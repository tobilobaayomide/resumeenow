import React, { useEffect, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from '../pdf/PDFDocument';
import type { LivePreviewProps } from '../../../types/builder';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const A4_WIDTH_PX = 794;

const getPreviewRenderScale = (): number => {
  const deviceScale = window.devicePixelRatio || 1;
  const isMobileViewport = window.innerWidth < 1024;
  return isMobileViewport ? Math.min(deviceScale, 1) : Math.min(deviceScale, 2);
};

const PDFPageCanvas: React.FC<{
  pdf: pdfjs.PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
}> = ({ pdf, pageNumber, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjs.RenderTask | null = null;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const renderScale = getPreviewRenderScale();
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / renderScale}px`;
        canvas.style.height = `${viewport.height / renderScale}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
      } catch (error) {
        if (
          !cancelled &&
          !(error instanceof Error && error.name === 'RenderingCancelledException')
        ) {
          console.error(`Failed to render preview page ${pageNumber}:`, error);
        }
      }
    };

    void render();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
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
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    update(doc);
  }, [doc]);

  useEffect(() => {
    setPreviewError(null);
    setIsFirstLoad(true);
  }, [doc]);

  useEffect(() => {
    if (!instance.url) return;

    let cancelled = false;
    let loadingTask: pdfjs.PDFDocumentLoadingTask | null = null;

    const load = async () => {
      try {
        setPreviewError(null);

        const response = await fetch(instance.url!);
        if (!response.ok) {
          throw new Error(`Preview fetch failed with status ${response.status}`);
        }
        if (cancelled) return;

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjs.getDocument({ data: buffer });
        const loaded = await loadingTask.promise;
        if (cancelled) {
          loaded.destroy();
          return;
        }

        setPdf((prev) => {
          prev?.destroy();
          return loaded;
        });
        setIsFirstLoad(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load PDF preview:', err);
          setPreviewError('Failed to load preview on this device.');
          setIsFirstLoad(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      loadingTask?.destroy().catch(() => {});
    };
  }, [instance.url]);

  if (instance.error || previewError) {
    return <div className="text-red-400 text-sm">{previewError ?? 'Failed to render PDF'}</div>;
  }

  if (isFirstLoad && (instance.loading || !pdf)) {
    return (
      <div className="w-full bg-[#525659] flex items-center justify-center py-8">
        <div
          style={{ width: A4_WIDTH_PX * zoom, height: 800 }}
          className="bg-white shadow-2xl flex items-center justify-center text-gray-400 text-sm"
        >
          Generating preview…
        </div>
      </div>
    );
  }

  if (!pdf) {
    return <div className="text-red-400 text-sm">Preview is unavailable on this device.</div>;
  }

  return (
    <div className="w-full bg-[#525659]">
      <div className="flex flex-col items-center py-8 gap-6">
        {Array.from({ length: pdf.numPages }, (_, i) => (
          <PDFPageCanvas
            key={i}
            pdf={pdf}
            pageNumber={i + 1}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
};

export default LivePreview;