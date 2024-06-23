import prismaClient from '../lib/prismaClient';
import CacheService from './cache.service';
import { Conflict, NotFound } from 'http-errors';
import rs from 'random-string';

export default class ApiService {
  constructor(private readonly cacheService: CacheService) {}

  public async createApp(user: User, name: string): Promise<ApiApp> {
    const count = await prismaClient.apiApp.count({
      where: {
        name,
      },
    });

    if (count > 0) throw new Conflict('App already exists');

    const app = await prismaClient.apiApp.create({
      data: {
        name,
        authorId: user.id,
      },
    });

    const apiApp = await this.getAppById(app.id);
    return apiApp!;
  }

  public async getAppById(
    id: string,
    options: Partial<{ revalidate: boolean }> = {},
  ): Promise<ApiApp | null> {
    const cacheKey = `apiApp:${id}`;

    if (options.revalidate === true) await this.cacheService.del(cacheKey);

    const cachedApp = await this.cacheService.get<ApiApp>(cacheKey);

    if (cachedApp) return cachedApp;

    const app = await prismaClient.apiApp.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        author: true,
        name: true,
      },
    });

    await this.cacheService.set(cacheKey, app);
    return app;
  }

  public async deleteAppById(id: string): Promise<ApiApp> {
    const app = await this.getAppById(id);

    if (!app) throw new NotFound('App not exists');

    await prismaClient.apiApp.delete({
      where: {
        id,
      },
    });

    return app;
  }

  // TODO: continue later

  // public async generateApiKey(
  //   user: User,
  //   options: Partial<{
  //     apps: ApiApp[];
  //     expiresIn: string;
  //   }> = {},
  // ): Promise<ApiKey> {
  //   const key = await prismaClient.apiKey.create({
  //     data: {
  //       userId: user.id,
  //       apiKey: `sk_${rs({
  //         length: 29,
  //         numeric: true,
  //         letters: true,
  //       })}`,
  //     },
  //   });

  //   return key;
  // }
}
