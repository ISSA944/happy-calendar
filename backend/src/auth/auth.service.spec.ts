import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaService } from '../prisma';
import { AuthService } from './auth.service';

const OLGA_EMAIL = 'metrolabsgroup@gmail.com';
const OWNER_EMAIL = 'mukaniskander01@gmail.com';

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  otpHash: string | null;
  otpExpiresAt: Date | null;
  otpFailedAttempts: number;
  otpLastFailedAt: Date | null;
  emailVerifiedAt: Date | null;
  welcomeEmailSentAt: Date | null;
};

function createUser(
  email: string,
  overrides: Partial<UserRecord> = {},
): UserRecord {
  return {
    id: 'user-1',
    email,
    name: email === OLGA_EMAIL ? 'Ольга' : 'Искандер',
    otpHash: null,
    otpExpiresAt: null,
    otpFailedAttempts: 0,
    otpLastFailedAt: null,
    emailVerifiedAt: new Date('2026-05-12T08:58:25.383Z'),
    welcomeEmailSentAt: null,
    ...overrides,
  };
}

function createService(
  user: UserRecord,
  nodeEnv = 'production',
  options: { stubOtpEmail?: boolean; stubWelcomeEmail?: boolean } = {},
) {
  const userUpdates: Array<{
    where: { id: string };
    data: { otpHash?: string } & Record<string, unknown>;
  }> = [];
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue(user),
      update: jest.fn((input: (typeof userUpdates)[number]) => {
        userUpdates.push(input);
        return Promise.resolve(user);
      }),
    },
    profile: {
      upsert: jest.fn().mockResolvedValue({ id: 'profile-1' }),
    },
    prefs: {
      upsert: jest.fn().mockResolvedValue({ id: 'prefs-1' }),
    },
  };
  const jwt = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token'),
  };
  const values: Record<string, string | undefined> = {
    NODE_ENV: nodeEnv,
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '30d',
  };
  const config = {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`Missing ${key}`);
      return value;
    }),
  };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
    config as unknown as ConfigService,
  );
  const sendOtpEmail = jest.fn().mockResolvedValue(undefined);
  const sendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
  if (options.stubOtpEmail !== false) {
    Object.defineProperty(service, 'sendOtpEmail', { value: sendOtpEmail });
  }
  if (options.stubWelcomeEmail !== false) {
    Object.defineProperty(service, 'sendWelcomeEmail', {
      value: sendWelcomeEmail,
    });
  }

  return {
    service,
    prisma,
    jwt,
    sendOtpEmail,
    sendWelcomeEmail,
    userUpdates,
  };
}

describe('AuthService registration email lifecycle', () => {
  it('rejects registration for an already verified account', async () => {
    const user = createUser('verified@example.com');
    const { service, sendWelcomeEmail } = createService(user);

    await expect(
      service.register('verified@example.com', 'Другое имя', true, false),
    ).rejects.toThrow('Email already registered');

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('sends OTP and exactly one gift during a new registration', async () => {
    const user = createUser('new@example.com', {
      name: 'Новая',
      emailVerifiedAt: null,
      welcomeEmailSentAt: null,
    });
    const { service, prisma, sendOtpEmail, sendWelcomeEmail, userUpdates } =
      createService(user);
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.register(' NEW@example.com ', 'Новая', true, false),
    ).resolves.toEqual({
      ok: true,
      email: 'new@example.com',
      giftEmailAccepted: true,
    });

    expect(sendOtpEmail).toHaveBeenCalledTimes(1);
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(sendWelcomeEmail).toHaveBeenCalledWith('new@example.com', 'Новая');
    expect(
      userUpdates.some(
        (update) => update.data.welcomeEmailSentAt instanceof Date,
      ),
    ).toBe(true);
  });

  it('allows an unfinished account to repeat registration without duplicating an accepted gift', async () => {
    const user = createUser('pending@example.com', {
      emailVerifiedAt: null,
      welcomeEmailSentAt: new Date('2026-08-18T10:00:00.000Z'),
    });
    const { service, prisma, sendOtpEmail, sendWelcomeEmail } =
      createService(user);

    await expect(
      service.register('pending@example.com', 'Новое имя', true, false),
    ).resolves.toEqual({
      ok: true,
      email: 'pending@example.com',
      giftEmailAccepted: true,
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(sendOtpEmail).toHaveBeenCalledTimes(1);
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('keeps a failed gift registration retryable', async () => {
    const user = createUser('retry@example.com', {
      emailVerifiedAt: null,
      welcomeEmailSentAt: null,
    });
    const { service, prisma, sendWelcomeEmail } = createService(user);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    sendWelcomeEmail.mockRejectedValueOnce(new Error('gift provider failed'));

    await expect(
      service.register('retry@example.com', 'Retry', true, false),
    ).rejects.toThrow('gift provider failed');

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(
      prisma.user.update.mock.calls.some(
        ([input]: [{ data: Record<string, unknown> }]) =>
          input.data.welcomeEmailSentAt instanceof Date,
      ),
    ).toBe(false);
  });

  it('marks email verified but never sends gifts from verifyOtp', async () => {
    const otpHash = await bcrypt.hash('1111', 4);
    const user = createUser(OLGA_EMAIL, {
      otpHash,
      otpExpiresAt: new Date(Date.now() + 60_000),
      emailVerifiedAt: null,
      welcomeEmailSentAt: new Date('2026-05-12T08:58:25.383Z'),
    });
    const { service, sendWelcomeEmail, userUpdates } = createService(user);

    await service.verifyOtp(OLGA_EMAIL, '1111');

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(
      userUpdates.some((update) => update.data.emailVerifiedAt instanceof Date),
    ).toBe(true);
  });

  it('never sends gifts during a regular login request', async () => {
    const user = createUser('login@example.com', {
      welcomeEmailSentAt: null,
    });
    const { service, sendWelcomeEmail } = createService(user);

    await service.login('login@example.com');

    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('renders the OTP email without a fixed-width mobile overflow', async () => {
    const user = createUser('mobile@example.com');
    const { service } = createService(user, 'production', {
      stubOtpEmail: false,
    });
    let sentHtml = '';
    const send = jest.fn((input: { html: string }) => {
      sentHtml = input.html;
      return Promise.resolve({ data: { id: 'otp-mail' } });
    });
    Object.defineProperty(service, 'provider', { value: 'resend' });
    Object.defineProperty(service, 'resend', {
      value: { emails: { send } },
    });

    await service.login('mobile@example.com');

    expect(sentHtml).toContain('width="100%"');
    expect(sentHtml).not.toContain('width="480"');
    expect(sentHtml).toContain('letter-spacing');
  });

  it('keeps system emails inside a Gmail mobile shell with the refreshed leaf asset', () => {
    const { service } = createService(createUser('mobile@example.com'));
    const renderer = service as unknown as {
      renderOtpEmailHtml(code: string): string;
      renderWelcomeEmailHtml(
        name: string | null,
        trackerFile: string | null,
        checklistFile: string | null,
      ): string;
    };

    const otpHtml = renderer.renderOtpEmailHtml('4935');
    const welcomeHtml = renderer.renderWelcomeEmailHtml(
      'Искандер',
      'habit-tracker.pdf',
      'self-care-checklist-30-days.pdf',
    );

    for (const html of [otpHtml, welcomeHtml]) {
      expect(html).toContain(
        'https://yoyojoy.online/email-assets/brand-leaf-v2.png',
      );
      expect(html).toContain('width="100%"');
      expect(html).toContain('class="email-shell"');
      expect(html).toContain('width="520"');
      expect(html).toContain('@media only screen and (max-width: 520px)');
      expect(html).not.toContain('width="480"');
      expect(html).not.toContain('width="600"');
      expect(html).not.toMatch(/[🌿🎁📎💚🤍]/u);
    }

    expect(otpHtml).toContain('font-size:32px');
    expect(otpHtml).toContain('white-space:nowrap');
    expect(
      existsSync(
        resolve(
          process.cwd(),
          '..',
          'public',
          'email-assets',
          'brand-leaf-v2.png',
        ),
      ),
    ).toBe(true);
  });
});

describe('AuthService test-account policies', () => {
  it('emails Olga the fixed 1111 OTP on login without deleting or overwriting her account', async () => {
    const user = createUser(OLGA_EMAIL);
    const { service, prisma, sendOtpEmail, userUpdates } = createService(
      user,
      'development',
    );

    await service.login(OLGA_EMAIL);

    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: user.id } }),
    );
    expect(sendOtpEmail).toHaveBeenCalledWith(OLGA_EMAIL, '1111');
    const otpHash = userUpdates[0].data.otpHash as string;
    await expect(bcrypt.compare('1111', otpHash)).resolves.toBe(true);
  });

  it('keeps the owner test account OTP bypass unchanged', async () => {
    const user = createUser(OWNER_EMAIL);
    const { service, sendOtpEmail, userUpdates } = createService(user);

    await service.login(OWNER_EMAIL);

    expect(sendOtpEmail).not.toHaveBeenCalled();
    const otpHash = userUpdates[0].data.otpHash as string;
    await expect(bcrypt.compare('1111', otpHash)).resolves.toBe(true);
  });

  it('issues Olga a 365-day refresh token', async () => {
    const otpHash = await bcrypt.hash('1111', 4);
    const user = createUser(OLGA_EMAIL, {
      otpHash,
      otpExpiresAt: new Date(Date.now() + 60_000),
    });
    const { service, jwt } = createService(user);

    await service.verifyOtp(OLGA_EMAIL, '1111');

    expect(jwt.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ email: OLGA_EMAIL, type: 'refresh' }),
      expect.objectContaining({ expiresIn: '365d' }),
    );
  });

  it('attaches both PDF gifts to a new registration email', async () => {
    const user = createUser('gift@example.com', {
      emailVerifiedAt: null,
      welcomeEmailSentAt: null,
    });
    const { service, prisma } = createService(user, 'production', {
      stubWelcomeEmail: false,
    });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const send = jest.fn().mockResolvedValue({ data: { id: 'mail-1' } });
    Object.defineProperty(service, 'provider', { value: 'resend' });
    Object.defineProperty(service, 'resend', {
      value: { emails: { send } },
    });
    Object.defineProperty(service, 'loadGiftAttachments', {
      value: () => [
        { filename: 'habit-tracker.pdf', content: Buffer.from('tracker') },
        {
          filename: 'self-care-checklist-30-days.pdf',
          content: Buffer.from('checklist'),
        },
      ],
    });

    await service.register('gift@example.com', 'Получатель', true, false);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'gift@example.com',
        attachments: [
          expect.objectContaining({ filename: 'habit-tracker.pdf' }),
          expect.objectContaining({
            filename: 'self-care-checklist-30-days.pdf',
          }),
        ],
      }),
    );
  });

  it('does not accept registration when either PDF gift is missing', async () => {
    const user = createUser('missing-gift@example.com', {
      emailVerifiedAt: null,
      welcomeEmailSentAt: null,
    });
    const { service, prisma } = createService(user, 'production', {
      stubWelcomeEmail: false,
    });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const send = jest.fn().mockResolvedValue({ data: { id: 'mail-1' } });
    Object.defineProperty(service, 'provider', { value: 'resend' });
    Object.defineProperty(service, 'resend', {
      value: { emails: { send } },
    });
    Object.defineProperty(service, 'loadGiftAttachments', {
      value: () => [
        { filename: 'habit-tracker.pdf', content: Buffer.from('tracker') },
      ],
    });

    await expect(
      service.register('missing-gift@example.com', 'Получатель', true, false),
    ).rejects.toThrow('Both PDF gifts are required');
    expect(send).not.toHaveBeenCalled();
  });
});
