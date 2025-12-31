# Database Migration Guide

This guide explains how to run database migrations for the PoweredByPace app.

## Migration Methods

### 1. Via Web UI (Recommended for Testing)

1. Go to your Vercel deployment: `https://your-app.vercel.app/migrate`
2. Click "Run Migration Now"
3. Check the results

### 2. Via API Endpoint (Recommended for Production)

Call the migration API directly:

```bash
curl -X POST https://your-app.vercel.app/api/migrate
```

Or use the provided script:

```bash
npm run migrate:vercel https://your-app.vercel.app
```

### 3. Via Vercel CLI Script

```bash
# Set your deployment URL
export VERCEL_URL=https://your-app.vercel.app

# Or pass it as argument
./scripts/run-migration-vercel.sh https://your-app.vercel.app
```

### 4. Via Direct psql (If you have direct database access)

```bash
npm run migrate:psql
```

**Note:** This requires direct network access to your Supabase database, which may not work from your local machine due to firewall restrictions.

### 5. Via Supabase SQL Editor (Manual)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `scripts/migrate-add-groups.sql`
5. Paste and run

## Automatic Migration

Migrations run automatically:
- **During Vercel build** (if `POSTGRES_URL` is available)
- **On first API request** to `/api/groups` (if tables are missing)

## Migration File

The migration SQL is located at: `scripts/migrate-add-groups.sql`

## Troubleshooting

### "Connection timeout" when using psql
- Use the API endpoint method instead (`npm run migrate:vercel`)
- Or run the migration via Supabase SQL Editor

### "SSL certificate error"
- The migration script handles SSL automatically
- Make sure `POSTGRES_URL_NON_POOLING` is set in Vercel environment variables

### "Table already exists" errors
- These are safe to ignore - the migration is idempotent
- The script will skip statements that already exist

## Environment Variables

Required for automatic migration:
- `POSTGRES_URL_NON_POOLING` (preferred) or `POSTGRES_URL`
- Or `VERCEL_POSTGRES_URL_NON_POOLING` (if using Vercel Postgres)

Set these in:
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Or in `.env.local` for local testing

