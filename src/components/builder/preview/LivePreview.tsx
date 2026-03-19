import React from 'react';
import { HtmlTemplateDocument } from './HtmlTemplateDocument';
import type { LivePreviewProps } from '../../../types/builder';

const LivePreview: React.FC<LivePreviewProps> = ({
  data,
  zoom = 0.8,
  templateId = 'executive',
  allowPan = false,
}) => (
  <div className={`${allowPan ? 'w-max min-w-full lg:w-full' : 'w-full'} bg-[#525659]`}>
    <div
      className={`relative flex flex-col ${allowPan ? 'items-start lg:items-center' : 'items-center'} py-8`}
    >
      <HtmlTemplateDocument
        data={data}
        templateId={templateId}
        zoom={zoom}
        withShadow
      />
    </div>
  </div>
);

export default LivePreview;
