# Backend API (Node.js + Express + Knex + Postgres)

## 1) Setup

```bash
cd backend
cp .env.example .env
npm install
```

Update `.env` values for:
- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `CLIENT_ORIGINS` (comma-separated allowed frontend origins)
- Optional for multiple clients: `GOOGLE_CLIENT_IDS` (comma-separated)

## 2) Database

Start Postgres (Docker):

```bash
npm run db:up
```

```bash
npm run migrate
npm run seed
```

Stop Postgres:

```bash
npm run db:down
```

## 3) Start API

```bash
npm run dev
```

Base URL: `http://localhost:4000/api`

## Auth flow (Gmail/Google)

1. Frontend gets Google `idToken` using Google Sign-In.
2. Call `POST /api/auth/google` with `{ "idToken": "..." }`.
3. API verifies token using Google client ID(s).
4. API returns your JWT in response.
5. Send JWT in `Authorization: Bearer <token>` for protected routes.

## Routes

### Public
- `GET /api/health`
- `POST /api/auth/google`

### Protected
- `GET /api/auth/me`
- `GET /api/households`
- `POST /api/households`
- `POST /api/households/join`
- `GET /api/categories?householdId=1`
- `POST /api/categories`
- `DELETE /api/categories/:id?householdId=1`
- `GET /api/expenses?householdId=1&from=2026-02-01&to=2026-02-28`
- `POST /api/expenses`
- `DELETE /api/expenses/:id?householdId=1`
- `GET /api/expenses/summary?householdId=1&mode=week|month&anchor=2026-02-20`

## Example request bodies

### `POST /api/categories`
```json
{
  "householdId": 1,
  "name": "Electricity",
  "icon": "flash-outline",
  "tone": "#f59e0b"
}
```

### `POST /api/expenses`
```json
{
  "householdId": 1,
  "title": "Milk and bread",
  "amount": 12.5,
  "categoryId": 3,
  "spentAt": "2026-02-20T12:34:00.000Z",
  "notes": "weekly groceries"
}
```
