import React from 'react';
import ExecutiveTemplate from './ExecutiveTemplate';
import StudioTemplate from './StudioTemplate';
import SiliconTemplate from './SiliconTemplate';
import MonoTemplate from './MonoTemplate';

interface TemplateRendererProps {
  templateId: string;
  data: any;
  contentRef?: React.RefObject<HTMLDivElement>;
}

const TemplateRenderer: React.FC<TemplateRendererProps> = ({ templateId, data, contentRef }) => {

  switch (templateId) {
    case 'executive':
      return <ExecutiveTemplate data={data} contentRef={contentRef} />;
    case 'studio':
      return <StudioTemplate data={data} contentRef={contentRef} />;
    case 'silicon':
      return <SiliconTemplate data={data} contentRef={contentRef} />;
    case 'mono':
      return <MonoTemplate data={data} contentRef={contentRef} />;
    default:
      return <ExecutiveTemplate data={data} contentRef={contentRef} />;
  }
};

export default TemplateRenderer;