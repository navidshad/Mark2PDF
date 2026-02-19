
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFOptions } from '../types';

/**
 * Attempts to fetch an image through a CORS proxy and convert it to Base64.
 */
const getBase64FromUrl = async (url: string): Promise<string> => {
  if (url.startsWith('data:') || url.startsWith(window.location.origin) || url.startsWith('/')) {
    return url;
  }
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error(`Error proxying image ${url}:`, err);
    return url;
  }
};

const proxyAndPrepareImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.getElementsByTagName('img'));
  const tasks = images.map(async (img) => {
    const originalSrc = img.getAttribute('src');
    if (originalSrc) {
      const base64 = await getBase64FromUrl(originalSrc);
      if (base64.startsWith('data:')) {
        img.src = base64;
      }
    }
    if (!img.complete) {
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }
  });
  await Promise.all(tasks);
};

export const generatePDF = async (element: HTMLElement, options: PDFOptions) => {
  const { pageSize, orientation, filename } = options;
  const originalTransform = element.style.transform;
  const originalWidth = element.style.width;
  
  try {
    // 1. Reset scaling to 1:1 for accurate capture
    element.style.transform = 'none';
    
    // 2. Perform high-resolution capture
    const canvas = await html2canvas(element, {
      scale: 2.5, // 2.5x scale for high quality prints
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      // Explicitly tell html2canvas the dimensions to capture
      width: element.offsetWidth,
      height: element.scrollHeight,
      onclone: async (clonedDoc, clonedElement) => {
        // Ensure scale is removed in the clone too
        clonedElement.style.transform = 'none';
        
        await proxyAndPrepareImages(clonedElement);
        
        // Hide UI-specific elements in the final PDF
        const guides = clonedDoc.querySelectorAll('.pointer-events-none');
        guides.forEach(g => (g as HTMLElement).style.display = 'none');
      }
    });

    // Restore UI state
    element.style.transform = originalTransform;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize,
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = pdfWidth / canvas.width;
    const finalImgHeight = canvas.height * ratio;
    
    let heightLeft = finalImgHeight;
    let position = 0;

    // Page 1
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, finalImgHeight);
    heightLeft -= pdfHeight;

    // Remaining Pages
    while (heightLeft > 0.5) { // Small buffer for rounding errors
      position = heightLeft - finalImgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, finalImgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename || 'document'}.pdf`);
  } catch (err) {
    element.style.transform = originalTransform;
    console.error("PDF Generation Error:", err);
    throw err;
  }
};
