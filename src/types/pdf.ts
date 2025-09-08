// Types for PDF.js
export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

export interface PDFPageProxy {
  getViewport(params: { scale: number }): PDFPageViewport;
  render(params: RenderParameters): RenderTask;
}

export interface PDFPageViewport {
  width: number;
  height: number;
}

export interface RenderParameters {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFPageViewport;
}

export interface RenderTask {
  promise: Promise<void>;
}

// Types for PDF functionality
export interface Annotation {
  id: string;
  type: 'select' | 'text' | 'highlight' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface PDFPageData {
  pageNumber: number;
  annotations: Annotation[];
}

// PDF.js specific types
export interface PDFDocument {
  getPage: (pageNumber: number) => Promise<PDFPage>;
  numPages: number;
}

export interface PDFPage {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (context: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

export interface PDFWorker {
  getDocument: (data: string | ArrayBuffer | { data: ArrayBuffer }) => { promise: Promise<PDFDocument> };
}
