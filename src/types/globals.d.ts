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
        enable: true;
      };
    }> {
    password?: string;
    salt?: string;
    information: UserInfo;
    emails: UserEmail[];
  }

  interface UserInfo
    extends Prisma.UserInformationGetPayload<{
      select: {
        id: true;
        displayName: true;
      };
    }> {}

  interface UserEmail
    extends Prisma.UserEmailGetPayload<{
      select: {
        id: true;
        email: true;
        verified: true;
        primary: true;
      };
    }> {}

  export interface ApiApp
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

  interface OptionsWithRevalidate {
    revalidate?: boolean;
  }

  interface ApiListPayload {
    revalidate?: boolean;
    createdAtFrom?: string;
    createdAtTo?: string;
    updatedAtFrom?: string;
    updatedAtTo?: string;
    skip?: number;
    take?: number;
    order?: 'asc' | 'desc';
  }
}
