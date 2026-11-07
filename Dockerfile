FROM node:22-bookworm-slim

# Install system dependencies (Python3 and SQLite required for database seeding & backup)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    sqlite3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies including devDependencies required for Vinext Vite build
RUN npm ci

# Copy project files
COPY . .

# Ensure upload directory exists
RUN mkdir -p public/resumes backups logs

# Initialize database
RUN python3 scripts/setup-database.py

# Build production assets
RUN npm run build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]

