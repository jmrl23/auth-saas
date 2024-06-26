import { UserRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { Unauthorized } from 'http-errors';

type Role = keyof typeof UserRole | 'ALL';

export default function userAuthorization(...roles: Role[]) {
  return async function handler(request: FastifyRequest) {
    if (!request.user) throw new Unauthorized('No session');
    if (!request.user.enable) throw Unauthorized('Account disabled');
    if (roles.includes('ALL')) return;
    if (!roles.includes(request.user.role)) {
      throw new Unauthorized(
        `Role must be one of the following: [${roles.join(', ')}]`,
      );
    }
  };
}
