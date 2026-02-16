# AM Manpower Service (Demo)

This workspace contains a demo frontend (static HTML/CSS/JS) and a Node.js Express backend to accept applications and save them to MongoDB.

Folders:

- `frontend/` — HTML pages: `index.html`, `about.html`, `jobs.html`, `location.html`, `apply.html` plus assets.
- `backend/` — Express server, models, routes and `config.env` placeholder.

Quick start (backend):

1. Open `backend/config.env` and set `DB_URL` to your MongoDB connection string. Optionally change `PORT`.
2. In a terminal, run:

```bash
cd "D:/AM Manpower/backend"
npm install
npm start
```

Frontend pages are static — open the files in a browser or serve them with a simple static server. The apply form posts to `http://localhost:5000/api/apply`.

Deployment notes

- Backend (Render.com):
  1.  Create a Git repository for this project and push the `backend/` folder (or the whole workspace) to GitHub/GitLab/Bitbucket.
  2.  In Render, create a new **Web Service** and connect your repo.
      - Build Command: `npm install`
      - Start Command: `npm start`
      - Environment: set `DB_URL` to your Atlas URI, set `ADMIN_USER`, `ADMIN_PASS`, `ADMIN_JWT_SECRET`, and `ADMIN_IS_SUPER=true` if you want delete rights.
      - Port: Render will set `PORT` automatically; server reads `process.env.PORT`.
  3.  After deploy note the Render service URL (e.g. `https://am-backend.onrender.com`).

- Frontend (Vercel):
  1.  Create a Git repo for the `frontend/` folder and push it.
  2.  In Vercel, import the project and set framework to `Other` (static). No build command is required for plain HTML/CSS/JS.
  3.  Add an Environment Variable `API_BASE` with the value of your Render backend URL (for example `https://am-backend.onrender.com`).
  4.  IMPORTANT: Create a small file replacement before deploy or add a tiny build step to inject the `API_BASE` into `frontend/assets/js/config.js`. Example build step (optional):
      - Build Command (example using sed on Linux/macOS):
        `sed -i "s|window.API_BASE = window.API_BASE || 'http://localhost:5000';|window.API_BASE = 'https://am-backend.onrender.com';|g" assets/js/config.js`

      On Vercel you can run a build script that replaces the placeholder in `assets/js/config.js` with the `API_BASE` value. Alternatively, after deployment open `assets/js/config.js` in the deployed files and edit the `API_BASE` value to point to Render URL.

  5.  Deploy; open the Vercel site and the admin pages at `/admin/login.html`.

Security note: For a production-ready setup use HTTPS, strong `ADMIN_JWT_SECRET`, and avoid embedding DB credentials in client code. Render secrets are stored in environment variables on Render.
