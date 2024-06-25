import env from 'env-var';

export const NODE_ENV = env.get('NODE_ENV').default('development').asString();

export const SERVER_HOST = env.get('SERVER_HOST').default('0.0.0.0').asString();

export const PORT = env.get('PORT').default(3001).asPortNumber();

export const JWT_SECRET = env.get('JWT_SECRET').required().asString();

export const REDIS_URL = env.get('REDIS_URL').required().asString();

export const SERVER_URL = env.get('SERVER_URL').asUrlString();

export const SMTP_TRANSPORT_HOST = env
  .get('SMTP_TRANSPORT_HOST')
  .required()
  .asString();

export const SMTP_TRANSPORT_PORT = env
  .get('SMTP_TRANSPORT_PORT')
  .required()
  .asPortNumber();

export const SMTP_TRANSPORT_USER = env
  .get('SMTP_TRANSPORT_USER')
  .required()
  .asString();

export const SMTP_TRANSPORT_SECURED = env
  .get('SMTP_TRANSPORT_SECURED')
  .default('true')
  .asBool();

export const GOOGLE_CLIENT_ID = env
  .get('GOOGLE_CLIENT_ID')
  .required()
  .asString();

export const GOOGLE_CLIENT_SECRET = env
  .get('GOOGLE_CLIENT_SECRET')
  .required()
  .asString();

export const GOOGLE_REFRESH_TOKEN = env
  .get('GOOGLE_REFRESH_TOKEN')
  .required()
  .asString();
