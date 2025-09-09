// Dedicated PDF.js loader utility - Fixed version
interface PDFJSLib {
  getDocument: (params: { data: ArrayBuffer; disableWorker?: boolean }) => { promise: Promise<unknown> };
  version?: string;
  GlobalWorkerOptions?: { workerSrc?: string };
}

declare global {
  interface Window {
    pdfjsLib?: PDFJSLib;
  }
}

let pdfJsInstance: unknown = null;
let isLoading = false;
let cdnScriptPromise: Promise<unknown> | null = null;

// Use a widely deployed version that still exposes a global when using the non-module build.
// (v5 packaging + Next 15 appears to trigger defineProperty issues during evaluation.)
const PDFJS_FALLBACK_VERSION = '3.11.174';
const UNPKG_BASE = `https://unpkg.com/pdfjs-dist@${PDFJS_FALLBACK_VERSION}/build`;

const loadFromCDN = (): Promise<unknown> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (pdfJsInstance) return Promise.resolve(pdfJsInstance);
  if (window.pdfjsLib) {
    pdfJsInstance = window.pdfjsLib;
    return Promise.resolve(pdfJsInstance);
  }
  if (cdnScriptPromise) return cdnScriptPromise;

  cdnScriptPromise = new Promise((resolve, reject) => {
    try {
      const existing = document.querySelector('script[data-pdfjs-unpkg]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.pdfjsLib || null), { once: true });
        existing.addEventListener('error', () => reject(new Error('Existing PDF.js unpkg script failed to load')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = `${UNPKG_BASE}/pdf.min.js`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-pdfjs-unpkg', 'true');
      script.onload = () => {
        if (window.pdfjsLib && typeof window.pdfjsLib.getDocument === 'function') {
          // Attempt to set workerSrc (optional, we still use disableWorker downstream)
          try {
            if (window.pdfjsLib.GlobalWorkerOptions) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${UNPKG_BASE}/pdf.worker.min.js`;
            }
          } catch (e) {
            console.warn('Failed to set workerSrc on fallback pdfjsLib:', e);
          }
          pdfJsInstance = window.pdfjsLib;
          resolve(pdfJsInstance);
        } else {
          reject(new Error('PDF.js unpkg script loaded but pdfjsLib not found'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js from unpkg CDN'));
      document.head.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });
  return cdnScriptPromise;
};

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
    console.log('Starting PDF.js dynamic import (package attempt)...');
    try {
      const pkg: any = await import('pdfjs-dist');
      const pdfJs: PDFJSLib = pkg.default || pkg;
      if (!pdfJs || typeof pdfJs.getDocument !== 'function') throw new Error('Invalid pdfjs-dist package import');
      pdfJsInstance = pdfJs;
      console.log('PDF.js loaded from package (version:', pdfJs.version, ')');
      return pdfJsInstance;
    } catch (packageErr) {
      console.warn('Package import failed; skipping legacy build (known issue) and using unpkg fallback...', packageErr);
      const cdnLib = await loadFromCDN();
      if (!cdnLib || typeof (cdnLib as any).getDocument !== 'function') {
        throw new Error('Fallback pdfjsLib missing getDocument');
      }
      console.log('PDF.js loaded from unpkg fallback (version:', (cdnLib as any).version, ')');
      return cdnLib;
    }
  } finally {
    isLoading = false;
  }
};

// Reset function for testing/debugging
export const resetPDFJS = () => {
  pdfJsInstance = null;
  isLoading = false;
};
