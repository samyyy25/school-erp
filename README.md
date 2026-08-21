# Scholarly — School ERP Management System

A production-ready role-based School ERP (Enterprise Resource Planning) platform built with **Next.js 14 (App Router)**, **PostgreSQL (via Prisma ORM)**, **NextAuth.js**, and **Tailwind CSS**.

Administrators, Faculty, and Students each get a dedicated, secure dashboard for managing the day-to-day academic and administrative life of an institution.

---

## 1. Database & Authentication Architecture

### Real Database (PostgreSQL / Supabase / Neon / Local Docker)
- **Database Engine**: PostgreSQL 14+ (compatible with Supabase, Neon, Railway, Docker, AWS RDS, GCP Cloud SQL).
- **ORM Layer**: Prisma ORM with indexed foreign keys, connection pooling support (`DATABASE_URL` + `DIRECT_URL`), and automated schema migration.
- **Relational Integrity**: Complete schema covering Users, Classes, Sections, Subjects, Attendance, Exams, Marks, Timetables, Assignments, Fees, Leaves, Notices, and Password Reset Tokens.

### Real Authentication & User Lifecycle
- **NextAuth.js JWT Sessions**: Secure token-based session management with 30-day persistence.
- **Password Security**: Salted Bcrypt hashing (cost factor 10).
- **Self-Service Registration**: Full sign-up system (`/register`) with role requests, email validation, and password strength evaluation.
- **Password Reset Flow**: Cryptographically secure 64-character token-based password recovery (`/forgot-password` & `/reset-password`).
- **Profile Security**: Profile editing and in-session password updates with current password verification.
- **Multi-Level Authorization**: Dual-layered role guards (Edge Middleware + Server-side `requireRole()` API guards).
- **OAuth Ready**: Out-of-the-box support for Google Workspace / Google OAuth for Education.

---

## 2. Quick Start Guide

### Prerequisites
- Node.js 18+
- A PostgreSQL Database (Supabase, Neon, Railway, Local Docker, or PostgreSQL service)

---

### Step 1: Clone & Install Dependencies

```bash
cd school-erp
npm install
```

---

### Step 2: Configure Environment Variables

Create your `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Set your `DATABASE_URL` and generate a `NEXTAUTH_SECRET`:

#### Option A: Free Cloud PostgreSQL (e.g. Supabase / Neon / Railway)
```env
# Example Supabase Connection String:
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth Secret:
NEXTAUTH_SECRET="f39e08cb4d216fbb3298d02c4b57493a7e583c21a41dbb80eef671239ab7c10d"
NEXTAUTH_URL="http://localhost:3000"
```

#### Option B: Local Docker PostgreSQL (Zero install with Docker)
```bash
docker compose up -d
```
Then in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/school_erp?schema=public"
NEXTAUTH_SECRET="f39e08cb4d216fbb3298d02c4b57493a7e583c21a41dbb80eef671239ab7c10d"
NEXTAUTH_URL="http://localhost:3000"
```

---

### Step 3: Initialize Database & Seed Demo Data

Run the all-in-one setup script:

```bash
npm run db:setup
```

Or step-by-step:
```bash
npx prisma generate
npx prisma db push
npm run seed
```

---

### Step 4: Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000** — you will be redirected to the login portal.

---

## 3. Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@school.com` | `Admin@123` | Full administrative control |
| **Staff / Faculty** | `daniel.cross@school.com` | `Staff@123` | Class management & grading |
| **Student** | `mithun.ray@school.com` | `Student@123` | Student portal & records |

*Tip: The login page includes 1-click autofill buttons for these demo accounts.*

---

## 4. Key Pages & Routes

- `/login` — Secure sign-in with remember-me, demo fillers, and links to registration/reset.
- `/register` — Account registration with role selection and password validation.
- `/forgot-password` — Password recovery token generation.
- `/reset-password` — Token-verified password reset form.
- `/admin/dashboard` — School-wide analytics, staff/student directories, notices, and settings.
- `/staff/dashboard` — Assigned courses, class rosters, attendance submission, mark entry.
- `/student/dashboard` — Academic records, attendance overview, timetable, and assignments.

---

## 5. Helpful NPM Scripts

```bash
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run db:push      # Push Prisma schema directly to PostgreSQL
npm run db:migrate   # Run Prisma database migrations
npm run db:seed      # Seed database with sample school data
npm run db:setup     # Generate Prisma client + push schema + seed data
npm run prisma:studio # Launch visual database GUI at localhost:5555
```

---

## 6. Project Structure

```
school-erp/
├── docker-compose.yml       # Local PostgreSQL container service
├── prisma/
│   ├── schema.prisma        # PostgreSQL Prisma schema & models
│   └── seed.js              # Initial database seed script
├── src/
│   ├── app/
│   │   ├── login/           # Authentication login page
│   │   ├── register/        # User registration page
│   │   ├── forgot-password/ # Password recovery page
│   │   ├── reset-password/  # Password reset page
│   │   ├── admin/           # Admin portal
│   │   ├── staff/           # Staff portal
│   │   ├── student/         # Student portal
│   │   └── api/
│   │       ├── auth/        # NextAuth, register, forgot/reset password APIs
│   │       ├── profile/     # Profile & password management API
│   │       └── ...          # Attendance, classes, exams, marks, students APIs
│   ├── components/          # Reusable UI components (Sidebar, Topbar, Modals)
│   ├── lib/                 # Prisma client, NextAuth options, role guards
│   └── middleware.js        # Edge route protection & role redirection
```
