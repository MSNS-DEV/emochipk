# 🚀 Executive Mochi — Vercel Deployment Guide

This project (Next.js 16 + Prisma 6 + tRPC + NextAuth) is fully Vercel-native.

---

## 1. Connect GitHub Repo to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **Import Git Repository** → select `MSNS-DEV/emochipk`
3. Framework Preset auto-detects **Next.js** — keep defaults:
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Click **Deploy**

---

## 2. Environment Variables in Vercel Dashboard

Configure the following environment variables in **Project → Settings → Environment Variables**:

### 🔑 Required Core Variables

| Variable | Description / Example | Type |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string (`...-pooler...neon.tech/neondb?sslmode=require`) | Sensitive |
| `DIRECT_URL` | Neon direct unpooled connection string (`...neon.tech/neondb?sslmode=require`) | Sensitive |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string for migrations | Sensitive |
| `NEON_API_KEY` | Neon Management API key (`napi_...`) | Sensitive |
| `AUTH_SECRET` | 32-character random hex/base64 string (`openssl rand -base64 32`) | Sensitive |
| `NEXTAUTH_SECRET` | 32-character random hex/base64 string | Sensitive |
| `NEXTAUTH_URL` | `https://executivemochi.pk` | Non-sensitive |
| `AUTH_URL` | `https://executivemochi.pk` | Non-sensitive |
| `NEXT_PUBLIC_APP_URL` | `https://executivemochi.pk` | Non-sensitive |
| `NEXT_PUBLIC_BRAND_NAME` | `Executive Mochi` | Non-sensitive |
| `NEXT_PUBLIC_BRAND_PHONE` | `+92-310-1601499` | Non-sensitive |

### 📦 Cloudflare R2 Image Storage (Zero-Egress)

| Variable | Description / Example | Type |
|---|---|---|
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com/emochipk` | Sensitive |
| `S3_BUCKET_NAME` | `emochipk` | Sensitive |
| `S3_REGION` | `auto` | Sensitive |
| `S3_ACCESS_KEY_ID` | Cloudflare R2 S3 Access Key ID | Sensitive |
| `S3_SECRET_ACCESS_KEY` | Cloudflare R2 S3 Secret Access Key | Sensitive |
| `NEXT_PUBLIC_IMAGE_URL` | Direct Cloudflare R2 custom domain (e.g. `https://images.executivemochi.pk`) | Non-sensitive |

### 🚚 Courier & Payment APIs

| Variable | Description | Type |
|---|---|---|
| `LEOPARDS_API_PASSWORD` | Leopards courier portal API password | Sensitive |
| `SAFEPAY_WEBHOOK_SECRET` | Safepay merchant webhook secret | Sensitive |
| `TRAX_PASSWORD` | Trax courier integration password | Sensitive |
| `SEED_ADMIN_EMAIL` | Administrator seed email | Sensitive |
| `SEED_ADMIN_PASSWORD` | Administrator seed password | Sensitive |

### 🛒 Google Merchant Center

| Variable | Description | Type |
|---|---|---|
| `GMC_MERCHANT_ID` | Merchant Center ID | Non-sensitive |
| `GMC_DATA_SOURCE_ID` | Primary Feed / Data Source ID | Non-sensitive |
| `GMC_FEED_ID` | Feed ID | Non-sensitive |
| `GMC_TARGET_COUNTRY` | `PK` | Non-sensitive |
| `GMC_CONTENT_LANGUAGE` | `en` | Non-sensitive |
| `GMC_CURRENCY` | `PKR` | Non-sensitive |

---

## 3. Custom Domain Setup

1. Vercel Dashboard → Project → **Domains**
2. Add `executivemochi.pk`
3. Add the DNS records shown by Vercel in your domain registrar (typically `A` or `CNAME`)

---

## 4. Redeploy

After syncing or updating environment variables, trigger a fresh deployment:
```bash
npx vercel --prod
```
