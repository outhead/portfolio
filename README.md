# Егор Шугаев — Portfolio

Персональное портфолио. Next.js 16 + Tailwind CSS 4 + Static Export.

## Быстрый старт

```bash
npm install
npm run dev
```

Открывается на [localhost:3000](http://localhost:3000).

## Деплой на Vercel

1. Пуш в GitHub:
```bash
git init
git add .
git commit -m "Initial portfolio"
git remote add origin git@github.com:outhead/portfolio.git
git push -u origin main
```

2. Зайти на [vercel.com](https://vercel.com), подключить репозиторий — автодеплой.

## Структура

```
src/
├── app/
│   ├── layout.tsx          # Root layout, SEO, Schema.org
│   ├── page.tsx            # Главная: hero, about, проекты, менторинг
│   ├── globals.css         # Стили: Swiss grid, шрифты, анимации
│   └── cases/[slug]/
│       └── page.tsx        # Страница кейса (SSG)
├── components/
│   ├── Header.tsx          # Навигация + бургер
│   ├── Footer.tsx          # Контакты
│   └── ProjectCard.tsx     # Карточка проекта
├── data/
│   └── projects.ts         # Данные всех проектов
└── lib/                    # Утилиты (пока пусто)
public/
└── images/                 # Фото и скриншоты
```

## Добавить новый кейс

1. Открой `src/data/projects.ts`
2. Добавь объект в массив `projects`
3. Положи скриншоты в `public/images/<slug>/`
4. Перезапусти dev-сервер

## Стек

- Next.js 16 (App Router, Static Export)
- Tailwind CSS 4
- TypeScript
- Vercel (хостинг)
