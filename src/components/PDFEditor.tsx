'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { 
  Upload, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Undo, 
  Redo, 
  Sun, 
  Moon,
  ChevronLeft,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

import Toolbar, { Tool } from './Toolbar';
import PageThumbnail from './PageThumbnail';
import { Annotation, PDFPageData } from '../types/pdf';
import { loadPDFJS } from '../utils/pdfJsLoader';

// Type guards for PDF.js types
interface PDFDocumentLike {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageLike>;
}

interface PDFPageLike {
  getViewport(params: { scale: number }): { width: number; height: number };
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void> };
}

const PDFEditor: React.FC = () => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentLike | null>(null);
  const [pdfLibDoc, setPdfLibDoc] = useState<PDFDocument | null>(null);
  const [pages, setPages] = useState<PDFPageData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>({ type: 'select', color: '#ff0000' });
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<PDFPageData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fileName, setFileName] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [showSidebar] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true);
    
    // Pre-load PDF.js to catch any initialization issues early
    const initializePDFJS = async () => {
      try {
        await loadPDFJS();
        console.log('PDF.js pre-loaded successfully');
      } catch (error) {
        console.error('Failed to pre-load PDF.js:', error);
      }
    };
    
    initializePDFJS();
  }, []);

  const generateAnnotationId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

  const getCanvasCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  const normalizeCoordinates = useCallback((x: number, y: number, canvas: HTMLCanvasElement) => {
    return {
      x: x / canvas.width,
      y: y / canvas.height
    };
  }, []);

  const isPointInAnnotation = useCallback((x: number, y: number, annotation: Annotation, canvasWidth: number, canvasHeight: number) => {
    const annotationX = annotation.x * canvasWidth;
    const annotationY = annotation.y * canvasHeight;
    const annotationWidth = annotation.width * canvasWidth;
    const annotationHeight = annotation.height * canvasHeight;
    
    return x >= annotationX && x <= annotationX + annotationWidth &&
           y >= annotationY && y <= annotationY + annotationHeight;
  }, []);

  const renderAnnotation = useCallback((
    context: CanvasRenderingContext2D, 
    annotation: Annotation, 
    canvasWidth: number,
    canvasHeight: number
  ) => {
    context.save();
    
    const x = annotation.x * canvasWidth;
    const y = annotation.y * canvasHeight;
    const width = annotation.width * canvasWidth;
    const height = annotation.height * canvasHeight;
    
    // Parse color
    const color = annotation.color;
    
    switch (annotation.type) {
      case 'text':
        context.fillStyle = color;
        context.font = `${annotation.fontSize || 16}px ${annotation.fontFamily || 'Arial'}`;
        context.fillText(annotation.content || '', x, y + (annotation.fontSize || 16));
        break;
        
      case 'highlight':
        context.fillStyle = color + '80'; // Add transparency
        context.fillRect(x, y, width, height);
        break;
        
      case 'rectangle':
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.strokeRect(x, y, width, height);
        break;
        
      case 'circle':
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2 * Math.PI);
        context.stroke();
        break;
    }
    
    context.restore();
  }, []);

  const saveToHistory = useCallback((newPages: PDFPageData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Load PDF file
  const loadPDF = useCallback(async (file: File) => {
    if (!isClient) return;
    
    setIsLoading(true);
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF.js with better error handling
      const pdfjsLib = await loadPDFJS();
      if (!pdfjsLib) {
        throw new Error('Failed to load PDF.js library - the library could not be imported or initialized');
      }
      
      // Type assertion for PDF.js library
      const typedPdfjsLib = pdfjsLib as { getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<unknown> } };
      
      // Additional validation
      if (typeof typedPdfjsLib.getDocument !== 'function') {
        throw new Error('PDF.js getDocument function not available - library may be corrupted');
      }
      
      // Load with PDF.js for rendering with defensive options
      const loadingTask = typedPdfjsLib.getDocument({
        data: arrayBuffer,
      });
      
      const loadedPdfDoc = await loadingTask.promise;
      
      // Type assertion for loaded PDF document
      const typedPdfDoc = loadedPdfDoc as PDFDocumentLike;
      
      // Load with PDF-lib for editing
      const loadedPdfLibDoc = await PDFDocument.load(arrayBuffer);
      
      setPdfDoc(typedPdfDoc);
      setPdfLibDoc(loadedPdfLibDoc);
      
      // Initialize pages
      const pageCount = typedPdfDoc.numPages;
      const initialPages: PDFPageData[] = [];
      
      for (let i = 1; i <= pageCount; i++) {
        initialPages.push({
          pageNumber: i,
          annotations: []
        });
      }
      
      setPages(initialPages);
      setCurrentPage(1);
      
      // Save initial state to history
      setHistory([initialPages]);
      setHistoryIndex(0);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF file: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isClient]);

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      await loadPDF(file);
    } else {
      alert('Please select a valid PDF file');
    }
  }, [loadPDF]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    noClick: true
  });

  // Render PDF page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDoc || !canvasRef.current || !isClient) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoom });
      
      const canvas = canvasRef.current;
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
      
      await (page as unknown as PDFPageLike).render(renderContext).promise;
      
      // Render annotations on top
      const currentPageData = pages.find(p => p.pageNumber === pageNumber);
      const annotations = currentPageData?.annotations || [];
      
      annotations.forEach(annotation => {
        renderAnnotation(context, annotation, canvas.width, canvas.height);
      });
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }, [pdfDoc, zoom, pages, isClient, renderAnnotation]);

  // Add annotation
  const addAnnotation = useCallback((x: number, y: number, width: number, height: number, content?: string) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { x: normalizedX, y: normalizedY } = normalizeCoordinates(x, y, canvas);
    const { x: normalizedWidth, y: normalizedHeight } = normalizeCoordinates(width, height, canvas);
    
    const newAnnotation: Annotation = {
      id: generateAnnotationId(),
      type: activeTool.type,
      x: normalizedX,
      y: normalizedY,
      width: Math.abs(normalizedWidth),
      height: Math.abs(normalizedHeight),
      color: activeTool.color,
      content: content || (activeTool.type === 'text' ? 'Double-click to edit' : undefined),
      fontSize: 16,
      fontFamily: 'Arial'
    };
    
    const newPages = pages.map(page => 
      page.pageNumber === currentPage 
        ? { ...page, annotations: [...page.annotations, newAnnotation] }
        : page
    );
    
    setPages(newPages);
    saveToHistory(newPages);
    
  }, [activeTool, currentPage, pages, normalizeCoordinates, generateAnnotationId, saveToHistory]);

  // Handle canvas mouse events
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x, y } = getCanvasCoordinates(event, canvas);
    
    if (activeTool.type === 'select') {
      // Check if clicking on an annotation
      const currentPageData = pages.find(p => p.pageNumber === currentPage);
      if (currentPageData) {
        const clickedAnnotation = currentPageData.annotations.find(annotation =>
          isPointInAnnotation(x, y, annotation, canvas.width, canvas.height)
        );
        
        if (clickedAnnotation) {
          setSelectedAnnotation(clickedAnnotation.id);
        } else {
          setSelectedAnnotation(null);
        }
      }
    } else {
      // Start drawing for annotation tools
      setIsDrawing(true);
      setDrawStart({ x, y });
      setSelectedAnnotation(null);
    }
  }, [activeTool, currentPage, pages, getCanvasCoordinates, isPointInAnnotation]);

  const handleCanvasMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { x, y } = getCanvasCoordinates(event, canvas);
    
    const width = x - drawStart.x;
    const height = y - drawStart.y;
    
    // Only create annotation if it has meaningful size
    if (Math.abs(width) > 5 && Math.abs(height) > 5) {
      if (activeTool.type === 'text') {
        const text = prompt('Enter text:');
        if (text !== null) {
          addAnnotation(drawStart.x, drawStart.y, width, height, text);
        }
      } else {
        addAnnotation(drawStart.x, drawStart.y, width, height);
      }
    }
    
    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, activeTool, addAnnotation, getCanvasCoordinates]);

  // Handle canvas click for point-based annotations
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool.type === 'select' || isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const { x, y } = getCanvasCoordinates(event, canvas);
    
    if (activeTool.type === 'text') {
      const text = prompt('Enter text:');
      if (text !== null && text.trim() !== '') {
        addAnnotation(x, y, 100, 20, text);
      }
    }
  }, [activeTool, addAnnotation, isDrawing, getCanvasCoordinates]);

  // Delete selected annotation
  const deleteSelectedAnnotation = useCallback(() => {
    if (!selectedAnnotation) return;
    
    const newPages = pages.map(page => 
      page.pageNumber === currentPage 
        ? { ...page, annotations: page.annotations.filter(a => a.id !== selectedAnnotation) }
        : page
    );
    
    setPages(newPages);
    saveToHistory(newPages);
    setSelectedAnnotation(null);
  }, [selectedAnnotation, pages, currentPage, saveToHistory]);

  // Download PDF with annotations
  const downloadPDF = useCallback(async () => {
    if (!pdfLibDoc) return;
    
    try {
      // Create a copy of the PDF
      const pdfDoc = await PDFDocument.create();
      const originalPages = await pdfDoc.copyPages(pdfLibDoc, pdfLibDoc.getPageIndices());
      
      originalPages.forEach((page, index) => {
        pdfDoc.addPage(page);
        
        const pageData = pages.find(p => p.pageNumber === index + 1);
        if (pageData && pageData.annotations.length > 0) {
          const { width, height } = page.getSize();
          
          pageData.annotations.forEach(annotation => {
            const x = annotation.x * width;
            const y = height - (annotation.y * height) - (annotation.height * height);
            const annotationWidth = annotation.width * width;
            const annotationHeight = annotation.height * height;
            
            // Parse color (hex to RGB)
            const hex = annotation.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            
            switch (annotation.type) {
              case 'text':
                if (annotation.content) {
                  page.drawText(annotation.content, {
                    x,
                    y,
                    size: annotation.fontSize || 16,
                    color: rgb(r, g, b),
                  });
                }
                break;
                
              case 'highlight':
                page.drawRectangle({
                  x,
                  y,
                  width: annotationWidth,
                  height: annotationHeight,
                  color: rgb(r, g, b),
                  opacity: 0.5,
                });
                break;
                
              case 'rectangle':
                page.drawRectangle({
                  x,
                  y,
                  width: annotationWidth,
                  height: annotationHeight,
                  borderColor: rgb(r, g, b),
                  borderWidth: 2,
                });
                break;
                
              case 'circle':
                page.drawEllipse({
                  x: x + annotationWidth / 2,
                  y: y + annotationHeight / 2,
                  xScale: annotationWidth / 2,
                  yScale: annotationHeight / 2,
                  borderColor: rgb(r, g, b),
                  borderWidth: 2,
                });
                break;
            }
          });
        }
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      saveAs(blob, fileName.replace('.pdf', '_edited.pdf'));
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Error saving PDF');
    }
  }, [pdfLibDoc, pages, fileName]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPages(history[historyIndex - 1]);
      setSelectedAnnotation(null);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPages(history[historyIndex + 1]);
      setSelectedAnnotation(null);
    }
  }, [historyIndex, history]);

  // Zoom controls
  const zoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.25, 3)), []);
  const zoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.25, 0.5)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  // Page navigation
  const goToPage = useCallback((pageNumber: number) => {
    if (pdfDoc && pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
      setCurrentPage(pageNumber);
      setSelectedAnnotation(null);
    }
  }, [pdfDoc]);

  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goToPrevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // File operations
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadPDF(file);
    }
  }, [loadPDF]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isClient) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 's':
            event.preventDefault();
            downloadPDF();
            break;
          case 'o':
            event.preventDefault();
            openFileDialog();
            break;
        }
      } else {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedAnnotation) {
              event.preventDefault();
              deleteSelectedAnnotation();
            }
            break;
          case 'ArrowLeft':
            event.preventDefault();
            goToPrevPage();
            break;
          case 'ArrowRight':
            event.preventDefault();
            goToNextPage();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, deleteSelectedAnnotation, undo, redo, downloadPDF, goToPrevPage, goToNextPage, isClient, openFileDialog]);

  // Effect to re-render when page changes
  useEffect(() => {
    if (pdfDoc && isClient) {
      renderPage(currentPage);
    }
  }, [currentPage, renderPage, pdfDoc, isClient]);

  // Effect to apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Show loading screen until client is ready
  if (!isClient) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`} {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PDF Editor</h1>
            {fileName && (
              <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {fileName}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* File Operations */}
            <button
              onClick={openFileDialog}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Open PDF (Ctrl+O)"
            >
              <FolderOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 border border-gray-200 dark:border-gray-600 rounded-md">
              <button onClick={zoomOut} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button 
                onClick={resetZoom}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 min-w-[3rem] text-center hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={zoomIn} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            {/* Delete Selected */}
            {selectedAnnotation && (
              <button
                onClick={deleteSelectedAnnotation}
                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                title="Delete Selected (Delete)"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            {/* Download */}
            {pdfDoc && (
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                title="Save PDF (Ctrl+S)"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {pdfDoc && showSidebar && (
          <aside className="flex bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Tools Panel */}
            <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
            
            {/* Page Thumbnails */}
            <div className="w-48 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pages</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentPage} / {pdfDoc?.numPages || 0}
                </span>
              </div>
              
              <div className="space-y-2">
                {Array.from({ length: pdfDoc?.numPages || 0 }, (_, index) => (
                  <PageThumbnail
                    key={index + 1}
                    pdfDoc={pdfDoc}
                    pageNumber={index + 1}
                    isActive={currentPage === index + 1}
                    onClick={() => goToPage(index + 1)}
                  />
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {/* Page Navigation */}
          {pdfDoc && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Previous Page (←)"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Page</span>
                  <input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (!isNaN(page)) goToPage(page);
                    }}
                    className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                    max={pdfDoc?.numPages || 1}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    of {pdfDoc?.numPages || 0}
                  </span>
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === pdfDoc?.numPages}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Next Page (→)"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
          
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {!pdfDoc ? (
              <div className={`
                w-full max-w-2xl h-96 border-2 border-dashed rounded-lg 
                flex flex-col items-center justify-center cursor-pointer
                transition-colors
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}>
                <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop PDF here' : 'Upload PDF'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Drag and drop a PDF file here, or click to select
                </p>
                <button
                  onClick={openFileDialog}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Choose File
                </button>
              </div>
            ) : (
              <div ref={containerRef} className="flex items-center justify-center">
                {isLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading PDF...</p>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseUp={handleCanvasMouseUp}
                    onClick={handleCanvasClick}
                    className={`
                      max-w-full max-h-full shadow-lg border border-gray-200 dark:border-gray-700 
                      ${activeTool.type === 'select' ? 'cursor-default' : 'cursor-crosshair'}
                      ${selectedAnnotation ? 'ring-2 ring-blue-500' : ''}
                    `}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default PDFEditor;
