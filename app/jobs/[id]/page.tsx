import { notFound } from 'next/navigation';
import { db, jobRow } from '@/lib/server';
import { sampleJobs, type Job } from '@/lib/jobs';
import JobDetailClient from './job-detail-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = sampleJobs.find(j => j.id === id);
  const row = sample || await db().prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first<any>();
  if (!row) {
    return { title: 'Job Not Found | HireEase Services' };
  }
  const job = sample || jobRow(row);
  return {
    title: `${job.title} | ${job.company} | HireEase Services`,
    description: job.description.slice(0, 160)
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = sampleJobs.find(j => j.id === id);
  let job: Job | null = sample || null;

  if (!job) {
    try {
      const row = await db().prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first<any>();
      if (row) {
        job = jobRow(row);
      }
    } catch (err) {
      console.error('Error fetching job by id:', err);
    }
  }

  if (!job) {
    notFound();
  }

  return <JobDetailClient initialJob={job} />;
}
