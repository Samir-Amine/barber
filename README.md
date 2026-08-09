# Atlas Blade — Production Barbershop Platform & Management System

A production-ready, multilingual barbershop web platform and management console built for Moroccan and international barbershops. Powered by Next.js / Vite, TypeScript, Express, Supabase, PostgreSQL, and Make.com automation.

---

## 🌟 Key Features

* **No Mock/Demo Data**: Dynamic content is loaded live from the Supabase database. If records are empty, professional translated empty states are presented.
* **Multilingual & Moroccan Darija (`ar-MA`)**:
  * English (`EN`)
  * Français (`FR`)
  * العربية المغربية / Moroccan Darija (`MA`)
  * Dynamic **RTL / LTR** document direction switching with layout mirroring and persistent locale storage.
* **Real Booking Engine**:
  * Step-by-step booking flow calculating real-time available time slots using `business_hours`, `barber_availability`, and existing appointments.
  * Executed directly via database RPC function `create_appointment`.
* **Role-Based Portals**:
  * **Customer Portal**: View bookings, cancel appointments, track status, and read notifications.
  * **Barber Portal**: View personal calendar, manage work schedules, complete appointments (`complete_appointment`), or cancel appointments with a **mandatory cancellation reason modal** (`cancel_appointment`).
  * **Owner Platform**: Comprehensive business management console with real DB metrics, service catalog management, barber roster, customer list, contact inquiries, and automation logs.
* **Make.com Webhook Integration**:
  * Secure server-side automation route (`/api/automation`) protecting Make secrets.
  * Allowlisted event entities (`appointment`, `service`, `barber`, `customer`, `message`, `contact_message`, `notification`, `availability`, `settings`) and actions (`create`, `get`, `list`, `update`, `delete`, `confirm`, `cancel`, `complete`, `send`).
  * Request tracking IDs and database activity logging in `automation_logs`.
* **GitHub Ready**: Clean structure, zero committed secrets, `.env.example`, `.gitignore` ignoring local environment files.

---

## 🏗️ Architecture & Existing Supabase Tables

This project connects directly to the existing Supabase backend:

### Database Tables:
```text
profiles
barbers
customers
services
appointments
business_hours
barber_availability
contact_messages
messages
notifications
automation_logs
settings
```

### Stored Procedures / RPC Functions:
* `create_appointment`
* `confirm_appointment`
* `cancel_appointment`
* `complete_appointment`

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` or configure runtime environment variables:

```env
# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# VITE FALLBACK EQUIVALENTS
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# MAKE.COM AUTOMATION
MAKE_WEBHOOK_URL=your-make-webhook-url
MAKE_WEBHOOK_SECRET=your-make-webhook-secret

# SERVER SECRETS (NEVER EXPOSE TO BROWSER)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

---

## 🛠️ Installation & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```

3. **Verify build & lint**:
   ```bash
   npm run lint
   npm run build
   ```

4. **Production Start**:
   ```bash
   npm run start
   ```

---

## 🚀 Deployment

The project builds a self-contained bundled CommonJS server file at `dist/server.cjs` via `esbuild` and serves the Vite production app. It is ready to push to GitHub and deploy to Cloud Run, Vercel, or Docker containers.
