import { jsPDF } from 'jspdf';

// Helper function to ensure colors render properly in the PDF 
// by converting hex colors to direct RGB values
export function convertHexToRGB(hex: string): { r: number, g: number, b: number } {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Parse the hex values to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

// Helper function to add wrapped text
export function addWrappedText(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

// Initialize PDF with standard settings
export function createPDF(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
    floatPrecision: 16 // Higher precision for better color rendering
  });
}

// Add professional metadata to PDF
export function addPDFMetadata(doc: jsPDF, title: string): void {
  (doc as any).setProperties({
    title: title,
    subject: 'Legal Agreement',
    author: 'CPXTB Platform',
    keywords: 'agreement, merchant, cpxtb, cryptocurrency',
    creator: 'CPXTB Platform'
  });
}