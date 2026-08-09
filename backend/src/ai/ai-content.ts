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
  horoscope: substantiveText('horoscope', 160, 500, 2, 4),
  horoscopeDetailed: substantiveText('horoscopeDetailed', 350, 850, 3, 4),
  advice: substantiveText('advice', 60, 220, 1, 2),
  moon: substantiveText('moon', 45, 180, 1, 1),
  aspect: substantiveText('aspect', 45, 180, 1, 1),
  supportPhrase: substantiveText('supportPhrase', 60, 220, 1, 2),
});

export type ValidatedDailyPack = z.infer<typeof dailyPackContentSchema>;

export function parseDailyPackContent(raw: string): ValidatedDailyPack {
  return dailyPackContentSchema.parse(JSON.parse(raw));
}

const supportContentSchema = z.object({
  supportPhrase: substantiveText('supportPhrase', 60, 220, 1, 2),
});

export function parseSupportContent(raw: string): { supportPhrase: string } {
  return supportContentSchema.parse(JSON.parse(raw));
}
