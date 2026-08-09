// Фолбэк-фон по теме для праздников без установленного готового WebP-пака (ТЗ п. 7.3).
// Ключи 1:1 совпадают с backend/src/holidays/themes.constant.ts.
export const THEME_GRADIENTS: Record<string, [string, string]> = {
  'Новый год и волшебство': ['#CFE0D8', '#8FBFA8'],
  'Зима и снег': ['#DCEBF5', '#A9CBE0'],
  'Весна и цветение': ['#F5E1EC', '#E3B8CF'],
  'Осень и уют': ['#F3E0C7', '#D9AE72'],
  'Лето и море': ['#CDEDE8', '#7FCFC2'],
  'Космос и наука': ['#D9D6EE', '#A79CD8'],
  'Животные и питомцы': ['#F1E4D0', '#DDB98A'],
  'Еда и вкусности': ['#FBE3A1', '#F2C14E'],
  'Спорт и движение': ['#F5B896', '#E8895F'],
  'Музыка, кино и искусство': ['#E6D6F0', '#C6A0DE'],
  'Путешествия и города': ['#CFE6DC', '#A9D2C3'],
  'Технологии и интернет': ['#D6E4EE', '#9FBDD6'],
  'Знания и образование': ['#DDE7D8', '#A9C79A'],
  'Природа и планета': ['#B8E0B0', '#84C57A'],
  'Любовь, семья и дружба': ['#F6D6D6', '#E3A0A0'],
  'Забота о себе и спокойствие': ['#A7D7C5', '#6FB39A'],
  'Красота и стиль': ['#F0DCE6', '#DDA8C0'],
  'Профессии и труд': ['#E0DED6', '#B8B2A0'],
  'Уютные пустяки и радости': ['#F6D9B5', '#E9B384'],
}

const DEFAULT_GRADIENT: [string, string] = THEME_GRADIENTS['Уютные пустяки и радости']

export function themeGradientCss(themeKey: string): string {
  const [from, to] = THEME_GRADIENTS[themeKey] ?? DEFAULT_GRADIENT
  return `linear-gradient(135deg, ${from}, ${to})`
}
