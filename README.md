# Money Tracker

Personal salary, expense and savings recorder. Static site on GitHub Pages + Supabase as the shared database, so every device you log in on sees the same data.

## 1. Supabase setup (one time)
1. Create a free project at supabase.com.
2. **SQL Editor** → paste `schema.sql` → Run.
3. **Authentication → Providers → Email**: turn **OFF** "Confirm email".
4. **Project Settings → API**: copy the Project URL and the `anon public` key into `config.js`. Never use the `service_role` key.

## 2. Publish the update
In your project folder (replace the old files with the new ones, and add `config.js`; `schema.sql` is optional):
```
git add .
git commit -m "Add login and shared database"
git push
```
GitHub Pages redeploys in a minute or two.

## 3. Create your account, then close sign-ups
1. Open your live site → **Create account** → pick your username and password.
2. In Supabase → **Authentication → Sign In / Providers** (or Settings) → turn OFF "Allow new users to sign up". Now nobody else can register.
3. Log in on your other devices with the same username and password.

## 4. Bring in your old data
On the old version of the site (same browser as before), click **Export backup**. After logging in to the new version, click **Import backup**.

## Notes
- There is no "forgot password". If you forget it, reset it in Supabase → Authentication → Users.
- Each username is mapped to a placeholder address (`username@example.com`); no emails are sent. If Supabase rejects that domain, change `FAKE_DOMAIN` at the top of the auth section in `app.js`.
- The anon key in `config.js` is safe to publish; your data is protected by Row Level Security (see `schema.sql`).
