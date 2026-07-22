// Общие помощники дат в часовом поясе пользователя.
// Повторяет логику getTodayDateStr из today.service (не трогаем «замороженный» модуль).

function partsInTz(timezone?: string | null) {
  const now = new Date();
  if (timezone) {
    try {
      const p = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).formatToParts(now);
      const day = p.find((x) => x.type === 'day')?.value;
      const month = p.find((x) => x.type === 'month')?.value;
      const year = p.find((x) => x.type === 'year')?.value;
      if (day && month && year) return { day, month, year };
    } catch {
      /* invalid IANA tz — fall through to UTC */
    }
  }
  return {
    day: String(now.getUTCDate()).padStart(2, '0'),
    month: String(now.getUTCMonth() + 1).padStart(2, '0'),
    year: String(now.getUTCFullYear()),
  };
}

/** "DD.MM" в часовом поясе пользователя (ключ праздников/дней заботы). */
export function todayDdMm(timezone?: string | null): string {
  const { day, month } = partsInTz(timezone);
  return `${day}.${month}`;
}

/** "DD.MM.YYYY" — уникальный ключ выполнения дня заботы (один зачёт в сутки). */
export function todayDdMmYyyy(timezone?: string | null): string {
  const { day, month, year } = partsInTz(timezone);
  return `${day}.${month}.${year}`;
}

/** Номер дня в году (1..366) в часовом поясе пользователя — для ротации дней заботы. */
export function dayOfYear(timezone?: string | null): number {
  const { day, month, year } = partsInTz(timezone);
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const start = new Date(Date.UTC(Number(year), 0, 0));
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/** "HH:mm" в часовом поясе пользователя — для сравнения с prefs.horoscopeTime/supportTime/
 * holidaysTime/personalCareTime, которые юзер выбирает как обычное локальное время
 * (TimePickerSheet ничего не знает про таймзоны). Невалидная IANA-таймзона — фолбэк на UTC. */
export function currentTimeInTz(timezone?: string | null): string {
  const now = new Date();
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now);
      const hour = parts.find((p) => p.type === 'hour')?.value;
      const minute = parts.find((p) => p.type === 'minute')?.value;
      if (hour && minute) return `${hour}:${minute}`;
    } catch {
      /* invalid IANA tz — fall through to UTC */
    }
  }
  return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
}
