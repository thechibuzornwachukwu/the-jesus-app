# The JESUS App

Christian community, discipleship and spiritual growth — PWA built on Next.js 16 + Supabase + Netlify.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL + Realtime + Storage + Auth)
- **AI** *(Phase 3)*: OpenAI GPT-4o + text-embedding-3-small
- **Vector DB**: pgvector (Supabase extension)
- **Deployment**: Netlify

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL + anon key

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
the-jesus-app/
├── app/
│   ├── (app)/          # Protected tab routes (Engage, Learn, Explore, Profile)
│   ├── (auth)/         # Sign-in, Sign-up
│   └── auth/callback/  # Supabase OAuth/magic-link callback
├── components/         # App-level components (BottomNav, PwaInstallPrompt)
├── lib/
│   ├── auth/           # Server actions (signIn, signUp, signInWithMagicLink)
│   └── supabase/       # Server/client/middleware Supabase clients
├── libs/
│   ├── shared-ui/      # Design system (tokens, Typography, Button, Input…)
│   ├── cells/          # Phase 2 — Engage tab
│   ├── explore/        # Phase 2 — Explore tab
│   └── learn/          # Phase 3 — Learn tab (AI)
├── public/
│   ├── manifest.json   # PWA manifest
│   └── sw.js           # Service worker
├── proxy.ts            # Auth middleware (Next.js 16 convention)
└── supabase/
    └── schema.sql      # Run in Supabase SQL Editor to set up DB
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy project URL + anon key into `.env.local`

## Phases

| Phase | Feature | Status |
| ----- | ------- | ------ |
| 1 | Foundation — PWA shell, auth, design system | ✅ Complete |
| 2 | Cells (Engage) + Explore video feed | Pending |
| 3 | Learn tab — AI discipleship (OpenAI) | Pending |

## Design Tokens

All brand colors live in `libs/shared-ui/tokens.css` as CSS custom properties.

| Token | Value | Use |
| ----- | ----- | --- |
| `--color-orange-dark` | `#f47521` | Primary accent |
| `--color-orange-sharp` | `#f7bd95` | Soft accent |
| `--color-blue-deep` | `#040503` | Page background |
| `--color-faint-bg` | `#171638` | Card / surface |
| `--color-bright` | `#f5f7f7` | Primary text |
