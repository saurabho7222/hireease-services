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
  resumeUrl?: string | null;
  hasResume: boolean;
  updatedAt: string;
  phone?: string;
};

export type ApplicationStatus =
  | 'clicked_apply'
  | 'redirected'
  | 'awaiting_confirmation'
  | 'submitted'
  | 'assessment'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'selected'
  | 'hired'
  | 'rejected'
  | 'pending'
  | 'review'
  | 'under_review'
  | 'interview_done'
  | 'approved'
  | 'not_selected';

export type StatusHistoryEvent = {
  status: string;
  timestamp: string;
  title: string;
  note?: string;
  actor?: 'candidate' | 'admin' | 'system';
  actorEmail?: string;
  interviewDate?: string;
};

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
  externalUrl?: string;
  platform?: string;
  statusHistory?: StatusHistoryEvent[];
  interviewDate?: string;
};

export const statusLabels: Record<string, string> = {
  clicked_apply: 'Clicked Apply (Redirected)',
  redirected: 'Clicked Apply (Redirected)',
  awaiting_confirmation: 'Awaiting External Confirmation',
  pending: 'Awaiting External Confirmation',
  submitted: 'Application Submitted & Verified',
  review: 'Under Review',
  under_review: 'Under Review',
  assessment: 'Assessment Stage',
  interview_scheduled: 'Interview Scheduled',
  interview: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  interview_done: 'Interview Completed',
  selected: 'Selected / Offer Received',
  approved: 'Selected / Offer Received',
  hired: 'Selected & Hired',
  rejected: 'Rejected',
  not_selected: 'Not Selected'
};

export const selectableAdminStatuses = [
  { value: 'clicked_apply', label: 'Clicked Apply (Redirected)', icon: '🔗', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  { value: 'awaiting_confirmation', label: 'Awaiting External Confirmation', icon: '⏳', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  { value: 'submitted', label: 'Application Submitted & Verified', icon: '📝', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  { value: 'assessment', label: 'Assessment Stage', icon: '🧠', color: '#7c3aed', bg: '#f3e8ff', border: '#e9d5ff' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', icon: '📅', color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe' },
  { value: 'interview_completed', label: 'Interview Completed', icon: '🎙️', color: '#6366f1', bg: '#eef2ff', border: '#e0e7ff' },
  { value: 'selected', label: 'Selected / Offer', icon: '🎉', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  { value: 'rejected', label: 'Rejected', icon: '❌', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' }
];
