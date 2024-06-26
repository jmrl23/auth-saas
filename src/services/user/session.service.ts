import jwt from 'jsonwebtoken';
import ms from 'ms';
import { JWT_SECRET } from '../../lib/constant/environment';
import CacheService from '../cache.service';

export class UserSessionService {
  constructor(private readonly cacheService: CacheService) {}

  public async createSession(user: User, expiresIn: string): Promise<string> {
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn,
    });
    await this.cacheService.set(`session:${token}`, user.id, ms(expiresIn));
    return token;
  }

  public async getSession(token: string): Promise<string | null> {
    const userId = await this.cacheService.get<string>(`session:${token}`);
    return userId ?? null;
  }

  public async deleteSession(token: string): Promise<void> {
    await this.cacheService.del(`session:${token}`);
  }
}
