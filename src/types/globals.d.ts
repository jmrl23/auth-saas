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

  export interface ApiApp
    extends Prisma.ApiAppGetPayload<{
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        author: true;
        name: true;
      };
    }> {}

  export interface ApiKey
    extends Prisma.ApiKeyGetPayload<{
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        user: true;
        apiKey: true;
        expires: true;
        enable: true;
      };
    }> {
    apps: Array<{
      id: string;
      name: string;
    }>;
  }
}
