import React from 'react';
import { useBuilderPageController } from '../../hooks/builder';
import { BuilderAiWorkflowModal, BuilderHeader, BuilderWorkspace } from './page';

const BuilderPage: React.FC = () => {
  const { headerProps, workspaceProps, aiModalProps } = useBuilderPageController();
  const isMobilePreview = workspaceProps.mobileView === 'preview';

  return (
    <div
      className={`
        flex flex-col bg-[#F3F4F6] font-sans
        ${isMobilePreview ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh] overflow-visible'}
        md:h-screen md:overflow-hidden
        print:block print:h-auto print:overflow-visible print:bg-white
      `}
    >
      <BuilderHeader {...headerProps} />
      <BuilderWorkspace {...workspaceProps} />
      <BuilderAiWorkflowModal {...aiModalProps} />
    </div>
  );
};

export default BuilderPage;
