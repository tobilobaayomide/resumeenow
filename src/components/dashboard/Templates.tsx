import React from 'react';
import { useTemplatesController } from '../../hooks/dashboard';
import Sidebar from './Sidebar';
import {
  TemplatesCategoryFilters,
  TemplatesGallery,
  TemplatesHeader,
  TemplatesPreviewModal,
} from './template-gallery';

const Templates: React.FC = () => {
  const {
    activeWaitlist,
    selectedCategory,
    searchQuery,
    previewTemplate,
    filteredTemplates,
    showComingSoonCard,
    setSelectedCategory,
    setSearchQuery,
    openTemplatePreview,
    closeTemplatePreview,
    clearFilters,
    joinWaitlist,
    useTemplate: applyTemplate,
  } = useTemplatesController();

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        <TemplatesHeader
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 overflow-y-auto pb-24 md:pb-10">
          <div className="w-full mx-auto">
            <TemplatesCategoryFilters
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <TemplatesGallery
              templates={filteredTemplates}
              showComingSoonCard={showComingSoonCard}
              activeWaitlist={activeWaitlist}
              onOpenTemplatePreview={openTemplatePreview}
              onJoinWaitlist={joinWaitlist}
              onClearFilters={clearFilters}
            />
          </div>
        </main>
      </div>

      <TemplatesPreviewModal
        previewTemplate={previewTemplate}
        onClose={closeTemplatePreview}
        onUseTemplate={(template) => {
          const used = applyTemplate(template);
          if (used) {
            closeTemplatePreview();
          }
        }}
      />
    </div>
  );
};

export default Templates;
