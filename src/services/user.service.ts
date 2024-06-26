import { type UserInformation, UserRole } from '@prisma/client';
import {
  BadRequest,
  Conflict,
  NotFound,
  Unauthorized,
  Forbidden,
} from 'http-errors';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import crypto from 'node:crypto';
import rs from 'random-string';
import { JWT_SECRET } from '../lib/constant/environment';
import prismaClient from '../lib/prismaClient';
import CacheService from './cache.service';
import EmailService from './email.service';

export default class UserService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly emailService: EmailService,
  ) {}

  public async createUser(
    username: string,
    password: string,
    email: string,
    role?: UserRole,
  ): Promise<User> {
    username = username.toLowerCase();
    email = email.toLowerCase();

    const existingEmail = await prismaClient.userEmail.count({
      where: {
        email,
      },
    });

    if (existingEmail > 0) throw new Conflict('Email already taken');

    const existingUser = await prismaClient.user.count({
      where: {
        username,
      },
    });

    if (existingUser > 0) throw new Conflict('Username already taken');

    const salt = crypto.randomBytes(16).toString('hex');
    const createdUser = await prismaClient.user.create({
      data: {
        username,
        password: this.hashPassword(password, salt),
        salt,
        role,
        information: {
          create: {},
        },
      },
    });

    await prismaClient.userEmail.create({
      data: {
        email,
        userId: createdUser.id,
        primary: true,
      },
    });

    const user = await this.getUserById(createdUser.id);
    return user!;
  }

  public async getUserById(
    id: string,
    options: Partial<{
      revalidate: boolean;
      includePassword: boolean;
    }> = {},
  ): Promise<User | null> {
    const cacheKey = `user:${id}`;

    if (options.revalidate === true) await this.cacheService.del(cacheKey);

    const cachedUser = await this.cacheService.get<User>(cacheKey);

    if (cachedUser) {
      const user = { ...cachedUser };

      if (!options.includePassword) {
        delete user.password;
        delete user.salt;
      }

      return cachedUser;
    }

    const user: User | null = await prismaClient.user.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        password: true,
        salt: true,
        role: true,
        emails: true,
        information: true,
        enable: true,
      },
    });

    const expires = ms('5m');
    await this.cacheService.set(cacheKey, user, expires);

    if (user && !options.includePassword) {
      delete user.password;
      delete user.salt;
    }

    return user;
  }

  public async getUserByToken(token: string): Promise<User | null> {
    const key = `session:${token}`;
    const session = await this.cacheService.get<string>(key);
    if (!session) return null;
    const user = await this.getUserById(session);
    return user;
  }

  public async loginUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<string> {
    usernameOrEmail = usernameOrEmail.toLowerCase();

    const user = await prismaClient.user.findFirst({
      where: {
        OR: [
          {
            username: usernameOrEmail,
          },
          {
            emails: {
              some: {
                email: usernameOrEmail,
                verified: true,
              },
            },
          },
        ],
      },
    });

    if (!user) throw new Unauthorized('User not exist');

    if (user.password !== this.hashPassword(password, user.salt)) {
      throw new Unauthorized('Password is incorrect');
    }

    const _user = await this.getUserById(user.id);
    const token = await this.createUserSession(_user!, '30d');

    return token;
  }

  public async updateUserPassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    await this.forbidOperationForMaster(user.id);

    const _user = (await this.getUserById(user.id, { includePassword: true }))!;

    if (user.password !== this.hashPassword(currentPassword, _user.salt!)) {
      throw new Unauthorized('Password is incorrect');
    }

    newPassword = this.hashPassword(newPassword, _user.salt!);

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: newPassword,
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  public async updateUserInformation(
    user: User,
    information: Partial<
      Omit<UserInformation, 'id' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<User> {
    await this.forbidOperationForMaster(user.id);

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        information: {
          update: {
            data: information,
          },
        },
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  public async addUserEmail(user: User, email: string): Promise<User> {
    await this.forbidOperationForMaster(user.id);

    email = email.toLowerCase();

    const existingEmail = await prismaClient.userEmail.count({
      where: {
        email,
      },
    });

    if (existingEmail) throw new Conflict('Email already used');

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        emails: {
          create: {
            email,
          },
        },
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  public async logoutByToken(token: string): Promise<User | null> {
    const user = await this.getUserByToken(token);
    const key = `session:${token}`;

    await this.cacheService.del(key);
    return user;
  }

  public async sendUserEmailVerification(
    user: User,
    emailId: string,
  ): Promise<string> {
    await this.forbidOperationForMaster(user.id);

    const email = user.emails.find((email) => email.id === emailId);
    if (!email) throw new NotFound('Email not found');
    if (email.verified) throw new BadRequest('Email already verified');
    const cacheKey = `email:verify:${email.email}`;
    const cachedOtp = await this.cacheService.get<string>(cacheKey);
    if (cachedOtp) return cachedOtp;
    const otp = rs({
      length: 6,
      letters: false,
      numeric: true,
      special: false,
    });
    await this.cacheService.set(cacheKey, otp, ms('12h'));
    await this.emailService.send({
      from: 'noreply <gaiterajomariel@gmail.com>',
      to: [email.email],
      subject: 'Email verification',
      text: `Verification OTP for email ${email.email}: ${otp}`,
      html: `Verification OTP for email <strong>${email.email}<strong>: <strong>${otp}</strong>`,
    });
    return otp;
  }

  public async verifyUserEmail(email: string, otp: string): Promise<User> {
    const key = `email:verify:${email}`;
    const cachedOtp = await this.cacheService.get<string>(key);
    if (cachedOtp !== otp) throw BadRequest('Invalid email verification url');
    const _email = await prismaClient.userEmail.update({
      where: {
        email,
      },
      data: {
        verified: true,
      },
      select: {
        userId: true,
      },
    });
    await this.cacheService.del(key);
    const user = await this.getUserById(_email.userId, { revalidate: true });
    return user!;
  }

  public async setUserPrimaryEmail(user: User, id: string): Promise<User> {
    const email = user.emails.find((email) => email.id === id);

    if (!email) throw new NotFound('Email not found');
    if (email.primary) throw new BadRequest('Email is already used as primary');

    await prismaClient.userEmail.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        primary: false,
      },
    });
    await prismaClient.userEmail.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        primary: true,
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  public async createUserEmail(user: User, email: string): Promise<User> {
    await this.forbidOperationForMaster(user.id);

    email = email.toLowerCase();

    if (user.emails.some((email) => !email.verified)) {
      throw new BadRequest('All emails must be a verified');
    }

    const count = await prismaClient.userEmail.count({
      where: {
        email,
      },
    });

    if (count > 0) throw new Conflict('Email already taken');

    await prismaClient.userEmail.create({
      data: {
        userId: user.id,
        email,
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  public async deleteUserEmail(user: User, id: string): Promise<User> {
    if (user.emails.length < 2) throw BadRequest('Cannot remove all emails');
    if (!user.emails.find((_email) => _email.id === id)) {
      throw new NotFound('Email not found');
    }

    await prismaClient.userEmail.delete({
      where: {
        id,
        userId: user.id,
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  public async toggleUserEnable(user: User, enable?: boolean): Promise<User> {
    await this.forbidOperationForMaster(user.id);

    await prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        enable: enable === undefined ? !user.enable : enable,
      },
    });

    const updatedUser = await this.getUserById(user.id, { revalidate: true });
    return updatedUser!;
  }

  private async createUserSession(
    user: User,
    expiresIn: string,
  ): Promise<string> {
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn,
    });

    await this.cacheService.set(`session:${token}`, user.id, ms(expiresIn));
    return token;
  }

  private async forbidOperationForMaster(id: string): Promise<void> {
    const user = await this.getUserById(id);
    if (user?.username === 'master') {
      throw new Forbidden('Forbidden operation for master account');
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 32).toString('hex');
  }
}
