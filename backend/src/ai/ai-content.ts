import { z } from 'zod';

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceCount(value: string): number {
  return (value.match(/[.!?…]+(?=\s|$)/g) ?? []).length;
}

function substantiveText(
  label: string,
  minChars: number,
  maxChars: number,
  minSentences: number,
  maxSentences: number,
) {
  return z
    .string()
    .transform(stripHtml)
    .pipe(z.string().min(minChars).max(maxChars))
    .superRefine((value, ctx) => {
      const sentences = sentenceCount(value);
      if (sentences < minSentences || sentences > maxSentences) {
        ctx.addIssue({
          code: 'custom',
          message: `${label}: expected ${minSentences}-${maxSentences} sentences, received ${sentences}`,
        });
      }
    });
}

export const dailyPackContentSchema = z.object({
  horoscope: substantiveText('horoscope', 240, 650, 3, 4),
  horoscopeDetailed: substantiveText('horoscopeDetailed', 520, 1400, 6, 8),
  advice: substantiveText('advice', 100, 420, 2, 2),
  moon: substantiveText('moon', 70, 320, 1, 2),
  aspect: substantiveText('aspect', 70, 320, 1, 2),
  supportPhrase: substantiveText('supportPhrase', 220, 650, 3, 4),
});

export type ValidatedDailyPack = z.infer<typeof dailyPackContentSchema>;

export function parseDailyPackContent(raw: string): ValidatedDailyPack {
  return dailyPackContentSchema.parse(JSON.parse(raw));
}

const supportContentSchema = z.object({
  supportPhrase: substantiveText('supportPhrase', 220, 650, 3, 4),
});

export function parseSupportContent(raw: string): { supportPhrase: string } {
  return supportContentSchema.parse(JSON.parse(raw));
}
