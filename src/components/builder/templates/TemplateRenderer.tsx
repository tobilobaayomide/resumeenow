import React from 'react';
import ExecutiveTemplate from './ExecutiveTemplate';
import StudioTemplate from './StudioTemplate';
import SiliconTemplate from './SiliconTemplate';
import MonoTemplate from './MonoTemplate';
import AtsTemplate from './AtsTemplate';
import type { TemplateRendererProps } from '../../../types/builder';

const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateId,
  data,
  contentRef,
  aiHighlights,
}) => {

  switch (templateId) {
    case 'executive':
      return <ExecutiveTemplate data={data} contentRef={contentRef} aiHighlights={aiHighlights} />;
    case 'studio':
      return <StudioTemplate data={data} contentRef={contentRef} aiHighlights={aiHighlights} />;
    case 'silicon':
      return <SiliconTemplate data={data} contentRef={contentRef} aiHighlights={aiHighlights} />;
    case 'mono':
      return <MonoTemplate data={data} contentRef={contentRef} aiHighlights={aiHighlights} />;
    case 'ats':
      return <AtsTemplate data={data} contentRef={contentRef} aiHighlights={aiHighlights} />;
    default:
      return <ExecutiveTemplate data={data} contentRef={contentRef} aiHighlights={aiHighlights} />;
  }
};

export default TemplateRenderer;
