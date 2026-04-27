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
  screenshots?: string[];
  sections?: {
    title: string;
    content: string;
    screenshots?: string[];
  }[];
  results?: {
    value: string;
    label: string;
  }[];
  links?: {
    label: string;
    url: string;
    category?: string;
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
      },
      {
        title: "МТС Маркет",
        content:
          "Запустил MVP нативного магазина внутри приложения Мой МТС. Внедрил сценарии с BNPL, механики допродажи цифровых продуктов. Встроил сценарии магазина в приложение Мой МТС. Сформировал концепцию развития маркета с механиками User Generated Content.",
      },
      {
        title: "AI-дивизион MWS AI",
        content:
          "Задавал AI-направление двум продуктам MWS AI. Запустил MWS AI UI Kit — единую дизайн-систему для всех AI-продуктов. Спроектировал Legal Copilot (AI-ассистент для юристов) и IAM Admin (управление доступами). Внедрил AI-инструменты (Claude, Cursor, v0) в дизайн-процесс. 3 продукта в production, дизайн-система покрывает 90%+ интерфейсов.",
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
      { label: "МТС Design — портал дизайна", url: "https://design.mts.ru" },
      { label: "Дизайн-система GRANAT", url: "https://design.mts.ru/ds" },
    ],
  },
  {
    slug: "gazprom-neft",
    title: "Разморозить флагман и построить ЦК дизайна",
    company: "Газпром Нефть",
    role: "Head of Design",
    period: "2022 — 2024",
    year: 2022,
    description:
      "Возглавил продуктовый дизайн в Газпром Нефти. Разморозил ЕСО — флагманский внутренний портал на 50 000 пользователей, который не двигался 2+ года. CX Awards 2024. Развивал open-source дизайн-систему Consta — на ней 180+ цифровых продуктов компании.",
    longDescription:
      "Два года в Газпром Нефти на позиции Head of Design. 10 дизайнеров в прямом подчинении и ~80 в компании через ЦК продуктового дизайна. За год — 57 проектов, 27+ выступлений на Стачке, Дизайн-Выходных и ПромТехДизайне. С со-руководителем Светланой Любавской построил центр компетенций третьего уровня зрелости: дизайн-процесс, ревью, карта компетенций, открытая база знаний в Confluence, вход в Jira Sourcing как официальная точка запроса дизайна. Главное — разморозил ЕСО, единое сервисное окно для 60+ организаций ГПН: предыдущие команды не могли договориться с департаментами, мы договорились. Продукт получил CX Awards 2024.",
    tags: [
      "Enterprise",
      "B2B",
      "Design System",
      "Open Source",
      "Design Management",
    ],
    metric: "50K",
    metricLabel: "пользователей ЕСО",
    results: [
      { value: "7 → 2 мин", label: "оформить заявку в ЕСО" },
      { value: "180+", label: "продуктов на Consta" },
      { value: "до 500 млн ₽", label: "экономии времени в год" },
      { value: "CX 2024", label: "награда за ЕСО" },
    ],
    type: "work",
    // Акцентная карточка — «CX Award 2024», бронза-золото как медаль
    coverColor: "#C9A66B",
    coverImage: "/images/covers/gpn-cover.jpg",
    screenshots: [
      "/images/figma/gpn-main.jpg",
      "/images/figma/gpn-eso.jpg",
    ],
    sections: [
      {
        title: "ЦК продуктового дизайна — система, не команда",
        content:
          "Дизайнеры в ГПН были и до меня — общей системы не было. Сидели по департаментам, не пересекались, помогать друг другу было неудобно. С со-руководителем Светланой Любавской мы за два года перевели центр компетенций со 2-го на 3-й уровень зрелости и собрали из ~80 разрозненных дизайнеров единую функцию. Карта людей: провёл асессмент всех дизайнеров — кто в каком блоке, какие компетенции, кому нужна поддержка. Матричное подчинение: 10 в прямом, дизайн-директора департаментов в функциональном (под каждым ~50 человек) — забирал на себя общее: рамочные договоры, переговоры с центром, единые ритуалы. Распределение ролей и взаимопомощь: дейли раз в 2 дня, дизайн-ревью лида с дизайнером, синки команды, общая карта компетенций (обкатали и в БЛПС/БРД). Дизайн как сервис: бесплатные консультации, 19–20 ревью проектов в год — проекты шли сами, потому что выходили со списком «что чинить», а не с запретом релиза. Системные точки входа: Confluence открыт всем, вошли в Jira Sourcing как официальная точка запроса дизайна. За год через ЦК — 57 проектов (36 in-house, 21 через подрядчиков). Стратегические — ЕСО, Инсайт, Корпоративный поиск, Эра-Бурение, Н1 Хаб — оставались внутри.",
      },
      {
        title: "ЕСО — флагман, который не двигался 2+ года",
        content:
          "Внутренний портал для отпусков, заявок, командировок. До нас — 800+ разрозненных сервисов, оформить элементарную заявку без подсказки коллеги было нельзя. Две предыдущие команды дизайна остановились на этапе макетов: не смогли договориться с департаментами. Мы договорились — комбинацией: замеры до/после в UX-исследовании (язык цифр для разговора с департаментами), одобрение генерального в письме, союзники в департаментах, 100 уважительных встреч. Раскатан на 60+ организаций ГПН: 50 000+ пользователей, каталог из 550+ сервисов. Подача заявки впервые — с 7 минут до менее 2 (в 3.5 раза быстрее), поиск — менее 1 минуты, CSI 75%. По верхней оценке — до 500 млн ₽ в год экономии. Раскатан и награждён CX Awards 2024 уже после моего ухода: самую тяжёлую часть — переговоры и проектирование — сделал я. То, что продукт работает без меня, и есть результат.",
        screenshots: ["/images/figma/gpn-main.jpg"],
      },
      {
        title: "Consta — open-source DS первой промышленной компании",
        content:
          "Не я создавал — Consta существовала до меня и была первой в индустрии бесплатной дизайн-системой от промышленной компании. Был её CPO в команде из 4 человек: вёл бэклог, выбивал бюджет, пробивал использование внутри и снаружи. За год: +12 000 скачиваний на npm, +1 000 использований, 6 000+ органических посетителей, 70 релизов, тёмная и светлая темы, 35 проектов задокументировано (фактически — все продукты компании), замеренный эффект — −20% времени разработки. Параллельно — Consta Analytics для маленьких выборок (3–4 пользователя), где не работают A/B. Главный человек на Consta — Алексей Тетяев, арт-директор в моём подчинении.",
        screenshots: ["/images/figma/gpn-eso.jpg"],
      },
      {
        title: "HR-бренд через комьюнити",
        content:
          "Дизайн-функция держится на людях — три канала одновременно. Внешний — выступления: 27+ за год на 15+ мероприятиях. Стачка (~20K участников), Дизайн-Выходные (~40K), ПромТехДизайн (240 000 онлайн). Темы — Consta, дизайн-процесс, нейросети, цифровые двойники. Партнёрства с обр. организациями: Bang Bang Education, Young Design (совместная номинация «Интерфейс» — модуль для геомоделирования на Consta), Институт Штиглица. Внутреннее: 6 митапов в год, открытые инфо-сессии. Виральная история с пропусками: идея совпала у меня и у Вики Кудрявцевой из моей команды. Объединились, довели до конца — 1.5 года, 300+ человек. Видишь у коллеги красивый пропуск — спрашиваешь где, попутно узнаёшь про дизайн-отдел. После моего ухода Вика навайбкодила генератор бейджей через ChatGPT — open-source, сервис живёт.",
      },
      {
        title: "Нейросети раньше рынка",
        content:
          "В 2022–2023, когда большинство компаний только обсуждали ChatGPT, мы уже использовали нейросети в продакшн-процессе: Stable Diffusion и MidJourney для иллюстраций, Llama и ChatGPT для текстов и макросов, Whisper для транскрибов UX-исследователей. Из этого же ряда — «Гайд на чёрный день для ухода с Figma»: план миграции на Pixso до того, как Figma ушла из РФ. Подробнее про роль и нейросети — в интервью на канале ЦЕХ.",
      },
      {
        title: "Витринные кейсы",
        content:
          "Дроны — стендап превратили во внутренний хакатон. Стажёры с коллегами из Уфы и Логистики Переработки и Сбыта за 2–3 недели сделали кликабельный прототип сервиса беспилотной съёмки. Стажёры стали нашими дизайнерами. Маркетплейс роботизации промышленности — продукт с нуля, дизайнер на этапе сценария: сервисный дизайн. Переговорки — стандартизация UI мультимедии и климата по всем офисам ГПН: сценарный анализ → исследование → итерации → реализация. ЭРА Бурения — Экономическая Расчётная Аналитическая модель для планирования ствола скважины. Адаптивность под все экраны: промысел, НТЦ, центр управления — последняя задача Алексея Тетяева перед моим уходом.",
      },
    ],
    links: [
      { category: "Награда", label: "ЕСО — карточка победителя CX Awards 2024 (РБК)", url: "https://cxa-spb.rbc.ru/proposals/147/" },
      { category: "Дизайн-система Consta", label: "consta.design — официальный сайт", url: "https://consta.design" },
      { category: "Дизайн-система Consta", label: "Consta на GitHub", url: "https://github.com/consta-design-system" },
      { category: "Дизайн-система Consta", label: "Статья vc.ru — корпблог ГПН про Consta", url: "https://vc.ru/gazpromneft/676527" },
      { category: "Пресса и интервью", label: "Интервью со мной — Дизайн-вечерка на канале ЦЕХ (про роль и нейросети)", url: "https://www.youtube.com/watch?v=Ivb-S7Q8OPQ" },
      { category: "Пресса и интервью", label: "Пресс-релиз Газпром Нефти про запуск Consta", url: "https://www.gazprom-neft.ru/press-center/news/gazprom_neft_sozdala_dizayn_sistemu_dlya_razrabotki_promyshlennykh_i_klientskikh_servisov/" },
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
        screenshots: ["/images/figma/mts-cashback.jpg"],
      },
      {
        title: "МТС Premium & Строки",
        content:
          "МТС Premium: 2.9 миллиона пользователей, рост подписок в 2 раза. МТС Строки (стриминговый сервис): 1.5 миллиона пользователей, рост в 2.5 раза. Два продукта, формирующих подписочную модель экосистемы.",
        screenshots: ["/images/figma/mts-stroki.jpg"],
      },
      {
        title: "Smart-продукты и Вторая Память",
        content:
          "Smart University: 0.5 миллиона пользователей, 70% вовлечённость. Smart Med: 4 миллиона пользователей, рост 300%. МТС Вторая Память: 1М+ пользователей, рейтинг 4.7/5, 70K+ MAU. Линейка smart-продуктов — от образования до здоровья и облачного хранилища.",
        screenshots: ["/images/figma/mts-memory.jpg"],
      },
      {
        title: "Масштаб и рост",
        content:
          "Вырос от продуктового дизайнера до Art Director B2C-экосистемы. Управлял 16 командами через 12 дизайн-лидов. 60+ дизайнеров в направлении. Сформировал дизайн-стратегию для всех B2C-продуктов экосистемы.",
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
