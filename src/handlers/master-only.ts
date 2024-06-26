import type { FastifyRequest } from 'fastify';
import { Forbidden } from 'http-errors';

export default async function masterOnly(request: FastifyRequest) {
  if (request.user?.username === 'master') return;
  throw Forbidden();
}
