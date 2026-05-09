/**
 * Calculates the Zodiac sign from a birthdate string in "DD.MM.YYYY" format.
 * Returns the sign name with emoji or null if invalid.
 */
export function getZodiac(dateStr: string): string | null {
  if (!dateStr || dateStr.length < 5) return null
  
  // Clean input and extract DD.MM
  const clean = dateStr.replace(/[^\d]/g, '')
  if (clean.length < 4) return null
  
  const day = parseInt(clean.substring(0, 2), 10)
  const month = parseInt(clean.substring(2, 4), 10)
  
  if (isNaN(day) || isNaN(month) || month < 1 || month > 12 || day < 1 || day > 31) return null

  // Basic zodiac dates
  if ((month === 1 && day <= 20) || (month === 12 && day >= 22)) return 'Козерог ♑︎'
  if ((month === 1 && day >= 21) || (month === 2 && day <= 18)) return 'Водолей ♒︎'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Рыбы ♓︎'
  if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) return 'Овен ♈︎'
  if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) return 'Телец ♉︎'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return 'Близнецы ♊︎'
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return 'Рак ♋︎'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 23)) return 'Лев ♌︎'
  if ((month === 8 && day >= 24) || (month === 9 && day <= 23)) return 'Дева ♍︎'
  if ((month === 9 && day >= 24) || (month === 10 && day <= 23)) return 'Весы ♎︎'
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return 'Скорпион ♏︎'
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return 'Стрелец ♐︎'

  return null
}
