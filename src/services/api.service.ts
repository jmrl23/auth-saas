import type ApplicationService from './api/app.service';
import type KeyService from './api/key.service';
import { Unauthorized, Forbidden } from 'http-errors';

export default class ApiService {
  constructor(
    public readonly app: ApplicationService,
    public readonly key: KeyService,
  ) {}

  public async validateRequest(key?: string, origin?: string): Promise<void> {
    if (!key) throw new Unauthorized('No API key');

    const ref = await this.key.getKeyByItsKey(key);

    if (!ref) throw new Unauthorized('Invalid API key');

    if (!ref.enable) throw new Forbidden('API key disabled');

    if (ref.expires && ref.expires <= new Date()) {
      throw new Forbidden('API key expired');
    }

    if (origin) {
      const appOrigins = ref.applications.map((app) => app.origins);
      const authorizedOrigins: string[] = [];

      for (const origins of appOrigins) {
        authorizedOrigins.push(...origins);
      }

      if (!authorizedOrigins.includes(origin)) {
        throw new Forbidden('Cannot use API key for this application');
      }
    }
  }
}
