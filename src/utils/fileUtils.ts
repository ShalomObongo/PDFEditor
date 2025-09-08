export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Please select a PDF file' };
  }
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'PDF file is too large. Maximum size is 50MB' };
  }
  
  // Check file name
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { isValid: false, error: 'File must have a .pdf extension' };
  }
  
  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatFileName = (fileName: string, maxLength: number = 30): string => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
  
  return truncatedName + '.' + extension;
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateUniqueFilename = (originalName: string, suffix: string = '_edited'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  const extension = originalName.split('.').pop();
  
  return `${nameWithoutExt}${suffix}_${timestamp}.${extension}`;
};

export const getMimeType = (file: File): string => {
  return file.type || 'application/octet-stream';
};

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const createThumbnailFromCanvas = (canvas: HTMLCanvasElement, maxWidth: number = 150): string => {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  
  const aspectRatio = canvas.height / canvas.width;
  const thumbnailWidth = Math.min(maxWidth, canvas.width);
  const thumbnailHeight = thumbnailWidth * aspectRatio;
  
  tempCanvas.width = thumbnailWidth;
  tempCanvas.height = thumbnailHeight;
  
  tempCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
  
  return tempCanvas.toDataURL('image/jpeg', 0.8);
};
