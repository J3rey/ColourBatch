# ColourBatch

Batch-grade photos in the browser. Drop in up to 50 images, pick a film/cinematic preset, fine-tune adjustments, and export the whole set.

**Live:** https://colour-batch.vercel.app/

## Features

- Batch upload (JPEG / PNG / WebP, up to 50 images)
- Curated preset library (film stocks, cinematic looks, neutral bases)
- Manual adjustments: brightness, contrast, saturation, temperature, tint, highlights, shadows, hue, vibrance, gamma, lift/gain, vignette, grain
- WebGL-accelerated preview rendering
- Export graded images individually or share via the Web Share API

## Stack

- **Frontend:** React 19 + Vite 7, Tailwind CSS, WebGL
- **Backend:** Express 5 (health/status endpoints)
- **Deploy:** Vercel (frontend)

## Project layout

```
frontend/   React + Vite app (the editor)
backend/    Express API
```

## Local development

```bash
npm install
npm run dev          # runs frontend (Vite) + backend concurrently
```

Other scripts:

```bash
npm run build        # build the frontend
npm run preview      # preview the built frontend
npm run start        # run the backend in production mode
npm run check        # build frontend + syntax-check backend
```

## Configuration

Backend env vars (optional, via `backend/.env`):

- `PORT` — API port (default `4000`)
- `CORS_ORIGIN` — allowed origin (default `http://127.0.0.1:5173`)
