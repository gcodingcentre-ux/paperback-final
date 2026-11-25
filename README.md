# PaperBack Publishers website

Static site (HTML/CSS/JS) with a small admin dashboard, deployed on Vercel. Content is stored in Upstash Redis.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis connection (`KV_REST_API_URL` / `KV_REST_API_TOKEN` also work) |
| `ADMIN_ID` | Admin login ID |
| `ADMIN_PASSWORD` | First admin password. After "Change password" is used in the admin, the new password is stored (hashed) in Redis and takes over |
| `ADMIN_SECRET` | 16+ random characters. Signs admin sessions |
| `ADMIN_RECOVERY_KEY` | Key for "Forgot password" on the admin login screen (falls back to `ADMIN_SECRET`) |

Redeploy after changing any variable.

## Pages
- `/` home page, `book.html?book=<slug>` book page, `/admin` dashboard.
- Manuscript form: opens Gmail addressed to `work.paperback@gmail.com` (set in `script.js`); the form also opens as a pop-up 5 seconds after the home page loads (`popup.js`).
