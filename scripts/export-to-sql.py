#!/usr/bin/env python3
"""
HireEase Services - SQLite to Standard SQL Exporter
Generates standard SQL, PostgreSQL, and MySQL compatible dump files.
"""

import os
import glob
import sqlite3
from datetime import datetime

def find_sqlite_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pattern = os.path.join(base_dir, ".wrangler", "state", "v3", "d1", "**", "*.sqlite")
    matches = glob.glob(pattern, recursive=True)
    # Exclude metadata.sqlite
    db_files = [m for m in matches if not os.path.basename(m).startswith("metadata")]
    if db_files:
        return db_files[0]
    raise FileNotFoundError("Could not locate local SQLite D1 database file.")

def escape_sql_value(val):
    if val is None:
        return "NULL"
    elif isinstance(val, (int, float)):
        return str(val)
    elif isinstance(val, bytes):
        return f"X'{val.hex()}'"
    else:
        # Standard SQL string escape: replace ' with ''
        escaped = str(val).replace("'", "''")
        return f"'{escaped}'"

def export_sql():
    db_path = find_sqlite_db()
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_universal = os.path.join(project_root, "hireease-database.sql")
    output_postgres = os.path.join(project_root, "hireease-postgres.sql")
    output_mysql = os.path.join(project_root, "hireease-mysql.sql")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Tables to export in foreign-key dependency order
    table_order = [
        "users",
        "profiles",
        "jobs",
        "applications",
        "staff",
        "sessions",
        "admin_access_requests",
        "outbox_emails",
        "email_verifications"
    ]

    # Verify existing tables
    existing_tables = [
        r[0] for r in cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%';"
        ).fetchall()
    ]

    tables_to_dump = [t for t in table_order if t in existing_tables]
    for t in existing_tables:
        if t not in tables_to_dump:
            tables_to_dump.append(t)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Universal / SQLite SQL Dump
    with open(output_universal, "w", encoding="utf-8") as f:
        f.write(f"-- HireEase Services Database Dump\n")
        f.write(f"-- Exported on: {now_str}\n")
        f.write(f"-- Source: SQLite (Cloudflare D1 Local State)\n")
        f.write(f"-- Compatible with: SQLite, D1, General SQL Clients (DBeaver, DataGrip, etc.)\n\n")
        f.write("BEGIN TRANSACTION;\n\n")

        for table in tables_to_dump:
            # Table schema
            schema_row = cursor.execute(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?;", (table,)
            ).fetchone()
            if schema_row and schema_row[0]:
                create_stmt = schema_row[0].strip()
                if not create_stmt.endswith(";"):
                    create_stmt += ";"
                f.write(f"-- ----------------------------\n-- Table: {table}\n-- ----------------------------\n")
                f.write(f"DROP TABLE IF EXISTS \"{table}\";\n")
                f.write(f"{create_stmt}\n\n")

            # Table rows
            cursor.execute(f"PRAGMA table_info(\"{table}\");")
            cols = [info[1] for info in cursor.fetchall()]
            col_list_str = ", ".join([f'"{c}"' for c in cols])

            cursor.execute(f"SELECT * FROM \"{table}\";")
            rows = cursor.fetchall()

            if rows:
                f.write(f"-- Data for {table} ({len(rows)} records)\n")
                for r in rows:
                    val_strs = [escape_sql_value(v) for v in r]
                    f.write(f"INSERT INTO \"{table}\" ({col_list_str}) VALUES ({', '.join(val_strs)});\n")
                f.write("\n")

            # Indexes
            indexes = cursor.execute(
                "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name = ? AND sql IS NOT NULL;",
                (table,)
            ).fetchall()
            for idx in indexes:
                if idx[0]:
                    idx_stmt = idx[0].strip()
                    if not idx_stmt.endswith(";"):
                        idx_stmt += ";"
                    f.write(f"{idx_stmt}\n")
            if indexes:
                f.write("\n")

        f.write("COMMIT;\n")

    # 2. PostgreSQL Dump
    with open(output_postgres, "w", encoding="utf-8") as f:
        f.write(f"-- HireEase Services Database Dump (PostgreSQL Format)\n")
        f.write(f"-- Exported on: {now_str}\n")
        f.write(f"-- Target: PostgreSQL 12+ / Supabase / Neon / AWS RDS\n\n")

        f.write("""-- Drop tables in reverse order
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS outbox_emails CASCADE;
DROP TABLE IF EXISTS admin_access_requests CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------
-- Table: users
-- ----------------------------
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    salt VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'candidate',
    provider VARCHAR(32) NOT NULL DEFAULT 'credentials',
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL
);
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- ----------------------------
-- Table: profiles
-- ----------------------------
CREATE TABLE profiles (
    user_id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    city VARCHAR(128) NOT NULL DEFAULT '',
    country VARCHAR(128) NOT NULL DEFAULT '',
    education VARCHAR(255) NOT NULL DEFAULT '',
    institution VARCHAR(255) NOT NULL DEFAULT '',
    graduation_year VARCHAR(16) NOT NULL DEFAULT '',
    skills TEXT NOT NULL DEFAULT '[]',
    experience TEXT NOT NULL DEFAULT '',
    resume_key TEXT,
    resume_name VARCHAR(255),
    consented_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL
);

-- ----------------------------
-- Table: jobs
-- ----------------------------
CREATE TABLE jobs (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    experience VARCHAR(255) NOT NULL,
    compensation VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    skills TEXT NOT NULL DEFAULT '[]',
    responsibilities TEXT NOT NULL DEFAULT '[]',
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    created_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL
);
CREATE INDEX idx_jobs_status_created ON jobs (status, created_at);

-- ----------------------------
-- Table: applications
-- ----------------------------
CREATE TABLE applications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    job_id VARCHAR(64) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    is_sample INTEGER NOT NULL DEFAULT 0,
    snapshot TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted',
    created_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL,
    updated_by VARCHAR(64),
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_applications_user_job ON applications (user_id, job_id);
CREATE INDEX idx_applications_created ON applications (created_at);

-- ----------------------------
-- Table: staff
-- ----------------------------
CREATE TABLE staff (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at VARCHAR(64) NOT NULL
);

-- ----------------------------
-- Table: sessions
-- ----------------------------
CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    expires_at VARCHAR(64) NOT NULL,
    created_at VARCHAR(64) NOT NULL
);
CREATE INDEX idx_sessions_user_id ON sessions (user_id);

-- ----------------------------
-- Table: admin_access_requests
-- ----------------------------
CREATE TABLE admin_access_requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at VARCHAR(64) NOT NULL,
    reviewed_at VARCHAR(64),
    reviewed_by VARCHAR(64)
);

-- ----------------------------
-- Table: outbox_emails
-- ----------------------------
CREATE TABLE outbox_emails (
    id VARCHAR(64) PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject TEXT NOT NULL,
    text_content TEXT,
    html_content TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'sent',
    sent_at VARCHAR(64) NOT NULL
);

-- ----------------------------
-- Table: email_verifications
-- ----------------------------
CREATE TABLE email_verifications (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(16) NOT NULL,
    expires_at VARCHAR(64) NOT NULL,
    created_at VARCHAR(64) NOT NULL
);
CREATE INDEX idx_verifications_email ON email_verifications (email);

""")
        # Insert Data
        f.write("-- ----------------------------\n-- DATA INSERTS\n-- ----------------------------\n\n")
        for table in tables_to_dump:
            cursor.execute(f"PRAGMA table_info(\"{table}\");")
            cols = [info[1] for info in cursor.fetchall()]
            col_list_str = ", ".join([f'"{c}"' for c in cols])

            cursor.execute(f"SELECT * FROM \"{table}\";")
            rows = cursor.fetchall()
            if rows:
                f.write(f"-- Inserts for {table}\n")
                for r in rows:
                    val_strs = [escape_sql_value(v) for v in r]
                    f.write(f"INSERT INTO \"{table}\" ({col_list_str}) VALUES ({', '.join(val_strs)});\n")
                f.write("\n")

    conn.close()
    print(f"Export completed successfully!")
    print(f"Universal / Standard SQL: {output_universal}")
    print(f"PostgreSQL SQL: {output_postgres}")

if __name__ == "__main__":
    export_sql()
