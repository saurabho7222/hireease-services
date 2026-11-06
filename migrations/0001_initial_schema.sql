-- Migration 0001: Initial Schema for HireEase Services
-- Compatible with Cloudflare D1 / SQLite / LibSQL

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  salt TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'candidate',
  provider TEXT NOT NULL DEFAULT 'credentials',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  education TEXT NOT NULL,
  institution TEXT NOT NULL,
  graduation_year TEXT NOT NULL,
  skills TEXT NOT NULL,
  experience TEXT NOT NULL,
  resume_key TEXT,
  resume_name TEXT,
  consented_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  experience TEXT NOT NULL,
  compensation TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  external_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs (status, created_at);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON UPDATE NO ACTION ON DELETE NO ACTION,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  is_sample INTEGER DEFAULT 0 NOT NULL,
  snapshot TEXT NOT NULL,
  status TEXT DEFAULT 'submitted' NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_user_job ON applications (user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications (created_at);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_access_requests (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  target_email TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS outbox_emails (
  id TEXT PRIMARY KEY NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  text_content TEXT,
  html_content TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inhouse_projects (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  client TEXT NOT NULL,
  domain TEXT NOT NULL,
  payout TEXT NOT NULL,
  estimated_hours TEXT NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  required_skills TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_inhouse_status_created ON inhouse_projects (status, created_at);

