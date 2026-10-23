export type Profile = {
  userId: string;
  email: string;
  name: string;
  address: string;
  city: string;
  country: string;
  education: string;
  institution: string;
  graduationYear: string;
  skills: string[];
  experience: string;
  resumeName: string | null;
  hasResume: boolean;
  updatedAt: string;
  phone?: string;
};

export type ApplicationStatus =
  | 'pending'
  | 'submitted'
  | 'review'
  | 'under_review'
  | 'interview_scheduled'
  | 'interview'
  | 'interview_done'
  | 'approved'
  | 'selected'
  | 'hired'
  | 'rejected'
  | 'not_selected';

export type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  isSample: boolean;
  status: string;
  notes?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
};

export const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Pending',
  review: 'Under Review',
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  interview: 'Interview Scheduled',
  interview_done: 'Interview Done',
  approved: 'Approved',
  selected: 'Approved',
  hired: 'Hired / Offered',
  rejected: 'Rejected',
  not_selected: 'Not Selected'
};

export const selectableAdminStatuses = [
  { value: 'pending', label: 'Pending', icon: '⏳', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  { value: 'review', label: 'Under Review', icon: '🔍', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', icon: '📅', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
  { value: 'interview_done', label: 'Interview Done', icon: '🎙️', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  { value: 'approved', label: 'Approved', icon: '✅', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  { value: 'hired', label: 'Hired / Offered', icon: '🎉', color: '#047857', bg: '#d1fae5', border: '#a7f3d0' },
  { value: 'rejected', label: 'Rejected', icon: '❌', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' }
];
