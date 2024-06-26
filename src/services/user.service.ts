import { UserRole } from '@prisma/client';
import { Conflict, NotFound, Unauthorized } from 'http-errors';
import ms from 'ms';
import crypto from 'node:crypto';
import prismaClient from '../lib/prismaClient';
import CacheService from './cache.service';
import type UserEmailService from './user/email.service';
import type UserInfoService from './user/info.service';
import { UserSessionService } from './user/session.service';

export default class UserService {
  constructor(
    private readonly cacheService: CacheService,
    public readonly info: UserInfoService,
    public readonly email: UserEmailService,
    public readonly session: UserSessionService,
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
      where: { email },
    });

    if (existingEmail > 0) throw new Conflict('Email already taken');

    const existingUser = await prismaClient.user.count({
      where: { username },
    });

    if (existingUser > 0) throw new Conflict('Username already taken');

    const salt = crypto.randomBytes(16).toString('hex');

    const createdUser = await prismaClient.user.create({
      data: {
        username,
        password: crypto.scryptSync(password, salt, 32).toString('hex'),
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

  public async loginUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<string> {
    usernameOrEmail = usernameOrEmail.toLowerCase();

    const account = await prismaClient.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
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

    if (!account) throw new Unauthorized('User not exist');

    if (
      account.password !==
      crypto.scryptSync(password, account.salt, 32).toString('hex')
    ) {
      throw new Unauthorized('Password is incorrect');
    }

    const user = await this.getUserByIdOrThrow(account.id);
    const token = await this.session.createSession(user, '30d');
    return token;
  }

  public async getUserById(
    id: string,
    options: OptionsWithRevalidate & {
      includePassword?: boolean;
    } = {},
  ): Promise<User | null> {
    const cacheKey = `user:[ref:id]:${id}`;

    if (options.revalidate === true) await this.cacheService.del(cacheKey);

    const cachedUser = await this.cacheService.get<User>(cacheKey);

    if (cachedUser !== undefined) {
      const user = { ...cachedUser };

      if (!options.includePassword) {
        delete user.password;
        delete user.salt;
      }

      return cachedUser;
    }

    const user: User | null = await prismaClient.user.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        password: true,
        salt: true,
        role: true,
        emails: {
          select: {
            id: true,
            email: true,
            verified: true,
            primary: true,
          },
        },
        information: {
          select: {
            id: true,
            displayName: true,
          },
        },
        enable: true,
      },
    });

    await this.cacheService.set(cacheKey, user, ms('5m'));

    if (user && !options.includePassword) {
      delete user.password;
      delete user.salt;
    }

    return user;
  }

  public async getUserByIdOrThrow(
    id: string,
    options: OptionsWithRevalidate & {
      includePassword?: boolean;
    } = {},
  ): Promise<User> {
    const user = await this.getUserById(id, options);
    if (!user) throw NotFound('User not found');
    return user;
  }

  public async updateUser(
    user: User,
    payload: {
      password?: string;
      enable?: boolean;
    } = {},
  ): Promise<User> {
    user = await this.getUserByIdOrThrow(user.id, { includePassword: true });

    if (payload.password !== undefined) {
      payload.password = crypto
        .scryptSync(payload.password, user.salt!, 32)
        .toString('hex');
    }

    await prismaClient.user.update({
      where: { id: user.id },
      data: payload,
    });
    const updatedUser = await this.getUserByIdOrThrow(user.id, {
      revalidate: true,
    });
    return updatedUser;
  }
}
