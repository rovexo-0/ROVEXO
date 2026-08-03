# Future Vercel Cron hook (Owner-authorized deploy required)
# Application freeze: do NOT add /api/cron/backup until Owner unlocks API routes.
# When authorized, point vercel.json cron at a new route that shells to npm run backup
# on a persistent volume — Vercel serverless is NOT suitable for large pg_dump artifacts.
#
# Prefer: Linux cron / Windows Task / GitHub Action for Free Plan development backups.
