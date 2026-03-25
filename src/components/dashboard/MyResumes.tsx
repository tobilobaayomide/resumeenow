import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/useAuth';
import { useResumes } from '../../hooks/useResumes';
import { useMyResumesView } from '../../hooks/dashboard';
import { getErrorMessage } from '../../lib/errors';
import type { ResumeRecord } from '../../types/resume';
import {
  MyResumesGridView,
  MyResumesHeader,
  MyResumesListView,
  MyResumesToolbar,
  ResumeActionSheet,
} from './my-resumes';

const MyResumes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resumes, loading, deleteResume } = useResumes(user?.id);
  const [activeResumeMenu, setActiveResumeMenu] = useState<ResumeRecord | null>(null);

  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredResumes,
  } = useMyResumesView(resumes);

  const openCreateResume = () => {
    navigate('/builder/new?template=executive');
  };

  const confirmDelete = (id: string) => {
    toast('Are you sure you want to delete this resume?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteResume(id);
            toast.success('Resume deleted successfully!');
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

  const openResume = (resume: ResumeRecord) => {
    navigate(`/builder/${resume.id}?template=${resume.template_id || 'executive'}`);
  };

  const duplicateResume = (resume: ResumeRecord) => {
    const duplicateTitle = `${resume.title || 'Untitled Resume'} (Copy)`;
    navigate(
      `/builder/new?template=${resume.template_id || 'executive'}&title=${encodeURIComponent(
        duplicateTitle,
      )}`,
      {
        state: {
          importedResumeData: resume.content,
          importedTitle: duplicateTitle,
        },
      },
    );
    toast.success('Duplicate opened in builder.');
  };

  const showEmptyState = !loading && filteredResumes.length === 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        <MyResumesHeader
          resumeCount={filteredResumes.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateResume={openCreateResume}
        />

        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 overflow-y-auto pb-24 md:pb-10">
          <div className="w-full mx-auto">
            <MyResumesToolbar
              viewMode={viewMode}
              sortBy={sortBy}
              onViewModeChange={setViewMode}
              onSortByChange={setSortBy}
            />

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="aspect-[1/1.41] bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : showEmptyState ? (
              <div className="h-[50vh] border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <FiFileText size={24} className="text-gray-300" />
                </div>
                <h2 className="text-base md:text-lg font-medium text-black">No documents found</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-xs mb-6">
                  Create a new resume to start building your professional profile.
                </p>
                <button
                  onClick={openCreateResume}
                  className="px-5 md:px-6 py-2 bg-black text-white text-xs md:text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
                >
                  Create New Resume
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <MyResumesGridView
                resumes={filteredResumes}
                onOpenResume={openResume}
                onDeleteResume={confirmDelete}
                onOpenActionMenu={setActiveResumeMenu}
                onCreateResume={openCreateResume}
              />
            ) : (
              <MyResumesListView
                resumes={filteredResumes}
                onOpenResume={openResume}
                onDeleteResume={confirmDelete}
                onOpenActionMenu={setActiveResumeMenu}
              />
            )}
          </div>
        </main>
      </div>

      <ResumeActionSheet
        resume={activeResumeMenu}
        onClose={() => setActiveResumeMenu(null)}
        onOpenResume={openResume}
        onDuplicateResume={duplicateResume}
        onDeleteResume={confirmDelete}
      />
    </div>
  );
};

export default MyResumes;
