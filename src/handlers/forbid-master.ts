import type { FastifyRequest } from 'fastify';
import { Forbidden } from 'http-errors';

export default async function forbidMaster(request: FastifyRequest) {
  if (request.user?.username !== 'master') return;
  throw Forbidden('Cannot execute operation on master');
}
