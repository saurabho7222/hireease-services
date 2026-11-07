#!/usr/bin/env bash
# ==============================================================================
# HireEase Services - Docker Automated Runner Script
# Usage: ./run-docker.sh
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${BOLD}${BLUE}======================================================${NC}"
echo -e "${BOLD}${BLUE}       HireEase Services - Docker Launcher            ${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}\n"

# 1. Check Docker Installation
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not installed on this system.${NC}"
    echo -e "${BLUE}Installing Docker automatically via official script...${NC}"
    curl -fsSL https://get.docker.com | sh
    if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
        sudo usermod -aG docker "$USER" || true
    fi
    echo -e "  • Docker installed successfully (${GREEN}OK${NC})"
fi

# Detect compose command
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose is not installed.${NC}"
    echo -e "Install via: sudo apt install -y docker-compose-v2"
    exit 1
fi

echo -e "  • Docker: $(${COMPOSE_CMD} version) (${GREEN}OK${NC})"

# 2. Check .env file
if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        echo -e "  • Creating .env from .env.production.example..."
        cp .env.production.example .env
    elif [ -f .env.example ]; then
        cp .env.example .env
    fi
fi

# 3. Build & Run container
echo -e "\n${BLUE}Building container image and starting service in background...${NC}"
$COMPOSE_CMD up -d --build

echo -e "\n${BOLD}${GREEN}======================================================${NC}"
echo -e "${BOLD}${GREEN}   HireEase Services Docker Container is Running!     ${NC}"
echo -e "${BOLD}${GREEN}======================================================${NC}\n"
echo -e "Access URL:      ${BOLD}http://localhost:3000${NC} (or http://YOUR_VPS_IP:3000)"
echo -e "View live logs:  ${BOLD}${COMPOSE_CMD} logs -f hireease${NC}"
echo -e "Restart app:     ${BOLD}${COMPOSE_CMD} restart hireease${NC}"
echo -e "Stop app:        ${BOLD}${COMPOSE_CMD} down${NC}\n"

