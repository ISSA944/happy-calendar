import { ProfileService } from './profile.service';

function dependencies() {
  const user = { id: 'user-1', name: 'Старое имя' };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ ...user, ...data }),
        ),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ userId: 'user-1' }),
    },
    prefs: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ userId: 'user-1' }),
    },
  };
  return {
    prisma,
    ai: {},
    today: {},
  };
}

describe('ProfileService.patch', () => {
  it('trims and saves name atomically with the rest of the profile', async () => {
    const { prisma, ai, today } = dependencies();
    const service = new ProfileService(
      prisma as never,
      ai as never,
      today as never,
    );

    const result = await service.patch('user-1', {
      name: '  Александра  ',
      birthdate: '01.02.1990',
      zodiacSign: 'Водолей ♒︎',
      gender: 'F',
      timezone: 'Europe/Moscow',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Александра' },
    });
    expect(prisma.profile.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.prefs.upsert).toHaveBeenCalledTimes(1);
    expect(result.user.name).toBe('Александра');
  });

  it('does not change an existing name when the field is absent', async () => {
    const { prisma, ai, today } = dependencies();
    const service = new ProfileService(
      prisma as never,
      ai as never,
      today as never,
    );

    const result = await service.patch('user-1', { gender: 'F' });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result.user.name).toBe('Старое имя');
  });
});
