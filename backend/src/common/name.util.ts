/**
 * Подстановка имени в тексты с плейсхолдером {имя} (задания дней заботы, пуши вех).
 * Если имя есть → заменяем. Если нет → убираем «{имя}, » и делаем первую букву заглавной,
 * чтобы фраза читалась естественно («сегодня выдели…» → «Сегодня выдели…»).
 */
export function fillName(text: string, name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) return text.replace(/\{имя\}/g, trimmed);
  const stripped = text.replace(/\{имя\}\s*,?\s*/g, '').trimStart();
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}
