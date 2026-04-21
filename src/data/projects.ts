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
    title: "Цифровая трансформация Газпром Нефти",
    company: "Газпром Нефть",
    role: "Head of Design",
    period: "2022 — 2024",
    year: 2022,
    description:
      "CX Awards 2024, навигация < 30 сек, CSI 75%. Руководил дизайн-функцией: 76 команд, 42 лида, 100+ дизайнеров. Запустил open-source дизайн-систему Consta: 150 Figma WAU, 10K+ NPM.",
    longDescription:
      "Два года в Газпром Нефти на позиции Head of Design. Масштаб: 76 команд, 42 дизайн-лида, 100+ дизайнеров на единой дизайн-системе. Ключевые проекты: ЕСО (единое сервисное окно для сотрудников) и развитие open-source дизайн-системы Consta. Получил награду CX Awards 2024 за улучшение HR-сервиса.",
    tags: [
      "Enterprise",
      "B2B",
      "Design System",
      "Open Source",
      "Design Management",
    ],
    metric: "100+",
    metricLabel: "дизайнеров",
    results: [
      { value: "<30с", label: "навигация по сервису" },
      { value: "75%", label: "CSI" },
      { value: "150", label: "Figma WAU Consta" },
      { value: "CX 2024", label: "награда" },
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
        title: "ЕСО — единое сервисное окно",
        content:
          "Спроектировал единую точку входа для всех корпоративных сервисов сотрудников Газпром Нефти. Навигация по любому сервису — менее 30 секунд. Подача заявки — менее 1 минуты. CSI (индекс удовлетворённости) — 75%. Проект получил награду CX Awards 2024.",
        screenshots: ["/images/figma/gpn-main.jpg"],
      },
      {
        title: "Дизайн-система Consta",
        content:
          "Развивал open-source дизайн-систему Consta для всех цифровых продуктов компании. 150 Figma WAU (еженедельных активных пользователей). 82% CSI среди пользователей системы. 450 NPM WAU, 10 000+ скачиваний. Используется в 50+ цифровых продуктах компании.",
        screenshots: ["/images/figma/gpn-eso.jpg"],
      },
      {
        title: "Результат",
        content:
          "Выстроил дизайн-процессы в enterprise-среде с высокими требованиями к безопасности. Внедрил user research и дизайн-ревью. Команда стала автономной — процессы работают без ручного управления. Победа на CX Awards 2024 подтвердила качество работы.",
      },
    ],
    links: [
      { label: "Consta — open-source дизайн-система", url: "https://consta.design" },
      { label: "CX World Awards 2024 — победители", url: "https://cx-forum.ru/cxclub/cxa/2024/winners" },
      { label: "GitHub — Consta Design System", url: "https://github.com/consta-design-system" },
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
