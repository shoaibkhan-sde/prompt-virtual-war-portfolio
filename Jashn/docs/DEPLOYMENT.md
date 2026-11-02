# Deployment Guide — Jashn Celebration & Event Planner

## 1. Deploying to Vercel (Recommended)

**Jashn** is built with Next.js App Router and optimized for instant zero-configuration deployment on Vercel.

### Option A: Via Vercel Web Dashboard
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/new), click **Add New Project** and import the repository.
3. Configure Environment Variables:
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API Key. If omitted, the built-in deterministic planner operates automatically.
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g., `https://jashn.vercel.app`).
4. Click **Deploy**. Vercel will build and deploy the application in under 60 seconds.

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 2. Self-Hosted Node.js / Docker Deployment

### Production Build & Run
```bash
# 1. Install production dependencies
npm ci

# 2. Build the production bundle
npm run build

# 3. Start the production server on port 3000
npm run start
```

### Minimal Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 3. Production Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Optional | `""` (built-in fallback) | Google Gemini API Key for LLM reasoning |
| `NEXT_PUBLIC_GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Default Gemini model in priority chain |
| `NEXT_PUBLIC_APP_URL` | Optional | `http://localhost:3000` | Canonical app URL for absolute links & metadata |
| `RATE_LIMIT_MAX_REQUESTS_PER_MINUTE` | Optional | `30` | Sliding window rate limit threshold per client IP |

---

## 4. Performance & Lighthouse Optimization
- **First Load JS:** Shared by all routes is only **87 kB**; main page is **195 kB**.
- **Font Optimization:** `Plus_Jakarta_Sans` is preloaded via `next/font/google` with CSS variables, preventing layout shift (CLS: 0).
- **Static Pre-rendering:** Root page and API endpoints are pre-compiled and served with aggressive cache headers.
