import { createTransport } from 'nodemailer';
import {
  SMTP_TRANSPORT_HOST,
  SMTP_TRANSPORT_PORT,
  SMTP_TRANSPORT_SECURED,
  SMTP_TRANSPORT_USER,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} from './constant/environment';

const smtpTransport = createTransport({
  host: SMTP_TRANSPORT_HOST,
  port: SMTP_TRANSPORT_PORT,
  secure: SMTP_TRANSPORT_SECURED,
  auth: {
    type: 'oauth2',
    user: SMTP_TRANSPORT_USER,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken: GOOGLE_REFRESH_TOKEN,
  },
});

export default smtpTransport;
