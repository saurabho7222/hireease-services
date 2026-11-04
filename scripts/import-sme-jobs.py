#!/usr/bin/env python3
"""
HireEase Services - SME Careers Job Importer
Fetches all open opportunities from https://api.sme.careers/v1/jobs/open
Extracts title, full JD, skills, requirements, compensation, and referral application link
(preserving referral code rp--66f070).
Inserts / updates the SQLite D1 database.
"""

import urllib.request
import json
import sqlite3
import glob
import os
import uuid
from datetime import datetime
from collections import defaultdict

REFERRAL_CODE = "rp--66f070"
BASE_REFERRAL_URL = "https://sme.careers/apply"

def find_sqlite_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pattern = os.path.join(base_dir, ".wrangler", "state", "v3", "d1", "**", "*.sqlite")
    matches = glob.glob(pattern, recursive=True)
    db_files = [m for m in matches if not os.path.basename(m).startswith("metadata")]
    if db_files:
        return db_files[0]
    raise FileNotFoundError("Could not locate local SQLite D1 database file.")

def categorize(title, desc='', skills=[]):
    t = (title + ' ' + ' '.join(skills)).lower()
    
    # 1. Languages
    lang_keywords = [
        'language expert', 'translator', 'linguist', 'translation', 'dutch', 'telugu', 'kannada',
        'thai', 'german', 'japanese', 'chinese', 'swedish', 'malay', 'french', 'spanish', 'arabic',
        'korean', 'italian', 'russian', 'hindi', 'vietnamese', 'bengali', 'tagalog', 'portuguese',
        'polish', 'turkish', 'hebrew', 'czech', 'hungarian', 'greek', 'danish', 'norwegian',
        'finnish', 'urdu', 'punjabi', 'marathi', 'tamil', 'gujarati', 'malayalam', 'burmese',
        'khmer', 'swahili', 'amharic', 'yoruba', 'igbo', 'zulu', 'somali', 'farsi', 'persian',
        'indonesian', 'romanian', 'ukrainian', 'slovak', 'bulgarian', 'croatian', 'serbian',
        'lithuanian', 'latvian', 'estonian'
    ]
    if any(k in t for k in lang_keywords):
        return 'Languages'
        
    # 2. Science
    sci_keywords = [
        'biochemist', 'chemist', 'scientist', 'physics', 'biology', 'materials science', 'nuclear',
        'cbrn', 'chemical', 'radiological', 'explosives', 'mathematics', 'math', 'geology', 'astronomy'
    ]
    if any(k in t for k in sci_keywords):
        return 'Science'
        
    # 3. Healthcare
    health_keywords = [
        'doctor', 'nurse', 'clinical', 'medical', 'healthcare', 'health', 'pharma', 'hospital',
        'patient', 'biomedical', 'pharmacy', 'therapist', 'physician', 'dental', 'veterinary'
    ]
    if any(k in t for k in health_keywords):
        return 'Healthcare'
        
    # 4. Legal
    legal_keywords = [
        'lawyer', 'attorney', 'legal', 'compliance', 'paralegal', 'juris', 'court', 'contract law',
        'litigation', 'regulatory'
    ]
    if any(k in t for k in legal_keywords):
        return 'Legal'
        
    # 5. Finance
    fin_keywords = [
        'accountant', 'finance', 'cpa', 'financial', 'tax', 'bookkeep', 'valuation', 'equity',
        'banking', 'wealth', 'audit'
    ]
    if any(k in t for k in fin_keywords) and 'safety audit' not in t and 'model audit' not in t:
        return 'Finance'
        
    # 6. Coding
    code_keywords = [
        'developer', 'software', 'coding', 'python', 'linux', 'ubuntu', 'c++', 'javascript',
        'typescript', 'spark', 'sql', 'fullstack', 'backend', 'frontend', 'engineer', 'devops', 'sysadmin'
    ]
    if any(k in t for k in code_keywords):
        return 'Coding'
        
    return 'Data Annotation & RLHF'

def format_compensation(curr, min_val, max_val, unit):
    curr = curr or 'USD'
    unit = unit or 'hourly'
    symbol = '$' if curr == 'USD' else f"{curr} "
    
    suffix = '/hr' if unit == 'hourly' else ('/mo' if unit == 'monthly' else f'/{unit}')
    
    if min_val is not None and max_val is not None and min_val != max_val:
        return f"{symbol}{int(min_val) if min_val == int(min_val) else min_val} - {symbol}{int(max_val) if max_val == int(max_val) else max_val}{suffix}"
    elif max_val is not None:
        return f"{symbol}{int(max_val) if max_val == int(max_val) else max_val}{suffix}"
    elif min_val is not None:
        return f"{symbol}{int(min_val) if min_val == int(min_val) else min_val}+{suffix}"
    else:
        return "Competitive / Negotiable"

def main():
    print("Fetching open opportunities from SME Careers API...")
    url = "https://api.sme.careers/v1/jobs/open?include=applicants-count"
    req = urllib.request.Request(url, headers={
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })
    
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        
    raw_jobs = data.get('data', {}).get('jobs', [])
    print(f"Total postings received from SME Careers: {len(raw_jobs)}")
    
    # Group by externalKey
    by_key = defaultdict(list)
    for j in raw_jobs:
        k = j.get('externalKey') or j.get('title')
        by_key[k].append(j)
        
    print(f"Grouped into {len(by_key)} distinct specialist roles.")
    
    db_path = find_sqlite_db()
    print(f"Target Database: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    inserted = 0
    updated = 0
    now = datetime.utcnow().isoformat() + "Z"
    
    for ext_key, postings in by_key.items():
        primary = postings[0]
        title = primary.get('title', '').strip()
        job_posting_id = primary.get('jobPostingId', '')
        
        # Collect all eligible countries
        countries = []
        for p in postings:
            c = p.get('country')
            if c and c.get('name'):
                countries.append(c['name'])
            elif p.get('countryCode'):
                countries.append(p.get('countryCode'))
        unique_countries = sorted(list(set(countries)))
        
        # Rates
        min_rates = [p.get('rateMin') for p in postings if p.get('rateMin') is not None]
        max_rates = [p.get('rateMax') for p in postings if p.get('rateMax') is not None]
        currencies = list(set([p.get('currencyCode') for p in postings if p.get('currencyCode')]))
        units = list(set([p.get('payUnit') for p in postings if p.get('payUnit')]))
        
        curr = currencies[0] if currencies else 'USD'
        unit = units[0] if units else 'hourly'
        min_val = min(min_rates) if min_rates else None
        max_val = max(max_rates) if max_rates else None
        
        comp_str = format_compensation(curr, min_val, max_val, unit)
        
        # Location
        if len(unique_countries) == 1:
            location_str = f"Remote ({unique_countries[0]})"
        elif len(unique_countries) > 1:
            sample_c = ", ".join(unique_countries[:3])
            location_str = f"Remote ({len(unique_countries)} Countries: {sample_c}…)"
        else:
            location_str = "Remote (Global)"
            
        # Skills
        raw_skills = primary.get('skills', [])
        skills_list = []
        for s in raw_skills:
            if isinstance(s, dict) and 'name' in s and s['name']:
                skills_list.append(s['name'].strip())
            elif isinstance(s, str) and s.strip():
                skills_list.append(s.strip())
        skills_list = list(dict.fromkeys(skills_list))
        
        # Requirements & Responsibilities
        requirements = [r.strip() for r in primary.get('requirements', []) if isinstance(r, str) and r.strip()]
        responsibilities = [r.strip() for r in primary.get('responsibilities', []) if isinstance(r, str) and r.strip()]
        
        # Complete Job Description
        base_desc = primary.get('description', '').strip()
        full_jd_parts = [base_desc]
        
        if responsibilities:
            full_jd_parts.append("\n\n### Responsibilities\n" + "\n".join(f"• {r}" for r in responsibilities))
            
        if requirements:
            full_jd_parts.append("\n\n### Requirements & Qualifications\n" + "\n".join(f"• {r}" for r in requirements))
            
        if len(unique_countries) > 1:
            full_jd_parts.append(f"\n\n### Eligible Countries ({len(unique_countries)})\n" + ", ".join(unique_countries))
            
        full_jd = "\n".join(full_jd_parts).strip()
        
        # Experience level
        exp_level = primary.get('experienceLevel', 'mid_senior_level')
        exp_formatted = exp_level.replace('_', ' ').title() if exp_level else 'Mid-Senior Level'
        
        # Category
        cat = categorize(title, base_desc, skills_list)
        
        # Unique deterministic job ID in hireease database
        deterministic_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"sme.careers:{ext_key}"))
        
        # Referral application link
        referral_link = f"{BASE_REFERRAL_URL}?referral={REFERRAL_CODE}&jobId={job_posting_id}&jobPostingId={ext_key}"
        
        # Check existing
        cur.execute("SELECT id FROM jobs WHERE id = ? OR (company = 'sme.careers' AND title = ?)", (deterministic_uuid, title))
        existing = cur.fetchone()
        
        if existing:
            target_id = existing[0]
            cur.execute("""
                UPDATE jobs
                SET title = ?, company = ?, category = ?, location = ?, type = ?,
                    experience = ?, compensation = ?, description = ?, skills = ?,
                    responsibilities = ?, status = 'open', updated_at = ?, external_url = ?
                WHERE id = ?
            """, (
                title, 'sme.careers', cat, location_str, 'Contract',
                exp_formatted, comp_str, full_jd, json.dumps(skills_list),
                json.dumps(responsibilities if responsibilities else requirements),
                now, referral_link, target_id
            ))
            updated += 1
        else:
            cur.execute("""
                INSERT INTO jobs (
                    id, title, company, category, location, type, experience,
                    compensation, description, skills, responsibilities, status,
                    created_at, updated_at, external_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                deterministic_uuid, title, 'sme.careers', cat, location_str, 'Contract',
                exp_formatted, comp_str, full_jd, json.dumps(skills_list),
                json.dumps(responsibilities if responsibilities else requirements),
                'open', now, now, referral_link
            ))
            inserted += 1
            
    conn.commit()
    conn.close()
    print(f"SME Careers Import Complete: {inserted} inserted, {updated} updated.")
    
    # Check total jobs in database
    conn2 = sqlite3.connect(db_path)
    cur2 = conn2.cursor()
    cur2.execute("SELECT company, count(*) FROM jobs GROUP BY company")
    print("Database breakdown by platform:", cur2.fetchall())
    cur2.execute("SELECT count(*) FROM jobs")
    print(f"Total active jobs in HireEase database: {cur2.fetchone()[0]}")
    conn2.close()

if __name__ == '__main__':
    main()
