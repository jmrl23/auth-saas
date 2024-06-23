import { type UserInformation, UserRole } from '@prisma/client';
import { Conflict, Unauthorized } from 'http-errors';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import crypto from 'node:crypto';
import { JWT_SECRET } from '../lib/constant/environment';
import prismaClient from '../lib/prismaClient';
import CacheService from './cache.service';

export default class UserService {
  constructor(private readonly cacheService: CacheService) {}

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
    withPassword: boolean = false,
    revalidate: boolean = false,
  ): Promise<User | null> {
    const cacheKey = `user:${id}`;

    if (revalidate) await this.cacheService.del(cacheKey);

    const cachedUser = await this.cacheService.get<User>(cacheKey);

    if (cachedUser) {
      const user = { ...cachedUser };

      if (!withPassword) {
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
      },
    });

    const expires = ms('5m');
    await this.cacheService.set(cacheKey, user, expires);

    if (user && !withPassword) {
      delete user.password;
      delete user.salt;
    }

    return user;
  }

  public async getUserByToken(token: string): Promise<User | null> {
    const key = `session:${token}`;
    const session = await this.cacheService.get<{ id: string }>(key);
    if (!session) return null;
    const user = await this.getUserById(session.id);
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
    const token = await this.createUserSession(_user!, '7d');

    return token;
  }

  public async updateUserPassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    // to ensure that `password` and `hash` properties are existing
    const _user = (await this.getUserById(user.id, true))!;

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

    // revalidate user cache
    const updatedUser = await this.getUserById(user.id, false, true);
    return updatedUser!;
  }

  public async updateUserInformation(
    user: User,
    information: Partial<
      Omit<UserInformation, 'id' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<User> {
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

    const updatedUser = await this.getUserById(user.id, false, true);
    return updatedUser!;
  }

  public async setUserPrimaryEmail(user: User, emailId: string): Promise<User> {
    await prismaClient.userEmail.updateMany({
      where: {
        NOT: {
          id: emailId,
        },
        userId: user.id,
      },
      data: {
        primary: false,
      },
    });

    await prismaClient.userEmail.update({
      where: {
        id: emailId,
        userId: user.id,
      },
      data: {
        primary: true,
      },
    });

    const updatedUser = await this.getUserById(user.id, false, true);
    return updatedUser!;
  }

  public async addUserEmail(user: User, email: string): Promise<User> {
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

    const updatedUser = await this.getUserById(user.id, false, true);
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

  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 32).toString('hex');
  }
}
