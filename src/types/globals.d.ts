import type { Prisma } from '@prisma/client';

export declare global {
  export interface User
    extends Prisma.UserGetPayload<{
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        role: true;
        username: true;
        emails: true;
        information: true;
      };
    }> {
    password?: string;
    salt?: string;
  }
}
