# JamSync

A full-stack jam session management web app with real-time chord/lyric sync, musician matching, and scheduling.

## Quick Start

### Development (hot reload)
```bash
docker-compose -f docker-compose.dev.yml up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- pgAdmin: http://localhost:5050 (admin@admin.com / admin)

### Production
```bash
docker-compose up --build
```
- App: http://localhost:80

## Demo Credentials
| Email | Password |
|-------|----------|
| alice@jamsync.com | password123 |
| bob@jamsync.com | password123 |
| carol@jamsync.com | password123 |
| dave@jamsync.com | password123 |

## Features
- **Auth** — Register/login with JWT in httpOnly cookies
- **Dashboard** — Session countdown, match cards, stats
- **Jam Mode** — Real-time karaoke with chords above lyrics (Socket.io), transpose, metronome
- **Match** — Swipeable musician discovery with compatibility score ring
- **Schedule** — Weekly calendar view with room booking
- **Profile** — Instruments, song wishlist, availability editor

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand, Socket.io Client
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io, JWT
- **Infra:** Docker, Docker Compose, Nginx
