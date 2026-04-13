# Портфолио — статус работ

## ✅ Сделано

### Структура и контент
- Полностью переписана главная страница по дизайн-критике (3 перспективы: арт-директор / HR / сеньор-дизайнер)
- Новая структура: Hero → «Сейчас открыт к» → Обо мне (01) → Портфолио (02) → Публично (03) → Эксперименты (04) → Менторинг (05) → Контакты (06)
- Hero: имя без градиентного сплита, описание-позиционирование, метрики с контекстом (где/когда), строка «Работал в»
- Метрики с контекстом: 8.8М+ (МТС Cashback 2018–21), 100+ (Газпром Нефть 2022–24), −60% TTM (МТС AI 2024), +40%/−60% (Ozon 2021–22), CX 2024
- TL;DR-абзац над карточками «Сейчас открыт к» с акцентом на C-level и AI-консалтинг
- Карточки availability: C-level / Консалтинг / Менторинг с CTA
- Блок «Не беру»: операционка без мандата, брендинг, короткие проекты, роли без стратегии
- Skills сгруппированы в 3 колонки с иконками: Core / Stack / Experiments
- Карьерный таймлайн с пульсирующим индикатором на «now»
- Раздел «Публично» (03): Выступления / Преподавание / Канал Vigrom (с фото-стрипом)
- Менторинг с прозрачным прайсом: 8 000 ₽ разовая, от 25 000 ₽/мес регулярный, от 50 000 ₽/группа AI-мастер-класс
- Запись через cal.com/egorshugaev (primary) + Telegram (secondary), форма заявки убрана
- Контакты: локация + 5 кнопок (Telegram primary, Email, LinkedIn, GitHub, CV)
- Skillbox удалён везде (был плейсхолдер)

### Дизайн и анимации
- Шрифт заголовков: Bebas Neue Cyrillic (Денис Машаров, через cdnfonts) с фолбэком на Bebas Neue / Impact
- Акцентный цвет `#A6FF00` (neon-green) — единая тема: section-label dots, hover-состояния карточек, CTA-кнопки, цены, активные индикаторы, прогресс-бар
- Все секции с framer-motion: fade-up + stagger детей при попадании в вьюпорт (once)
- Карточки «Открыт к» и проектов: магнитный hover (y: -4..-6, акцентная рамка)
- Бургер-меню с AnimatePresence
- Прогресс-бар скролла на motion-scaleX
- Иконки lucide-react: Briefcase, Sparkles, GraduationCap, LayoutGrid, Code2, Wand2, Mic2, Send, Mail, Clock, CalendarDays, Users, ArrowUpRight, MapPin, FileDown, Menu/X
- Inline SVG для GitHub и LinkedIn (lucide убрал бренд-иконки)
- ProjectCard: всплывающая стрелка ↗ в правом верхнем углу, акцентный glow-градиент, hover-цвет метрики
- Section-labels: маленькая зелёная точка + читабельный uppercase
- Скруглены до `rounded-xl` все карточки

### SEO / меню
- Навигация обновлена: Открыт к · Обо мне · Работы · Публично · Менторинг · Контакты
- Бейдж «Open to work» с пульсирующим индикатором вместо «МСК 2026»
- JSON-LD (schema.org/Person) на месте

### Деплой
- Vercel auto-deploy по пушу в `main`
- Production: https://portfolio-egors-projects-baaaa1ca.vercel.app/
- Repo: https://github.com/outhead/portfolio
- Стек: Next.js 16 (App Router, static export) + Tailwind v4 + framer-motion + lucide-react

---

## 📋 Нужно сделать (требует контента или решения от Егора)

### Высокий приоритет

- [ ] **Подтвердить плейсхолдеры**, которые сейчас опубликованы:
  - Цены менторинга: 8 000 ₽ разовая / от 25 000 ₽ / мес регулярный / от 50 000 ₽ группа
  - URL календаря: `cal.com/egorshugaev` (нужно проверить, что аккаунт реально создан и время открыто)
  - Тексты в «Работал в»: МТС / Ozon / Газпром Нефть / ВШЭ
- [ ] **Реальные скриншоты UI** на карточки проектов (МТС, Газпром, Ozon, B2C, Legal Copilot и т.д.) — сейчас одна общая обложка на всё
- [ ] **Хотя бы один отзыв** (testimonial): 2–3 строки + имя + должность + фото, от руководителя/коллеги в МТС или Ozon. Поставить между «Проекты» и «Публично»
- [ ] **Загрузить актуальный CV** (`/Egor_Shugaev_CV.pdf`) — проверить, что файл свежий

### Средний приоритет

- [ ] **og:image** для красивой превью в Telegram/LinkedIn (сейчас дефолтное)
- [ ] **Живой фид Vigrom**: 2–3 последних поста на превью в карточке канала (можно парсить статически на build через RSS Telegram через RSSHub или вручную)
- [ ] **Видео-тизер** (10–20 сек) с выступлением — встроить в раздел «Публично»
- [ ] **Расширенные кейсы**: каждая страница `/cases/[slug]` сейчас простая. Углубить — process, before/after, цифры до/после
- [ ] **Мобильная вёрстка** — пройти все разрешения (375 / 414 / iPad), особенно метрики в hero и карточки

### Низкий приоритет / на будущее

- [ ] Тёмная/светлая тема (сейчас только тёмная)
- [ ] Английская версия (en-US) — если планирует релокацию
- [ ] Hero parallax: фото с лёгким движением при скролле
- [ ] 3D-tilt на карточки проектов (mouse-track)
- [ ] Блог / статьи раздел (если будет писать кроме Vigrom)
- [ ] Аналитика (Plausible или Vercel Analytics)
- [ ] sitemap.xml + robots.txt — проверить, генерируется ли Next.js'ом для static export

---

## История коммитов

```
c552ce3 Redesign: framer-motion animations, lucide icons, neon-green accent, tighter composition
af447f3 Use Bebas Neue Cyrillic for headings
57e9e95 Swap Bebas Neue to Oswald — Cyrillic support
337f41c Improvements: nav update, TL;DR, metric context, Не беру block, Bebas Neue, remove Skillbox
a5f7471 Redesign homepage per design critique
5ad61c4 Initial commit: portfolio site with mentoring, CV, SEO, scroll animations
```
