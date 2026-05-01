/** Скриншот: либо просто строка-путь, либо объект с подписью. */
export type Screenshot = string | { src: string; caption?: string; alt?: string };

export interface Project {
  slug: string;
  title: string;
  company: string;
  role: string;
  period: string;
  year: number;
  description: string;
  longDescription: string;
  tags: string[];
  metric?: string;
  metricLabel?: string;
  type: "work" | "experiment";
  coverColor: string;
  coverImage?: string;
  /**
   * Optional cover video (mp4/webm). Если задан — карточка показывает автоплей-видео
   * вместо статичного coverImage. coverImage при этом служит постером для <video>.
   */
  coverVideo?: string;
  /**
   * Опционально: timestamp в секундах, на котором держится «холодный» кадр.
   * — На hero страницы кейса видео ставится на эту секунду и стоит на паузе.
   * — На карточке главной: hover → play 0..pauseAt → pause; mouseLeave → play pauseAt..end → pause на конце.
   */
  coverVideoPauseAt?: number;
  screenshots?: Screenshot[];
  sections?: {
    title: string;
    /** Старый формат — single paragraph. Используется в кейсах, где ещё не разнесли на структурные блоки. */
    content?: string;
    /** Новый структурный формат: задача → подход → что способствовало → результат. */
    context?: string;
    approach?: string;
    helped?: string;
    result?: string;
    /** Мини-цифры внутри секции — рендерятся сеткой 2×N. */
    callouts?: { value: string; label: string }[];
    /** Inline-пруфы: ссылки рядом с релевантным контентом, а не только в нижнем блоке. */
    links?: { label: string; url: string; thumbnail?: string; kind?: "video" | "article" | "site" | "github" }[];
    screenshots?: Screenshot[];
  }[];
  results?: {
    value: string;
    label: string;
  }[];
  links?: {
    label: string;
    url: string;
    category?: string;
    /** Опционально: путь к JPG-превью (1280x720). Для видео-ссылок будет нарисован play-иконкой поверх. */
    thumbnail?: string;
    /** Опционально: тип ссылки. Если "video" — рендерится с play-иконкой. */
    kind?: "video" | "article" | "site" | "github";
  }[];
}

export const projects: Project[] = [
  {
    slug: "mts-2024",
    title: "МТС Экосистема & AI",
    company: "МТС · MWS AI",
    role: "Design Director, МТС · AI Visioner, MWS AI",
    period: "2024 — 2026",
    year: 2024,
    description:
      "3 продукта в проде, time-to-market −60%, коммуникационный бюджет −40%. Руководил дизайном B2C-экосистемы (8 команд, 40+ дизайнеров) и задавал AI-направление в MWS AI.",
    longDescription:
      "Две роли в экосистеме МТС. Как Design Director B2C-экосистемы — визуальная стратегия и управление креативными командами в период трансформации МТС из телеком-оператора в технологическую экосистему: 8 команд, 6 дизайн-лидов, 3 арт-директора, 40+ дизайнеров. Продукты: Мой МТС App, МТС Маркет, Голосовая Экосистема, Гео-Центр, МТС Лончер, МТС Накопления, Семейная Группа, МТС Shop, MTS.RU Web. Как AI Visioner в MWS AI — задавал AI-направление двум продуктам дивизиона: Legal Copilot, IAM Admin. Запустил MWS AI UI Kit — единую дизайн-систему AI-продуктов.",
    tags: [
      "Design Management",
      "AI/ML",
      "B2C Ecosystem",
      "Design System",
      "Art Direction",
    ],
    metric: "40+",
    metricLabel: "дизайнеров",
    results: [
      { value: "−60%", label: "TTM коммуникаций" },
      { value: "−40%", label: "бюджет на коммуникации" },
      { value: "3", label: "AI-продукта в проде" },
      { value: "40+", label: "дизайнеров" },
    ],
    type: "work",
    coverColor: "#1a1a2e",
    coverImage: "/images/covers/mts-2024.jpg",
    screenshots: [
      "/images/iam-admin/1.1-workspaces.png",
      "/images/iam-admin/1.5-role-constructor.png",
      "/images/iam-admin/1.2-ba-users.png",
      "/images/iam-admin/1.3-ws-users.png",
      "/images/iam-admin/1.4-ws-roles.png",
      "/images/iam-admin/1.6-ws-multi.png",
      "/images/iam-admin/3.1-modal-create-ws.png",
      "/images/iam-admin/2.1-user-card.png",
    ],
    sections: [
      {
        title: "B2C экосистема",
        content:
          "Руководил дизайн-направлением департамента «Цифровые витрины». Уменьшил бюджет на коммуникационные задачи на 40%. Сократил TTM коммуникационных задач на 60%. Увеличил количество качественных гипотез на 30%. Ускорил прохождение этапов написания текста на 40%. Ускорил time-to-market выхода фичей. Увеличил кросс-функциональность между продуктами.",
        callouts: [
          { value: "−40%", label: "бюджет коммуникаций" },
          { value: "−60%", label: "TTM коммуникаций" },
          { value: "+30%", label: "качественных гипотез" },
          { value: "+40%", label: "ускорение текстов" },
        ],
      },
      {
        title: "МТС Маркет",
        content:
          "Запустил MVP нативного магазина внутри приложения Мой МТС. Внедрил сценарии с BNPL, механики допродажи цифровых продуктов. Встроил сценарии магазина в приложение Мой МТС. Сформировал концепцию развития маркета с механиками User Generated Content.",
        callouts: [
          { value: "MVP", label: "нативного магазина" },
          { value: "BNPL", label: "сценарии оплаты" },
          { value: "Мой МТС", label: "встроенная витрина" },
        ],
      },
      {
        title: "AI-дивизион MWS AI",
        content:
          "Задавал AI-направление двум продуктам MWS AI. Запустил MWS AI UI Kit — единую дизайн-систему для всех AI-продуктов. Спроектировал Legal Copilot (AI-ассистент для юристов) и IAM Admin (управление доступами). Внедрил AI-инструменты (Claude, Cursor, v0) в дизайн-процесс. 3 продукта в production, дизайн-система покрывает 90%+ интерфейсов.",
        callouts: [
          { value: "3", label: "AI-продукта в проде" },
          { value: "90%+", label: "покрытие AI UI Kit" },
          { value: "2", label: "продукта спроектировано" },
          { value: "Claude · Cursor · v0", label: "AI в дизайн-процессе" },
        ],
        screenshots: [
          "/images/iam-admin/1.1-workspaces.png",
          "/images/iam-admin/1.5-role-constructor.png",
          "/images/iam-admin/1.2-ba-users.png",
          "/images/iam-admin/1.3-ws-users.png",
          "/images/iam-admin/1.4-ws-roles.png",
          "/images/iam-admin/1.6-ws-multi.png",
          "/images/iam-admin/3.1-modal-create-ws.png",
          "/images/iam-admin/2.1-user-card.png",
        ],
      },
    ],
    links: [
      { category: "Дизайн-система", label: "МТС Design — портал дизайна", url: "https://design.mts.ru" },
      { category: "Дизайн-система", label: "Дизайн-система GRANAT", url: "https://design.mts.ru/ds" },
      { category: "Выступления и интервью", label: "Интервью со мной — Art-director МТС", url: "https://youtu.be/opoCmrnQUDI", kind: "video", thumbnail: "/images/mts/links/mts-interview.jpg" },
      { category: "Выступления и интервью", label: "Раннее выступление — «Чаптеры или как засинкать 150 дизайнеров»", url: "https://youtu.be/2F6TrdrWYKc", kind: "video", thumbnail: "/images/mts/links/mts-first.jpg" },
    ],
  },
  {
    slug: "gazprom-neft",
    title: "Построить ЦК дизайна и разморозить флагман",
    company: "Газпром Нефть",
    role: "Head of Design",
    period: "2022 — 2024",
    year: 2022,
    description:
      "Собрал из 80 разрозненных дизайнеров единую функцию. Разморозил флагманский ЕСО — портал на 50 000 пользователей, замёрзший в макетах два года. CX Awards 2024. Развил open-source DS Consta — на ней 180+ продуктов компании.",
    longDescription:
      "Пришёл в Газпром Нефть в 2022-м, на роль Head of Design. За два года собрал из 80 разрозненных дизайнеров единую функцию третьего уровня зрелости — с общими процессами, открытой базой знаний и дизайном-как-сервисом для всей компании.\n\nЗадача со звёздочкой — внутренний портал на 50 тысяч человек, который годами оставался в макетах: две команды дизайна до меня не смогли договориться с департаментами. Перевели разговор на язык цифр — разморозили; раскатали и взяли CX Awards 2024 уже после моего ухода.",
    tags: [
      "Enterprise",
      "Industrial",
      "Design System",
      "Design Management",
      "AI/ML",
    ],
    results: [
      { value: "CX 2024", label: "награда за ЕСО" },
      { value: "180+", label: "продуктов на Consta" },
      { value: "57", label: "проектов в год" },
      { value: "27+", label: "внешних выступлений" },
    ],
    type: "work",
    // Чистый тёмный фон под видео-обложку (раньше была бронза #C9A66B — давала бежевую подсветку)
    coverColor: "#0E0E0E",
    coverImage: "/images/covers/gpn-cover.jpg",
    coverVideo: "/videos/gpn-cover.mp4",
    coverVideoPauseAt: 2.86,
    screenshots: [
      "/images/gpn/eso/eso-home.png",
      "/images/gpn/consta/consta-dashboard-dark.png",
      "/images/gpn/hr/badges-closeup.jpg",
    ],
    sections: [
      {
        title: "ЦК продуктового дизайна — система, не команда",
        context:
          "Дизайнеры в ГПН были и до меня — но не было общего процесса, языка и точек обмена. Сидели по департаментам, не пересекались, помогать друг другу было неудобно.",
        approach:
          "**Карта людей.** Асессмент всех дизайнеров: кто в каком блоке, какие компетенции, кому нужна поддержка.\n\n**Матричное подчинение.** 10 дизайнеров в прямом, дизайн-директора департаментов в функциональном — под каждым ещё ~50 человек.\n\n**Общие ритуалы.** Дейли раз в 2 дня, дизайн-ревью лида, синки команды, карта компетенций как стандарт для всей дизайн-функции компании.\n\n**Дизайн как сервис.** Открытые консультации и 19–20 ревью проектов в год — выходим со списком, что чинить, а не с запретом релиза.\n\n**Системные точки входа.** Открытый Confluence со всеми процессами и Jira Sourcing — официальный канал запроса продуктового дизайна.",
        result:
          "За два года перевели ЦК со 2-го на 3-й уровень зрелости. Собрали из ~80 разрозненных дизайнеров единую функцию. Стратегические продукты — ЕСО, Инсайт, Корпоративный поиск, Эра-Бурение, Н1 Хаб — вели сами, без подрядчиков.",
        callouts: [
          { value: "~80", label: "дизайнеров в функции" },
          { value: "57", label: "проектов в год" },
          { value: "19–20", label: "ревью проектов" },
          { value: "3-й", label: "уровень зрелости ЦК" },
        ],
        screenshots: [
          { src: "/images/gpn/team/team-demo.jpg", caption: "Команда продуктового дизайна на демо департамента. Цифергауз, Питер" },
          { src: "/images/gpn/team/team-noses.jpg", caption: "Тимбилдинг с красными клоунскими носами. Внутренняя традиция, ставшая мемом команды" },
          { src: "/images/gpn/team/process-talk.jpg", caption: "Внутренний доклад про дизайн-процесс — 7 этапов от анализа требований до реализации" },
          { src: "/images/gpn/team/concept-talk.jpg", caption: "Соавторский доклад со Светланой Любавской про создание нового концепта продукта" },
        ],
      },
      {
        title: "ЕСО — флагман, который не двигался годами",
        context:
          "Внутренний портал, через который сотрудник оформляет отпуск, командировку, любую заявку. До нас — 800+ разрозненных сервисов, оформить простую заявку без подсказки коллеги было нельзя. Две предыдущие команды дизайна остановились на этапе макетов: не смогли договориться с департаментами.",
        approach:
          "Договариваться через цифры. Замеры до/после в UX-исследовании дали язык, на котором с департаментами стало возможно разговаривать. Плюс одобрение генерального в письме, союзники, 100 уважительных встреч.",
        helped:
          "Сменили формат разговора с «давайте объединимся» на «вот цифры, вот выгода для вашего сценария». До этого попытки шли через идею и встречали оборону.",
        result:
          "Раскатан на 60+ организаций ГПН: 50 000+ пользователей, 550+ сервисов в каталоге. По консервативной оценке — сотни миллионов ₽ экономии времени в год. Победитель CX Awards 2024 в номинации «Работа с персоналом как с внутренним клиентом» — раскатан и награждён уже после моего ухода. Переговоры и проектирование — на мне; релиз и поддержка — на команде.",
        callouts: [
          { value: "7 → 2 мин", label: "оформить заявку" },
          { value: "50K", label: "пользователей" },
          { value: "CSI 75%", label: "удовлетворённость" },
          { value: "~500 млн ₽", label: "оценка экономии в год" },
        ],
        links: [
          { label: "Карточка ЕСО на CX Awards 2024 (РБК)", url: "https://cxa-spb.rbc.ru/proposals/147/" },
        ],
        screenshots: [
          { src: "/images/gpn/eso/eso-home.png", caption: "ЕСО — главная: список обращений сотрудника с фильтрами по статусам, виджеты «Отпуск скоро» и «Старт» справа" },
          { src: "/images/gpn/eso/eso-form.png", caption: "ЕСО — создание нового обращения. Контекстная подсказка с правилами оформления справки 2-НДФЛ" },
          { src: "/images/gpn/eso/eso-detail.png", caption: "ЕСО — карточка обращения SD-4252730: статус, контактное лицо, прогресс обработки" },
        ],
      },
      {
        title: "Consta — open-source DS первой промышленной компании",
        context:
          "Открытая дизайн-система, существовавшая до меня. Первая в индустрии бесплатная DS от промышленной компании. Я не создавал — пришёл на роль CPO.",
        approach:
          "Команда из 4 человек: я как CPO дизайн-системы — бэклог приоритетов, бюджет и адвокация внутри/снаружи компании. Алексей Титяев (арт-директор в прямом подчинении) — компонентная часть и связь с продуктовыми командами. Штатный разработчик — релизы, инфраструктура, поддержка. Дизайнер — документация и Figma-библиотека.",
        result:
          "Снизили трудозатраты дизайнеров на 40% и фронтенд-разработчиков на 20%. За год: +12 000 скачиваний на npm, +10 000 загрузок в Figma Community (несколько раз попадали в топ трендов), +1 000 использований разработчиками, 6 000+ органических посетителей сайта, 70 релизов, тёмная и светлая темы, 35 проектов задокументировано (фактически — все продукты компании). Параллельно — Consta Analytics для маленьких выборок (3–4 пользователя), где A/B не работает.",
        callouts: [
          { value: "−40%", label: "трудозатрат у дизайнеров" },
          { value: "−20%", label: "трудозатрат у фронта" },
          { value: "+10K", label: "загрузок в Figma Community" },
          { value: "180+", label: "продуктов на DS" },
        ],
        links: [
          { label: "consta.design — официальный сайт", url: "https://consta.design" },
          { label: "Consta на GitHub", url: "https://github.com/consta-design-system" },
          { label: "Статья vc.ru от ГПН", url: "https://vc.ru/gazpromneft/676527" },
        ],
        screenshots: [
          { src: "/images/gpn/consta/consta-quick-start.png", caption: "Consta Quick Start — что такое дизайн-система, лицевая страница доклада" },
          { src: "/images/gpn/consta/consta-buttons.png", caption: "Широкая вариативность компонентов — на примере кнопок" },
          { src: "/images/gpn/consta/consta-userselect.png", caption: "UserSelect — компонент с порталом, обновляется автоматически после апдейта на GitHub" },
          { src: "/images/gpn/consta/consta-dashboard-light.png", caption: "Дашборд бурения — светлая тема" },
          { src: "/images/gpn/consta/consta-dashboard-dark.png", caption: "Тот же дашборд — тёмная тема. Парные темы из коробки" },
          { src: "/images/gpn/consta/consta-charts.png", caption: "Consta Charts — линейные, столбчатые, пузырчатые графики на палитре DS" },
        ],
      },
      {
        title: "Продукты на Consta — Юпитер и ЭРА Бурения",
        context:
          "Consta — production-DS, на ней работают десятки внутренних продуктов ГПН. Здесь — два показательных. ЭРА Бурения — продукт моей команды, под арт-директорством Алексея Титяева. Юпитер — продукт другого отдела, который выбрал Consta как стандарт. Разные домены, разные команды — один язык интерфейса.",
        result:
          "**ЭРА Бурения — мой продукт.** Экономическая Расчётная Аналитическая модель ствола скважины. Один продукт — три радикально разных контекста использования: промысел (полевые условия), НТЦ, центр управления. Адаптивность под все экраны вёл Алексей Титяев.\n\n**Юпитер — пример распространения Consta вне моей команды.** Корпоративный поиск и мониторинг IT-инфраструктуры ГПН: поиск по внутренним системам компании (BLPS, БРД, ДРП, RCL, Linux), лента событий, инфраструктурные карты SAP-блоков. Команда выбрала Consta как стандарт — без моего участия в продуктовых решениях.",
        callouts: [
          { value: "2", label: "продукта в кейсе" },
          { value: "1 DS", label: "Consta на оба" },
          { value: "3", label: "контекста ЭРА: промысел · НТЦ · центр" },
          { value: "≠ команды", label: "ЭРА — моя, Юпитер — соседняя" },
        ],
        screenshots: [
          { src: "/images/gpn/consta/jupiter-main.png", caption: "Юпитер — главная: поиск по внутренним системам ГПН и лента изменений" },
          { src: "/images/gpn/consta/jupiter-monitoring.png", caption: "Юпитер — лента инцидентов: приоритет, статус, владелец" },
          { src: "/images/gpn/consta/jupiter-dashboard.png", caption: "Юпитер — инфраструктурная карта SAP-блоков и связанных сервисов" },
          { src: "/images/gpn/consta/jupiter-search.png", caption: "Юпитер — расширенный поиск с фильтрами по типам систем и метрикам" },
          { src: "/images/gpn/drilling/era-burenie-empty.png", caption: "ЭРА Бурения — стартовое состояние «компоновка не создана»" },
          { src: "/images/gpn/drilling/era-burenie-stack.png", caption: "ЭРА Бурения — компоновка КНБК с долотом, мотором, стабилизатором" },
          { src: "/images/gpn/drilling/era-burenie-projection.png", caption: "ЭРА Бурения — проекция ствола скважины с обсадной колонной" },
          { src: "/images/gpn/drilling/era-burenie-sections.png", caption: "ЭРА Бурения — модель скважины: направление, кондуктор, хвостовик" },
        ],
      },
      {
        title: "HR-бренд через комьюнити",
        context:
          "Дизайн-функция держится на людях. Без HR-бренда — не масштабируется ни найм, ни удержание.",
        approach:
          "Три канала параллельно: внешние выступления, партнёрства с вузами и школами, внутреннее комьюнити.",
        result:
          "**Внешние выступления.** 27+ за год на 15+ мероприятиях: Стачка (~20K), Дизайн-Выходные (~40K), ПромТехДизайн (240K онлайн). Темы — Consta, дизайн-процесс, нейросети, цифровые двойники.\n\n**Партнёрства с вузами и школами.** Bang Bang Education, Young Design (совместная номинация «Интерфейс» — модуль для геомоделирования на Consta), Институт Штиглица. Поставляли реальные задачи, дизайнеры менторили студентов.\n\n**Внутреннее комьюнити.** 6 митапов в год для всей компании. История с пропусками, которая разошлась сама: идея совпала у меня и у Вики Кудрявцевой из команды — объединились, довели до конца. 1,5 года, 300+ персональных пропусков напечатано — каждый стал точкой входа в дизайн-отдел. После моего ухода Вика навайбкодила генератор бейджей через ChatGPT — open-source, сервис живёт без меня.",
        helped:
          "Главное — строил среду, а не команду. Дизайнер с инициативой мог довести её до GitHub, и это работает без моего постоянного участия.",
        callouts: [
          { value: "27+", label: "выступлений/год" },
          { value: "240K", label: "ПромТехДизайн онлайн" },
          { value: "300+", label: "персональных пропусков" },
          { value: "3", label: "вуза-партнёра" },
        ],
        links: [
          { label: "Выступление на World Usability Day", url: "https://www.youtube.com/live/OjdF0lLFGv4?t=5003", kind: "video", thumbnail: "/images/gpn/links/wud-2022.jpg" },
          { label: "Полное выступление со студией Pinkman", url: "https://youtu.be/lLxhnXgoCTQ", kind: "video", thumbnail: "/images/gpn/links/pinkman.jpg" },
          { label: "Young Design × ГПН — номинация «Интерфейс»", url: "https://youngdesignspb.ru/nominations/interface" },
          { label: "Бейдж-генератор Вики (open-source)", url: "https://github.com/design-kudry/badge-generator" },
        ],
        screenshots: [
          { src: "/images/gpn/hr/badges-closeup.jpg", caption: "Готовые персональные пропуска: Лепёха, Кудрявцева, Воронин, Шугаев, Кравченко" },
          { src: "/images/gpn/hr/badges-vika.jpg", caption: "Вика Кудрявцева — соавторка истории с пропусками — со своим пропуском" },
          { src: "/images/gpn/hr/badges-presentation.jpg", caption: "Внутренняя презентация про шаблон наклеек на пропуска. Зал слушает, на экране сетка пропусков команды" },
          { src: "/images/gpn/hr/badges-egor.jpg", caption: "Мой пропуск на ленте UMBRELLA CORPORATION — внутренний мем команды" },
          { src: "/images/gpn/hr/speaking-barcamp.jpg", caption: "Спикер на БАРКЕМП 20.35 — Национальная технологическая революция, Санкт-Петербург, 7–8 ноября" },
          { src: "/images/gpn/hr/speaking-panel.jpg", caption: "Панельная дискуссия на БАРКЕМП 20.35 — продуктовый дизайн в крупных промышленных компаниях" },
          { src: "/images/gpn/hr/speaking-covid.jpg", caption: "Внутренний митап в Цифергаузе. Тема: хронология ограничений COVID-19 и ответ продуктовой команды" },
          { src: "/images/gpn/hr/speaking-bw.jpg", caption: "Подкаст-интервью на сцене перед аудиторией дизайнеров" },
        ],
      },
      {
        title: "Нейросети раньше рынка",
        context:
          "2022–2023. Большинство компаний только обсуждали ChatGPT. Нам же сразу было нужно — и для продакшн-задач, и для подготовки к Figma-блокировкам.",
        approach:
          "Поставили нейросети в плоскость дизайн-процесса, а не «вау, нейронка». Stable Diffusion и MidJourney — иллюстрации для внутренних продуктов и HR-бренда. Llama и ChatGPT — тексты, макросы. Whisper — транскрибы UX-исследователей. Параллельно — «Гайд на чёрный день для ухода из Figma»: план миграции на Pixso.",
        result:
          "Команда вышла из блокировки Figma в РФ без простоя — план миграции уже был. После каждой конференции к нам приходили B2B-компании за консультациями про AI в дизайне.",
        callouts: [
          { value: "2022", label: "AI-инструменты в проде" },
          { value: "5+", label: "AI-инструментов в работе" },
          { value: "0", label: "простоя при блокировке Figma" },
          { value: "1.5–2 года", label: "раньше рынка" },
        ],
        links: [
          { label: "ЦЕХ News #13 — ИИ в дизайне (Webflow Conf 2023)", url: "https://youtu.be/4s7j57G71fg", kind: "video", thumbnail: "/images/gpn/links/ai-edited.jpg" },
          { label: "«ИИ бесполезен» — подкаст про ИИ", url: "https://youtu.be/iGQzN9T4upA", kind: "video", thumbnail: "/images/gpn/links/ai-fun.jpg" },
          { label: "AI в дизайне — кафедра Skillbox", url: "https://youtu.be/u1AQGiFpgMI", kind: "video", thumbnail: "/images/gpn/links/ai-skillbox.jpg" },
          { label: "Раннее интервью на ЦЕХ — нейросети", url: "https://youtu.be/cEw5iTNTfZg", kind: "video", thumbnail: "/images/gpn/links/ai-old.jpg" },
        ],
      },
      {
        title: "Из 36 in-house проектов — три, которые показывают подход",
        context:
          "В год команда вела 36 продуктовых проектов внутри компании. Три из них — про разные стороны работы: командный формат, сервисный дизайн и стандартизация.",
        result:
          "**Дроны — стендап как хакатон.** Привезли коллег из Уфы и Логистики Переработки и Сбыта; за 2–3 недели стажёры с дизайнерами сделали кликабельный прототип сервиса беспилотной съёмки. Двойной выхлоп: реальный прототип + площадка, где стажёры выросли в наших дизайнеров.\n\n**Маркетплейс роботизации промышленности.** Продукт с нуля. Дизайнера подключили на этапе сценария, а не интерфейса — сервисный дизайн повлиял на саму конфигурацию продукта.\n\n**Переговорки.** В каждом офисе ГПН — свой UI мультимедии и климата. Сотрудник в новом офисе теряется: как поменять температуру, как вывести презентацию. Сценарный анализ → исследование → итерации → единый интерфейс на все офисы.",
        callouts: [
          { value: "36", label: "in-house проектов" },
          { value: "21", label: "через подрядчиков" },
          { value: "2–3 нед", label: "Дроны: от стендапа до прототипа" },
          { value: "Единый UI", label: "Переговорки на все офисы" },
        ],
        screenshots: [
          { src: "/images/gpn/drones/d-outcrop.png", caption: "Дроны / D-Outcrop — прототип сервиса беспилотной геологоразведки. Сделан на хакатоне-стендапе за 2–3 недели стажёрами с коллегами из Уфы и ЛПС" },
          { src: "/images/gpn/illustrations/marketplace.svg", caption: "Маркетплейс роботизации — концептуальная схема: каталог промышленных решений с фильтрами по операции, отрасли и производителю. Дизайн-вклад на этапе сценария, не интерфейса (NDA-чувствительный продукт показан схемой)" },
          { src: "/images/gpn/illustrations/meeting-rooms.svg", caption: "Переговорки — единый UI климат-контроля и мультимедии. Один интерфейс для всех офисов ГПН: Москва, Питер, Уфа, Тюмень, Омск (NDA-чувствительный продукт показан схемой)" },
        ],
      },
    ],
    links: [
      { category: "Награда", label: "ЕСО — карточка победителя CX Awards 2024 (РБК)", url: "https://cxa-spb.rbc.ru/proposals/147/" },
      { category: "Дизайн-система Consta", label: "consta.design — официальный сайт", url: "https://consta.design" },
      { category: "Дизайн-система Consta", label: "Consta на GitHub", url: "https://github.com/consta-design-system" },
      { category: "Дизайн-система Consta", label: "Статья vc.ru — корпблог ГПН про Consta", url: "https://vc.ru/gazpromneft/676527" },
      { category: "Выступления и интервью", label: "Полное выступление со студией Pinkman", url: "https://youtu.be/lLxhnXgoCTQ", kind: "video", thumbnail: "/images/gpn/links/pinkman.jpg" },
      { category: "Выступления и интервью", label: "Выступление на World Usability Day", url: "https://www.youtube.com/live/OjdF0lLFGv4?t=5003", kind: "video", thumbnail: "/images/gpn/links/wud-2022.jpg" },
      { category: "Выступления и интервью", label: "ЦЕХ News #13 — ИИ в дизайне (Webflow Conf 2023)", url: "https://youtu.be/4s7j57G71fg", kind: "video", thumbnail: "/images/gpn/links/ai-edited.jpg" },
      { category: "Выступления и интервью", label: "«ИИ бесполезен» — подкаст про ИИ", url: "https://youtu.be/iGQzN9T4upA", kind: "video", thumbnail: "/images/gpn/links/ai-fun.jpg" },
      { category: "Выступления и интервью", label: "AI в дизайне — кафедра Skillbox", url: "https://youtu.be/u1AQGiFpgMI", kind: "video", thumbnail: "/images/gpn/links/ai-skillbox.jpg" },
      { category: "Выступления и интервью", label: "Раннее интервью на ЦЕХ — нейросети", url: "https://youtu.be/cEw5iTNTfZg", kind: "video", thumbnail: "/images/gpn/links/ai-old.jpg" },
      { category: "Пресса", label: "Пресс-релиз Газпром Нефти про запуск Consta", url: "https://www.gazprom-neft.ru/press-center/news/gazprom_neft_sozdala_dizayn_sistemu_dlya_razrabotki_promyshlennykh_i_klientskikh_servisov/" },
      { category: "Партнёрства и артефакты", label: "Young Design СПб × ГПН — совместная номинация «Интерфейс»", url: "https://youngdesignspb.ru/nominations/interface" },
      { category: "Партнёрства и артефакты", label: "Бейдж-генератор Вики Кудрявцевой (open-source наследие)", url: "https://github.com/design-kudry/badge-generator" },
    ],
  },
  {
    slug: "ozon",
    title: "Дизайн-процессы и HR-бренд",
    company: "Ozon",
    role: "Community Lead",
    period: "2021 — 2022",
    year: 2021,
    description:
      "Найм +40%, текучка −60%, HR-канал с 0 до 17K подписчиков. Построил дизайн-ревью, UX-исследования, дизайн-критики с нуля.",
    longDescription:
      "Год в Ozon — быстрый темп, data-driven дизайн. Фокус не только на продуктовом дизайне, но и на построении дизайн-процессов и развитии HR-бренда дизайн-команды. Заложил основы дизайн-комьюнити: внедрил design-review, UX-исследования, регулярные дизайн-критики.",
    tags: ["E-commerce", "HR Brand", "Design Process", "Community Building"],
    metric: "17K",
    metricLabel: "подписчиков HR-канала",
    results: [
      { value: "+40%", label: "найм дизайнеров" },
      { value: "−60%", label: "текучка" },
      { value: "17K", label: "подписчиков канала" },
    ],
    type: "work",
    coverColor: "#1a1a3e",
    coverImage: "/images/covers/ozon-cover.jpg",
    screenshots: [
      "/images/figma/ozon-process.jpg",
      "/images/figma/ozon-hr.jpg",
    ],
    sections: [
      {
        title: "Дизайн-процессы",
        content:
          "Внедрил системный подход к дизайну: design-review для всех критичных фич, регулярные UX-исследования, дизайн-критики. Это стало фундаментом, на котором команда масштабировалась.",
        screenshots: ["/images/figma/ozon-process.jpg"],
      },
      {
        title: "HR-бренд дизайна",
        content:
          "Создал и развил Telegram-канал дизайн-команды Ozon с нуля до 17 000 подписчиков. Результат для бизнеса: найм дизайнеров вырос на 40%, текучка снизилась на 60%. Канал стал одним из главных инструментов привлечения талантов в компанию.",
        callouts: [
          { value: "0 → 17K", label: "подписчиков канала" },
          { value: "+40%", label: "найм дизайнеров" },
          { value: "−60%", label: "текучка" },
        ],
        screenshots: ["/images/figma/ozon-hr.jpg"],
      },
      {
        title: "Результат",
        content:
          "Заложил основы дизайн-комьюнити, которое продолжает работать после моего ухода. Доказал, что инвестиции в HR-бренд дизайн-команды напрямую влияют на метрики найма и удержания.",
      },
    ],
  },
  {
    slug: "mts-b2c",
    title: "B2C-продукты МТС",
    company: "МТС",
    role: "Art Director B2C",
    period: "2017 — 2021",
    year: 2017,
    description:
      "8.8М пользователей Cashback, ×10 транзакций. Руководил дизайн-направлением: 16 команд, 60+ человек.",
    longDescription:
      "Четыре года в МТС — от продуктового дизайнера до Art Director B2C-экосистемы. Масштаб: 16 команд, 12 дизайн-лидов, 60+ дизайнеров. Формировал дизайн-стратегию в период трансформации МТС из телеком-оператора в цифровую экосистему. Ключевые продукты: Cashback, Premium, Строки, Smart University, Smart Med, Вторая Память.",
    tags: ["Mobile", "B2C", "Telecom", "Design Strategy", "Growth"],
    metric: "8.8М",
    metricLabel: "пользователей Cashback",
    results: [
      { value: "8.8М", label: "пользователей Cashback" },
      { value: "×10", label: "рост транзакций" },
      { value: "60+", label: "дизайнеров" },
      { value: "16", label: "продуктовых команд" },
    ],
    type: "work",
    coverColor: "#2e1a1a",
    coverImage: "/images/covers/mts-b2c-cover.jpg",
    screenshots: [
      "/images/figma/mts-b2c.jpg",
      "/images/figma/mts-cashback.jpg",
      "/images/figma/mts-stroki.jpg",
      "/images/figma/mts-memory.jpg",
    ],
    sections: [
      {
        title: "МТС Cashback",
        content:
          "8.8 миллионов пользователей. Рост количества транзакций в 10 раз. Ключевой продукт монетизации экосистемы МТС — кэшбэк-программа, интегрированная во все сервисы.",
        callouts: [
          { value: "8.8М", label: "пользователей" },
          { value: "×10", label: "рост транзакций" },
          { value: "1", label: "хаб монетизации экосистемы" },
        ],
        screenshots: ["/images/figma/mts-cashback.jpg"],
      },
      {
        title: "МТС Premium & Строки",
        content:
          "МТС Premium: 2.9 миллиона пользователей, рост подписок в 2 раза. МТС Строки (стриминговый сервис): 1.5 миллиона пользователей, рост в 2.5 раза. Два продукта, формирующих подписочную модель экосистемы.",
        callouts: [
          { value: "2.9М", label: "Premium пользователей" },
          { value: "×2", label: "рост Premium-подписок" },
          { value: "1.5М", label: "Строки пользователей" },
          { value: "×2.5", label: "рост Строк" },
        ],
        screenshots: ["/images/figma/mts-stroki.jpg"],
      },
      {
        title: "Smart-продукты и Вторая Память",
        content:
          "Smart University: 0.5 миллиона пользователей, 70% вовлечённость. Smart Med: 4 миллиона пользователей, рост 300%. МТС Вторая Память: 1М+ пользователей, рейтинг 4.7/5, 70K+ MAU. Линейка smart-продуктов — от образования до здоровья и облачного хранилища.",
        callouts: [
          { value: "0.5М", label: "Smart University · 70% engage" },
          { value: "4М", label: "Smart Med · ×4 рост" },
          { value: "1М+", label: "Вторая Память · 70K MAU" },
          { value: "4.7", label: "рейтинг Вторая Память" },
        ],
        screenshots: ["/images/figma/mts-memory.jpg"],
      },
      {
        title: "Масштаб и рост",
        content:
          "Вырос от продуктового дизайнера до Art Director B2C-экосистемы. Управлял 16 командами через 12 дизайн-лидов. 60+ дизайнеров в направлении. Сформировал дизайн-стратегию для всех B2C-продуктов экосистемы.",
        callouts: [
          { value: "16", label: "продуктовых команд" },
          { value: "12", label: "дизайн-лидов" },
          { value: "60+", label: "дизайнеров" },
          { value: "Junior → AD", label: "карьерный путь за 4 года" },
        ],
      },
    ],
  },
  {
    slug: "legal-copilot",
    title: "Legal Copilot",
    company: "MWS AI",
    role: "AI Visioner",
    period: "2024 — 2026",
    year: 2024,
    description:
      "Поиск информации быстрее в 5 раз, продукт в проде, юристы используют ежедневно. AI-ассистент с RAG-поиском по документам, генерацией заключений и анализом договоров.",
    longDescription:
      "Legal Copilot — один из двух продуктов AI-дивизиона MWS AI, которым задавал направление. AI-помощник для юридического отдела: умный поиск по базе документов с RAG-подходом, генерация юридических заключений, анализ рисков в договорах. Спроектировал от концепции до production.",
    tags: ["AI/ML", "LLM", "B2B", "RAG", "React"],
    metric: "×5",
    metricLabel: "быстрее поиск",
    type: "experiment",
    coverColor: "#1e1a2e",
    coverImage: "/images/covers/legal-copilot-cover.jpg",
    screenshots: [
      "/images/legal-copilot/review.png",
      "/images/legal-copilot/library.jpg",
      "/images/legal-copilot/quality.jpg",
      "/images/legal-copilot/how-it-works.jpg",
      "/images/legal-copilot/user-stories.jpg",
    ],
    sections: [
      {
        title: "Проблема",
        content:
          "Юристы тратят часы на поиск прецедентов и составление типовых заключений. Документы разбросаны по разным системам, нет единой точки поиска.",
        screenshots: ["/images/legal-copilot/user-stories.jpg"],
      },
      {
        title: "Решение",
        content:
          "Чат-интерфейс с RAG-подходом: AI ищет по базе документов и генерирует ответы с цитатами из источников. Стек: React, TypeScript, MWS AI UI Kit. Интеграция с внутренними системами документооборота.",
        screenshots: [
          "/images/legal-copilot/review.png",
          "/images/legal-copilot/library.jpg",
          "/images/legal-copilot/how-it-works.jpg",
        ],
      },
      {
        title: "Результат",
        content:
          "Время поиска информации сократилось в 5 раз. Юристы используют продукт ежедневно для рутинных задач. Продукт в production.",
        callouts: [
          { value: "×5", label: "быстрее поиск информации" },
          { value: "ежедневно", label: "юристы используют" },
          { value: "production", label: "статус продукта" },
        ],
        screenshots: ["/images/legal-copilot/quality.jpg"],
      },
    ],
    links: [
      { label: "MWS AI — облачная AI-платформа МТС", url: "https://mws.ru/services/ai/" },
    ],
  },
  {
    slug: "webgl-experiments",
    title: "WebGL Experiments",
    company: "Pet Project",
    role: "Creative Developer",
    period: "2025 — настоящее время",
    year: 2025,
    description:
      "Стеклянные 3D-фигуры с внутренней сеткой, aurora ribbons, морфинг форм. Three.js + custom GLSL-шейдеры, SDF, post-processing. Исследование границ дизайна и creative coding.",
    longDescription:
      "Эксперименты на стыке дизайна и программирования. Анимированные стеклянные фигуры (куб, октаэдр, икосаэдр) с внутренней светящейся сеткой, эффекты преломления, fresnel, bloom. Исследование границ между дизайном и creative coding.",
    tags: ["Three.js", "GLSL", "WebGL", "Creative Coding"],
    type: "experiment",
    coverColor: "#0a1a2e",
    coverImage: "/images/covers/webgl-experiments.svg",
    sections: [
      {
        title: "Идея",
        content:
          "Воспроизвести и развить hero-секции с стеклянными 3D-формами и внутренней геометрической сеткой. Научиться работать с шейдерами, SDF и Three.js на уровне production.",
      },
      {
        title: "Технологии",
        content:
          "Three.js, custom GLSL shaders, SDF (Signed Distance Functions), post-processing (bloom, chromatic aberration). Алгоритмы: lattice points для внутренней сетки, fresnel для стекла, морфинг через интерполяцию геометрий.",
      },
      {
        title: "Статус",
        content:
          "Куб с внутренней сеткой работает. Ведётся работа над обобщением алгоритма на произвольные формы (октаэдр, икосаэдр, додекаэдр).",
      },
    ],
  },
  {
    slug: "vigrom-agent",
    title: "Vigrom Agent",
    company: "Pet Project",
    role: "Developer",
    period: "2025",
    year: 2025,
    description:
      "От ссылки до готового черновика за 30 секунд. Telegram-бот для авторского канала про AI: приём материалов → транскрипция → генерация поста. Python + aiogram + Claude API.",
    longDescription:
      "Автоматизация создания контента для Telegram-канала Vigrom. Бот принимает материалы (ссылки, голосовые, скриншоты), транскрибирует через Whisper, парсит статьи через trafilatura, генерирует черновик поста через Claude. Цель — снять рутину сборки и черновика, сохранив авторский голос.",
    tags: ["Python", "Claude API", "Telegram Bot", "AI Automation"],
    metric: "30с",
    metricLabel: "от ссылки до черновика",
    type: "experiment",
    coverColor: "#1a2e2e",
    coverImage: "/images/covers/vigrom-agent.svg",
    sections: [
      {
        title: "Проблема",
        content:
          "Ведение авторского канала занимает 2-3 часа в день: сбор материалов, транскрипция мыслей, написание поста. Хочется автоматизировать рутину, сохранив авторский голос.",
      },
      {
        title: "Решение",
        content:
          "Telegram-бот на aiogram 3 + FastAPI. Пайплайн: приём материалов → транскрипция (Whisper API) → парсинг статей (trafilatura) → генерация черновика (Claude). SQLite + SQLAlchemy для хранения сессий.",
      },
      {
        title: "Статус",
        content:
          "Этап 1 (скелет) в разработке. Базовый цикл работает: отправляешь ссылку/голосовое → /go → получаешь черновик поста.",
      },
    ],
  },
];

export const workProjects = projects.filter((p) => p.type === "work");
export const experimentProjects = projects.filter(
  (p) => p.type === "experiment"
);

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
