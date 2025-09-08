// Import PDF-lib (works in SSR)
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Annotation } from '../types/pdf';

// Dynamic import for PDF.js (client-side only)
let pdfjsLib: unknown = null;

const initPDFJS = async (): Promise<unknown> => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    try {
      const pdfjsModule = await import('pdfjs-dist');
      
      // Handle both default export and named exports
      pdfjsLib = pdfjsModule.default || pdfjsModule;
      const lib = pdfjsLib as { GlobalWorkerOptions?: { workerSrc?: string }; version: string };
      
      // Defensive worker setup
      if (lib.GlobalWorkerOptions) {
        if (typeof lib.GlobalWorkerOptions === 'object' && lib.GlobalWorkerOptions !== null) {
          if (!lib.GlobalWorkerOptions.workerSrc) {
            try {
              lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.js`;
            } catch (error) {
              console.warn('Failed to set worker source in pdfUtils:', error);
              try {
                Object.defineProperty(lib.GlobalWorkerOptions, 'workerSrc', {
                  value: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.js`,
                  writable: true,
                  configurable: true
                });
              } catch (error2) {
                console.warn('defineProperty also failed in pdfUtils:', error2);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load PDF.js in pdfUtils:', error);
      return null;
    }
  }
  return pdfjsLib;
};

export interface PDFPageData {
  pageNumber: number;
  annotations: Annotation[];
  canvas?: HTMLCanvasElement;
}

export class PDFUtils {
  static async loadPDF(arrayBuffer: ArrayBuffer) {
    const pdfjs = await initPDFJS();
    if (!pdfjs) {
      throw new Error('PDF.js not available');
    }
    
    // Load with PDF.js for rendering
    const pdfDoc = await (pdfjs as { getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<unknown> } }).getDocument({ data: arrayBuffer }).promise;
    
    // Load with PDF-lib for editing
    const pdfLibDoc = await PDFDocument.load(arrayBuffer);
    
    return { pdfDoc, pdfLibDoc };
  }

  static async renderPage(pdfDoc: unknown, pageNumber: number, canvas: HTMLCanvasElement, zoom: number = 1, annotations: Annotation[] = []) {
    if (!pdfDoc) return;
    
    const page = await (pdfDoc as { getPage: (num: number) => Promise<{ getViewport: (options: { scale: number }) => { width: number; height: number }; render: (params: unknown) => { promise: Promise<void> } }> }).getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoom });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render PDF page
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Render annotations on top
    annotations.forEach(annotation => {
      this.renderAnnotation(context, annotation, { width: canvas.width, height: canvas.height });
    });
  }

  static renderAnnotation(
    context: CanvasRenderingContext2D, 
    annotation: Annotation, 
    viewport: { width: number; height: number }
  ) {
    context.save();
    
    const x = annotation.x * viewport.width;
    const y = annotation.y * viewport.height;
    const width = annotation.width * viewport.width;
    const height = annotation.height * viewport.height;
    
    // Parse color
    const color = annotation.color;
    context.fillStyle = color;
    context.strokeStyle = color;
    
    switch (annotation.type) {
      case 'highlight':
        context.globalAlpha = 0.3;
        context.fillRect(x, y, width, height);
        break;
        
      case 'rectangle':
        context.lineWidth = 2;
        context.globalAlpha = 1;
        context.strokeRect(x, y, width, height);
        break;
        
      case 'circle':
        context.lineWidth = 2;
        context.globalAlpha = 1;
        context.beginPath();
        context.ellipse(
          x + width / 2, 
          y + height / 2, 
          width / 2, 
          height / 2, 
          0, 
          0, 
          2 * Math.PI
        );
        context.stroke();
        break;
        
      case 'text':
        context.globalAlpha = 1;
        const fontSize = annotation.fontSize || Math.max(12, width / 10);
        context.font = `${fontSize}px ${annotation.fontFamily || 'Arial'}`;
        context.fillText(annotation.content || 'Sample Text', x, y + height / 2);
        break;
    }
    
    context.restore();
  }

  static async exportPDFWithAnnotations(
    pdfLibDoc: PDFDocument, 
    pages: PDFPageData[]
  ): Promise<Uint8Array> {
    try {
      // Create a copy of the document
      const pdfBytes = await pdfLibDoc.save();
      const newDoc = await PDFDocument.load(pdfBytes);
      
      // Add annotations to each page
      for (const pageData of pages) {
        const page = newDoc.getPage(pageData.pageNumber - 1);
        const { width, height } = page.getSize();
        
        for (const annotation of pageData.annotations) {
          const x = annotation.x * width;
          const y = height - (annotation.y * height) - (annotation.height * height);
          const annotationWidth = annotation.width * width;
          const annotationHeight = annotation.height * height;
          
          // Convert color
          const { r, g, b } = PDFUtils.hexToRgb(annotation.color);
          
          switch (annotation.type) {
            case 'text':
              const font = await newDoc.embedFont(StandardFonts.Helvetica);
              page.drawText(annotation.content || 'Sample Text', {
                x,
                y,
                size: annotation.fontSize || Math.max(10, annotationHeight),
                font,
                color: rgb(r, g, b)
              });
              break;
              
            case 'rectangle':
              page.drawRectangle({
                x,
                y,
                width: annotationWidth,
                height: annotationHeight,
                borderColor: rgb(r, g, b),
                borderWidth: 2
              });
              break;
              
            case 'highlight':
              page.drawRectangle({
                x,
                y,
                width: annotationWidth,
                height: annotationHeight,
                color: rgb(r, g, b),
                opacity: 0.3
              });
              break;
              
            case 'circle':
              // PDF-lib doesn't have direct circle support, so we'll use a rectangle for now
              page.drawRectangle({
                x,
                y,
                width: annotationWidth,
                height: annotationHeight,
                borderColor: rgb(r, g, b),
                borderWidth: 2
              });
              break;
          }
        }
      }
      
      return await newDoc.save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }

  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  static generateAnnotationId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getCanvasCoordinates(
    event: MouseEvent | React.MouseEvent, 
    canvas: HTMLCanvasElement
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  static normalizeCoordinates(
    x: number, 
    y: number, 
    canvas: HTMLCanvasElement
  ): { x: number; y: number } {
    return {
      x: x / canvas.width,
      y: y / canvas.height
    };
  }

  static isPointInAnnotation(
    x: number, 
    y: number, 
    annotation: Annotation, 
    canvasWidth: number, 
    canvasHeight: number
  ): boolean {
    const annotationX = annotation.x * canvasWidth;
    const annotationY = annotation.y * canvasHeight;
    const annotationWidth = annotation.width * canvasWidth;
    const annotationHeight = annotation.height * canvasHeight;
    
    return x >= annotationX && 
           x <= annotationX + annotationWidth && 
           y >= annotationY && 
           y <= annotationY + annotationHeight;
  }
}

export default PDFUtils;
