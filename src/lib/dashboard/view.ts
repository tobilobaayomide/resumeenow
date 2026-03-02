import type { DashboardResumeStatus } from '../../types/dashboard';
import type { ResumeRecord } from '../../types/resume';

export const getDashboardGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const getDashboardDateLabel = (date: Date = new Date()): string =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

export const getDashboardResumeStatus = (
  resume: ResumeRecord,
  lastExportResumeId: string | null,
): DashboardResumeStatus => {
  if (lastExportResumeId === resume.id) {
    return { label: 'Exported', tone: 'bg-black text-white border-black' };
  }

  const summary = typeof resume.content?.summary === 'string' ? resume.content.summary : '';
  const isTailored = summary.toLowerCase().includes('targeting ');
  if (isTailored) {
    return { label: 'Tailored', tone: 'bg-gray-900 text-white border-gray-900' };
  }

  return { label: 'Draft', tone: 'bg-gray-50 text-gray-600 border-gray-200' };
};
