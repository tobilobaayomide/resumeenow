import React, { useEffect, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from '../pdf/PDFDocument';
import type { LivePreviewProps } from '../../../types/builder';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const A4_WIDTH_PX = 794;

const PDFPageCanvas: React.FC<{
  pdf: pdfjs.PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
}> = ({ pdf, pageNumber, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const dpi = window.devicePixelRatio * 2;
      const viewport = page.getViewport({ scale: dpi });

      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      await page.render({ canvasContext: offCtx, viewport, canvas: offscreen }).promise;
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpi}px`;
      canvas.style.height = `${viewport.height / dpi}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(offscreen, 0, 0);
    };

    render();
    return () => { cancelled = true; };
  }, [pdf, pageNumber]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        marginBottom: zoom < 1 ? `${A4_WIDTH_PX * zoom - A4_WIDTH_PX}px` : 0,
      }}
      className="bg-white shadow-2xl"
    />
  );
};

const LivePreview: React.FC<LivePreviewProps> = ({
  data,
  zoom = 0.8,
  templateId = 'executive',
}) => {
  const doc = React.useMemo(
    () => <PDFDocument data={data} templateId={templateId} />,
    [data, templateId],
  );

  const [instance, update] = usePDF({ document: doc });
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    update(doc);
  }, [doc]);

  useEffect(() => {
    if (!instance.url) return;

    let cancelled = false;
    let loadingTask: pdfjs.PDFDocumentLoadingTask | null = null;

    const load = async () => {
      try {
        // Fetch the blob into an ArrayBuffer immediately while the URL is
        // still valid — pdfjs then works from memory, not the blob URL,
        // so revocation of the URL after this point doesn't matter.
        const response = await fetch(instance.url!);
        if (cancelled) return;

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjs.getDocument({ data: buffer });
        const loaded = await loadingTask.promise;
        if (cancelled) {
          loaded.destroy();
          return;
        }

        // Destroy previous pdf before replacing
        setPdf((prev) => {
          prev?.destroy();
          return loaded;
        });
        setIsFirstLoad(false);
      } catch (err) {
        if (!cancelled) console.error('Failed to load PDF preview:', err);
      }
    };

    load();

    return () => {
      cancelled = true;
      loadingTask?.destroy().catch(() => {});
    };
  }, [instance.url]);

  if (isFirstLoad && (instance.loading || !pdf)) {
    return (
      <div className="w-full bg-[#525659] flex items-center justify-center py-8">
        <div
          style={{ width: A4_WIDTH_PX * zoom, height: 400 }}
          className="bg-white shadow-2xl flex items-center justify-center text-gray-400 text-sm"
        >
          Generating preview…
        </div>
      </div>
    );
  }

  if (instance.error) {
    return <div className="text-red-400 text-sm">Failed to render PDF</div>;
  }

  return (
    <div className="w-full bg-[#525659]">
      <div className="flex flex-col items-center py-8 gap-6">
        {Array.from({ length: pdf!.numPages }, (_, i) => (
          <PDFPageCanvas
            key={i}
            pdf={pdf!}
            pageNumber={i + 1}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
};

export default LivePreview;