// Dedicated PDF.js loader utility - Fixed version
interface PDFJSLib {
  getDocument?: (params: unknown) => { promise: Promise<unknown> };
  version?: string;
  GlobalWorkerOptions?: { workerSrc?: string };
}

let pdfJsInstance: unknown = null;
let isLoading = false;

export const loadPDFJS = async () => {
  if (typeof window === 'undefined') {
    console.warn('loadPDFJS called on server side');
    return null;
  }

  // Return existing instance if already loaded
  if (pdfJsInstance) {
    return pdfJsInstance;
  }

  // Prevent multiple simultaneous loads
  if (isLoading) {
    console.log('PDF.js is already loading, waiting...');
    // Wait for loading to complete
    while (isLoading && !pdfJsInstance) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return pdfJsInstance;
  }

  isLoading = true;

  try {
    console.log('Starting PDF.js dynamic import...');
    
    // Use the more reliable import method that works with Next.js
    const pdfJsModule = await import('pdfjs-dist') as { default?: PDFJSLib } & PDFJSLib;
    console.log('PDF.js module imported successfully');
    
    // Get the actual PDF.js object - handle both default and named exports
    const pdfJs = pdfJsModule.default || pdfJsModule as PDFJSLib;
    
    // Validate the import
    if (!pdfJs || typeof pdfJs !== 'object') {
      throw new Error('PDF.js import returned invalid object');
    }

    if (!pdfJs.getDocument || typeof pdfJs.getDocument !== 'function') {
      throw new Error('PDF.js getDocument function not found');
    }

    console.log('PDF.js version:', pdfJs.version);

    // NEW APPROACH: Don't set GlobalWorkerOptions.workerSrc at all
    // Instead, let PDF.js handle the worker automatically
    // This avoids the "Properties can only be defined on Objects" error
    
    // PDF.js 4.0+ can automatically detect and load the worker
    // If we need to specify it, we do it through getDocument options instead
    
    console.log('PDF.js loaded and configured successfully (no worker src needed)');
    
    // Store the instance
    pdfJsInstance = pdfJs;
    
    return pdfJsInstance;

  } catch (error) {
    console.error('Failed to load PDF.js:', error);
    
    // Fallback: Try the legacy import method
    try {
      console.log('Trying fallback import method...');
      const fallbackModule = await import('pdfjs-dist') as { default?: PDFJSLib } & PDFJSLib;
      const fallbackPdfJs = fallbackModule.default || fallbackModule;
      
      if (fallbackPdfJs && typeof fallbackPdfJs.getDocument === 'function') {
        console.log('Fallback import successful');
        pdfJsInstance = fallbackPdfJs;
        return pdfJsInstance;
      }
    } catch (fallbackError) {
      console.error('Fallback import also failed:', fallbackError);
    }
    
    pdfJsInstance = null;
    return null;
  } finally {
    isLoading = false;
  }
};

// Reset function for testing/debugging
export const resetPDFJS = () => {
  pdfJsInstance = null;
  isLoading = false;
};
