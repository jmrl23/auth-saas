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

  export interface ApiApplication
    extends Prisma.ApiApplicationGetPayload<{
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        authorId: true;
        name: true;
        origins: true;
      };
    }> {}

  export interface ApiKey
    extends Prisma.ApiKeyGetPayload<{
      select: {
        id: true;
        createdAt: true;
        updatedAt: true;
        userId: true;
        apiKey: true;
        expires: true;
        enable: true;
      };
    }> {
    applications: Array<{
      id: string;
      name: string;
      origins: string[];
    }>;
  }
}
