#!/usr/bin/env python3
"""
Sync Micro1 Referral Jobs:
1. Fetches all active job opportunities from Micro1 referral API
2. Fetches complete Job Descriptions (JD), Scope of Work, and Requirements
3. Generates a formatted Excel (.xlsx) workbook preserving referral link
4. Publishes all jobs into HireEase Services SQLite / D1 database
"""

import urllib.request
import json
import time
import re
import html
import sqlite3
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

REFERRAL_CODE = "a462a1ef-5825-41db-8422-83628df889fc"
API_BASE_URL = "https://prod-api.micro1.ai/api/v1"
DB_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite"
    )
)
ROOT_EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../micro1-referral-jobs.xlsx"))
PUBLIC_EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../public/micro1-referral-jobs.xlsx"))

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<br\s*/?>', '\n', raw_html)
    text = re.sub(r'</li>', '\n', text)
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    return text

def map_category(domain_slug, title, skills):
    d = (domain_slug or "").lower()
    t = (title or "").lower()
    s_text = " ".join(skills).lower()

    if any(k in d or k in t for k in ["software", "code", "coding", "developer", "engineer", "devops", "frontend", "backend", "fullstack", "architect", "python", "typescript", "react", "golang", "java"]):
        return "Coding"
    if any(k in d or k in t for k in ["legal", "law", "attorney", "paralegal", "compliance", "regulatory", "contracts", "counsel"]):
        return "Legal"
    if any(k in d or k in t for k in ["health", "medic", "clinical", "nurse", "physician", "doctor", "pharma", "biotech"]):
        return "Healthcare"
    if any(k in d or k in t for k in ["finance", "financial", "accounting", "accountant", "audit", "auditor", "valuation", "tax", "banking", "treasury"]):
        return "Finance"
    if any(k in d or k in t for k in ["language", "linguist", "translat", "bilingual", "interpreter", "localization"]):
        return "Languages"
    if any(k in d or k in t for k in ["science", "chemistry", "biology", "physics", "math", "statistic", "researcher", "phd"]):
        return "Science"
    return "Data Annotation & RLHF"

def fetch_all_job_stubs():
    print(f"[*] Fetching job list from Micro1 Referral API for referralCode: {REFERRAL_CODE}...")
    jobs = []
    page = 1
    total_expected = 0

    while True:
        url = f"{API_BASE_URL}/job/portal/referral/{REFERRAL_CODE}/jobs?page={page}&limit=100"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-custom-lang": "en"
        })
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("data", [])
                total_expected = data.get("total", 0)
                if not items:
                    break
                jobs.extend(items)
                print(f"    Page {page}: fetched {len(items)} jobs (total: {len(jobs)} / {total_expected})")
                if len(jobs) >= total_expected:
                    break
                page += 1
        except Exception as e:
            print(f"    [!] Error on page {page}: {e}")
            break

    print(f"[+] Total job listings discovered: {len(jobs)}")
    return jobs

def fetch_job_details(stub):
    job_id = stub.get("job_id")
    post_url = f"https://jobs.micro1.ai/post/{job_id}"
    req = urllib.request.Request(post_url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})

    job_title = stub.get("job_name")
    skills = stub.get("skills") or []
    openings = stub.get("no_of_openings") or 1
    reward = stub.get("referral_reward_amount") or 0
    date_posted = stub.get("date_posted") or time.strftime("%Y-%m-%d %H:%M:%S")

    # Format compensation
    comp_obj = stub.get("ideal_hourly_rate")
    compensation = "Competitive"
    if isinstance(comp_obj, dict) and comp_obj.get("min") and comp_obj.get("max"):
        compensation = f"${comp_obj['min']} - ${comp_obj['max']}/hr"
    elif stub.get("ideal_monthly_salary_min") and stub.get("ideal_monthly_salary_max"):
        compensation = f"${stub['ideal_monthly_salary_min']} - ${stub['ideal_monthly_salary_max']}/mo"

    # Apply URL
    apply_url = stub.get("apply_url")
    if not apply_url:
        apply_url = f"https://jobs.micro1.ai/post/{job_id}?referralCode={REFERRAL_CODE}&utm_source=referral&utm_medium=share&utm_campaign=job_referral"

    full_description = ""
    responsibilities = []
    location = "Remote"
    emp_type = "Contract"

    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                html_content = resp.read().decode("utf-8")
                # Look for Schema.org JobPosting
                for script in re.findall(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL):
                    if "JobPosting" in script:
                        m = re.search(r'self\.__next_f\.push\(\[1,\s*\"(.*)\"\]\)', script, re.DOTALL)
                        if m:
                            try:
                                decoded = json.loads('"' + m.group(1) + '"')
                                jd_obj = json.loads(decoded)
                                raw_desc = jd_obj.get("description", "")
                                full_description = clean_html(raw_desc)
                                if jd_obj.get("title"):
                                    job_title = jd_obj.get("title")
                                if jd_obj.get("employmentType"):
                                    emp_type = jd_obj.get("employmentType").capitalize()
                                loc_type = jd_obj.get("jobLocationType")
                                if loc_type == "TELECOMMUTE":
                                    location = "Remote"
                            except Exception:
                                pass
            break
        except Exception as e:
            if attempt == 1:
                pass
            time.sleep(0.5)

    # Fallback description if page couldn't be parsed
    if not full_description:
        full_description = f"{job_title}\n\nJoin micro1 as a {job_title}. Apply your domain expertise in {', '.join(skills[:5])} to evaluate, benchmark, and improve frontier AI models.\n\nKey Responsibilities:\n- Review and annotate complex prompts and generated outputs\n- Identify factual and reasoning errors in domain topics\n- Deliver high-quality feedback to train next-generation AI systems."

    # Extract responsibilities bullet points
    lines = [l.strip() for l in full_description.split("\n") if l.strip()]
    in_scope = False
    for line in lines:
        if any(h in line.lower() for h in ["scope of work", "responsibilities", "what you'll do", "duties"]):
            in_scope = True
            continue
        if in_scope:
            if any(h in line.lower() for h in ["requirements", "qualifications", "who you are", "about you", "benefits", "compensation"]):
                break
            if len(line) > 10 and not line.endswith(":"):
                responsibilities.append(line.lstrip("•-*0123456789. "))
        if len(responsibilities) >= 8:
            break

    if not responsibilities:
        responsibilities = [
            f"Apply verified knowledge in {', '.join(skills[:3])} to benchmark AI solutions",
            "Audit generative model outputs for technical and factual correctness",
            "Synthesize domain feedback and evaluation signals to improve model performance",
            "Collaborate with project coordinators to maintain high rubric adherence"
        ]

    category = map_category(stub.get("domain_slug"), job_title, skills)

    return {
        "id": job_id,
        "title": job_title,
        "company": "micro1",
        "category": category,
        "location": location,
        "type": emp_type,
        "experience": "2+ years professional experience",
        "compensation": compensation,
        "description": full_description,
        "skills": skills,
        "responsibilities": responsibilities,
        "openings": openings,
        "referral_reward": f"${reward}" if reward else "$0",
        "apply_url": apply_url,
        "date_posted": date_posted,
        "status": "open"
    }

def create_excel_file(jobs_data):
    print("[*] Generating formatted Excel (.xlsx) workbook...")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Micro1 Referral Jobs"

    # Brand Colors: Forest Emerald
    header_fill = PatternFill(start_color="166534", end_color="166534", fill_type="solid")
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Arial", size=10)
    bold_font = Font(name="Arial", size=10, bold=True)
    link_font = Font(name="Arial", size=10, color="0044CC", underline="single")

    thin_border = Border(
        left=Side(style='thin', color='DCE5D6'),
        right=Side(style='thin', color='DCE5D6'),
        top=Side(style='thin', color='DCE5D6'),
        bottom=Side(style='thin', color='DCE5D6')
    )

    headers = [
        "Job ID",
        "Position / Title",
        "Company",
        "Category / Domain",
        "Location",
        "Employment Type",
        "Experience",
        "Compensation",
        "Openings",
        "Referral Reward",
        "Required Skills",
        "Responsibilities (Scope)",
        "Complete Job Description (JD)",
        "Referral Application Link",
        "Date Posted",
        "Status"
    ]

    ws.append(headers)

    # Style header row
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
    ws.row_dimensions[1].height = 28

    # Zebra shading
    alt_fill = PatternFill(start_color="F8FAF7", end_color="F8FAF7", fill_type="solid")

    for r_idx, job in enumerate(jobs_data, start=2):
        row_vals = [
            job["id"],
            job["title"],
            job["company"],
            job["category"],
            job["location"],
            job["type"],
            job["experience"],
            job["compensation"],
            job["openings"],
            job["referral_reward"],
            ", ".join(job["skills"]),
            "\n".join([f"• {r}" for r in job["responsibilities"]]),
            job["description"],
            job["apply_url"],
            job["date_posted"],
            job["status"].capitalize()
        ]
        ws.append(row_vals)

        # Style data cells
        fill = alt_fill if r_idx % 2 == 0 else PatternFill(fill_type=None)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=r_idx, column=col_idx)
            cell.border = thin_border
            if fill.fill_type:
                cell.fill = fill
            cell.font = data_font

            if col_idx in [1, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16]:
                cell.alignment = Alignment(horizontal="center", vertical="top")
            elif col_idx in [11, 12, 13]:
                cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
            elif col_idx == 14: # Referral link
                cell.font = link_font
                cell.hyperlink = job["apply_url"]
                cell.alignment = Alignment(horizontal="left", vertical="top")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="top")

        ws.row_dimensions[r_idx].height = 42

    # Column widths
    col_widths = {
        1: 38,  # ID
        2: 36,  # Title
        3: 12,  # Company
        4: 24,  # Category
        5: 14,  # Location
        6: 16,  # Type
        7: 24,  # Experience
        8: 18,  # Compensation
        9: 10,  # Openings
        10: 16, # Reward
        11: 40, # Skills
        12: 50, # Responsibilities
        13: 65, # Description
        14: 65, # Referral Link
        15: 20, # Date Posted
        16: 12  # Status
    }
    for col_idx, width in col_widths.items():
        ws.column_dimensions[get_column_letter(col_idx)].width = width

    ws.freeze_panes = "A2"

    wb.save(ROOT_EXCEL_PATH)
    wb.save(PUBLIC_EXCEL_PATH)
    print(f"[+] Saved Excel to: {ROOT_EXCEL_PATH}")
    print(f"[+] Saved Excel to: {PUBLIC_EXCEL_PATH}")

def publish_to_database(jobs_data):
    print(f"[*] Publishing {len(jobs_data)} jobs to HireEase Services database...")
    if not os.path.exists(DB_PATH):
        print(f"[!] Database file not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Check and add external_url column if missing
    cur.execute("PRAGMA table_info(jobs)")
    cols = [col[1] for col in cur.fetchall()]
    if "external_url" not in cols:
        print("[*] Adding 'external_url' column to jobs table...")
        cur.execute("ALTER TABLE jobs ADD COLUMN external_url TEXT")
        conn.commit()

    now = time.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    inserted = 0
    updated = 0

    for j in jobs_data:
        cur.execute("SELECT id FROM jobs WHERE id = ?", (j["id"],))
        exists = cur.fetchone()

        cur.execute("""
            INSERT INTO jobs (
                id, title, company, category, location, type, experience,
                compensation, description, skills, responsibilities,
                status, created_at, updated_at, external_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                title = excluded.title,
                company = excluded.company,
                category = excluded.category,
                location = excluded.location,
                type = excluded.type,
                experience = excluded.experience,
                compensation = excluded.compensation,
                description = excluded.description,
                skills = excluded.skills,
                responsibilities = excluded.responsibilities,
                status = excluded.status,
                updated_at = excluded.updated_at,
                external_url = excluded.external_url
        """, (
            j["id"],
            j["title"],
            j["company"],
            j["category"],
            j["location"],
            j["type"],
            j["experience"],
            j["compensation"],
            j["description"],
            json.dumps(j["skills"]),
            json.dumps(j["responsibilities"]),
            j["status"],
            j["date_posted"] if j["date_posted"] else now,
            now,
            j["apply_url"]
        ))

        if exists:
            updated += 1
        else:
            inserted += 1

    conn.commit()
    cur.execute("SELECT COUNT(*) FROM jobs WHERE company = 'micro1'")
    micro1_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM jobs")
    total_count = cur.fetchone()[0]
    conn.close()

    print(f"[+] Database updated successfully: {inserted} inserted, {updated} updated.")
    print(f"[+] Total micro1 jobs in DB: {micro1_count} (Overall total jobs in DB: {total_count})")

def main():
    t0 = time.time()
    stubs = fetch_all_job_stubs()
    if not stubs:
        print("[!] No job listings found. Aborting.")
        sys.exit(1)

    print(f"[*] Fetching full descriptions for {len(stubs)} jobs concurrently (25 workers)...")
    full_jobs = []
    completed = 0
    with ThreadPoolExecutor(max_workers=25) as executor:
        futures = {executor.submit(fetch_job_details, s): s for s in stubs}
        for f in as_completed(futures):
            res = f.result()
            full_jobs.append(res)
            completed += 1
            if completed % 50 == 0 or completed == len(stubs):
                print(f"    Progress: {completed}/{len(stubs)} job details fetched...")

    # Sort deterministically by date / title
    full_jobs.sort(key=lambda x: (x["category"], x["title"]))

    # Generate Excel
    create_excel_file(full_jobs)

    # Publish to Database
    publish_to_database(full_jobs)

    t1 = time.time()
    print(f"[✓] ALL TASKS COMPLETED in {t1 - t0:.2f} seconds!")

if __name__ == "__main__":
    main()
