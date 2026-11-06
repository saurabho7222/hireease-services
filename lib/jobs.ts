export type Job = {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  type: string;
  experience: string;
  compensation: string;
  description: string;
  skills: string[];
  responsibilities: string[];
  isSample: boolean;
  status: string;
  createdAt: string;
  platform?: string;
  highDemand?: boolean;
  urgent?: boolean;
  payRate?: string;
  matchReason?: string;
  externalUrl?: string;
};

export const trackedPlatforms = [
  'micro1.',
  'Mercor',
  'sme.careers',
  'Labelbox',
  'xAI',
  'Alignerr',
  'Anthropic',
  'Scale AI',
  'ElevenLabs',
  'Turing',
  'Invisible Tech',
  'Outlier',
  'DataAnnotation.tech',
  'Mindrift',
  'Harvey AI'
];

export function getCompanyLogo(company?: string): string {
  const c = (company || '').toLowerCase().trim();
  if (c.includes('micro1')) return '/logos/micro1.svg';
  if (c.includes('mercor')) return '/logos/mercor.svg';
  if (c.includes('sme')) return '/logos/sme.svg';
  if (c.includes('turing')) return '/logos/turing.svg';
  if (c.includes('labelbox')) return '/logos/labelbox.svg';
  if (c.includes('scale')) return '/logos/scaleai.svg';
  if (c.includes('elevenlabs')) return '/logos/ElevenLabs.svg';
  if (c.includes('alignerr')) return '/logos/alignerr.png';
  if (c.includes('anthropic')) return '/logos/anthropic.svg';
  if (c.includes('xai')) return '/logos/xai-mark.svg';
  if (c.includes('outlier')) return '/logos/outlier.svg';
  if (c.includes('invisible')) return '/logos/invisible.svg';
  if (c.includes('dataannotation')) return '/logos/dataannotation.svg';
  if (c.includes('mindrift')) return '/logos/mindrift.svg';
  if (c.includes('harvey')) return '/logos/harvey.svg';
  return '/logos/micro1.svg';
}

export function getCompanyDisplayName(company?: string): string {
  const c = (company || '').toLowerCase().trim();
  if (c.includes('micro1')) return 'micro1';
  if (c.includes('mercor')) return 'Mercor';
  if (c.includes('sme')) return 'SME Careers';
  if (c.includes('turing')) return 'Turing';
  if (c.includes('labelbox')) return 'Labelbox';
  if (c.includes('scale')) return 'Scale AI';
  if (c.includes('elevenlabs')) return 'ElevenLabs';
  if (c.includes('alignerr')) return 'Alignerr';
  if (c.includes('anthropic')) return 'Anthropic';
  if (c.includes('xai')) return 'xAI';
  if (c.includes('outlier')) return 'Outlier';
  if (c.includes('invisible')) return 'Invisible Tech';
  if (c.includes('dataannotation')) return 'DataAnnotation';
  if (c.includes('mindrift')) return 'Mindrift';
  if (c.includes('harvey')) return 'Harvey AI';
  return company || 'Partner Platform';
}

export const partners = trackedPlatforms;

export const categories = [
  'All roles',
  'Healthcare',
  'Legal',
  'Finance',
  'Languages',
  'Coding',
  'Science',
  'Data Annotation & RLHF'
];

export const expertiseProfiles = [
  {
    id: 'finance',
    name: 'Finance',
    roles: 'Accountants, analysts and financial professionals',
    description: 'Verify financial modeling, balance sheet calculations, DCF analyses, and market evaluation logic.',
    pay: '$45 - $95/hr',
    icon: 'TrendingUp',
    skills: ['Financial Modeling', 'DCF Valuation', 'Accounting Standards', 'Taxation', 'Corporate Finance'],
    bgImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'languages',
    name: 'Languages',
    roles: 'Translators, linguists and bilingual experts',
    description: 'Grade translation quality, assess localized idioms, evaluate cultural appropriateness and tone.',
    pay: '$20 - $50/hr',
    icon: 'Languages',
    skills: ['Native Fluency', 'Localization', 'Cultural Nuance', 'Grammar', 'Audio Transcription'],
    bgImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'coding',
    name: 'Coding',
    roles: 'Software engineers, ML developers and code reviewers',
    description: 'Audit AI code solutions, write rigorous unit test suites, and benchmark multi-turn agent debugging.',
    pay: '$45 - $105/hr',
    icon: 'Code2',
    skills: ['Python', 'TypeScript', 'Algorithms', 'Unit Testing', 'Code Debugging'],
    bgImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'science',
    name: 'Science',
    roles: 'PhDs, researchers and STEM problem solvers',
    description: 'Fact-check complex scientific derivations, mathematical proofs, and experimental design outputs.',
    pay: '$50 - $110/hr',
    icon: 'Atom',
    skills: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Scientific Derivations'],
    bgImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'annotation',
    name: 'Data Annotation',
    roles: 'Quality raters, RLHF evaluators and content specialists',
    description: 'Rank prompt responses, grade adherence to safety guidelines, tag multimodal media, and annotate bounding boxes.',
    pay: '$18 - $35/hr',
    icon: 'Sparkles',
    skills: ['Prompt Evaluation', 'RLHF Rating', 'Attention to Detail', 'Guideline Adherence', 'Quality Review'],
    bgImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    roles: 'Doctors, nurses, pharmacists & medical researchers',
    description: 'Evaluate medical AI responses, audit clinical reasoning, and flag pharmacological hallucinations.',
    pay: '$60 - $120/hr',
    icon: 'Stethoscope',
    skills: ['Clinical Review', 'Pharmacology', 'Medical Terminology', 'Diagnostics', 'Patient Safety'],
    bgImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'legal',
    name: 'Legal',
    roles: 'Attorneys, legal researchers & compliance officers',
    description: 'Review contract analyses, statutory interpretations, case law citations, and regulatory reasoning.',
    pay: '$70 - $130/hr',
    icon: 'Scale',
    skills: ['Contract Review', 'Statutory Interpretation', 'Case Law', 'Compliance', 'Legal Drafting'],
    bgImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'
  }
];
// Clean role feed: empty by default so only roles created by recruiter in admin panel appear
export const sampleJobs: Job[] = [];

export type InHouseProject = {
  id: string;
  title: string;
  client: string;
  domain: string;
  payout: string;
  estimatedHours: string;
  duration: string;
  status: string;
  requiredSkills: string[];
  description: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

// Clean in-house projects: loaded dynamically from database (admin managed)
export const internalProjects: InHouseProject[] = [];

export const practiceLabQuestions = [
  {
    id: 1,
    prompt: 'User: "Can I take Ibuprofen and Naproxen together for severe headache pain?"',
    modelResponseA: 'Yes, taking both together will provide faster relief because they attack headache pain through slightly different pathways.',
    modelResponseB: 'No, you should not take Ibuprofen and Naproxen together. Both are nonsteroidal anti-inflammatory drugs (NSAIDs). Combining them increases your risk of serious gastrointestinal bleeding and kidney injury without providing additional pain relief.',
    correctChoice: 'B',
    explanation: 'Response B is medically accurate. Combining two NSAIDs provides no clinical advantage and significantly heightens gastric irritation and ulcer risk. Response A contains a dangerous clinical hallucination.'
  },
  {
    id: 2,
    prompt: 'User: "Write a Python function to safely fetch user data by ID from SQLite without SQL injection."',
    modelResponseA: 'def get_user(db, user_id):\n    return db.execute(f"SELECT * FROM users WHERE id = {user_id}").fetchone()',
    modelResponseB: 'def get_user(db, user_id):\n    return db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()',
    correctChoice: 'B',
    explanation: 'Response B uses parameterized queries with parameter substitution (?), completely preventing SQL injection. Response A directly interpolates strings, creating a severe vulnerability.'
  },
  {
    id: 3,
    prompt: 'User: "Summarize this NDA clause: The Recipient shall hold Confidential Information in strict confidence for 5 years, except trade secrets which shall be held in perpetuity."',
    modelResponseA: 'All confidential information and trade secrets expire after 5 years, after which the recipient is free to disclose them.',
    modelResponseB: 'Standard confidential information must remain confidential for 5 years, but trade secrets must be protected indefinitely without any time expiration.',
    correctChoice: 'B',
    explanation: 'Response B correctly captures the critical carveout for trade secrets ("in perpetuity" = indefinitely).'
  }
];

export function matchingSkills(job: Job, skills: string[]) {
  if (!skills || !skills.length) return [];
  const normalized = skills.map(s => s.toLowerCase().trim()).filter(Boolean);
  return job.skills.filter(r =>
    normalized.some(s =>
      s.length > 2 && (r.toLowerCase().includes(s) || s.includes(r.toLowerCase()))
    )
  );
}
