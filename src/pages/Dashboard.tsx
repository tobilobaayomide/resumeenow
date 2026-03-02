import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DashboardView from '../components/dashboard/DashboardView';
import { useAuth } from '../context/useAuth';
import { useResumes } from '../hooks/useResumes';
import { getErrorMessage } from '../lib/errors';
import type { TemplateId } from '../types/resume';

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { resumes, loading: resumesLoading, deleteResume, refreshResumes } = useResumes(user?.id);

  const username =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      void refreshResumes().catch(() => {
        // errors are surfaced by the hook via state
      });
    }
  }, [user, refreshResumes]);

  const handleCreateResume = (templateId: TemplateId) => {
    navigate(`/builder/new?template=${templateId}`);
  };

  const handleDeleteResume = async (id: string) => {
    toast('Are you sure you want to delete this resume?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteResume(id);
            toast.success('Resume deleted successfully.');
          } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to delete resume.'));
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleUploadResume = async (file: File, templateId: TemplateId) => {
    const loadingToast = toast.loading('Parsing resume...');
    try {
      const { parseResumeFile } = await import('../lib/resumeParser');
      const { data, suggestedTitle } = await parseResumeFile(file);
      toast.dismiss(loadingToast);
      toast.success('Resume parsed. Review and adjust before saving.');
      navigate(`/builder/new?template=${templateId}&title=${encodeURIComponent(suggestedTitle)}`, {
        state: {
          importedResumeData: data,
          importedTitle: suggestedTitle,
        },
      });
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      toast.error(getErrorMessage(error, 'Failed to parse uploaded resume.'));
    }
  };

  if (authLoading) return null;

  return (
    <DashboardView
      resumes={resumes}
      isLoading={resumesLoading}
      onCreateResume={handleCreateResume}
      onDeleteResume={handleDeleteResume}
      onUploadResume={handleUploadResume}
      username={username}
    />
  );
};

export default Dashboard;
