import ms from 'ms';
import prismaClient from '../../lib/prismaClient';
import type CacheService from '../cache.service';
import { NotFound } from 'http-errors';

export default class UserInfoService {
  constructor(private readonly cacheService: CacheService) {}

  public async getUserInfoById(
    infoId: string,
    options: OptionsWithRevalidate = {},
  ): Promise<UserInfo | null> {
    const cacheKey = `user.info:[ref:id]:${infoId}`;

    if (options.revalidate === true) {
      await this.cacheService.del(cacheKey);
    }

    const cachedInfo = await this.cacheService.get<UserInfo>(cacheKey);

    if (cachedInfo !== undefined) return cachedInfo;

    const info = await prismaClient.userInformation.findUnique({
      where: { id: infoId },
      select: {
        id: true,
        displayName: true,
      },
    });

    await this.cacheService.set(cacheKey, info, ms('5m'));
    return info;
  }

  public async getUserInfoByIdOrThrow(
    id: string,
    options: OptionsWithRevalidate = {},
  ): Promise<UserInfo> {
    const info = await this.getUserInfoById(id, options);

    if (!info) throw new NotFound('User info not found');

    return info;
  }

  public async updateInfo(
    user: User,
    payload: Partial<Omit<UserInfo, 'id'>>,
  ): Promise<UserInfo> {
    const id = (await this.getUserInfoByIdOrThrow(user.information.id)).id;

    await prismaClient.userInformation.update({
      where: { id },
      data: payload,
    });
    await this.invalidateUserCache(user.id);

    const info = await this.getUserInfoByIdOrThrow(id, {
      revalidate: true,
    });
    return info;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheService.del(`user:[ref:id]:${userId}`);
  }
}
