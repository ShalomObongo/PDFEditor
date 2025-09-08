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

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await (pdfDoc as PDFDocument).getPage(pageNumber) as PDFPage;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;
        
        // Set thumbnail size
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering thumbnail:', error);
      }
    };

    renderThumbnail();
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
