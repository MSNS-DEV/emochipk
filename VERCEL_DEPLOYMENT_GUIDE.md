# 🚀 Executive Mochi — Vercel Deployment Guide

This project (Next.js 15 + Prisma + tRPC + NextAuth) is fully Vercel-native. No Railway, no Docker, no custom servers needed.

---

## 1. Connect GitHub Repo to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **Import Git Repository** → select `MSNS-DEV/emochipk`
3. Framework Preset auto-detects **Next.js** — keep defaults:
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Click **Deploy** (it will fail on first deploy — that's expected until env vars are set)

---

## 2. Set Environment Variables in Vercel Dashboard

Go to **Project → Settings → Environment Variables** and add these:

### 🔑 Required Core Variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_si9fM8gyAZCx@ep-young-scene-a1czywn2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connection_limit=10&pool_timeout=20` |
| `DIRECT_URL` | *(same as DATABASE_URL)* |
| `AUTH_SECRET` | `kVX5Cw93WkdByPGAz86VWk/2` |
| `NEXTAUTH_SECRET` | `kuMSB7FS+yIGp5MmyoTwFTBNWLOUzM46ZPJtKQoyBT8=` |
| `NEXTAUTH_URL` | `https://executivemochi.pk` |
| `AUTH_URL` | `https://executivemochi.pk` |
| `NEXT_PUBLIC_APP_URL` | `https://executivemochi.pk` |
| `NEXT_PUBLIC_BRAND_NAME` | `Executive Mochi` |
| `NEXT_PUBLIC_BRAND_PHONE` | `+92-310-1601499` |

### 📦 Cloudflare R2 Image Storage
Cloudflare R2 provides **0 egress fees** and unlimited free data transfer.

| Variable | Value |
|---|---|
| `S3_ENDPOINT` | `https://c678cf5c0fc5ef3806edacc18e6a762d.r2.cloudflarestorage.com` |
| `S3_BUCKET_NAME` | `emochipk` |
| `S3_REGION` | `auto` |
| `S3_ACCESS_KEY_ID` | `f3afb5cbae3f64a15d4030d65e741736` |
| `S3_SECRET_ACCESS_KEY` | `3d90d3b9db6197138dd290f0122c1fe3198ddc7767e77a22d9a6115dd3db7f91` |
| `NEXT_PUBLIC_IMAGE_URL` | *(Optional direct Cloudflare domain, e.g. `https://images.executivemochi.pk` or `https://pub-*.r2.dev`)* |

### 🚚 Courier & Payment APIs

| Variable | Value |
|---|---|
| `LEOPARDS_API_PASSWORD` | `sn1d22ls4v9x8wxr6ck5lvr2v47ud1v0` |
| `SAFEPAY_WEBHOOK_SECRET` | `wvkly3yt7onbkmji8x2uq3rju31n2tse` |
| `TRAX_PASSWORD` | `9szo8zb1ji2y9wkh1basbhzrmycqxau1` |
| `SEED_ADMIN_EMAIL` | `admin@executivemochi.pk` |
| `SEED_ADMIN_PASSWORD` | `!GXPRPlfp@E3` |

---

## 3. Custom Domain Setup

1. Vercel Dashboard → Project → **Domains**
2. Add `executivemochi.pk`
3. Add the DNS records shown by Vercel in your domain registrar (typically an `A` record or `CNAME`)

---

## 4. Redeploy

After setting all environment variables, go to **Deployments → Redeploy** (or push any commit to trigger a fresh deploy).

---

## 5. Done! ✅

Your app will be live at `https://executivemochi.pk` with:
- ⚡ Edge-cached Next.js pages
- 🗄️ Neon PostgreSQL (serverless Postgres)
- 🖼️ Cloudflare R2 image storage via `/api/images/` proxy
- 🔒 NextAuth authentication
- 🌏 Singapore region (`sin1`) — closest to Pakistan
