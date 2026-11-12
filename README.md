# ProBy6 — Fasa 1 + 2 (Next.js 14 + Supabase)

Fasa 2 lengkap: middleware sesi, shell + sidebar, dashboard 5 peranan, senarai & profil murid, borang kemas kini (Zod), analisis kohort, Presentation Mode, Feeder Access, Cetak Pukal, Tetapan/Audit Log.

```bash
npm install
cp .env.local.example .env.local   # URL + anon key projek Supabase
npm run dev
```
Status: kod belum dikompil (npm registry tidak boleh dicapai dari sandbox). Jalankan `npm run typecheck` dan `npm run build` dahulu dan hantar sebarang ralat kepada saya.

## Struktur folder
```
proby6/
├─ app/
│  ├─ layout.tsx                  # <Toaster richColors position="top-right" /> (sonner), font, metadata
│  ├─ globals.css                 # token tema shadcn (navy/blue/violet/teal)
│  ├─ login/page.tsx              # ✅ Fasa 1
│  ├─ (app)/                      # kawasan selepas login (layout: sidebar navy + topbar)
│  │  ├─ layout.tsx               # semak sesi + peranan di server
│  │  ├─ dashboard/page.tsx       # dashboard ikut peranan
│  │  ├─ murid/page.tsx           # senarai murid (kad)
│  │  ├─ murid/[id]/page.tsx      # profil individu → StudentProfileCard
│  │  ├─ murid/[id]/edit/page.tsx # borang (react-hook-form + Zod)
│  │  ├─ kohort/page.tsx
│  │  ├─ present/[id]/page.tsx    # Presentation Mode (Framer Motion, prev/next)
│  │  ├─ feeder-access/page.tsx
│  │  ├─ cetak/page.tsx           # cetak pukal + print stylesheet
│  │  └─ tetapan/page.tsx         # pengguna & audit log (ADMIN/PK1)
│  └─ api/audit/route.ts          # log VIEW/PRINT sebelah server
├─ components/
│  ├─ ui/                         # shadcn: button input label badge card sonner dialog select
│  ├─ StudentProfileCard.tsx      # ✅ Fasa 1
│  ├─ charts/ (ThreeMChart, UpDlp6Chart, AttendanceChart, FeederChart)
│  └─ layout/ (Sidebar, Topbar, RoleGuard)
├─ lib/
│  ├─ supabase/{client.ts ✅, server.ts, middleware.ts}
│  ├─ insight.ts ✅   student-utils.ts ✅   validators.ts ✅   utils.ts (cn)
├─ types/student.ts ✅    types/database.ts (supabase gen types)
├─ middleware.ts              # refresh sesi + redirect /login
└─ supabase/migrations/{0001_schema.sql ✅, 0002_rls.sql ✅, 0003_seed.sql}
```

## Pemasangan
```bash
npx create-next-app@14 proby6 --ts --tailwind --app
npm i @supabase/supabase-js @supabase/ssr framer-motion lucide-react zod react-hook-form @hookform/resolvers sonner recharts
npx shadcn@latest init
npx shadcn@latest add button input label badge card sonner
```
`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (service_role hanya di server/skrip admin).
Jalankan `0001_schema.sql` kemudian `0002_rls.sql` di Supabase SQL Editor.
