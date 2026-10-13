# Клиент «Совместные расходы»

React + MUI интерфейс для API совместных расходов. Приложение поддерживает мгновенные обновления через Laravel Reverb.

## Локальная разработка без Docker

Требуется Node.js 22 или новее. Сначала подготовьте и запустите backend, затем создайте файл окружения:

```bash
cp .env.example .env
npm install
npm run dev
```

По умолчанию Vite откроет приложение на `http://localhost:5173`. Переменные в `.env`:

| Переменная | Назначение |
| --- | --- |
| `VITE_API_BASE_URL` | Базовый URL API, включая `/api/v1` |
| `VITE_API_ORIGIN` | Origin Laravel для авторизации приватных WebSocket-каналов |
| `VITE_REVERB_*` | Параметры подключения браузера к Reverb |

## Запуск в Docker

Docker-конфигурация общая для frontend и backend и хранится в backend-репозитории. Из каталога `shared-expenses-backend` выполните:

```bash
cp docker-compose.env.example .env
docker compose up --build
```

Откройте `http://localhost:5173`. Контейнер фронтенда передаёт `/api/*` в Laravel и `/app/*` в Reverb, поэтому браузер использует один origin и не требует отдельной настройки CORS.

Для остановки используйте `docker compose down`; данные PostgreSQL и загруженные файлы сохраняются в Docker volumes.

## Развёртывание на сервере

Подробная последовательность и параметры почты описаны в [README backend](../shared-expenses-backend/README.md). Перед сборкой фронтенда обязательно задайте в `.env` backend-репозитория публичный домен, например:

```dotenv
FRONTEND_PUBLIC_URL=https://expenses.example.com
APP_URL=https://expenses.example.com
FRONTEND_URL=https://expenses.example.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

Переменные `VITE_*` встраиваются в статическую сборку. После их изменения пересоберите frontend: `docker compose up -d --build frontend`.
