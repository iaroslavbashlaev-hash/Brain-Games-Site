# FanatickStudio-GAMES Website
  
This is a project built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.
 You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).
  
This project is connected to the Convex deployment named [`pastel-loris-290`](https://dashboard.convex.dev/d/pastel-loris-290).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Деплой на Vercel (подключение к dev-окружению Convex)

Чтобы сайт на Vercel работал с **dev**-бэкендом Convex (а не с prod), используется команда `build:dev` в `vercel.json`. Иначе `convex deploy` из `build:production` деплоит в **production** Convex, и переменная с dev-окружением не используется.

**В настройках проекта Vercel → Settings → Environment Variables задайте:**

| Переменная | Значение |
|------------|----------|
| `CONVEX_DEPLOY_KEY` | Ключ **development** из Convex Dashboard (Deployment → Deploy keys → Create development key). Не используйте production-ключ. |
| `VITE_CONVEX_URL` | URL вашего dev-деплоя, например `https://pastel-loris-290.convex.cloud` |

Без `VITE_CONVEX_URL` сборка `build:dev` не подставит URL в фронтенд. Скрипт `build:dev` делает: `convex dev --once` (пушит бэкенд в dev) и затем `vite build` (читает `VITE_CONVEX_URL` из окружения).

Если нужен деплой в **production** Convex (отдельный прод-сайт), в Vercel задайте production deploy key и смените в `vercel.json` команду на `npm run build:production`.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
