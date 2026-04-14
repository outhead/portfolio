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
  screenshots?: string[];
  sections?: {
    title: string;
    content: string;
  }[];
}

export const projects: Project[] = [
  {
    slug: "mts-2024",
    title: "МТС Экосистема & AI",
    company: "МТС",
    role: "Арт-директор B2C · Head of Design AI Division",
    period: "2024 — настоящее время",
    year: 2024,
    description:
      "3 продукта в проде, скорость запуска −60%, коммуникационный бюджет −40%. Управляю дизайном B2C-экосистемы (8 команд, 40+ дизайнеров) и строю AI-дивизион МТС с нуля. Discovery → A/B → продакшн.",
    longDescription:
      "Две параллельные зоны ответственности в МТС. Как арт-директор B2C-экосистемы — визуальная стратегия и управление креативными командами в период трансформации МТС из телеком-оператора в технологическую экосистему: 8 команд, 6 дизайн-лидов, 3 арт-директора, 40+ дизайнеров. Продукты: Мой МТС App, МТС Маркет, Голосовая Экосистема, Гео-Центр, МТС Лончер, МТС Накопления, Семейная Группа, MTC Shop, MTS.RU Web. Как Head of Design AI-дивизиона — строю дизайн-функцию для облачных AI-продуктов с нуля: Legal Copilot, IAM Admin, MWS AI UI Kit.",
    tags: [
      "Design Management",
      "AI/ML",
      "B2C Ecosystem",
      "Design System",
      "Art Direction",
    ],
    metric: "40+",
    metricLabel: "дизайнеров",
    type: "work",
    coverColor: "#1a1a2e",
    coverImage: "/images/photos/photo-5.jpg",
    screenshots: [
      "/images/iam-admin/1.1-workspaces.png",
      "/images/iam-admin/1.5-role-constructor.png",
      "/images/iam-admin/1.2-ba-users.png",
      "/images/iam-admin/1.4-ws-roles.png",
    ],
    sections: [
      {
        title: "B2C экосистема",
        content:
          "Руковожу дизайн-направлением департамента «Цифровые витрины». Уменьшил бюджет на коммуникационные задачи на 40%. Сократил TTM коммуникационных задач на 60%. Увеличил количество качественных гипотез на 30%. Ускорил прохождение этапов написания текста на 40%. Ускорил time-to-market выхода фичей. Увеличил кросс-функциональность между продуктами.",
      },
      {
        title: "МТС Маркет",
        content:
          "Запустил MVP нативного магазина внутри приложения Мой МТС. Внедрил сценарии с BNPL, механики допродажи цифровых продуктов. Встроил сценарии магазина в приложение Мой МТС. Сформировал концепцию развития маркета с механиками User Generated Content.",
      },
      {
        title: "AI-дивизион",
        content:
          "Построил дизайн-функцию для нового AI-дивизиона: от найма до процессов, от дизайн-системы до готовых продуктов. Создал MWS AI UI Kit — единую дизайн-систему для всех AI-продуктов. Спроектировал Legal Copilot (AI-ассистент для юристов) и IAM Admin (управление доступами). Внедрил AI-инструменты (Claude, Cursor, v0) в дизайн-процесс. 3 продукта в production, дизайн-система покрывает 90%+ интерфейсов.",
      },
    ],
  },
  {
    slug: "gazprom-neft",
    title: "Цифровая трансформация Газпром Нефти",
    company: "Газпром Нефть",
    role: "Lead Product Designer → Design Manager",
    period: "2022 — 2024",
    year: 2022,
    description:
      "CX Awards 2024, навигация < 30 сек, CSI 75%. Управлял 100+ дизайнерами и 76 командами. CJM → user research → дизайн-ревью. Open-source дизайн-система Consta: 150 Figma WAU, 10K+ NPM.",
    longDescription:
      "Два года в Газпром Нефти — от ведущего продуктового дизайнера до руководителя дизайн-направления. Масштаб: 76 команд, 42 дизайн-лида, 100+ дизайнеров. Ключевые проекты: ЕСО (единое сервисное окно для сотрудников) и развитие open-source дизайн-системы Consta. Получил награду CX Awards 2024 за улучшение HR-сервиса.",
    tags: [
      "Enterprise",
      "B2B",
      "Design System",
      "Open Source",
      "Design Management",
    ],
    metric: "100+",
    metricLabel: "дизайнеров",
    type: "work",
    coverColor: "#1a2e1a",
    coverImage: "/images/photos/photo-1.jpg",
    screenshots: [
      "/images/figma/gpn-main.jpg",
      "/images/figma/gpn-eso.jpg",
    ],
    sections: [
      {
        title: "ЕСО — единое сервисное окно",
        content:
          "Спроектировал единую точку входа для всех корпоративных сервисов сотрудников Газпром Нефти. Навигация по любому сервису — менее 30 секунд. Подача заявки — менее 1 минуты. CSI (индекс удовлетворённости) — 75%. Проект получил награду CX Awards 2024.",
      },
      {
        title: "Дизайн-система Consta",
        content:
          "Развивал open-source дизайн-систему Consta для всех цифровых продуктов компании. 150 Figma WAU (еженедельных активных пользователей). 82% CSI среди пользователей системы. 450 NPM WAU, 10 000+ скачиваний. Используется в 50+ цифровых продуктах компании.",
      },
      {
        title: "Результат",
        content:
          "Выстроил дизайн-процессы в enterprise-среде с высокими требованиями к безопасности. Внедрил user research и дизайн-ревью. Команда стала автономной — процессы работают без ручного управления. Победа на CX Awards 2024 подтвердила качество работы.",
      },
    ],
  },
  {
    slug: "ozon",
    title: "Дизайн-процессы и HR-бренд",
    company: "OZON",
    role: "Senior Product Designer → Design Lead",
    period: "2021 — 2022",
    year: 2021,
    description:
      "Найм +40%, текучка −60%, HR-канал с 0 до 17K. Построил процессы: design-review, UX-исследования, дизайн-критики. Data-driven подход к HR-метрикам.",
    longDescription:
      "Год в OZON — быстрый темп, data-driven дизайн. Фокус не только на продуктовом дизайне, но и на построении дизайн-процессов и развитии HR-бренда дизайн-команды. Заложил основы дизайн-комьюнити: внедрил design-review, UX-исследования, регулярные дизайн-критики.",
    tags: ["E-commerce", "HR Brand", "Design Process", "Community Building"],
    metric: "17K",
    metricLabel: "подписчиков HR-канала",
    type: "work",
    coverColor: "#1a1a3e",
    coverImage: "/images/photos/photo-2.jpg",
    screenshots: [
      "/images/figma/ozon-process.jpg",
      "/images/figma/ozon-hr.jpg",
    ],
    sections: [
      {
        title: "Дизайн-процессы",
        content:
          "Внедрил системный подход к дизайну: design-review для всех критичных фич, регулярные UX-исследования, дизайн-критики. Это стало фундаментом, на котором команда масштабировалась.",
      },
      {
        title: "HR-бренд дизайна",
        content:
          "Создал и развил Telegram-канал дизайн-команды OZON с нуля до 17 000 подписчиков. Результат для бизнеса: найм дизайнеров вырос на 40%, текучка снизилась на 60%. Канал стал одним из главных инструментов привлечения талантов в компанию.",
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
    role: "Product Designer → Head of Design Direction",
    period: "2018 — 2021",
    year: 2018,
    description:
      "8.8М пользователей Cashback, ×10 транзакций. Вырос от дизайнера до руководителя: 16 команд, 60+ человек. Кросс-функциональная работа с продуктом и маркетингом, OKR, roadmap.",
    longDescription:
      "Три года в МТС — от продуктового дизайнера до руководителя дизайн-направления. Масштаб: 16 команд, 12 дизайн-лидов, 60+ дизайнеров. Формировал дизайн-стратегию в период трансформации МТС из телеком-оператора в цифровую экосистему. Ключевые продукты: Cashback, Premium, Строки, Smart University, Smart Med, Вторая Память.",
    tags: ["Mobile", "B2C", "Telecom", "Design Strategy", "Growth"],
    metric: "8.8М",
    metricLabel: "пользователей Cashback",
    type: "work",
    coverColor: "#2e1a1a",
    coverImage: "/images/photos/photo-4.jpg",
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
      },
      {
        title: "МТС Premium & Строки",
        content:
          "МТС Premium: 2.9 миллиона пользователей, рост подписок в 2 раза. МТС Строки (стриминговый сервис): 1.5 миллиона пользователей, рост в 2.5 раза. Два продукта, формирующих подписочную модель экосистемы.",
      },
      {
        title: "Smart-продукты и Вторая Память",
        content:
          "Smart University: 0.5 миллиона пользователей, 70% вовлечённость. Smart Med: 4 миллиона пользователей, рост 300%. МТС Вторая Память: 1М+ пользователей, рейтинг 4.7/5, 70K+ MAU. Линейка smart-продуктов — от образования до здоровья и облачного хранилища.",
      },
      {
        title: "Масштаб и рост",
        content:
          "Вырос от дизайнера до руководителя направления. Управлял 16 командами через 12 дизайн-лидов. 60+ дизайнеров в направлении. Сформировал дизайн-стратегию для всех B2C-продуктов экосистемы.",
      },
    ],
  },
  {
    slug: "legal-copilot",
    title: "Legal Copilot",
    company: "МТС AI",
    role: "Head of Design",
    period: "2024",
    year: 2024,
    description:
      "Поиск информации быстрее в 5 раз, продукт в проде, юристы используют ежедневно. AI-ассистент с RAG-поиском по документам, генерацией заключений и анализом договоров.",
    longDescription:
      "Legal Copilot — один из ключевых продуктов AI-дивизиона МТС. AI-помощник для юридического отдела: умный поиск по базе документов с RAG-подходом, генерация юридических заключений, анализ рисков в договорах. Спроектировал от концепции до production.",
    tags: ["AI/ML", "LLM", "B2B", "RAG", "React"],
    type: "experiment",
    coverColor: "#1e1a2e",
    sections: [
      {
        title: "Проблема",
        content:
          "Юристы тратят часы на поиск прецедентов и составление типовых заключений. Документы разбросаны по разным системам, нет единой точки поиска.",
      },
      {
        title: "Решение",
        content:
          "Чат-интерфейс с RAG-подходом: AI ищет по базе документов и генерирует ответы с цитатами из источников. Стек: React, TypeScript, MWS AI UI Kit. Интеграция с внутренними системами документооборота.",
      },
      {
        title: "Результат",
        content:
          "Время поиска информации сократилось в 5 раз. Юристы используют продукт ежедневно для рутинных задач. Продукт в production.",
      },
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
    type: "experiment",
    coverColor: "#1a2e2e",
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
