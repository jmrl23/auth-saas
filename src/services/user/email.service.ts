import ms from 'ms';
import prismaClient from '../../lib/prismaClient';
import type CacheService from '../cache.service';
import type EmailService from '../email.service';
import { Conflict, NotFound, BadRequest, Forbidden } from 'http-errors';
import rs from 'random-string';

export default class UserEmailService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly emailService: EmailService,
  ) {}

  public async createEmail(user: User, email: string): Promise<UserEmail> {
    email = email.toLowerCase();

    const count = await prismaClient.userEmail.count({
      where: { email },
    });

    if (count > 0) throw new Conflict('Email already used');

    const instance = await prismaClient.userEmail.create({
      data: {
        userId: user.id,
        email: email,
      },
      select: {
        id: true,
        email: true,
        verified: true,
        primary: true,
      },
    });
    return instance;
  }

  public async sendVerificationOtp(
    user: User,
    emailId: string,
  ): Promise<string> {
    const email = this.getUserEmail(user, emailId);

    if (email.verified) throw new BadRequest('User email already verified');

    const cacheKey = `email:verify:[ref:email]:${email}`;
    const cachedOtp = await this.cacheService.get<string>(cacheKey);
    if (cachedOtp) return cachedOtp;

    const otp = rs({
      length: 6,
      letters: false,
      numeric: true,
    });

    await this.cacheService.set(cacheKey, otp, ms('12h'));
    await this.emailService.send({
      from: 'noreply <gaiterajomariel@gmail.com>',
      to: [email.email],
      subject: 'Email verification',
      text: `Verification OTP for email ${email.email}: ${otp}`,
      html: `Verification OTP for email <strong>${email.email}<strong>: <strong>${otp}</strong>`,
    });
    return otp;
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<boolean> {
    const key = `email:verify:[ref:email]:${email}`;
    const cachedOtp = await this.cacheService.get<string>(key);

    if (otp !== cachedOtp) throw new BadRequest('Invalid');

    const { verified } = await prismaClient.userEmail.update({
      where: { email },
      data: { verified: true },
    });

    await this.cacheService.del(key);
    return verified;
  }

  public async setPrimaryEmail(
    user: User,
    emailId: string,
  ): Promise<UserEmail> {
    const ref = this.getUserEmail(user, emailId);

    if (ref.primary) throw new BadRequest('User email is already primary');

    await prismaClient.userEmail.updateMany({
      where: {
        userId: user.id,
        NOT: { email: ref.email },
      },
      data: { primary: false },
    });
    const email = await prismaClient.userEmail.update({
      where: {
        id: emailId,
        userId: user.id,
      },
      data: { primary: true },
      select: {
        id: true,
        email: true,
        verified: true,
        primary: true,
      },
    });

    return email;
  }

  public async deleteEmail(user: User, emailId: string): Promise<UserEmail> {
    const email = this.getUserEmail(user, emailId);

    if (email.primary) {
      throw new Forbidden('Cannot remove a primary email');
    }

    await prismaClient.userEmail.delete({
      where: {
        id: emailId,
        userId: user.id,
      },
    });

    return email;
  }

  private getUserEmail(user: User, emailId: string): UserEmail {
    const email = user.emails.find((e) => e.id === emailId);
    if (!email) throw new NotFound('User email not found');
    return email;
  }
}
