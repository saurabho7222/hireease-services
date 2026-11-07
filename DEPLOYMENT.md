# 🚀 HireEase Services - VPS Deployment Guide

This guide covers deploying **HireEase Services** onto any Virtual Private Server (Ubuntu 22.04 / 24.04, Debian 12, Rocky Linux, AWS EC2, DigitalOcean, Hetzner, Linode, Vultr, etc.).

---

## 📋 System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **OS** | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 or 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPUs |
| **RAM** | 1 GB (with swap) | 2 GB+ |
| **Disk** | 10 GB SSD | 20 GB SSD |
| **Node.js** | `>= 20.0.0` | `22.x LTS` |

---

## ⚡ Option A: Quick Automated Deploy (Recommended)

Once you clone the repository on your VPS, running a single command handles dependencies, database setup, building, and starting:

```bash
cd hireease-site
./deploy-vps.sh
```

---

## 🛠️ Option B: Step-by-Step Manual Deployment

### Step 1: Prepare VPS & Install Dependencies

SSH into your VPS and install Node.js 22, Python 3, SQLite 3, Git, Nginx, and PM2:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node and npm
node -v   # Should be v22.x
npm -v

# Install system utilities
sudo apt install -y git python3 sqlite3 nginx curl ufw

# Install PM2 globally (Process Manager)
sudo npm install -g pm2
```

Configure the UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

### Step 2: Clone the Project & Configure Environment

```bash
# Clone the repository
git clone https://github.com/saurabho7222/hireease-services.git
cd hireease-services/hireease-site

# Copy production environment configuration
cp .env.production.example .env

# Edit .env with your favorite editor
nano .env
```

Ensure you configure:
- `SUPER_ADMIN_EMAIL`: Your primary admin email (receives automatic Super Admin access to `/admin`).
- `ADMIN_SETUP_KEY`: A secret key for recruiter workspace onboarding.
- `NEXT_PUBLIC_APP_URL`: Your live domain (e.g., `https://hireeaseservices.com`).
- OAuth credentials (Google, GitHub, LinkedIn) if using live social sign-in.

---

### Step 3: Install Dependencies & Initialize Database

The project includes pre-built database migration and verification scripts:

```bash
# 1. Install dependencies
npm ci

# 2. Setup SQLite / D1 database (creates tables, indexes, and seeds 1,245 verified jobs)
npm run db:setup

# 3. Verify database integrity
npm run db:verify
```

Expected output:
```text
==================================================
      HireEase Services - Database Setup          
==================================================
Target Database: .../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite

Verification Results:
  • Existing Tables (11): applications, jobs, profiles, staff, users, sessions, outbox_emails, admin_access_requests, email_verifications, admin_audit_logs, inhouse_projects
  • Total Jobs: 1245
  • Registered Users: 19
  • Total Applications: 13
  • In-House Projects: 0

[OK] Database is healthy and operational.
```

> **Note on SQL Dumps:** If you are connecting to an external database or need raw SQL dumps, the project provides `hireease-database.sql` (Universal/SQLite), `hireease-postgres.sql` (PostgreSQL), and `hireease-mysql.sql` (MySQL). You can re-generate them anytime with `npm run db:export`.

---

### Step 4: Build the Application

Compile the production assets:

```bash
npm run build
```

---

### Step 5: Start the Service with PM2

Start HireEase with PM2 and configure it to restart automatically on system reboot:

```bash
# Start application using the pre-configured ecosystem file
pm2 start ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup
# (Copy and execute the command printed by PM2)
```

Useful PM2 management commands:
```bash
pm2 status                # Check status
pm2 logs hireease-site    # Stream live logs
pm2 restart hireease-site # Restart app
pm2 reload hireease-site  # Zero-downtime reload
pm2 stop hireease-site    # Stop app
```

---

### Step 6: Configure Nginx Reverse Proxy

Copy the included Nginx configuration:

```bash
sudo cp nginx/hireease.conf /etc/nginx/sites-available/hireease.conf

# Edit the configuration to set your domain name
sudo nano /etc/nginx/sites-available/hireease.conf
# Replace 'yourdomain.com' with your actual domain name or VPS public IP
```

Enable the site and reload Nginx:
```bash
# Enable the configuration
sudo ln -sf /etc/nginx/sites-available/hireease.conf /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Step 7: Enable Free SSL with Let's Encrypt (Certbot)

Obtain a free SSL certificate with auto-renewal:

```bash
# Install Certbot and the Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically configure HTTPS in Nginx and set up a systemd renewal timer. Test renewal with:
```bash
sudo certbot renew --dry-run
```

---

### Step 8: Configure Automated Daily Database Backups

The project includes an online, zero-downtime database backup script:

```bash
# Test manual backup
npm run db:backup
```

Add a daily cron job to back up the database at 3:00 AM every night:

```bash
crontab -e
```

Add this line to the bottom:
```bash
0 3 * * * cd /path/to/hireease-services/hireease-site && bash scripts/backup-database.sh >> /var/log/hireease-backup.log 2>&1
```

Backups are compressed with gzip and stored in `backups/`. Archives older than 14 days are automatically cleaned up.

---

## 🐳 Option C: Docker Deployment

If you prefer deploying with Docker & Docker Compose:

```bash
# 1. Ensure Docker & Docker Compose are installed
sudo apt install -y docker.io docker-compose-v2

# 2. Configure .env
cp .env.production.example .env
nano .env

# 3. Build and launch containers
docker compose up -d --build

# 4. View logs
docker compose logs -f
```

The database (`.wrangler/state`) and candidate résumés (`public/resumes`) are automatically stored in persistent Docker volumes.

---

## 🔄 Deploying Future Updates

Whenever you push new changes to git, updating your VPS is seamless:

```bash
cd /path/to/hireease-services/hireease-site
git pull
./deploy-vps.sh
```

`deploy-vps.sh` will automatically install any new dependencies, apply database updates, re-build the assets, and reload PM2 with zero downtime.

---

## 🔍 Troubleshooting & FAQs

### 1. View Live Application Logs
```bash
pm2 logs hireease-site --lines 100
```

### 2. Port Conflict (Port 3000 already in use)
Change `PORT=3000` in `.env` and `ecosystem.config.cjs` to another port (e.g. `PORT=3001`), then update `proxy_pass http://127.0.0.1:3001;` in `/etc/nginx/sites-available/hireease.conf` and run `sudo systemctl reload nginx`.

### 3. File Upload Issues for Large Résumés
Nginx is pre-configured with `client_max_body_size 50M;` in `nginx/hireease.conf` to accommodate multi-page PDF résumés.

### 4. Database Status Check
Run `npm run db:verify` at any time to verify the database file is active, all 11 tables exist, and all 1,245 jobs are intact.
