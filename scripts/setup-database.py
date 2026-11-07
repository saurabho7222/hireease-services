#!/usr/bin/env python3
"""
HireEase Services - VPS Database Setup & Migration Script
Initializes, migrates, and verifies the SQLite / Cloudflare D1 database for production VPS deployment.
"""

import os
import sys
import glob
import sqlite3
import argparse
from pathlib import Path

DEFAULT_D1_FILENAME = "faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite"

def get_paths(project_root: str):
    wrangler_d1_dir = os.path.join(project_root, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject")
    migrations_dir = os.path.join(project_root, "migrations")
    dump_file = os.path.join(project_root, "hireease-database.sql")
    schema_file = os.path.join(migrations_dir, "0001_initial_schema.sql")
    seed_file = os.path.join(migrations_dir, "0002_seed_jobs.sql")
    return {
        "wrangler_d1_dir": wrangler_d1_dir,
        "migrations_dir": migrations_dir,
        "dump_file": dump_file,
        "schema_file": schema_file,
        "seed_file": seed_file,
    }

def find_or_create_db(project_root: str, target_override: str = None) -> str:
    if target_override:
        target_path = os.path.abspath(target_override)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        return target_path

    paths = get_paths(project_root)
    d1_dir = paths["wrangler_d1_dir"]
    os.makedirs(d1_dir, exist_ok=True)

    # Initialize metadata.sqlite if missing
    metadata_path = os.path.join(d1_dir, "metadata.sqlite")
    if not os.path.exists(metadata_path):
        m_conn = sqlite3.connect(metadata_path)
        m_conn.execute("""
            CREATE TABLE IF NOT EXISTS _cf_ALARM (
                actor_id TEXT PRIMARY KEY,
                scheduled_time INTEGER
            ) WITHOUT ROWID;
        """)
        m_conn.commit()
        m_conn.close()

    # Search for existing D1 database
    pattern = os.path.join(d1_dir, "*.sqlite")
    matches = glob.glob(pattern)
    db_candidates = [m for m in matches if not os.path.basename(m).startswith("metadata")]

    if db_candidates:
        # Sort candidates: non-empty / largest files first
        db_candidates.sort(key=lambda p: os.path.getsize(p) if os.path.exists(p) else 0, reverse=True)
        # Check if any candidate has tables
        for cand in db_candidates:
            if os.path.getsize(cand) > 0:
                try:
                    c = sqlite3.connect(cand).cursor()
                    c.execute("SELECT count(*) FROM sqlite_master WHERE type='table'")
                    if c.fetchone()[0] > 0:
                        return cand
                except sqlite3.OperationalError:
                    continue
        return db_candidates[0]

    # Create default file
    default_db_path = os.path.join(d1_dir, DEFAULT_D1_FILENAME)
    return default_db_path

def get_stats(conn: sqlite3.Connection):
    cursor = conn.cursor()
    stats = {}
    
    # Check tables
    tables = [r[0] for r in cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%';"
    ).fetchall()]
    stats["tables"] = tables

    for t in ["users", "jobs", "applications", "staff", "inhouse_projects"]:
        if t in tables:
            stats[t] = cursor.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
        else:
            stats[t] = 0

    return stats

def run_sql_file(conn: sqlite3.Connection, file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"SQL file not found: {file_path}")
    
    print(f"  -> Executing: {os.path.basename(file_path)} ({os.path.getsize(file_path):,} bytes)...")
    with open(file_path, "r", encoding="utf-8") as f:
        sql = f.read()
    conn.executescript(sql)

def setup_database():
    parser = argparse.ArgumentParser(description="HireEase Services VPS Database Setup")
    parser.add_argument("--force", action="store_true", help="Force re-creation and re-seeding of database")
    parser.add_argument("--target", type=str, help="Specify custom target SQLite database file")
    parser.add_argument("--from-dump", action="store_true", help="Initialize directly from hireease-database.sql if present")
    parser.add_argument("--verify-only", action="store_true", help="Only verify existing database status")
    args = parser.parse_args()

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    paths = get_paths(project_root)
    db_path = find_or_create_db(project_root, args.target)

    print("==================================================")
    print("      HireEase Services - Database Setup          ")
    print("==================================================")
    print(f"Target Database: {db_path}")

    conn = sqlite3.connect(db_path)

    if args.verify_only:
        stats = get_stats(conn)
        print(f"\nVerification Results:")
        print(f"  • Existing Tables ({len(stats['tables'])}): {', '.join(stats['tables'])}")
        print(f"  • Total Jobs: {stats.get('jobs', 0)}")
        print(f"  • Registered Users: {stats.get('users', 0)}")
        print(f"  • Total Applications: {stats.get('applications', 0)}")
        print(f"  • In-House Projects: {stats.get('inhouse_projects', 0)}")
        conn.close()
        if stats.get('jobs', 0) > 0 and len(stats['tables']) >= 8:
            print("\n[OK] Database is healthy and operational.")
            sys.exit(0)
        else:
            print("\n[WARNING] Database appears empty or incomplete. Run without --verify-only to initialize.")
            sys.exit(1)

    existing_stats = get_stats(conn)
    jobs_count = existing_stats.get("jobs", 0)

    if jobs_count > 0 and not args.force:
        print(f"\nDatabase already initialized with {jobs_count} verified jobs and {len(existing_stats['tables'])} tables.")
        print("To overwrite and re-seed, run with --force.")
        conn.close()
        return

    print("\nStarting Database Initialization...")

    # Enable WAL mode and foreign keys for high-performance concurrent reads
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")

    if args.from_dump and os.path.exists(paths["dump_file"]):
        print(f"Restoring from full universal SQL dump: {paths['dump_file']}")
        run_sql_file(conn, paths["dump_file"])
    else:
        # Standard migration flow
        if os.path.exists(paths["schema_file"]):
            run_sql_file(conn, paths["schema_file"])
        else:
            raise FileNotFoundError(f"Missing initial schema file: {paths['schema_file']}")

        if os.path.exists(paths["seed_file"]):
            run_sql_file(conn, paths["seed_file"])
        elif os.path.exists(paths["dump_file"]):
            print("Seed migration missing, falling back to hireease-database.sql dump...")
            run_sql_file(conn, paths["dump_file"])

    conn.commit()
    final_stats = get_stats(conn)
    conn.close()

    print("\n==================================================")
    print("          Database Setup Completed!               ")
    print("==================================================")
    print(f"  • Tables created: {len(final_stats['tables'])}")
    print(f"  • Total Jobs Seeded: {final_stats.get('jobs', 0)}")
    print(f"  • Registered Users: {final_stats.get('users', 0)}")
    print(f"  • Staff Privileges: {final_stats.get('staff', 0)}")
    print(f"  • In-House Projects: {final_stats.get('inhouse_projects', 0)}")
    print(f"  • Database File: {db_path}")
    print("==================================================\n")

if __name__ == "__main__":
    setup_database()
