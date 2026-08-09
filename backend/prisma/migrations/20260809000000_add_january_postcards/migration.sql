ALTER TABLE "calendar_holidays"
  ADD COLUMN "postcard_key" TEXT,
  ADD COLUMN "postcard_pack" TEXT;

UPDATE "calendar_holidays"
SET "title" = 'Новый год в России',
    "postcard_key" = '01-001',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '01.01'
  AND "title" = 'Новый год в России';

UPDATE "calendar_holidays"
SET "title" = 'Международный день похмелья',
    "postcard_key" = '01-002',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '01.01'
  AND "title" = 'Международный день похмелья';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день интроверта',
    "postcard_key" = '01-003',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'Всемирный день интроверта';

UPDATE "calendar_holidays"
SET "title" = 'День научной фантастики',
    "postcard_key" = '01-004',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'День научной фантастики';

UPDATE "calendar_holidays"
SET "title" = 'День мягких подушек',
    "postcard_key" = '01-005',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'День мягких подушек';

UPDATE "calendar_holidays"
SET "title" = 'День оливье',
    "postcard_key" = '01-006',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'День оливье';

UPDATE "calendar_holidays"
SET "title" = 'Новый мяу-год у кошек',
    "postcard_key" = '01-007',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'Новый мяу-год у кошек';

UPDATE "calendar_holidays"
SET "title" = 'Первый полет к Луне (запуск станции «Луна-1»)',
    "postcard_key" = '01-008',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'Первый полет к Луне (запуск станции «Луна-1»)';

UPDATE "calendar_holidays"
SET "title" = 'Продолжение новогоднего праздника',
    "postcard_key" = '01-009',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '02.01'
  AND "title" = 'Продолжение новогоднего праздника';

UPDATE "calendar_holidays"
SET "title" = 'День рождения соломинки для коктейлей',
    "postcard_key" = '01-010',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '03.01'
  AND "title" = 'День рождения соломинки для коктейлей';

UPDATE "calendar_holidays"
SET "title" = 'День катания на санках',
    "postcard_key" = '01-011',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '03.01'
  AND "title" = 'День катания на санках';

UPDATE "calendar_holidays"
SET "title" = 'День мандаринок',
    "postcard_key" = '01-012',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '03.01'
  AND "title" = 'День мандаринок';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день гипноза',
    "postcard_key" = '01-013',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '04.01'
  AND "title" = 'Всемирный день гипноза';

UPDATE "calendar_holidays"
SET "title" = 'День Ньютона',
    "postcard_key" = '01-014',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '04.01'
  AND "title" = 'День Ньютона';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день тяготения',
    "postcard_key" = '01-015',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '04.01'
  AND "title" = 'Всемирный день тяготения';

UPDATE "calendar_holidays"
SET "title" = 'День зимних сладостей',
    "postcard_key" = '01-016',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '04.01'
  AND "title" = 'День зимних сладостей';

UPDATE "calendar_holidays"
SET "title" = 'День страстей по лимонной карамельке',
    "postcard_key" = '01-017',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '04.01'
  AND "title" = 'День страстей по лимонной карамельке';

UPDATE "calendar_holidays"
SET "title" = 'Международный день бойскаутов',
    "postcard_key" = '01-018',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '05.01'
  AND "title" = 'Международный день бойскаутов';

UPDATE "calendar_holidays"
SET "title" = 'Международный разгрузочный день',
    "postcard_key" = '01-019',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '05.01'
  AND "title" = 'Международный разгрузочный день';

UPDATE "calendar_holidays"
SET "title" = 'День маленьких историй',
    "postcard_key" = '01-020',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '05.01'
  AND "title" = 'День маленьких историй';

UPDATE "calendar_holidays"
SET "title" = 'День похода на ёлку',
    "postcard_key" = '01-021',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '05.01'
  AND "title" = 'День похода на ёлку';

UPDATE "calendar_holidays"
SET "title" = 'День города Кисловодск',
    "postcard_key" = '01-022',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '05.01'
  AND "title" = 'День города Кисловодск';

UPDATE "calendar_holidays"
SET "title" = 'День начала контрнаступления против немецко-фашистских войск в битве под Москвой',
    "postcard_key" = '01-023',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '05.01'
  AND "title" = 'День начала контрнаступления против немецко-фашистских войск в битве под Москвой';

UPDATE "calendar_holidays"
SET "title" = 'День магического мышления',
    "postcard_key" = '01-024',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '06.01'
  AND "title" = 'День магического мышления';

UPDATE "calendar_holidays"
SET "title" = 'День яблони',
    "postcard_key" = '01-025',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '06.01'
  AND "title" = 'День яблони';

UPDATE "calendar_holidays"
SET "title" = 'Рождественский сочельник',
    "postcard_key" = '01-026',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '06.01'
  AND "title" = 'Рождественский сочельник';

UPDATE "calendar_holidays"
SET "title" = 'Святки',
    "postcard_key" = '01-027',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '07.01'
  AND "title" = 'Святки';

UPDATE "calendar_holidays"
SET "title" = 'День распространения микробов радости',
    "postcard_key" = '01-028',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '08.01'
  AND "title" = 'День распространения микробов радости';

UPDATE "calendar_holidays"
SET "title" = 'День сторожа',
    "postcard_key" = '01-029',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '08.01'
  AND "title" = 'День сторожа';

UPDATE "calendar_holidays"
SET "title" = 'Международный день хореографа',
    "postcard_key" = '01-030',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '09.01'
  AND "title" = 'Международный день хореографа';

UPDATE "calendar_holidays"
SET "title" = 'День игры в прятки с зимой',
    "postcard_key" = '01-031',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '09.01'
  AND "title" = 'День игры в прятки с зимой';

UPDATE "calendar_holidays"
SET "title" = 'День игры в снежки',
    "postcard_key" = '01-032',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '09.01'
  AND "title" = 'День игры в снежки';

UPDATE "calendar_holidays"
SET "title" = 'День путешествия на воздушном шаре',
    "postcard_key" = '01-033',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '09.01'
  AND "title" = 'День путешествия на воздушном шаре';

UPDATE "calendar_holidays"
SET "title" = 'День инженера-механика ВМФ России',
    "postcard_key" = '01-034',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '10.01'
  AND "title" = 'День инженера-механика ВМФ России';

UPDATE "calendar_holidays"
SET "title" = 'День соавторов',
    "postcard_key" = '01-035',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '10.01'
  AND "title" = 'День соавторов';

UPDATE "calendar_holidays"
SET "title" = 'День рождения имбирного пряника',
    "postcard_key" = '01-036',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '10.01'
  AND "title" = 'День рождения имбирного пряника';

UPDATE "calendar_holidays"
SET "title" = 'День санок',
    "postcard_key" = '01-037',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '10.01'
  AND "title" = 'День санок';

UPDATE "calendar_holidays"
SET "title" = 'День своеобразных людей',
    "postcard_key" = '01-038',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '10.01'
  AND "title" = 'День своеобразных людей';

UPDATE "calendar_holidays"
SET "title" = 'День заповедников и национальных парков России',
    "postcard_key" = '01-039',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '11.01'
  AND "title" = 'День заповедников и национальных парков России';

UPDATE "calendar_holidays"
SET "title" = 'Международный день «спасибо»',
    "postcard_key" = '01-040',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '11.01'
  AND "title" = 'Международный день «спасибо»';

UPDATE "calendar_holidays"
SET "title" = 'День заповедников и национальных парков',
    "postcard_key" = '01-041',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '11.01'
  AND "title" = 'День заповедников и национальных парков';

UPDATE "calendar_holidays"
SET "title" = 'День кофейных грёз',
    "postcard_key" = '01-042',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '11.01'
  AND "title" = 'День кофейных грёз';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день «Спасибо!»',
    "postcard_key" = '01-043',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '11.01'
  AND "title" = 'Всемирный день «Спасибо!»';

UPDATE "calendar_holidays"
SET "title" = 'День работника прокуратуры Российской Федерации',
    "postcard_key" = '01-044',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'День работника прокуратуры Российской Федерации';

UPDATE "calendar_holidays"
SET "title" = 'Международный день марципана',
    "postcard_key" = '01-045',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'Международный день марципана';

UPDATE "calendar_holidays"
SET "title" = 'День посадки внутреннего дерева',
    "postcard_key" = '01-046',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'День посадки внутреннего дерева';

UPDATE "calendar_holidays"
SET "title" = 'День северного сияния',
    "postcard_key" = '01-047',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'День северного сияния';

UPDATE "calendar_holidays"
SET "title" = 'День снежной королевы',
    "postcard_key" = '01-048',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'День снежной королевы';

UPDATE "calendar_holidays"
SET "title" = 'Декларация прав трудящихся',
    "postcard_key" = '01-049',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'Декларация прав трудящихся';

UPDATE "calendar_holidays"
SET "title" = 'День работника прокуратуры',
    "postcard_key" = '01-050',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '12.01'
  AND "title" = 'День работника прокуратуры';

UPDATE "calendar_holidays"
SET "title" = 'День российской печати',
    "postcard_key" = '01-051',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '13.01'
  AND "title" = 'День российской печати';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день борьбы с депрессией',
    "postcard_key" = '01-052',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '13.01'
  AND "title" = 'Всемирный день борьбы с депрессией';

UPDATE "calendar_holidays"
SET "title" = 'День осуществления мечты',
    "postcard_key" = '01-053',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '13.01'
  AND "title" = 'День осуществления мечты';

UPDATE "calendar_holidays"
SET "title" = 'Щедрец',
    "postcard_key" = '01-054',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '13.01'
  AND "title" = 'Щедрец';

UPDATE "calendar_holidays"
SET "title" = 'Старый Новый год в России',
    "postcard_key" = '01-055',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '14.01'
  AND "title" = 'Старый Новый год в России';

UPDATE "calendar_holidays"
SET "title" = 'День белоснежных птиц',
    "postcard_key" = '01-056',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '14.01'
  AND "title" = 'День белоснежных птиц';

UPDATE "calendar_holidays"
SET "title" = 'Обрезание Господне',
    "postcard_key" = '01-057',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '14.01'
  AND "title" = 'Обрезание Господне';

UPDATE "calendar_holidays"
SET "title" = 'День Святого Василия Великого',
    "postcard_key" = '01-058',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '14.01'
  AND "title" = 'День Святого Василия Великого';

UPDATE "calendar_holidays"
SET "title" = 'День создания трубопроводных войск России',
    "postcard_key" = '01-059',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '14.01'
  AND "title" = 'День создания трубопроводных войск России';

UPDATE "calendar_holidays"
SET "title" = 'День лося в России',
    "postcard_key" = '01-060',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '15.01'
  AND "title" = 'День лося в России';

UPDATE "calendar_holidays"
SET "title" = 'День образования Следственного комитета Российской Федерации',
    "postcard_key" = '01-061',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '15.01'
  AND "title" = 'День образования Следственного комитета Российской Федерации';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день шаурмы',
    "postcard_key" = '01-062',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '15.01'
  AND "title" = 'Всемирный день шаурмы';

UPDATE "calendar_holidays"
SET "title" = 'День клубничного мороженого',
    "postcard_key" = '01-063',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '15.01'
  AND "title" = 'День клубничного мороженого';

UPDATE "calendar_holidays"
SET "title" = 'День принятия горячей ванны',
    "postcard_key" = '01-064',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '15.01'
  AND "title" = 'День принятия горячей ванны';

UPDATE "calendar_holidays"
SET "title" = 'День образования Следственного комитета РФ',
    "postcard_key" = '01-065',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '15.01'
  AND "title" = 'День образования Следственного комитета РФ';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день The Beatles',
    "postcard_key" = '01-066',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '16.01'
  AND "title" = 'Всемирный день The Beatles';

UPDATE "calendar_holidays"
SET "title" = 'День Ледовара',
    "postcard_key" = '01-067',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '16.01'
  AND "title" = 'День Ледовара';

UPDATE "calendar_holidays"
SET "title" = 'День недоразумений',
    "postcard_key" = '01-068',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '16.01'
  AND "title" = 'День недоразумений';

UPDATE "calendar_holidays"
SET "title" = 'Международный день горячей и острой пищи',
    "postcard_key" = '01-069',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '16.01'
  AND "title" = 'Международный день горячей и острой пищи';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день «Beatles»',
    "postcard_key" = '01-070',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '16.01'
  AND "title" = 'Всемирный день «Beatles»';

UPDATE "calendar_holidays"
SET "title" = 'День ледовара (заливщика льда)',
    "postcard_key" = '01-071',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '16.01'
  AND "title" = 'День ледовара (заливщика льда)';

UPDATE "calendar_holidays"
SET "title" = 'День артиста в России',
    "postcard_key" = '01-072',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '17.01'
  AND "title" = 'День артиста в России';

UPDATE "calendar_holidays"
SET "title" = 'День творчества и вдохновения',
    "postcard_key" = '01-073',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '17.01'
  AND "title" = 'День творчества и вдохновения';

UPDATE "calendar_holidays"
SET "title" = 'День детских изобретений',
    "postcard_key" = '01-074',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '17.01'
  AND "title" = 'День детских изобретений';

UPDATE "calendar_holidays"
SET "title" = 'Международный день наставничества',
    "postcard_key" = '01-075',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '17.01'
  AND "title" = 'Международный день наставничества';

UPDATE "calendar_holidays"
SET "title" = 'День снежных котов',
    "postcard_key" = '01-076',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '17.01'
  AND "title" = 'День снежных котов';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день религии',
    "postcard_key" = '01-077',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '18.01'
  AND "title" = 'Всемирный день религии';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день снега',
    "postcard_key" = '01-078',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '18.01'
  AND "title" = 'Всемирный день снега';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день снеговика',
    "postcard_key" = '01-079',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '18.01'
  AND "title" = 'Всемирный день снеговика';

UPDATE "calendar_holidays"
SET "title" = 'День снеговика',
    "postcard_key" = '01-080',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '18.01'
  AND "title" = 'День снеговика';

UPDATE "calendar_holidays"
SET "title" = 'Грустный понедельник',
    "postcard_key" = '01-081',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '19.01'
  AND "title" = 'Грустный понедельник';

UPDATE "calendar_holidays"
SET "title" = 'День нежности ко всем существам',
    "postcard_key" = '01-082',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '19.01'
  AND "title" = 'День нежности ко всем существам';

UPDATE "calendar_holidays"
SET "title" = 'Великое освящение воды',
    "postcard_key" = '01-083',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '19.01'
  AND "title" = 'Великое освящение воды';

UPDATE "calendar_holidays"
SET "title" = 'День Республики Крым',
    "postcard_key" = '01-084',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '20.01'
  AND "title" = 'День Республики Крым';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день любителей сыра',
    "postcard_key" = '01-085',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '20.01'
  AND "title" = 'Всемирный день любителей сыра';

UPDATE "calendar_holidays"
SET "title" = 'День осведомленности о пингвинах',
    "postcard_key" = '01-086',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '20.01'
  AND "title" = 'День осведомленности о пингвинах';

UPDATE "calendar_holidays"
SET "title" = 'День любителей сыра',
    "postcard_key" = '01-087',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '20.01'
  AND "title" = 'День любителей сыра';

UPDATE "calendar_holidays"
SET "title" = 'День прогулки на свежем воздухе',
    "postcard_key" = '01-088',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '20.01'
  AND "title" = 'День прогулки на свежем воздухе';

UPDATE "calendar_holidays"
SET "title" = 'День сосулек',
    "postcard_key" = '01-089',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '20.01'
  AND "title" = 'День сосулек';

UPDATE "calendar_holidays"
SET "title" = 'День инженерных войск России',
    "postcard_key" = '01-090',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'День инженерных войск России';

UPDATE "calendar_holidays"
SET "title" = 'Международный день аспиранта',
    "postcard_key" = '01-091',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'Международный день аспиранта';

UPDATE "calendar_holidays"
SET "title" = 'Международный день объятий',
    "postcard_key" = '01-092',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'Международный день объятий';

UPDATE "calendar_holidays"
SET "title" = 'День алкогольной независимости',
    "postcard_key" = '01-093',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'День алкогольной независимости';

UPDATE "calendar_holidays"
SET "title" = 'День объятий',
    "postcard_key" = '01-094',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'День объятий';

UPDATE "calendar_holidays"
SET "title" = 'День уютной кофейни',
    "postcard_key" = '01-095',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'День уютной кофейни';

UPDATE "calendar_holidays"
SET "title" = 'День инженерных войск',
    "postcard_key" = '01-096',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'День инженерных войск';

UPDATE "calendar_holidays"
SET "title" = 'Национальный день объятий',
    "postcard_key" = '01-097',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '21.01'
  AND "title" = 'Национальный день объятий';

UPDATE "calendar_holidays"
SET "title" = 'День авиации войск ПВО России',
    "postcard_key" = '01-098',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '22.01'
  AND "title" = 'День авиации войск ПВО России';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день дыхания',
    "postcard_key" = '01-099',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '22.01'
  AND "title" = 'Всемирный день дыхания';

UPDATE "calendar_holidays"
SET "title" = 'День борьбы с пивным животиком',
    "postcard_key" = '01-100',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '22.01'
  AND "title" = 'День борьбы с пивным животиком';

UPDATE "calendar_holidays"
SET "title" = 'День рождения воздушной кукурузы',
    "postcard_key" = '01-101',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '22.01'
  AND "title" = 'День рождения воздушной кукурузы';

UPDATE "calendar_holidays"
SET "title" = 'День сотрудников органов дознания МЧС России',
    "postcard_key" = '01-102',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День сотрудников органов дознания МЧС России';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день пирога',
    "postcard_key" = '01-103',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'Всемирный день пирога';

UPDATE "calendar_holidays"
SET "title" = 'День ручного письма',
    "postcard_key" = '01-104',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День ручного письма';

UPDATE "calendar_holidays"
SET "title" = 'День зелёного света',
    "postcard_key" = '01-105',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День зелёного света';

UPDATE "calendar_holidays"
SET "title" = 'День счастливчика по жизни',
    "postcard_key" = '01-106',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День счастливчика по жизни';

UPDATE "calendar_holidays"
SET "title" = 'День травяного чая',
    "postcard_key" = '01-107',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День травяного чая';

UPDATE "calendar_holidays"
SET "title" = 'День Святого Григория',
    "postcard_key" = '01-108',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День Святого Григория';

UPDATE "calendar_holidays"
SET "title" = 'День ручного письма (день почерка)',
    "postcard_key" = '01-109',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '23.01'
  AND "title" = 'День ручного письма (день почерка)';

UPDATE "calendar_holidays"
SET "title" = 'День госслужащего в России',
    "postcard_key" = '01-110',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '24.01'
  AND "title" = 'День госслужащего в России';

UPDATE "calendar_holidays"
SET "title" = 'Международный день эскимо',
    "postcard_key" = '01-111',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '24.01'
  AND "title" = 'Международный день эскимо';

UPDATE "calendar_holidays"
SET "title" = 'День баночного пива',
    "postcard_key" = '01-112',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '24.01'
  AND "title" = 'День баночного пива';

UPDATE "calendar_holidays"
SET "title" = 'День белого зайца',
    "postcard_key" = '01-113',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '24.01'
  AND "title" = 'День белого зайца';

UPDATE "calendar_holidays"
SET "title" = 'Праздник дат и планов',
    "postcard_key" = '01-114',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'День рождения Calend.ru';

UPDATE "calendar_holidays"
SET "title" = 'Татьянин день — День российского студенчества',
    "postcard_key" = '01-115',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'Татьянин день — День российского студенчества';

UPDATE "calendar_holidays"
SET "title" = 'Международный день БЕЗ интернета',
    "postcard_key" = '01-116',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'Международный день БЕЗ интернета';

UPDATE "calendar_holidays"
SET "title" = 'День рождения МГУ имени М. В. Ломоносова',
    "postcard_key" = '01-117',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'День рождения МГУ имени М. В. Ломоносова';

UPDATE "calendar_holidays"
SET "title" = 'День российского студенчества',
    "postcard_key" = '01-118',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'День российского студенчества';

UPDATE "calendar_holidays"
SET "title" = 'День счастливых снеговиков',
    "postcard_key" = '01-119',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'День счастливых снеговиков';

UPDATE "calendar_holidays"
SET "title" = 'Татьянин день',
    "postcard_key" = '01-120',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'Татьянин день';

UPDATE "calendar_holidays"
SET "title" = 'День штурмана ВМФ',
    "postcard_key" = '01-121',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'День штурмана ВМФ';

UPDATE "calendar_holidays"
SET "title" = 'Неделя о Закхее-мытаре',
    "postcard_key" = '01-122',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '25.01'
  AND "title" = 'Неделя о Закхее-мытаре';

UPDATE "calendar_holidays"
SET "title" = 'Киберпонедельник в России',
    "postcard_key" = '01-123',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '26.01'
  AND "title" = 'Киберпонедельник в России';

UPDATE "calendar_holidays"
SET "title" = 'День супругов',
    "postcard_key" = '01-124',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '26.01'
  AND "title" = 'День супругов';

UPDATE "calendar_holidays"
SET "title" = 'Международный день таможенника',
    "postcard_key" = '01-125',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '26.01'
  AND "title" = 'Международный день таможенника';

UPDATE "calendar_holidays"
SET "title" = 'День случайных направлений',
    "postcard_key" = '01-126',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '26.01'
  AND "title" = 'День случайных направлений';

UPDATE "calendar_holidays"
SET "title" = 'Международный день профессионального рыбака',
    "postcard_key" = '01-127',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '26.01'
  AND "title" = 'Международный день профессионального рыбака';

UPDATE "calendar_holidays"
SET "title" = 'День жизнелюба',
    "postcard_key" = '01-128',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '27.01'
  AND "title" = 'День жизнелюба';

UPDATE "calendar_holidays"
SET "title" = 'День танца со своей тенью',
    "postcard_key" = '01-129',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '27.01'
  AND "title" = 'День танца со своей тенью';

UPDATE "calendar_holidays"
SET "title" = 'Всемирный день безработных',
    "postcard_key" = '01-130',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '28.01'
  AND "title" = 'Всемирный день безработных';

UPDATE "calendar_holidays"
SET "title" = 'Международный день ЛЕГО',
    "postcard_key" = '01-131',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '28.01'
  AND "title" = 'Международный день ЛЕГО';

UPDATE "calendar_holidays"
SET "title" = 'Международный день защиты персональных данных',
    "postcard_key" = '01-132',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '28.01'
  AND "title" = 'Международный день защиты персональных данных';

UPDATE "calendar_holidays"
SET "title" = 'День снежных горок',
    "postcard_key" = '01-133',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '28.01'
  AND "title" = 'День снежных горок';

UPDATE "calendar_holidays"
SET "title" = 'День солений',
    "postcard_key" = '01-134',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '28.01'
  AND "title" = 'День солений';

UPDATE "calendar_holidays"
SET "title" = 'Международный день защиты персональных данных (конфиденциальности)',
    "postcard_key" = '01-135',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '28.01'
  AND "title" = 'Международный день защиты персональных данных (конфиденциальности)';

UPDATE "calendar_holidays"
SET "title" = 'День мобилизации против угрозы ядерной войны',
    "postcard_key" = '01-136',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '29.01'
  AND "title" = 'День мобилизации против угрозы ядерной войны';

UPDATE "calendar_holidays"
SET "title" = 'День изобретения автомобиля',
    "postcard_key" = '01-137',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '29.01'
  AND "title" = 'День изобретения автомобиля';

UPDATE "calendar_holidays"
SET "title" = 'День необязательств',
    "postcard_key" = '01-138',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '29.01'
  AND "title" = 'День необязательств';

UPDATE "calendar_holidays"
SET "title" = 'День первооткрывателя в России',
    "postcard_key" = '01-139',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '29.01'
  AND "title" = 'День первооткрывателя в России';

UPDATE "calendar_holidays"
SET "title" = 'Международный день мобилизации против ядерной войны',
    "postcard_key" = '01-140',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '29.01'
  AND "title" = 'Международный день мобилизации против ядерной войны';

UPDATE "calendar_holidays"
SET "title" = 'День Деда Мороза и Снегурочки',
    "postcard_key" = '01-141',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '30.01'
  AND "title" = 'День Деда Мороза и Снегурочки';

UPDATE "calendar_holidays"
SET "title" = 'День веселья на работе',
    "postcard_key" = '01-142',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '30.01'
  AND "title" = 'День веселья на работе';

UPDATE "calendar_holidays"
SET "title" = 'День рождения киностудии «Мосфильм»',
    "postcard_key" = '01-143',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '30.01'
  AND "title" = 'День рождения киностудии «Мосфильм»';

UPDATE "calendar_holidays"
SET "title" = 'День рождения русской водки',
    "postcard_key" = '01-144',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '31.01'
  AND "title" = 'День рождения русской водки';

UPDATE "calendar_holidays"
SET "title" = 'День скрапбукинга',
    "postcard_key" = '01-145',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '31.01'
  AND "title" = 'День скрапбукинга';

UPDATE "calendar_holidays"
SET "title" = 'Международный день ювелира',
    "postcard_key" = '01-146',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '31.01'
  AND "title" = 'Международный день ювелира';

UPDATE "calendar_holidays"
SET "title" = 'Международный день очистки воды',
    "postcard_key" = '01-147',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '31.01'
  AND "title" = 'Международный день очистки воды';

UPDATE "calendar_holidays"
SET "title" = 'День рисования солнца на снегу',
    "postcard_key" = '01-148',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '31.01'
  AND "title" = 'День рисования солнца на снегу';

UPDATE "calendar_holidays"
SET "title" = 'День ювелира',
    "postcard_key" = '01-149',
    "postcard_pack" = 'calendar/01/v8-20260808'
WHERE "date" = '31.01'
  AND "title" = 'День ювелира';

DO $$
DECLARE
  attached_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attached_count
  FROM "calendar_holidays"
  WHERE "postcard_pack" = 'calendar/01/v8-20260808';

  IF attached_count <> 149 THEN
    RAISE EXCEPTION 'January postcard migration expected 149 rows, attached %', attached_count;
  END IF;
END $$;
