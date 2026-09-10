# 🚀 Production-Grade Email Scheduler & Dashboard

A scalable, reliable, production-grade email scheduler service and frontend dashboard built with **Express.js, TypeScript, PostgreSQL, BullMQ, Redis, Ethereal SMTP, Elasticsearch, Next.js (App Router), TanStack Query, React Hook Form, and Zod**.

---

## 🎯 Architecture Overview

```
                          ┌────────────────────────┐
                          │ Next.js 16 Dashboard   │
                          │(TanStack Query + Zod)  │
                          └───────────┬────────────┘
                                      │ HTTP (API / OAuth)
                                      ▼
                          ┌────────────────────────┐
                          │   Express.js Backend   │
                          └─────┬────────────┬─────┘
                                │            │
            ┌───────────────────┘            └────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│  PostgreSQL Database  │                             │  BullMQ + Redis Queue │
│ (Emails, Users, Logs) │                             │ (Delayed & Rate Limit)│
└───────────────────────┘                             └───────────┬───────────┘
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │  BullMQ Email Workers │
                                                      │ (Concurrency + Retry) │
                                                      └─────┬────────────┬────┘
                                                            │            │
                                         ┌──────────────────┘            └─────────────────┐
                                         ▼                                                 ▼
                             ┌───────────────────────┐                         ┌───────────────────────┐
                             │  Ethereal SMTP Engine │                         │  Elasticsearch Index  │
                             │ (Fake SMTP Test Mails)│                         │ (Full-text Search)    │
                             └───────────────────────┘                         └───────────────────────┘
```

---

## 🛠️ Key Features & Technical Specifications

### 1. **Scheduler Engine & Persistence**
- **BullMQ + Redis Job Queue**: No cron jobs used (`node-cron`, `crontab`, etc. are non-existent). All emails use BullMQ delayed jobs with calculated delay offsets.
- **Restart Resilience**: Job parameters and scheduled delay states are persisted in Redis. If the server or background processes restart, pending delayed jobs trigger automatically at their originally scheduled timestamp without repeating or dropping jobs.
- **Strict Idempotency**: Job IDs are uniquely formatted as `email:{emailJobId}`. Duplicate API schedule requests or re-queued jobs are ignored if already present in Redis or marked as `sent` in PostgreSQL.

### 2. **Worker Concurrency & Rate Limiting**
- **Worker Concurrency**: Configurable via `WORKER_CONCURRENCY` env variable (default: `5` concurrent job processors per worker).
- **Inter-Email Delay (Throttling)**: Min delay of **2 seconds** (`MIN_DELAY_BETWEEN_SENDS_MS=2000`) enforced via worker delays to prevent provider throttling.
- **Hourly Rate Limiting**:
  - **Redis Atomic Counter**: Keyed by `ratelimit:{senderEmail}:{hour_window_timestamp}` with dynamic TTL.
  - **Configurable Limits**: Set globally or per campaign via `MAX_EMAILS_PER_HOUR_PER_SENDER` (default: `200` emails/hr).
  - **Graceful Rescheduling**: When a rate limit is exceeded, jobs are **not dropped or failed**. They are automatically rescheduled using BullMQ `moveToDelayed` to the exact start of the next hourly window while maintaining campaign order.
- **Slack Notification Alerts**:
  - Real-time Slack webhooks trigger the moment a sender reaches their hourly rate limit.
  - Notifications are throttled to once per hour per sender to eliminate spam.

### 3. **Search & Analytics**
- **Elasticsearch Integration**: Every scheduled, sent, rate-limited, and failed email is indexed in Elasticsearch (`emails` index).
- **Full-Text Search API**: Provides fast multi-field search across recipient email addresses, subjects, statuses, and body content.

### 4. **Frontend Architecture & Stack**
- **Next.js (App Router) + TypeScript**: Pure modular layout structure with route guards.
- **TanStack Query (React Query)**: Handles all server state fetching (`useScheduledEmails`, `useSentEmails`, `useScheduleEmail`), zero ad-hoc fetch chains.
- **React Hook Form + Zod**: Type-safe validation (`composeEmailSchema`) for form inputs, start times, and delays before hitting the network.
- **Unified Component System**: Modular UI primitives including reusable `<DataTable>` with distinct loading, empty, and error states.
- **Dashboard ErrorBoundary**: Layout-level error boundary capturing runtime UI exceptions cleanly.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js v18+
- Docker & Docker Compose (or local PostgreSQL & Redis)

### Step 1: Clone & Configure Environment Variables
Copy example environment variables:
```bash
# Backend configuration
cd backend
cp .env.example .env

# Frontend configuration
cd ../frontend
cp .env.local.example .env.local
```

Ensure `frontend/.env.local` contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 2: Start Infrastructure (PostgreSQL, Redis, Elasticsearch)
From project root:
```bash
docker compose up -d
```

### Step 3: Run Database Migrations
```bash
cd backend
npx prisma migrate dev --name init
```

### Step 4: Run Backend & Workers
```bash
cd backend
npm run dev
```
- API Base: `http://localhost:4000`
- BullMQ UI: `http://localhost:4000/admin/queues`

### Step 5: Run Frontend
```bash
cd frontend
npm run dev
```
- Dashboard UI: `http://localhost:3000`

---

## 🗺️ Feature Mapping Summary

| Requirement | Implementation Details | File References |
|---|---|---|
| **No Cron Jobs** | BullMQ `delay` option calculates exact timestamp offsets | [emailQueue.ts](file:///c:/outbox_labs/backend/src/queues/emailQueue.ts) |
| **Persistence on Restart** | Delayed state saved in Redis + DB status fallback on boot | [emailWorker.ts](file:///c:/outbox_labs/backend/src/queues/emailWorker.ts) |
| **Worker Concurrency** | Configurable worker concurrency pool (`WORKER_CONCURRENCY`) | [emailWorker.ts](file:///c:/outbox_labs/backend/src/queues/emailWorker.ts#L186) |
| **Delay Between Emails** | 2000ms minimum delay enforced per processed job | [emailWorker.ts](file:///c:/outbox_labs/backend/src/queues/emailWorker.ts#L106) |
| **Hourly Rate Limiter** | Redis sliding window counter key `ratelimit:{sender}:{hour}` | [rateLimitService.ts](file:///c:/outbox_labs/backend/src/services/rateLimitService.ts) |
| **Slack Rate Limit Notification** | Webhook sent on limit breach (throttled once/hr/sender) | [slackService.ts](file:///c:/outbox_labs/backend/src/services/slackService.ts) |
| **TanStack Query State** | `useScheduledEmails` & `useSentEmails` for server state | [useScheduledEmails.ts](file:///c:/outbox_labs/frontend/src/hooks/useScheduledEmails.ts) |
| **Zod + React Hook Form** | Form validation schema for compose modal | [validation.ts](file:///c:/outbox_labs/frontend/src/lib/validation.ts) |
| **Unified DataTable Primitive** | Reusable table with loading skeletons, empty, & error states | [DataTable.tsx](file:///c:/outbox_labs/frontend/src/components/ui/DataTable.tsx) |
| **Slack Integrations Page** | Real OAuth connect/disconnect flow with instant feedback | [page.tsx](file:///c:/outbox_labs/frontend/src/app/settings/integrations/page.tsx) |
