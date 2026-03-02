import React from 'react';
import { useBuilderPageController } from '../../hooks/builder';
import { BuilderAiWorkflowModal, BuilderHeader, BuilderWorkspace } from './page';

const BuilderPage: React.FC = () => {
  const { headerProps, workspaceProps, aiModalProps } = useBuilderPageController();

  return (
    <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white print:block">
      <BuilderHeader {...headerProps} />
      <BuilderWorkspace {...workspaceProps} />
      <BuilderAiWorkflowModal {...aiModalProps} />
    </div>
  );
};

export default BuilderPage;
