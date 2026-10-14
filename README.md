# Money Tracker

Simple salary, expense and savings recorder. Pure HTML/CSS/JS, no build step. Data is stored in the browser's localStorage.

## Run locally
Open `index.html` in a browser.

## Deploy on GitHub Pages
1. Create a new repo on GitHub (e.g. `money-tracker`).
2. Push these files:
   ```
   git init
   git add .
   git commit -m "Money tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/money-tracker.git
   git push -u origin main
   ```
3. Repo → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save.
4. Site goes live at `https://<your-username>.github.io/money-tracker/`.

## Notes
- Data lives per browser/device. Use **Export backup** / **Import backup** to move or back up data.
- Clearing site data erases entries, so export regularly.
