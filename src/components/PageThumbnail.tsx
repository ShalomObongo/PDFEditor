'use client';

import React, { useRef, useEffect } from 'react';
import { PDFDocument, PDFPage } from '../types/pdf';

interface PageThumbnailProps {
  pdfDoc: unknown;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ 
  pdfDoc, 
  pageNumber, 
  isActive, 
  onClick 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Track current render task to avoid concurrent usage of the same canvas
  const renderTaskRef = useRef<{ cancelled?: boolean; promise?: Promise<void> } | null>(null);

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      // If a previous render is in flight, mark it cancelled (pdf.js v3 doesn't expose cancel on the returned task in this simplified type def)
      if (renderTaskRef.current) {
        renderTaskRef.current.cancelled = true;
      }

      const currentTask = { cancelled: false } as { cancelled?: boolean; promise?: Promise<void> };
      renderTaskRef.current = currentTask;

      try {
        const page = await (pdfDoc as PDFDocument).getPage(pageNumber) as PDFPage;
        if (currentTask.cancelled) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 0.2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const task = page.render(renderContext);
        currentTask.promise = task.promise;
        await task.promise;
      } catch (error) {
        if (!(error as Error).message?.includes('cancelled')) {
          console.error('Error rendering thumbnail:', error);
        }
      }
    };

    renderThumbnail();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancelled = true;
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div
      onClick={onClick}
      className={`
        p-2 rounded-lg cursor-pointer transition-all
        ${isActive 
          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }
      `}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto border border-gray-200 dark:border-gray-600 rounded"
      />
      <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-300">
        Page {pageNumber}
      </p>
    </div>
  );
};

export default PageThumbnail;
