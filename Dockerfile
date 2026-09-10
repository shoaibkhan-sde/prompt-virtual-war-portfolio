# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build Flask Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build from stage 1
COPY --from=frontend-build /app/dist ./dist

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run with gunicorn
# Note: we run from the backend directory so that wsgi:app works correctly
WORKDIR /app/backend
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 wsgi:app
