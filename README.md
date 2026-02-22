# 🎧 Syncro
Syncro — это аналог Discord на ранней стадии разработки. Приложение позволяет пользователям общаться в персональных и групповых конференциях, обмениваться сообщениями и управлять своей учетной записью.

## Текущий стек:

⚛️ React (TypeScript), Vite, .NET 9.0, Entity Framework, SignalR, JWT, S3 хранилище для медиа-файлов

🧪 Статус: Активная разработка

## ✨ Возможности

🔐 Аутентификация и регистрация через JWT

💬 Персональные и групповые конференции с отправкой сообщений, медиа файлов

📋 Главное меню с навигацией по конференциям и друзьям!

## 🔮 В планах:
Система серверов (аналог Discord серверов)

Голосовая и видеосвязь

Демонстрация экрана

UI/UX polishing и мобильная адаптация

## 🚀 Быстрый старт
📦 Требования

Node.js (используется через nvm)

.NET 9.0 SDK

PostgreSQL

## 🧰 Установка
1. Клонируйте репозиторий

2. Настройка фронтенда

```bash

cd Syncro.Client
npm install
npm run dev

```
3. Настройка бэкенда
```bash

cd Syncro.Server
dotnet restore
dotnet ef database update
dotnet run               

```
Теперь клиент доступен по адресу http://localhost:5173, сервер — http://localhost:5232 (или указанному в конфигурации).

## 📡 Технологии
Frontend: React (TS), Vite

Backend: .NET 9.0, Entity Framework Core, SignalR

Auth: JWT (Access/Refresh tokens)

Real-Time: SignalR

