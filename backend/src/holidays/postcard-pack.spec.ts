import * as fs from 'fs';
import * as path from 'path';

type ManifestEntry = {
  key: string;
  date: string;
  title: string;
};

type HolidaySeed = {
  date: string;
  title: string;
};

describe('January postcard pack manifest', () => {
  const manifestPath = path.resolve(
    process.cwd(),
    'prisma',
    'seed-data',
    'january-postcards-v8.json',
  );

  it('contains 149 unique holidays and exactly three tone filenames per holiday', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    ) as ManifestEntry[];
    const keys = new Set(manifest.map((entry) => entry.key));
    const filenames = manifest.flatMap((entry) =>
      ['cute', 'humor', 'cynical'].map((tone) => `${entry.key}_${tone}.webp`),
    );

    expect(manifest).toHaveLength(149);
    expect(keys.size).toBe(149);
    expect(new Set(filenames).size).toBe(447);
    expect(manifest.every((entry) => /^01-\d{3}$/.test(entry.key))).toBe(true);
    expect(manifest.every((entry) => /^\d{2}\.01$/.test(entry.date))).toBe(
      true,
    );
  });

  it('maps every entry to one existing January holiday, including the renamed 01-114 row', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(
      fs.readFileSync(manifestPath, 'utf8'),
    ) as ManifestEntry[];
    const holidays = JSON.parse(
      fs.readFileSync(
        path.resolve(process.cwd(), 'prisma', 'seed-data', 'holidays.json'),
        'utf8',
      ),
    ) as HolidaySeed[];

    for (const entry of manifest) {
      const acceptedTitles =
        entry.key === '01-114'
          ? [entry.title, 'День рождения Calend.ru']
          : [entry.title];
      const matches = holidays.filter(
        (holiday) =>
          holiday.date === entry.date && acceptedTitles.includes(holiday.title),
      );
      expect(matches).toHaveLength(1);
    }

    expect(manifest.find((entry) => entry.key === '01-114')).toEqual({
      key: '01-114',
      date: '25.01',
      title: 'Праздник дат и планов',
    });
  });
});
