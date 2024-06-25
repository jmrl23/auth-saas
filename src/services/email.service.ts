import type { Transporter } from 'nodemailer';
import type {
  SentMessageInfo,
  MailOptions,
} from 'nodemailer/lib/smtp-transport';

export default class EmailService {
  constructor(private readonly transporter: Transporter<SentMessageInfo>) {}

  public async send(options: MailOptions): Promise<EmailSendResponse> {
    const response = await this.transporter.sendMail(options);
    const data = {
      messageId: response.messageId,
      accepted: response.accepted.map((value) =>
        typeof value === 'string' ? value : value.address,
      ),
    };
    return data;
  }
}

export interface EmailSendResponse {
  messageId: string;
  accepted: string[];
}
