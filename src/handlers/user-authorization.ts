import type { FastifyRequest } from 'fastify';
import type { UserRole } from '@prisma/client';
import { Unauthorized } from 'http-errors';

export default function userAuthorization(...roles: UserRole[]) {
  return async function handler(request: FastifyRequest) {
    if (!request.user) throw new Unauthorized('No session');
    if (!roles.includes(request.user.role)) {
      throw new Unauthorized(
        `Role must be one of the following: ${roles.join(', ')}`,
      );
    }
  };
}
