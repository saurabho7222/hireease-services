#!/usr/bin/env python3
"""
HireEase Services - Mercor Job Importer
Fetches all open opportunities from https://work.mercor.com/explore
Extracts title, full JD, skills, requirements, compensation, and referral application link
(preserving referral code 2a6bc3e0-a5f7-40ad-95f3-1609d00a73a8 from https://t.mercor.com/Zd5wn).
Inserts / updates the SQLite D1 database.
"""

import urllib.request
import json
import sqlite3
import glob
import os
import re
import uuid
from datetime import datetime

REFERRAL_CODE = "2a6bc3e0-a5f7-40ad-95f3-1609d00a73a8"
BASE_JOB_URL = "https://work.mercor.com/jobs"

def find_sqlite_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pattern = os.path.join(base_dir, ".wrangler", "state", "v3", "d1", "**", "*.sqlite")
    matches = glob.glob(pattern, recursive=True)
    db_files = [m for m in matches if not os.path.basename(m).startswith("metadata")]
    if db_files:
        return db_files[0]
    raise FileNotFoundError("Could not locate local SQLite D1 database file.")

def categorize(title, desc=''):
    t = (title + ' ' + desc[:400]).lower()
    
    # 1. Languages
    lang_keywords = [
        'language expert', 'translator', 'linguist', 'translation', 'dutch', 'telugu', 'kannada',
        'thai', 'german', 'japanese', 'chinese', 'swedish', 'malay', 'french', 'spanish', 'arabic',
        'korean', 'italian', 'russian', 'hindi', 'vietnamese', 'bengali', 'tagalog', 'portuguese',
        'polish', 'turkish'
    ]
    if any(k in t for k in lang_keywords):
        return 'Languages'
        
    # 2. Healthcare
    health_keywords = [
        r'\bdoctor\b', r'\bnurse\b', r'\bnursing\b', r'\bclinical\b', r'\bmedical\b',
        r'\bhealthcare\b', r'\bhealth\b', r'\bpharma\b', r'\bhospital\b', r'\bpatient\b',
        r'\bbiomedical\b', r'\bphysician\b', r'\btoxicolog', r'\bmedicine\b'
    ]
    if any(re.search(k, t) for k in health_keywords) and 'hospitality' not in t:
        return 'Healthcare'
        
    # 3. Science
    sci_keywords = [
        'biochemist', 'chemist', 'scientist', 'physics', 'physicist', 'biology', 'biologist',
        'materials science', 'nuclear', 'cbrn', 'chemical', 'radiological', 'explosives',
        'mathematics', 'mathematician', 'blasting', 'propulsion', 'hazardous device',
        'nonproliferation', 'safeguards', 'emergency response'
    ]
    if any(k in t for k in sci_keywords) and 'software' not in title.lower():
        return 'Science'
        
    # 4. Legal
    legal_keywords = [
        'lawyer', 'attorney', 'legal', 'compliance', 'paralegal', 'patent attorney', 'prosecution',
        'litigation', 'court', 'regulatory'
    ]
    if any(k in t for k in legal_keywords):
        return 'Legal'
        
    # 5. Finance
    fin_keywords = [
        'accountant', 'finance', 'financial', 'cpa', 'underwriter', 'loan officer', 'banking',
        'tax', 'bookkeep', 'valuation', 'equity', 'audit'
    ]
    if any(k in t for k in fin_keywords) and 'safety audit' not in t:
        return 'Finance'
        
    # 6. Coding
    code_keywords = [
        'developer', 'software', 'coding', 'python', 'linux', 'ubuntu', 'c++', 'javascript',
        'typescript', 'spark', 'sql', 'fullstack', 'full-stack', 'backend', 'frontend', 'engineer',
        'devops', 'machine learning', 'ai-native', 'codebase', 'cybersecurity', 'smart contract', 'solidity'
    ]
    if any(k in t for k in code_keywords):
        return 'Coding'
        
    return 'Data Annotation & RLHF'

def extract_skills(title, desc):
    skills = []
    
    # Priority skill dictionary
    skills_map = [
        ('Python', r'\bpython\b'),
        ('JavaScript', r'\bjavascript\b'),
        ('TypeScript', r'\btypescript\b'),
        ('C++', r'\bc\+\+\b'),
        ('Go', r'\b(golang|go language)\b'),
        ('Rust', r'\brust\b'),
        ('SQL', r'\bsql\b'),
        ('Machine Learning', r'\b(machine learning|ml)\b'),
        ('Deep Learning', r'\bdeep learning\b'),
        ('PyTorch', r'\bpytorch\b'),
        ('LLM Evaluation', r'\b(llm|large language model|genai)\b'),
        ('RLHF', r'\brlhf\b'),
        ('Cybersecurity', r'\b(cybersecurity|security research|vulnerability)\b'),
        ('Reverse Engineering', r'\breverse engineering\b'),
        ('Smart Contracts', r'\b(smart contracts?|solidity)\b'),
        ('React', r'\breact\b'),
        ('Node.js', r'\bnode\.?js\b'),
        ('Docker', r'\bdocker\b'),
        ('Linux / Ubuntu', r'\b(linux|ubuntu)\b'),
        ('Patent Law', r'\bpatent\b'),
        ('Litigation', r'\blitigation\b'),
        ('Legal Research', r'\blegal (research|reasoning)\b'),
        ('Compliance', r'\bcompliance\b'),
        ('Loan Underwriting', r'\b(underwriter|underwriting|loan officer)\b'),
        ('Financial Analysis', r'\bfinancial (analysis|modeling|analyst)\b'),
        ('Accounting', r'\baccounting\b'),
        ('Auditing', r'\baudit(ing)?\b'),
        ('Taxation', r'\btax(ation)?\b'),
        ('Forensic Chemistry', r'\bforensic\b'),
        ('Toxicology', r'\btoxicolog(y|ical)\b'),
        ('Materials Science', r'\bmaterials science\b'),
        ('Nuclear Engineering', r'\bnuclear\b'),
        ('Chemical Safety', r'\bchemical safety\b'),
        ('Biochemistry', r'\bbiochemist(ry)?\b'),
        ('Molecular Biology', r'\bbiolog(y|ist)\b'),
        ('Clinical Medicine', r'\b(clinical|physician|medicine|doctor)\b'),
        ('Nursing', r'\bnurs(e|ing)\b'),
        ('Translation', r'\btranslat(or|ion)\b'),
        ('Concierge Services', r'\bconcierge\b'),
        ('Luxury Travel', r'\btravel advisor\b'),
        ('Market Research', r'\bmarket research\b'),
        ('Prompt Engineering', r'\bprompt engineering\b'),
        ('Code Review', r'\bcode review\b'),
        ('Open Source Maintenance', r'\bopen source\b')
    ]
    
    t_and_d = f"{title}\n{desc}"
    for skill_name, pattern in skills_map:
        if re.search(pattern, t_and_d, re.I):
            if skill_name not in skills:
                skills.append(skill_name)
                
    # If fewer than 2 skills, extract from title words
    if len(skills) < 2:
        title_words = [w.strip() for w in re.split(r'[\–\—\-\/\,\(\)]', title) if w.strip()]
        for w in title_words:
            if len(w) > 3 and not re.search(r'\b(expert|specialist|role|study|survey|us|paid)\b', w, re.I):
                clean_w = w.title()
                if clean_w not in skills:
                    skills.append(clean_w)
                    
    return skills[:8]

def format_compensation(rate_min, rate_max, freq):
    freq = (freq or 'hourly').lower()
    
    if freq in ['hourly', 'hour']:
        if rate_min and rate_max and rate_min != rate_max:
            return f"${int(rate_min)} - ${int(rate_max)}/hr"
        elif rate_max:
            return f"${int(rate_max)}/hr"
        elif rate_min:
            return f"${int(rate_min)}/hr"
    elif freq in ['one-time', 'fixed', 'project', 'survey']:
        amount = rate_max or rate_min
        if amount:
            return f"${int(amount)} (Fixed Task)"
    elif freq in ['annually', 'yearly', 'annual']:
        if rate_min and rate_max and rate_min != rate_max:
            return f"${int(rate_min):,} - ${int(rate_max):,}/yr"
        elif rate_max:
            return f"${int(rate_max):,}/yr"
    elif freq in ['monthly', 'month']:
        if rate_min and rate_max and rate_min != rate_max:
            return f"${int(rate_min):,} - ${int(rate_max):,}/mo"
        elif rate_max:
            return f"${int(rate_max):,}/mo"
            
    if rate_max:
        return f"${int(rate_max)}/hr"
        
    return "Competitive / Negotiable"

def main():
    print("Fetching open opportunities from Mercor...")
    url = "https://work.mercor.com/explore"
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    })
    
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>', html)
    if not match:
        raise ValueError("Could not find __NEXT_DATA__ in Mercor explore HTML")
        
    data = json.loads(match.group(1))
    listings = data['props']['pageProps']['dehydratedState']['queries'][0]['state']['data']['listings']
    print(f"Total listings received from Mercor: {len(listings)}")
    
    db_path = find_sqlite_db()
    print(f"Target Database: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    inserted = 0
    updated = 0
    now = datetime.utcnow().isoformat() + "Z"
    
    for l in listings:
        listing_id = l.get('listingId')
        if not listing_id:
            continue
            
        title = l.get('title', '').strip()
        if not title:
            continue
            
        base_desc = l.get('description', '').strip()
        
        # Compensation
        comp_str = format_compensation(l.get('rateMin'), l.get('rateMax'), l.get('payRateFrequency'))
        
        # Location & arrangement
        loc = l.get('location') or 'Remote'
        arr = l.get('workArrangement') or 'remote'
        eligible = l.get('eligibleLocation') or []
        
        location_str = loc
        if 'remote' in arr.lower() and 'remote' not in loc.lower():
            location_str = f"Remote ({loc})"
            
        # Category
        cat = categorize(title, base_desc)
        
        # Skills
        skills = extract_skills(title, base_desc)
        
        # Detailed description
        full_jd_parts = [base_desc]
        meta_bullets = []
        if l.get('hoursPerWeek'):
            meta_bullets.append(f"• Expected Hours: {l.get('hoursPerWeek')} hrs/week")
        if l.get('commitment'):
            meta_bullets.append(f"• Commitment: {l.get('commitment').title()}")
        if eligible:
            meta_bullets.append(f"• Eligible Locations: {', '.join(eligible)}")
        if l.get('companyName'):
            meta_bullets.append(f"• Client Partner: {l.get('companyName')}")
            
        if meta_bullets:
            full_jd_parts.append("\n\n### Role Details & Eligibility\n" + "\n".join(meta_bullets))
            
        full_jd = "\n".join(full_jd_parts).strip()
        
        # Deterministic job ID
        job_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"mercor.com:{listing_id}"))
        
        # Referral application URL
        referral_link = f"{BASE_JOB_URL}/{listing_id}?referralCode={REFERRAL_CODE}"
        
        # Responsibilities dummy / parsed
        resp_matches = re.findall(r'(?:responsibilities|what you\'ll do|what you will do)[:\s]*\n((?:[•\-\*]\s*[^\n]+\n?)+)', base_desc, re.I)
        responsibilities = []
        if resp_matches:
            responsibilities = [r.strip() for r in re.findall(r'[•\-\*]\s*([^\n]+)', resp_matches[0]) if r.strip()]
        if not responsibilities:
            responsibilities = [
                f"Contribute specialized domain expertise in {title}",
                "Collaborate with leading frontier AI research teams to evaluate and improve model reasoning",
                "Ensure strict adherence to quality benchmarks and high-accuracy reference guidelines"
            ]
            
        cur.execute("SELECT id FROM jobs WHERE id = ? OR external_url LIKE ?", (job_id, f"%{listing_id}%"))
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
                title, 'Mercor', cat, location_str, 'Contract',
                'Specialist / SME', comp_str, full_jd, json.dumps(skills),
                json.dumps(responsibilities), now, referral_link, target_id
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
                job_id, title, 'Mercor', cat, location_str, 'Contract',
                'Specialist / SME', comp_str, full_jd, json.dumps(skills),
                json.dumps(responsibilities), 'open', now, now, referral_link
            ))
            inserted += 1
            
    conn.commit()
    conn.close()
    print(f"Mercor Import Complete: {inserted} inserted, {updated} updated.")
    
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
