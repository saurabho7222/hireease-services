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

# Install all dependencies including devDependencies required for Vinext build
RUN npm ci

# Copy project source code
COPY . .

# Ensure necessary directories exist
RUN mkdir -p public/resumes backups logs .wrangler/state

# Initialize seed database in image
RUN python3 scripts/setup-database.py

# Build production bundle using Node 22
RUN npm run build

# Make entrypoint script executable
RUN chmod +x scripts/docker-entrypoint.sh

# Expose production port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
