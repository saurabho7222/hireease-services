#!/usr/bin/env python3
"""
HireEase Services - Turing Job Importer
Fetches all open opportunities from https://work.turing.com/jobs (via https://work.turing.com/api/jobs/all).
Extracts title, full JD, skills, requirements, compensation, and individual referral application link.
Inserts / updates the SQLite D1 database.
"""

import urllib.request
import json
import sqlite3
import glob
import os
import re
import html
import uuid
from datetime import datetime

REFERRAL_CODE = os.environ.get("TURING_REFERRAL_CODE", "")
BASE_JOB_URL = "https://work.turing.com/job/home"

def find_sqlite_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pattern = os.path.join(base_dir, ".wrangler", "state", "v3", "d1", "**", "*.sqlite")
    matches = glob.glob(pattern, recursive=True)
    db_files = [m for m in matches if not os.path.basename(m).startswith("metadata")]
    for db_f in db_files:
        try:
            c = sqlite3.connect(db_f).cursor()
            c.execute("SELECT count(*) FROM jobs")
            return db_f
        except sqlite3.OperationalError:
            continue
    if db_files:
        return db_files[0]
    raise FileNotFoundError("Could not locate local SQLite D1 database file.")

def html_to_markdown(raw_html):
    if not raw_html:
        return ""
    text = raw_html
    # Formatting
    text = re.sub(r"<strong>(.*?)</strong>", r"**\1**", text, flags=re.I)
    text = re.sub(r"<b>(.*?)</b>", r"**\1**", text, flags=re.I)
    text = re.sub(r"<em>(.*?)</em>", r"*\1*", text, flags=re.I)
    text = re.sub(r"<i>(.*?)</i>", r"*\1*", text, flags=re.I)
    text = re.sub(r"<li[^>]*>(.*?)</li>", r"\n• \1", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", r"\n", text, flags=re.I)
    text = re.sub(r"</p>", r"\n\n", text, flags=re.I)
    text = re.sub(r"<h[1-6][^>]*>(.*?)</h[1-6]>", r"\n\n### \1\n\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def categorize(role_group, title, desc):
    rg = (role_group or "").strip().lower()
    t_title = title.lower()
    # Mask out 'large language model' or 'llm' before checking language keywords
    t_desc_clean = re.sub(r'\blarge language models?\b', 'ai_model', desc[:600], flags=re.I)
    t = f"{t_title} {t_desc_clean}".lower()

    # Annotation / QA / Evaluation in title priority
    if any(k in t_title for k in ["annotation", "annotator", "rater", "evaluat", "rlhf", "model evaluat", "labeling", "red team", "qa", "reviewing"]):
        if any(k in t_title for k in ["software", "code", "devops", "c++", "python", "developer"]):
            return "Coding"
        return "Data Annotation & RLHF"

    # Healthcare
    if "healthcare" in rg or "medical" in rg or any(k in t for k in ["doctor", "nurse", "medical", "clinical", "healthcare", "pharma", "patient", "physician"]):
        return "Healthcare"

    # Legal
    if "legal" in rg or "law" in rg or any(k in t for k in ["legal", "lawyer", "attorney", "paralegal", "compliance", "litigation"]):
        return "Legal"

    # Finance
    if "finance" in rg or any(k in t for k in ["finance", "financial", "accountant", "accounting", "tax", "audit", "banking", "cpa", "bookkeep"]):
        return "Finance"

    # Languages (specific languages and linguist/translation keywords)
    lang_names = [
        "linguist", "translation", "translator", "bilingual", "multilingual",
        "dutch", "french", "german", "spanish", "japanese", "chinese", "arabic",
        "hindi", "korean", "portuguese", "italian", "vietnamese", "russian",
        "swedish", "polish", "thai", "indonesian", "turkish", "tagalog"
    ]
    if "linguistics" in rg or any(re.search(rf"\b{k}\b", t) for k in lang_names):
        return "Languages"

    # Science
    sci_names = ["physics", "chemistry", "biology", "math", "mathematic", "scientist", "biochem", "quantum", "geology", "phd maths", "phd biology"]
    if "science" in rg or any(re.search(rf"\b{k}\b", t) for k in sci_names):
        return "Science"

    # Coding
    if any(k in rg for k in ["software", "engineering", "cloud", "ml/data", "coding", "developer"]) or any(k in t for k in ["developer", "software", "engineer", "frontend", "backend", "full stack", "fullstack", "python", "java", "c++", "c#", "rust", "golang", "architect", "devops", "machine learning", "ai engineer", "data engineer"]):
        return "Coding"

    # Default to Data Annotation & RLHF
    return "Data Annotation & RLHF"

def extract_compensation(title, desc):
    # Check title first
    m_title = re.search(r"\b(?:Up to\s*)?\$?\s*(\d+(?:\s*-\s*\$?\s*\d+)?)\s*(?:/\s*hr|/\s*hour|USD|per hour)\b", title, re.I)
    if m_title:
        return f"${m_title.group(1)}/hr"

    # Check description
    m_desc = re.search(r"(?:\$|USD\s*)(\d+(?:[\,\.]\d+)?(?:\s*-\s*\$?\s*\d+(?:[\,\.]\d+)?)?)\s*(?:/\s*hr|/\s*hour|per hour)", desc, re.I)
    if m_desc:
        return f"${m_desc.group(1)}/hr"

    t_lower = title.lower()
    if any(k in t_lower for k in ["personal account", "rater", "smartphone", "generalist"]):
        return "$15 - $25/hr"
    elif any(k in t_lower for k in ["doctor", "physician", "attorney", "lawyer", "phd"]):
        return "$70 - $130/hr"
    elif any(k in t_lower for k in ["expert", "consulting", "specialist"]):
        return "$60 - $120/hr"
    elif any(k in t_lower for k in ["engineer", "developer", "architect", "lead", "c++"]):
        return "$50 - $95/hr"
    elif any(k in t_lower for k in ["analyst", "evaluator", "annotation", "trainer"]):
        return "$35 - $65/hr"

    return "$40 - $80/hr"

def extract_experience(desc):
    m = re.findall(r"(\d+\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|hands-on|industry|professional)?)", desc, re.I)
    if m:
        clean = m[0].strip()
        if not clean.lower().endswith("experience"):
            clean += " experience"
        return clean
    return "1+ years / Domain Specialist"

def extract_location(title, location_type):
    t_lower = title.lower()
    if "- us" in t_lower or "(us" in t_lower or "us only" in t_lower:
        return "Remote (United States)"
    if "- india" in t_lower or "(india" in t_lower:
        return "Remote (India)"
    if "on-site" in str(location_type).lower():
        return "On-site / Hybrid"
    return "Remote (Worldwide)"

def extract_responsibilities(raw_html, title):
    bullets = re.findall(r"<li[^>]*>(.*?)</li>", raw_html, re.I)
    resps = []
    for b in bullets:
        clean = re.sub(r"<[^>]+>", "", b).strip()
        clean = html.unescape(clean)
        # Filter out short or boilerplate bullets
        if len(clean) > 25 and not clean.startswith("http") and clean not in resps:
            resps.append(clean)
        if len(resps) >= 6:
            break

    if not resps:
        resps = [
            f"Review, evaluate, and fine-tune next-generation AI model responses for {title}",
            "Provide step-by-step reasoning explanations, factual verifications, and high-quality reference answers",
            "Identify hallucinations, logical inconsistencies, and edge-case failure modes in AI outputs",
            "Collaborate with Turing research and evaluation teams to maintain state-of-the-art benchmarks"
        ]
    return resps

def extract_skills_list(job):
    skills = []
    # 1. API skills
    for s in job.get("skills", []):
        if isinstance(s, dict) and "skillName" in s:
            name = s["skillName"].strip()
            if name and name not in skills:
                skills.append(name)

    # 2. Add title keywords or domain skills if list is small
    title = job.get("title", "")
    desc = job.get("description", "")
    t_and_d = f"{title}\n{desc}".lower()

    extra_map = [
        ("LLM Evaluation", r"\b(llm|fine-tuning|model evaluation)\b"),
        ("Prompt Engineering", r"\bprompt\b"),
        ("RLHF", r"\brlhf\b"),
        ("Python", r"\bpython\b"),
        ("Data Annotation", r"\b(annotation|annotator|data labelling)\b"),
        ("Quality Assurance", r"\bqa\b|\bquality assurance\b"),
        ("Content Review", r"\b(content review|fact-checking)\b"),
        ("AI Safety & Alignment", r"\b(safety|alignment|red team)\b")
    ]
    for skill_name, pat in extra_map:
        if len(skills) >= 6:
            break
        if re.search(pat, t_and_d) and skill_name not in skills:
            skills.append(skill_name)

    if not skills:
        skills = ["AI Evaluation", "Domain Analysis", "Problem Solving"]

    return skills[:8]

def main():
    print("=" * 60)
    print("HireEase Services - Turing Opportunities Importer")
    print("=" * 60)

    jobs = []
    # Try fetching live
    url = "https://work.turing.com/api/jobs/all"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = json.dumps({
        "searchQuery": "",
        "expertise": [],
        "location": [],
        "pageNumber": 1,
        "pageSize": 500,
        "sortingCriteria": "newest"
    }).encode("utf-8")

    try:
        print(f"Connecting to {url}...")
        req = urllib.request.Request(url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            jobs = data.get("jobs", [])
            print(f"Successfully fetched {len(jobs)} jobs live from Turing API.")
    except Exception as e:
        print(f"Live fetch notice: {e}")
        # Fallback to local cache if present
        cache_paths = ["/tmp/turing_raw_jobs.json", "scripts/turing_raw_jobs.json"]
        for p in cache_paths:
            if os.path.exists(p):
                with open(p, "r") as f:
                    jobs = json.load(f)
                print(f"Loaded {len(jobs)} jobs from cached file: {p}")
                break

    if not jobs:
        raise RuntimeError("No jobs could be fetched or loaded for Turing.")

    db_path = find_sqlite_db()
    print(f"Active SQLite D1 database: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    inserted = 0
    updated = 0
    now = datetime.utcnow().isoformat() + "Z"

    for j in jobs:
        turing_id = j.get("id")
        job_code = j.get("jobCode") or j.get("public_code")
        title = (j.get("title") or "").strip()
        if not turing_id or not title:
            continue

        raw_desc = j.get("description", "")
        clean_jd = html_to_markdown(raw_desc)
        cat = categorize(j.get("roleGroup"), title, clean_jd)
        comp = extract_compensation(title, clean_jd)
        loc = extract_location(title, j.get("locationType"))
        exp = extract_experience(clean_jd)
        skills = extract_skills_list(j)
        resps = extract_responsibilities(raw_desc, title)

        # Deterministic UUID based on Turing ID
        job_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"turing.com:{turing_id}"))

        # Referral URL: points to individual job landing with referralCode if provided
        referral_link = f"{BASE_JOB_URL}?jobCode={job_code}"
        if REFERRAL_CODE:
            referral_link += f"&referralCode={REFERRAL_CODE}"

        cur.execute("SELECT id FROM jobs WHERE id = ? OR external_url LIKE ?", (job_id, f"%jobCode={job_code}%"))
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
                title, 'Turing', cat, loc, 'Contract',
                exp, comp, clean_jd, json.dumps(skills),
                json.dumps(resps), now, referral_link, target_id
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
                job_id, title, 'Turing', cat, loc, 'Contract',
                exp, comp, clean_jd, json.dumps(skills),
                json.dumps(resps), 'open', now, now, referral_link
            ))
            inserted += 1

    conn.commit()
    conn.close()

    print(f"\nImport Completed:")
    print(f"  • Inserted: {inserted}")
    print(f"  • Updated:  {updated}")

    # Verify breakdown
    conn2 = sqlite3.connect(db_path)
    cur2 = conn2.cursor()
    cur2.execute("SELECT company, count(*) FROM jobs GROUP BY company ORDER BY count(*) DESC")
    breakdown = cur2.fetchall()
    print("\nDatabase Platform Breakdown:")
    for comp, count in breakdown:
        print(f"  - {comp:15}: {count:4} jobs")
    cur2.execute("SELECT count(*) FROM jobs")
    total_jobs = cur2.fetchone()[0]
    print(f"\nTotal Active Jobs in Database: {total_jobs}")
    conn2.close()

if __name__ == "__main__":
    main()
