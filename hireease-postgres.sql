-- HireEase Services Database Dump (PostgreSQL Format)
-- Exported on: 2026-10-16 23:13:25
-- Target: PostgreSQL 12+ / Supabase / Neon / AWS RDS

-- Drop tables in reverse order
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

-- ----------------------------
-- DATA INSERTS
-- ----------------------------

-- Inserts for users
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_admin_zlk1df9j', 'admin@hireease.com', '639fdcc6ff71e7f86b70305da7b0e4cd8f5e73829e24504beae47c89a37ea92a', 'd96952bd4af7d41aac6944ad8fadaffc', 'HireEase Super Admin', 'admin', 'credentials', '2026-10-08T07:21:42.341Z', '2026-10-14T08:23:59.914Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_j7uafx8f', 'candidate@hireease.com', '66d0e1952ffcf26bb99f6cd3b33e81399e24151198e1652e2aa6e1aad5e9b001', '1ab3e69230c1823c9d95e0c3e5d00480', 'Alex Rivera', 'candidate', 'credentials', '2026-10-08T07:21:42.431Z', '2026-10-16T15:01:29.619Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_cb48467c959b', 'sarah@example.com', '8371c11e8672bfc5e397b2e05a49c5bbda9206630667ab8b99193a0df787de05', 'b891a26c1b38bfd3fa0d45295ea3cfdc', 'Sarah Connor', 'candidate', 'credentials', '2026-10-08T07:31:44.002Z', '2026-10-08T07:31:44.002Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_adm_b34554a8b251', 'recruiter@partner.ai', '014a5cf8ec01302a2c2c01c303fcc18e99a5825e1951b5ad395e87f48f39cd53', 'f5c5fecbbb113cc6e91da5e596148df3', 'Recruiter Lead', 'admin', 'credentials', '2026-10-08T07:32:10.541Z', '2026-10-08T07:32:10.541Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_93b76f22f465', 'googleuser@gmail.com', NULL, NULL, 'Google Candidate', 'candidate', 'google', '2026-10-08T07:32:19.406Z', '2026-10-08T07:32:19.406Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_ee92f9d0f5a6', 'googleuser@example.com', NULL, NULL, 'Google Candidate', 'candidate', 'google', '2026-10-08T07:43:36.471Z', '2026-10-08T07:43:36.471Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_21bc004ae280', 'newhire@hireease.com', '633d90ccb029e9a4facd8c893dd3a61c06e005310f420242f987d50fea0b1ac8', '76d0b82b72a85713bb9eaccfa9d6bd16', 'New Hire', 'candidate', 'credentials', '2026-10-08T07:44:17.509Z', '2026-10-08T07:44:17.509Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_adm_adf87775d0b3', 'realadmin@hireease.com', '0371a8e5d996a53938c3ccd803bd6c70785bdf53535554c237fe6a3c6d25ac4a', '7cde91fd3dc707738d8ec114cfd2788a', 'Real Admin', 'admin', 'credentials', '2026-10-08T07:51:15.699Z', '2026-10-08T07:51:15.699Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_5e97fdd36aa9', 'candidate.jane@gmail.com', NULL, NULL, 'Jane Candidate', 'candidate', 'google', '2026-10-08T08:15:31.650Z', '2026-10-08T08:18:03.183Z', 0);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_ea77e384df63', 'dev.candidate@example.com', '97b4c57d19c8606e81706138c691a8418595ba24add832edf0cf7e5b09fbbbbd', '023ca33d9ca3516f100c203ae96b90af', 'Dev Candidate', 'candidate', 'credentials', '2026-10-08T20:23:09.250Z', '2026-10-08T20:23:09.250Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_72e0b0422c57', 'test.candidate.50923248@example.com', '97741a60864b810c7de669d7d5ee148a2e0c518c7d4d8b86fd344a8920cc8926', '6b86b1e7ca2be3d9b70e845276113eaf', 'Test Candidate', 'candidate', 'credentials', '2026-10-08T20:31:32.402Z', '2026-10-08T20:31:32.402Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_6c52eeca3dd7', 'candidate.google@example.com', NULL, NULL, 'GoogleCandidate', 'candidate', 'google', '2026-10-08T20:31:43.035Z', '2026-10-08T20:31:43.035Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_ad144ae8ce70', 'candidate.linkedin@example.com', NULL, NULL, 'LinkedInCandidate', 'candidate', 'linkedin', '2026-10-08T20:31:43.089Z', '2026-10-08T20:31:43.089Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_431f5ae77483', 'johndoe.test@gmail.com', NULL, NULL, 'John Doe', 'candidate', 'google', '2026-10-16T14:53:49.088Z', '2026-10-16T14:53:49.088Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_e5fabc1ac609', 'octocat@github.com', NULL, NULL, 'The Octocat', 'candidate', 'github', '2026-10-16T15:01:39.529Z', '2026-10-16T15:01:39.529Z', 1);
INSERT INTO "users" ("id", "email", "password_hash", "salt", "name", "role", "provider", "created_at", "updated_at", "email_verified") VALUES ('usr_cand_7c19d476402c', 'saurabho7222@gmail.com', NULL, NULL, 'saurabh ojha', 'admin', 'google', '2026-10-16T17:10:02.266Z', '2026-10-16T17:10:02.266Z', 1);

-- Inserts for profiles
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('local_seedy', 'seedy@sites.test', 'Preview Candidate', 'Preview street address', 'Mumbai', 'India', 'B.Tech Computer Science', 'Preview University', '2024', '["Python","English","Writing"]', 'Preview-only engineering and AI evaluation experience.', 'resumes/8552925e-cee3-43a7-bd0a-92049230468f.pdf', 'resume.pdf', '2026-10-07T15:12:32.355Z', '2026-10-07T15:12:32.591Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_j7uafx8f', 'candidate@hireease.com', 'Alex Rivera', '42 Tech Park, Outer Ring Road', 'Bengaluru', 'India', 'B.Tech in Artificial Intelligence', 'National Institute of Technology', '2024', '["Python","PyTorch","Prompt Engineering","Data Evaluation"]', 'Experienced in evaluating large language model responses and developing AI workflow pipelines.', 'resumes/starter-resume.pdf', 'Alex_Rivera_CV.pdf', '2026-10-08T07:21:42.431Z', '2026-10-08T07:58:27.099Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_cb48467c959b', 'sarah@example.com', 'Sarah Connor', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T07:31:44.002Z', '2026-10-08T07:31:44.002Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_93b76f22f465', 'googleuser@gmail.com', 'Google Candidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T07:32:19.406Z', '2026-10-08T07:32:19.406Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_ee92f9d0f5a6', 'googleuser@example.com', 'Google Candidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T07:43:36.471Z', '2026-10-08T07:43:36.471Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_21bc004ae280', 'newhire@hireease.com', 'New Hire', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T07:44:17.509Z', '2026-10-08T07:44:17.509Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_5e97fdd36aa9', 'candidate.jane@gmail.com', 'Jane Candidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T08:15:31.650Z', '2026-10-08T08:15:31.650Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_ea77e384df63', 'dev.candidate@example.com', 'Dev Candidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T20:23:26.344Z', '2026-10-08T20:23:26.344Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_72e0b0422c57', 'test.candidate.50923248@example.com', 'Test Candidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T20:31:32.803Z', '2026-10-08T20:31:32.803Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_6c52eeca3dd7', 'candidate.google@example.com', 'GoogleCandidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T20:31:43.035Z', '2026-10-08T20:31:43.035Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_ad144ae8ce70', 'candidate.linkedin@example.com', 'LinkedInCandidate', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-08T20:31:43.089Z', '2026-10-08T20:31:43.089Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_431f5ae77483', 'johndoe.test@gmail.com', 'John Doe', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-16T14:53:49.088Z', '2026-10-16T14:53:49.088Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_e5fabc1ac609', 'octocat@github.com', 'The Octocat', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-16T15:01:39.529Z', '2026-10-16T15:01:39.529Z');
INSERT INTO "profiles" ("user_id", "email", "name", "address", "city", "country", "education", "institution", "graduation_year", "skills", "experience", "resume_key", "resume_name", "consented_at", "updated_at") VALUES ('usr_cand_7c19d476402c', 'saurabho7222@gmail.com', 'saurabh ojha', '', '', '', '', '', '', '[]', '', NULL, NULL, '2026-10-16T17:10:02.266Z', '2026-10-16T17:10:02.266Z');

-- Inserts for jobs
INSERT INTO "jobs" ("id", "title", "company", "category", "location", "type", "experience", "compensation", "description", "skills", "responsibilities", "status", "created_at", "updated_at") VALUES ('8b80f143-2ba1-4d5f-985d-e9b86b9d92a8', 'Preview Test Role', 'Preview only', 'Engineering', 'Remote', 'Contract', 'Preview experience', 'Not disclosed', 'Local preview-only role to verify recruitment workflow.', '["Python"]', '["Review and build test workflows."]', 'closed', '2026-10-07T15:12:32.811Z', '2026-10-07T15:12:32.975Z');

-- Inserts for applications
INSERT INTO "applications" ("id", "user_id", "job_id", "job_title", "company", "is_sample", "snapshot", "status", "created_at", "updated_at", "updated_by") VALUES ('150b5481-259f-4350-bc2d-16ee9ef2f1a1', 'local_seedy', 'example-engineer', 'AI Software Engineer', 'AI career pathways', 1, '{"user_id":"local_seedy","email":"seedy@sites.test","name":"Preview Candidate","address":"Preview street address","city":"Mumbai","country":"India","education":"B.Tech Computer Science","institution":"Preview University","graduation_year":"2024","skills":"[\"Python\",\"English\",\"Writing\"]","experience":"Preview-only engineering and AI evaluation experience.","resume_key":"resumes/d8ebf717-1f6f-46d8-a736-357db169b720.pdf","resume_name":"resume.pdf","consented_at":"2026-10-07T15:12:32.355Z","updated_at":"2026-10-07T15:12:32.513Z"}', 'submitted', '2026-10-07T15:12:32.563Z', '2026-10-07T15:12:32.563Z', NULL);
INSERT INTO "applications" ("id", "user_id", "job_id", "job_title", "company", "is_sample", "snapshot", "status", "created_at", "updated_at", "updated_by") VALUES ('83882269-f85d-402e-ad8e-bde1a957561c', 'local_seedy', '8b80f143-2ba1-4d5f-985d-e9b86b9d92a8', 'Preview Test Role', 'Preview only', 0, '{"user_id":"local_seedy","email":"seedy@sites.test","name":"Preview Candidate","address":"Preview street address","city":"Mumbai","country":"India","education":"B.Tech Computer Science","institution":"Preview University","graduation_year":"2024","skills":"[\"Python\",\"English\",\"Writing\"]","experience":"Preview-only engineering and AI evaluation experience.","resume_key":"resumes/8552925e-cee3-43a7-bd0a-92049230468f.pdf","resume_name":"resume.pdf","consented_at":"2026-10-07T15:12:32.355Z","updated_at":"2026-10-07T15:12:32.591Z"}', 'interview', '2026-10-07T15:12:32.870Z', '2026-10-07T15:12:32.917Z', 'local_seedy');
INSERT INTO "applications" ("id", "user_id", "job_id", "job_title", "company", "is_sample", "snapshot", "status", "created_at", "updated_at", "updated_by") VALUES ('7e0b3cc0-2438-499d-ad8e-fb33a275095e', 'usr_cand_j7uafx8f', 'example-evaluator', 'AI Model Evaluator', 'AI career pathways', 1, '{"user_id":"usr_cand_j7uafx8f","email":"candidate@hireease.com","name":"Alex Rivera","address":"42 Tech Park, Outer Ring Road","city":"Bengaluru","country":"India","education":"B.Tech in Artificial Intelligence","institution":"National Institute of Technology","graduation_year":"2024","skills":"[\"Python\",\"PyTorch\",\"Prompt Engineering\",\"Data Evaluation\"]","experience":"Experienced in evaluating large language model responses and developing AI workflow pipelines.","resume_key":"resumes/starter-resume.pdf","resume_name":"Alex_Rivera_CV.pdf","consented_at":"2026-10-08T07:21:42.431Z","updated_at":"2026-10-08T07:58:27.099Z"}', 'selected', '2026-10-08T08:17:40.418Z', '2026-10-08T20:49:20.655Z', 'usr_admin_zlk1df9j');

-- Inserts for staff
INSERT INTO "staff" ("id", "user_id", "email", "created_at") VALUES ('owner', 'usr_admin_zlk1df9j', 'admin@hireease.com', '2026-10-07T15:12:32.741Z');

-- Inserts for sessions
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_2b3d1702860e4395972ecf615c829fea', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T07:29:39.284Z', '2026-10-08T07:29:39.284Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_193b713137954ff6bc6a72ce060e391e', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T07:31:31.064Z', '2026-10-08T07:31:31.064Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_f245f7e41d2d4cdbbb731ec9c2001e91', 'usr_cand_cb48467c959b', 'candidate', '2026-11-07T07:31:44.016Z', '2026-10-08T07:31:44.016Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_233be62d07874731b15eb746dbe3c261', 'usr_adm_b34554a8b251', 'admin', '2026-11-07T07:32:10.546Z', '2026-10-08T07:32:10.546Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_1df3b756d9f84e0a9c9429231339dfcb', 'usr_cand_93b76f22f465', 'candidate', '2026-11-07T07:32:19.411Z', '2026-10-08T07:32:19.411Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_9f54b70107824d8aaeddeb892b2d52aa', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T07:35:56.022Z', '2026-10-08T07:35:56.022Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_8910ed8fdcd04bd8bb50ab5d8090286e', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T07:37:56.631Z', '2026-10-08T07:37:56.631Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_fbfe07ffdc5b41d3adba48bbdf21a274', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T07:42:32.603Z', '2026-10-08T07:42:32.603Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_484d515aabf14104a087589ed8f6d5b7', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T07:42:40.166Z', '2026-10-08T07:42:40.166Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_0501ede85524467f81283164ab58caad', 'usr_cand_ee92f9d0f5a6', 'candidate', '2026-11-07T07:43:36.499Z', '2026-10-08T07:43:36.499Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_1e087e24c8f440ad9dde0f741383b851', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T07:43:46.243Z', '2026-10-08T07:43:46.243Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_b3d8eb09273442b2a805bdf7a5dd00de', 'usr_cand_21bc004ae280', 'candidate', '2026-11-07T07:44:17.515Z', '2026-10-08T07:44:17.515Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_7b37dc31d888471c8c276608d36572b0', 'usr_adm_adf87775d0b3', 'admin', '2026-11-07T07:51:15.708Z', '2026-10-08T07:51:15.708Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_e02048f05cef44cdb872176d7e312475', 'usr_cand_5e97fdd36aa9', 'candidate', '2026-11-07T08:15:31.674Z', '2026-10-08T08:15:31.674Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_16a21516cbc3402e81c689eba6294a3a', 'usr_cand_5e97fdd36aa9', 'candidate', '2026-11-07T08:16:08.697Z', '2026-10-08T08:16:08.697Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_cf0ce00759cc4d449df1298944c804cc', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T08:16:30.055Z', '2026-10-08T08:16:30.055Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_e586a099e50d44c3b911e37b9874b0ea', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T08:16:44.872Z', '2026-10-08T08:16:44.872Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_f19847835c0e4139939f3bb428c85ede', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T08:16:45.030Z', '2026-10-08T08:16:45.030Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_59e0b423530240aea93fd646202134ed', 'usr_cand_ea77e384df63', 'candidate', '2026-11-07T20:23:26.353Z', '2026-10-08T20:23:26.353Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_95bd3b2aaf5b434aa450a7b09ff93394', 'usr_cand_72e0b0422c57', 'candidate', '2026-11-07T20:31:32.815Z', '2026-10-08T20:31:32.815Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_ccf233b9b5d7469398225dbce9d897a9', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T20:31:33.177Z', '2026-10-08T20:31:33.177Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_e289fef28e7e46b0b851caecab49b3c8', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T20:31:33.240Z', '2026-10-08T20:31:33.240Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_ee903418ab5a4aaca36130a59373611f', 'usr_cand_6c52eeca3dd7', 'candidate', '2026-11-07T20:31:43.039Z', '2026-10-08T20:31:43.039Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_6d17a48e9af24aa98819ecdf0a98f310', 'usr_cand_ad144ae8ce70', 'candidate', '2026-11-07T20:31:43.093Z', '2026-10-08T20:31:43.093Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_5b1ba7056ae9476cbc49fd469720d04c', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T20:49:00.988Z', '2026-10-08T20:49:00.988Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_c8674641b1b044539e58814ae406ff61', 'usr_cand_j7uafx8f', 'candidate', '2026-11-07T20:49:20.222Z', '2026-10-08T20:49:20.222Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_012102de4ead40979e8eb937ff75e10d', 'usr_admin_zlk1df9j', 'admin', '2026-11-07T20:49:20.349Z', '2026-10-08T20:49:20.349Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_809923f1ef6449c29989865a4423febf', 'usr_cand_431f5ae77483', 'candidate', '2026-11-15T14:53:49.110Z', '2026-10-16T14:53:49.110Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_51bf5771d2544e639889ba8eabc5c2ca', 'usr_cand_e5fabc1ac609', 'candidate', '2026-11-15T15:01:39.536Z', '2026-10-16T15:01:39.536Z');
INSERT INTO "sessions" ("id", "user_id", "role", "expires_at", "created_at") VALUES ('ses_378be752f37948a989fdb0d6a4e6da4d', 'usr_cand_7c19d476402c', 'admin', '2026-11-15T17:10:02.279Z', '2026-10-16T17:10:02.279Z');

-- Inserts for admin_access_requests
INSERT INTO "admin_access_requests" ("id", "user_id", "email", "name", "reason", "status", "created_at", "reviewed_at", "reviewed_by") VALUES ('req_79b30ea438664e06', 'usr_cand_5e97fdd36aa9', 'candidate.jane@gmail.com', 'Jane Candidate', 'Need recruiter access to review applicants', 'approved', '2026-10-08T08:18:02.806Z', '2026-10-08T08:18:02.975Z', 'usr_admin_zlk1df9j');

-- Inserts for outbox_emails
INSERT INTO "outbox_emails" ("id", "recipient_email", "recipient_name", "subject", "text_content", "html_content", "status", "sent_at") VALUES ('eml_ce618484c5ef4f44', 'candidate@hireease.com', 'Alex Rivera', '🎉 Congratulations! Your application for AI Model Evaluator at AI career pathways has been approved', 'Congratulations Alex Rivera!

Your application for AI Model Evaluator at AI career pathways has been approved by the HireEase Recruitment Team.

Next Steps:
Our talent recruiter will reach out within 24-48 hours with interview coordinates.

Track your progress at: http://localhost:5173/dashboard

Ref: #7E0B3CC0

HireEase Services', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Application has been Approved</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 14px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 4px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Application Approved
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Congratulations, Alex Rivera!
        </h2>

        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          We are pleased to inform you that your application for the position of
          <strong style="color: #38bdf8;">AI Model Evaluator</strong> at
          <strong style="color: #ffffff;">AI career pathways</strong> has been reviewed and officially <strong style="color: #4ade80;">APPROVED</strong> by our recruitment leadership team.
        </p>

        <!-- Role Highlights Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1a2744; border-radius: 10px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">
                APPLICATION DETAILS
              </p>
              <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
                AI Model Evaluator
              </p>
              <p style="margin: 0; font-size: 14px; color: #38bdf8;">
                AI career pathways · Ref #7E0B3CC0
              </p>
            </td>
          </tr>
        </table>

        <!-- Next Steps -->
        <div style="background-color: rgba(56, 189, 248, 0.05); border-left: 4px solid #38bdf8; border-radius: 4px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">
            What Happens Next:
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            <li>Our partner recruiter will contact you within <strong>24–48 hours</strong> to coordinate your upcoming interview schedule.</li>
            <li>Keep your contact details and availability up to date on your profile.</li>
            <li>You can review this application anytime in your candidate space.</li>
          </ul>
        </div>

        <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
          <tr>
            <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);">
              <a href="http://localhost:5173/dashboard" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                View Candidate Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">
          © 2026 HireEase Services. Human talent · AI possibilities.
        </p>
        <p style="margin: 0;">
          This message was sent automatically regarding your application ref #7E0B3CC0.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>', 'sent', '2026-10-08T08:17:40.561Z');
INSERT INTO "outbox_emails" ("id", "recipient_email", "recipient_name", "subject", "text_content", "html_content", "status", "sent_at") VALUES ('eml_otp_6d86998c3cc84c', 'dev.candidate@example.com', 'Dev Candidate', 'Your HireEase Verification Code: 528781', 'Hello Dev Candidate,

Your HireEase verification code is: 528781

This code expires in 15 minutes. Enter this code to verify your candidate account.

HireEase Services', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 3px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Candidate Verification
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Verify Your Candidate Account
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hello <strong>Dev Candidate</strong>,<br/>
          Welcome to HireEase Services! Please use the 6-digit verification code below to verify your email and activate your candidate profile:
        </p>

        <!-- OTP Code Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 24px;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px;">
                VERIFICATION CODE
              </div>
              <div style="font-family: ''SF Mono'', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; padding: 4px 0;">
                528781
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                Valid for 15 minutes · Do not share with anyone
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
          If you did not initiate this candidate registration, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        © 2026 HireEase Services · Human talent. AI possibilities.
      </td>
    </tr>
  </table>
</body>
</html>', 'sent', '2026-10-08T20:23:09.304Z');
INSERT INTO "outbox_emails" ("id", "recipient_email", "recipient_name", "subject", "text_content", "html_content", "status", "sent_at") VALUES ('eml_otp_ea1c7851a9e547', 'dev.candidate@example.com', 'Dev Candidate', 'Your HireEase Verification Code: 811706', 'Hello Dev Candidate,

Your HireEase verification code is: 811706

This code expires in 15 minutes. Enter this code to verify your candidate account.

HireEase Services', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 3px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Candidate Verification
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Verify Your Candidate Account
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hello <strong>Dev Candidate</strong>,<br/>
          Welcome to HireEase Services! Please use the 6-digit verification code below to verify your email and activate your candidate profile:
        </p>

        <!-- OTP Code Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 24px;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px;">
                VERIFICATION CODE
              </div>
              <div style="font-family: ''SF Mono'', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; padding: 4px 0;">
                811706
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                Valid for 15 minutes · Do not share with anyone
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
          If you did not initiate this candidate registration, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        © 2026 HireEase Services · Human talent. AI possibilities.
      </td>
    </tr>
  </table>
</body>
</html>', 'sent', '2026-10-08T20:23:09.426Z');
INSERT INTO "outbox_emails" ("id", "recipient_email", "recipient_name", "subject", "text_content", "html_content", "status", "sent_at") VALUES ('eml_otp_5165012f955d4a', 'test.candidate.50923248@example.com', 'Test Candidate', 'Your HireEase Verification Code: 359083', 'Hello Test Candidate,

Your HireEase verification code is: 359083

This code expires in 15 minutes. Enter this code to verify your candidate account.

HireEase Services', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 3px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Candidate Verification
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Verify Your Candidate Account
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hello <strong>Test Candidate</strong>,<br/>
          Welcome to HireEase Services! Please use the 6-digit verification code below to verify your email and activate your candidate profile:
        </p>

        <!-- OTP Code Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 24px;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px;">
                VERIFICATION CODE
              </div>
              <div style="font-family: ''SF Mono'', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; padding: 4px 0;">
                359083
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                Valid for 15 minutes · Do not share with anyone
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
          If you did not initiate this candidate registration, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        © 2026 HireEase Services · Human talent. AI possibilities.
      </td>
    </tr>
  </table>
</body>
</html>', 'sent', '2026-10-08T20:31:32.462Z');
INSERT INTO "outbox_emails" ("id", "recipient_email", "recipient_name", "subject", "text_content", "html_content", "status", "sent_at") VALUES ('eml_otp_c1107c8f6d164b', 'test.candidate.50923248@example.com', 'Test Candidate', 'Your HireEase Verification Code: 359083', 'Hello Test Candidate,

Your HireEase verification code is: 359083

This code expires in 15 minutes. Enter this code to verify your candidate account.

HireEase Services', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 13px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 3px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Candidate Verification
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Verify Your Candidate Account
        </h2>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hello <strong>Test Candidate</strong>,<br/>
          Welcome to HireEase Services! Please use the 6-digit verification code below to verify your email and activate your candidate profile:
        </p>

        <!-- OTP Code Box -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1e293b; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 24px;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 8px;">
                VERIFICATION CODE
              </div>
              <div style="font-family: ''SF Mono'', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; padding: 4px 0;">
                359083
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                Valid for 15 minutes · Do not share with anyone
              </div>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
          If you did not initiate this candidate registration, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        © 2026 HireEase Services · Human talent. AI possibilities.
      </td>
    </tr>
  </table>
</body>
</html>', 'sent', '2026-10-08T20:31:32.647Z');
INSERT INTO "outbox_emails" ("id", "recipient_email", "recipient_name", "subject", "text_content", "html_content", "status", "sent_at") VALUES ('eml_fe1f50286d3448b4', 'candidate@hireease.com', 'Alex Rivera', '🎉 Congratulations! Your application for AI Model Evaluator at AI career pathways has been approved', 'Congratulations Alex Rivera!

Your application for AI Model Evaluator at AI career pathways has been approved by the HireEase Recruitment Team.

Next Steps:
Our talent recruiter will reach out within 24-48 hours with interview coordinates.

Track your progress at: http://localhost:5173/dashboard

Ref: #7E0B3CC0

HireEase Services', '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your HireEase Application has been Approved</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #050914; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; color: #f0f4fc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0b1329; border-radius: 14px; border: 1px solid #1a2744; overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #162444; background: linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%);">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                Hire<span style="color: #38bdf8;">Ease</span> <span style="font-size: 14px; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 4px;">Services</span>
              </h1>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 5px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Application Approved
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
          Congratulations, Alex Rivera!
        </h2>

        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          We are pleased to inform you that your application for the position of
          <strong style="color: #38bdf8;">AI Model Evaluator</strong> at
          <strong style="color: #ffffff;">AI career pathways</strong> has been reviewed and officially <strong style="color: #4ade80;">APPROVED</strong> by our recruitment leadership team.
        </p>

        <!-- Role Highlights Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0; background-color: #070d1e; border: 1px solid #1a2744; border-radius: 10px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">
                APPLICATION DETAILS
              </p>
              <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
                AI Model Evaluator
              </p>
              <p style="margin: 0; font-size: 14px; color: #38bdf8;">
                AI career pathways · Ref #7E0B3CC0
              </p>
            </td>
          </tr>
        </table>

        <!-- Next Steps -->
        <div style="background-color: rgba(56, 189, 248, 0.05); border-left: 4px solid #38bdf8; border-radius: 4px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">
            What Happens Next:
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            <li>Our partner recruiter will contact you within <strong>24–48 hours</strong> to coordinate your upcoming interview schedule.</li>
            <li>Keep your contact details and availability up to date on your profile.</li>
            <li>You can review this application anytime in your candidate space.</li>
          </ul>
        </div>

        <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
          <tr>
            <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);">
              <a href="http://localhost:5173/dashboard" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                View Candidate Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #060b18; border-top: 1px solid #162444; font-size: 12px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">
          © 2026 HireEase Services. Human talent · AI possibilities.
        </p>
        <p style="margin: 0;">
          This message was sent automatically regarding your application ref #7E0B3CC0.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>', 'sent', '2026-10-08T20:49:20.660Z');

