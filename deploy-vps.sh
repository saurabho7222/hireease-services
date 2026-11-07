#!/usr/bin/env bash
# ==============================================================================
# HireEase Services - VPS Automated Deployment Script
# Usage: ./deploy-vps.sh
# ==============================================================================

set -euo pipefail

# ANSI color codes
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${BOLD}${BLUE}======================================================${NC}"
echo -e "${BOLD}${BLUE}      HireEase Services - VPS Production Deploy       ${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}\n"

# 1. Environment & Prerequisite Checks
echo -e "${BLUE}[1/7] Checking environment prerequisites...${NC}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js is not installed! Please install Node.js >= 22.${NC}"
    echo "  Example on Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION="$(node -v | sed 's/v//')"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d'.' -f1)"
echo -e "  • Node.js: v${NODE_VERSION} (${GREEN}OK${NC})"

if [ "$NODE_MAJOR" -lt 20 ]; then
    echo -e "${YELLOW}[WARNING] Node.js v${NODE_VERSION} detected. Version 22.x is recommended.${NC}"
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Python 3 is required for database setup and migrations.${NC}"
    echo "  Install via: sudo apt-get update && sudo apt-get install -y python3 sqlite3"
    exit 1
fi
echo -e "  • Python 3: $(python3 --version 2>&1) (${GREEN}OK${NC})"

# 2. Directory Structure Preparation
echo -e "\n${BLUE}[2/7] Preparing directory structure...${NC}"
mkdir -p public/resumes backups logs .wrangler/state
echo -e "  • Verified: public/resumes, backups, logs, .wrangler/state (${GREEN}OK${NC})"

# 3. Environment Configuration (.env)
echo -e "\n${BLUE}[3/7] Checking configuration (.env)...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        echo -e "  ${YELLOW}No .env found. Creating .env from .env.production.example...${NC}"
        cp .env.production.example .env
        echo -e "  ${YELLOW}Please remember to edit .env with your live domains and secrets!${NC}"
    elif [ -f .env.example ]; then
        cp .env.example .env
    fi
else
    echo -e "  • Existing .env file found (${GREEN}OK${NC})"
fi

# 4. Dependency Installation
echo -e "\n${BLUE}[4/7] Installing production & build dependencies...${NC}"
if [ -f package-lock.json ]; then
    npm ci --prefer-offline || npm install
else
    npm install
fi
echo -e "  • Dependencies installed successfully (${GREEN}OK${NC})"

# 5. Database Setup & Migrations
echo -e "\n${BLUE}[5/7] Initializing and verifying SQLite / D1 database...${NC}"
python3 scripts/setup-database.py
echo -e "  • Running integrity verification..."
python3 scripts/setup-database.py --verify-only

# 6. Production Build
echo -e "\n${BLUE}[6/7] Building production bundle...${NC}"
npm run build
echo -e "  • Build completed successfully (${GREEN}OK${NC})"

# 7. Process Management (PM2 or Systemd)
echo -e "\n${BLUE}[7/7] Launching / Reloading application process...${NC}"

if command -v pm2 >/dev/null 2>&1; then
    echo -e "  • PM2 detected. Managing process with PM2..."
    if pm2 list | grep -q "hireease-site"; then
        echo -e "  • Reloading existing PM2 instance..."
        pm2 reload ecosystem.config.cjs --update-env
    else
        echo -e "  • Starting new PM2 instance..."
        pm2 start ecosystem.config.cjs
        pm2 save || true
    fi
    echo -e "  • PM2 status: (${GREEN}RUNNING${NC})"
else
    echo -e "${YELLOW}  • PM2 is not installed globally.${NC}"
    echo -e "    To keep HireEase running permanently in background, install PM2:"
    echo -e "    ${BOLD}sudo npm install -g pm2 && pm2 start ecosystem.config.cjs && pm2 startup && pm2 save${NC}"
    echo -e "    Alternatively, use the systemd service in ${BOLD}systemd/hireease.service${NC}."
fi

echo -e "\n${BOLD}${GREEN}======================================================${NC}"
echo -e "${BOLD}${GREEN}       HireEase Services Deployed Successfully!       ${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}\n"
echo -e "Useful Commands:"
echo -e "  • View live logs:       ${BOLD}pm2 logs hireease-site${NC}"
echo -e "  • Restart application:  ${BOLD}pm2 restart hireease-site${NC}"
echo -e "  • Backup database:      ${BOLD}npm run db:backup${NC}"
echo -e "  • Database status:      ${BOLD}npm run db:verify${NC}"
echo -e "  • Nginx config:         ${BOLD}nginx/hireease.conf${NC}\n"

