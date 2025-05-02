import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

// Use the same token address as in the merchant dashboard
const CPXTB_TOKEN_ADDRESS = "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b";

interface MerchantPamphletProps {
  businessName: string;
  walletAddress: string;
  logoUrl?: string;
}

export function MerchantPamphlet({ 
  businessName, 
  walletAddress,
  logoUrl
}: MerchantPamphletProps) {
  const { toast } = useToast();
  const pamphletRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prerenderedQrCode, setPrerenderedQrCode] = useState<string | null>(null);
  
  // Pre-render QR code as an image on component mount to ensure it shows in PDF
  useEffect(() => {
    const renderQrAsImage = async () => {
      try {
        // Find the QR code SVG element
        const qrElement = qrCodeRef.current?.querySelector('svg');
        if (qrElement) {
          // Convert SVG to data URL
          const svgString = new XMLSerializer().serializeToString(qrElement as SVGElement);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          // Set up the rendering pipeline
          canvas.width = 400;
          canvas.height = 400;
          ctx!.fillStyle = '#ffffff';
          ctx!.fillRect(0, 0, canvas.width, canvas.height);
          
          // Create a data URL from the SVG
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          
          // Load the image and render to canvas
          img.onload = () => {
            ctx!.drawImage(img, 0, 0, 400, 400);
            const dataUrl = canvas.toDataURL('image/png');
            setPrerenderedQrCode(dataUrl);
            URL.revokeObjectURL(url);
          };
          
          img.src = url;
        }
      } catch (err) {
        console.error('Failed to pre-render QR code:', err);
      }
    };
    
    // Run the pre-rendering logic
    renderQrAsImage();
  }, [walletAddress]);
  // Function to generate QR code data for merchant's wallet
  const getWalletQrData = () => {
    return `ethereum:${walletAddress}?token=${CPXTB_TOKEN_ADDRESS}`;
  };
  
  // Function to convert SVG QR code to data URL with better error handling
  const getQRCodeDataUrl = async (qrCodeElement: SVGElement): Promise<string> => {
    // Get the QR code SVG as a string
    const svgString = new XMLSerializer().serializeToString(qrCodeElement);
    
    // Create a Blob with the SVG string
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create an Image element to load the SVG
    const img = new Image();
    
    // Wait for the image to load with better error handling
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          const scale = 3; // Increase scale for better quality
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          // Draw the image on the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert the canvas to a data URL
          const dataUrl = canvas.toDataURL('image/png');
          
          // Clean up
          URL.revokeObjectURL(url);
          
          // Return the data URL
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(url);
          console.error('Error rendering QR code to canvas:', error);
          
          // Create a simple fallback QR code
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = 200;
          fallbackCanvas.height = 200;
          const fallbackCtx = fallbackCanvas.getContext('2d');
          
          if (fallbackCtx) {
            fallbackCtx.fillStyle = '#FFFFFF';
            fallbackCtx.fillRect(0, 0, 200, 200);
            fallbackCtx.strokeStyle = '#000000';
            fallbackCtx.lineWidth = 2;
            fallbackCtx.strokeRect(10, 10, 180, 180);
            
            // Draw grid pattern to look like a QR code
            fallbackCtx.fillStyle = '#000000';
            for (let i = 0; i < 8; i++) {
              for (let j = 0; j < 8; j++) {
                if (Math.random() > 0.6) {
                  fallbackCtx.fillRect(25 + i * 20, 25 + j * 20, 15, 15);
                }
              }
            }
            
            // Draw positioning squares in corners
            fallbackCtx.fillRect(25, 25, 40, 40);
            fallbackCtx.fillRect(135, 25, 40, 40);
            fallbackCtx.fillRect(25, 135, 40, 40);
            
            // White inner squares for the positioning markers
            fallbackCtx.fillStyle = '#FFFFFF';
            fallbackCtx.fillRect(35, 35, 20, 20);
            fallbackCtx.fillRect(145, 35, 20, 20);
            fallbackCtx.fillRect(35, 145, 20, 20);
            
            // Black inner squares
            fallbackCtx.fillStyle = '#000000';
            fallbackCtx.fillRect(40, 40, 10, 10);
            fallbackCtx.fillRect(150, 40, 10, 10);
            fallbackCtx.fillRect(40, 150, 10, 10);
            
            resolve(fallbackCanvas.toDataURL('image/png'));
          } else {
            reject(new Error('Failed to create fallback QR code'));
          }
        }
      };
      
      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        console.error('Error loading QR code image:', error);
        reject(new Error('Failed to load QR code SVG as image'));
      };
      
      // Set the image source to the Blob URL
      img.src = url;
      
      // Add a timeout as a safety measure
      setTimeout(() => {
        if (!img.complete) {
          URL.revokeObjectURL(url);
          reject(new Error('Timed out waiting for QR code image to load'));
        }
      }, 5000);
    });
  };

  // Function to generate PDF and download
  const handlePrint = async () => {
    try {
      // Set generating state
      setIsGenerating(true);
      
      // Create a loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'fixed inset-0 flex items-center justify-center bg-black/30 z-50';
      loadingDiv.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
          <div class="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <div>Generating PDF...</div>
        </div>
      `;
      document.body.appendChild(loadingDiv);
      
      // Use our pre-rendered QR code image if available
      let qrCodeImage: string | null = prerenderedQrCode;
      
      // If we don't have a pre-rendered QR code, try multiple methods to generate one
      if (!qrCodeImage) {
        try {
          // Try to get the QR code from the DOM
          const qrCodeImg = qrCodeRef.current?.querySelector('img');
          if (qrCodeImg) {
            qrCodeImage = (qrCodeImg as HTMLImageElement).src;
          } else {
            // If no image exists yet, try to get the SVG and convert it
            const qrCodeSvg = qrCodeRef.current?.querySelector('svg');
            if (qrCodeSvg) {
              // Use our specialized function to convert SVG to data URL
              qrCodeImage = await getQRCodeDataUrl(qrCodeSvg as SVGElement);
            }
          }
        } catch (qrError) {
          console.error('Error getting pre-rendered QR code:', qrError);
          
          // Fallback to html2canvas if other methods fail
          try {
            const qrElement = qrCodeRef.current;
            if (qrElement) {
              // Create a temporary canvas for the QR code
              const qrCanvas = await html2canvas(qrElement, {
                backgroundColor: '#FFFFFF',
                scale: 3, // Higher scale for better quality
                logging: false
              });
              
              qrCodeImage = qrCanvas.toDataURL('image/png');
            }
          } catch (fallbackError) {
            console.error('All QR code conversion methods failed:', fallbackError);
          }
        }
      }
      
      // If we still don't have a QR code image, create a basic placeholder
      if (!qrCodeImage) {
        console.warn('Using placeholder QR code image');
        // Create a basic QR code placeholder using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 200, 200);
          
          // Draw border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, 180, 180);
          
          // Add text
          ctx.fillStyle = '#000000';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('QR Code', 100, 100);
          
          qrCodeImage = canvas.toDataURL('image/png');
        }
      }
      
      // Skip content capture entirely - direct PDF generation is more reliable
      
      // Create a new PDF document with letter size for better content fit
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });
      
      // Letter dimensions are 215.9 x 279.4 mm (8.5 x 11 inches)
      const pageWidth = 215.9;
      const pageHeight = 279.4;
      
      // Add gradient header background
      const headerHeight = 40;
      doc.setFillColor(59, 130, 246); // Primary blue at top
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      
      // Set up initial position
      let yPosition = 15; // Start text in header
      
      // Add title text in white on blue background
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Payment Instructions", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 12;
      
      // Add Business Name as subtitle in header
      doc.setFontSize(16);
      doc.setTextColor(240, 240, 240);
      doc.text(businessName, pageWidth / 2, yPosition, { align: "center" });
      
      // Move position to start content after header
      yPosition = headerHeight + 10;
      
      // Add tagline
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(59, 130, 246); // Blue text
      doc.text("We Accept CPXTB Token Payments", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8; // Reduced gap between text and QR code
      
      // Add the QR code at the top section of the page - MOST IMPORTANT PART
      if (qrCodeImage) {
        // Set QR code size (smaller to save vertical space)
        const qrSize = 60; // mm - smaller size to fit more content
        const qrX = (pageWidth - qrSize) / 2;
        
        // Add the QR code with border
        // First add white background and border
        doc.setDrawColor(59, 130, 246); // Blue border (#3b82f6)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(qrX - 2, yPosition - 2, qrSize + 4, qrSize + 4, 2, 2, 'FD');
        
        // Now add the QR code image
        doc.addImage(qrCodeImage, 'PNG', qrX, yPosition, qrSize, qrSize);
        yPosition += qrSize + 5;
        
        // Add scan instructions
        doc.setFontSize(10);
        doc.text("Scan this QR code with any crypto wallet", pageWidth / 2, yPosition, { align: "center" });
        yPosition += 7;
        
        // Add wallet address in a box with monospace font
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(243, 244, 246); // Light gray background
        const addressBoxWidth = 140;
        const addressBoxHeight = 12;
        const addressBoxX = (pageWidth - addressBoxWidth) / 2;
        
        doc.roundedRect(addressBoxX, yPosition, addressBoxWidth, addressBoxHeight, 1, 1, 'FD');
        
        // Add wallet address text
        doc.setFont("courier", "normal"); // Use monospace font
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55); // Dark gray text
        
        // Check if we need to truncate or split the address
        if (walletAddress.length > 40) {
          // Split address in half to fit in box
          const firstHalf = walletAddress.substring(0, Math.floor(walletAddress.length / 2));
          const secondHalf = walletAddress.substring(Math.floor(walletAddress.length / 2));
          
          doc.text(firstHalf, pageWidth / 2, yPosition + 5, { align: "center" });
          doc.text(secondHalf, pageWidth / 2, yPosition + 9, { align: "center" });
        } else {
          doc.text(walletAddress, pageWidth / 2, yPosition + 6, { align: "center" });
        }
        
        yPosition += addressBoxHeight + 10;
      }
      
      // Add section header bar for instructions
      doc.setFillColor(240, 249, 255); // Light blue background
      doc.rect(0, yPosition - 7, pageWidth, 14, 'F');
      
      // Add "How to Pay with CPXTB" section header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246); // Blue text
      doc.text("How to Pay with CPXTB", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      
      // Add numbered steps with blue dots and connecting line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      const steps = [
        "Open your crypto wallet app",
        "Buy Ethereum on Base network",
        "Swap ETH to CPXTB on Base network",
        "Scan the QR code or enter wallet address",
        "Enter the exact amount in CPXTB",
        "Confirm and send your payment"
      ];
      
      // Shorter descriptions to fit better
      const stepDescriptions = [
        "Any wallet that supports Base network",
        "Purchase ETH on Base network",
        "Use BaseSwap to convert ETH to CPXTB",
        "Verify address matches exactly",
        "Exact CPXTB amount provided at checkout",
        "Confirmation takes 10-30 seconds"
      ];
      
      // Draw a vertical line connecting all steps
      const lineStartY = yPosition;
      const circleX = 15;
      
      // Calculate total steps height - adjusted for taller boxes
      const stepsHeight = steps.length * 22; // Using taller step boxes
      
      // Draw line first (in the background) - extended to match taller boxes
      doc.setDrawColor(220, 230, 250); // Light blue line
      doc.setLineWidth(1.5);
      doc.line(circleX, lineStartY - 2, circleX, lineStartY + stepsHeight);
      
      // Draw boxes for steps - fixed to contain text properly
      steps.forEach((step, index) => {
        // Draw larger circle with drop shadow effect
        doc.setFillColor(245, 247, 250); // Light gray background for shadow
        doc.circle(circleX + 0.5, yPosition - 0.5, 3.5, 'F');
        
        // Draw actual circle
        doc.setFillColor(59, 130, 246); // Blue (#3b82f6)
        doc.circle(circleX, yPosition - 1, 3.5, 'F');
        
        // Add number in circle
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text((index + 1).toString(), circleX, yPosition, { align: "center" });
        
        // Calculate the height needed for both the step and description
        const boxHeight = 16; // Reduced height to save vertical space
        
        // Add rounded rectangle for step text - increased height to fit both lines
        doc.setFillColor(248, 250, 252); // Very light blue/gray
        doc.setDrawColor(230, 236, 245); // Light blue border
        doc.roundedRect(circleX + 7, yPosition - 6, 170, boxHeight, 1, 1, 'FD');
        
        // Add step text
        doc.setFont("helvetica", "bold");
        doc.setTextColor(59, 130, 246); // Blue text
        doc.setFontSize(11);
        doc.text(step, circleX + 11, yPosition - 1); // Position slightly higher
        
        // Add step description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Slate gray text
        doc.text(stepDescriptions[index], circleX + 11, yPosition + 6); // Position lower
        
        // Move to next step position, adding enough space for the taller boxes
        yPosition += boxHeight + 4;
      });
      
      yPosition += 8;
      
      // Add warning box with attention-grabbing design but smaller
      // First create a light orange gradient background
      doc.setFillColor(255, 251, 235); // Light amber background
      doc.setDrawColor(251, 191, 36); // Amber border
      doc.setLineWidth(1.5);
      doc.roundedRect(20, yPosition, pageWidth - 40, 20, 4, 4, 'FD');
      
      // Add warning icon
      const warningIconSize = 8;
      const iconX = 30;
      const iconY = yPosition + 12;
      
      // Draw warning triangle
      doc.setFillColor(251, 146, 60); // Orange fill
      doc.setDrawColor(249, 115, 22); // Darker orange border
      
      // Triangle points
      const trianglePoints = [
        { x: iconX, y: iconY + warningIconSize/2 },
        { x: iconX - warningIconSize/2, y: iconY - warningIconSize/2 },
        { x: iconX + warningIconSize/2, y: iconY - warningIconSize/2 }
      ];
      
      // Draw filled triangle
      doc.triangle(
        trianglePoints[0].x, trianglePoints[0].y,
        trianglePoints[1].x, trianglePoints[1].y,
        trianglePoints[2].x, trianglePoints[2].y,
        'F'
      );
      
      // Add exclamation mark
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("!", iconX, iconY - 1, { align: "center" });
      
      // Add warning text with heading and body
      doc.setFont("helvetica", "bold");
      doc.setTextColor(194, 65, 12); // Deep orange text
      doc.setFontSize(12);
      doc.text("IMPORTANT: ONLY SEND CPXTB TOKENS", 45, yPosition + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(146, 64, 14); // Amber text
      doc.text("Sending any other cryptocurrency may result in permanent loss of funds.", 
        45, yPosition + 16);
        
      // Add a small repeating pattern on the right side for visual interest
      for (let i = 0; i < 3; i++) {
        doc.setFillColor(253, 186, 116); // Light orange
        doc.circle(pageWidth - 30, yPosition + 6 + (i * 6), 1, 'F');
      }
      
      // Add footer with branding with clear separation from content
      yPosition += 15; // Add more space after warning box
      
      // Add more visible footer box
      doc.setFillColor(240, 249, 255); // Light blue background
      doc.rect(0, yPosition - 10, pageWidth, 30, 'F');
      
      // Add footer line with more visibility
      doc.setDrawColor(59, 130, 246); // Blue line
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      
      // Add footer text with more contrast
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9); // Slightly larger text
      doc.setTextColor(59, 130, 246); // Blue text for visibility
      doc.text(`Generated by CPXTB Platform | ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition + 5, { align: "center" });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Darker text
      doc.text(`${businessName}`, pageWidth / 2, yPosition + 12, { align: "center" });
      
      // Add stylized version
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(59, 130, 246); // Blue version number
      doc.text("v2.0", pageWidth - 20, yPosition + 5, { align: "right" });
      
      // Save the PDF with formatted filename
      doc.save(`${businessName.replace(/\s+/g, '_')}_Payment_Guide.pdf`);
      
      // Remove loading indicator
      document.body.removeChild(loadingDiv);
      setIsGenerating(false);
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your payment guide has been downloaded as a PDF file.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Reset generating state
      setIsGenerating(false);
      
      // Remove loading indicator if it exists
      const loadingDiv = document.querySelector('.fixed.inset-0.flex.items-center.justify-center.bg-black\\/30.z-50');
      if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
      
      // Show error toast
      toast({
        title: "PDF Generation Failed",
        description: "There was an error creating your PDF. Please try again or use your browser's print function.",
        variant: "destructive"
      });
      
      // Fall back to regular print dialog if PDF generation fails
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  return (
    <div 
      ref={pamphletRef}
      className="merchant-pamphlet-container p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <div className="print:block hidden absolute top-4 right-4">
        <p className="text-sm text-gray-500">Generated from CPXTB Platform</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Instructions</h2>
        <Button 
          onClick={handlePrint}
          className="print:hidden flex items-center gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9 L6 2 L18 2 L18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <path d="M6 14h12v8H6z"/>
              </svg>
              Download PDF
            </>
          )}
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="mb-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${businessName} logo`} 
              className="h-16 mx-auto" 
            />
          ) : (
            <div className="h-16 w-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {businessName.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{businessName}</h1>
        <p className="text-lg text-gray-600 mt-2">We Accept CPXTB Token Payments</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center">
          <div 
            ref={qrCodeRef} 
            className="qr-code-wrapper border-4 border-primary rounded-lg bg-white mb-3 inline-flex items-center justify-center"
            style={{ width: '212px', height: '212px', padding: '6px' }}
          >
            {prerenderedQrCode ? (
              <img 
                src={prerenderedQrCode}
                alt="QR code for wallet"
                width={200}
                height={200}
                className="block"
                style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
              />
            ) : (
              <QRCodeSVG 
                value={getWalletQrData()}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                includeMargin={false}
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mb-2">Scan this QR code with any crypto wallet</p>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all text-gray-800 border border-gray-300">
            {walletAddress}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 text-gray-800">How to Pay with CPXTB</h3>
          
          <ol className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">1</span>
              <div>
                <p className="font-medium">Open your crypto wallet app</p>
                <p className="text-sm text-gray-600">Any wallet that supports Base network tokens</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">2</span>
              <div>
                <p className="font-medium">Buy Ethereum on Base network</p>
                <p className="text-sm text-gray-600">Use your wallet's exchange feature to purchase ETH on Base network</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">3</span>
              <div>
                <p className="font-medium">Swap ETH to CPXTB on Base network</p>
                <p className="text-sm text-gray-600">Use a DEX like BaseSwap to convert ETH to CPXTB token</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">4</span>
              <div>
                <p className="font-medium">Scan the QR code or enter wallet address</p>
                <p className="text-sm text-gray-600">Make sure you're sending <strong>CPXTB tokens</strong>, not ETH or BASE coins</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">5</span>
              <div>
                <p className="font-medium">Enter the exact amount in CPXTB</p>
                <p className="text-sm text-gray-600">We'll provide the exact CPXTB amount at checkout</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">6</span>
              <div>
                <p className="font-medium">Confirm and send your payment</p>
                <p className="text-sm text-gray-600">Transaction confirmation usually takes 10-30 seconds</p>
              </div>
            </li>
          </ol>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 font-medium">⚠️ Important: Only send CPXTB tokens</p>
            <p className="text-amber-700 text-sm">Sending any other cryptocurrency to this address may result in permanent loss of funds.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold mb-3 text-gray-800">About CPXTB Token</h3>
        <p className="text-gray-700">
          CPXTB is a utility token on the Base network that enables fast and low-cost payments. 
          Visit <a href="https://coinmarketcap.com/currencies/coin-prediction-tool-on-base/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CoinMarketCap</a> for current pricing and market information.
        </p>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>CPXTB Token Contract Address:</p>
          <code className="bg-gray-100 p-1 rounded text-xs font-mono text-gray-800 border border-gray-300">{CPXTB_TOKEN_ADDRESS}</code>
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {businessName} | Powered by CPXTB Platform</p>
        </div>
      </div>

      {/* Special print-only version that's completely separate from the regular display */}
      <div className="hidden">
        <div className="print-only-pamphlet" style={{ display: 'none' }}>
          {/* QR code section - moved to absolute positioning to avoid page flow issues */}
          <div style={{ position: 'absolute', top: '-20mm', left: '0', right: '0', textAlign: 'center', zIndex: 1000, margin: '0', padding: '0' }}>
            <div style={{ display: 'inline-block', border: '4px solid #3b82f6', borderRadius: '8px', padding: '4px', backgroundColor: 'white', width: '140px', height: '140px', margin: '0 auto' }}>
              {prerenderedQrCode && (
                <img 
                  src={prerenderedQrCode} 
                  alt="QR code for wallet"
                  width={132}
                  height={132}
                  style={{ display: 'block', margin: '0 auto' }}
                />
              )}
            </div>
            <p style={{ fontSize: '12px', margin: '8px 0 4px 0', color: '#1f2937', fontWeight: 'bold' }}>
              Scan this QR code with any crypto wallet
            </p>
            <div style={{ 
              fontSize: '10px', 
              fontFamily: 'monospace', 
              padding: '8px', 
              backgroundColor: '#f3f4f6', 
              border: '1px solid #d1d5db', 
              borderRadius: '4px',
              color: '#1f2937',
              maxWidth: '220px',
              margin: '0 auto',
              wordBreak: 'break-all'
            }}>
              {walletAddress}
            </div>
          </div>
          
          {/* Instructions */}
          <div style={{ marginTop: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '12px 0 8px 0', color: '#1f2937' }}>How to Pay with CPXTB</h3>
            <ol style={{ paddingLeft: '20px', margin: '0', color: '#1f2937' }}>
              <li style={{ marginBottom: '4px', fontSize: '12px' }}>Open your crypto wallet app</li>
              <li style={{ marginBottom: '4px', fontSize: '12px' }}>Buy Ethereum on Base network</li>
              <li style={{ marginBottom: '4px', fontSize: '12px' }}>Swap ETH to CPXTB on Base network</li>
              <li style={{ marginBottom: '4px', fontSize: '12px' }}>Scan the QR code or enter wallet address above</li>
              <li style={{ marginBottom: '4px', fontSize: '12px' }}>Enter the exact amount in CPXTB</li>
              <li style={{ marginBottom: '4px', fontSize: '12px' }}>Confirm and send your payment</li>
            </ol>
            
            <div style={{ 
              margin: '12px 0', 
              padding: '8px', 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fbbf24', 
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400e'
            }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>⚠️ Important: Only send CPXTB tokens</p>
              <p style={{ margin: '0', fontSize: '11px' }}>Sending any other cryptocurrency may result in permanent loss of funds.</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0 !important;
            padding: 0 !important;
            size: portrait;
          }
          
          body * {
            display: none !important;
          }
          
          /* Show only our print-specific version */
          .print-only-pamphlet {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            top: 0 !important; /* Place at the very top */
            left: 0;
            width: 100%;
            padding: 0 !important; /* Remove all padding */
            margin: 0 !important; /* Remove all margins */
          }
          
          .print-only-pamphlet * {
            visibility: visible !important;
            display: block !important;
          }
          
          /* Add business name after QR code to maintain context */
          .print-only-pamphlet:after {
            content: "${businessName}";
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            color: #1f2937 !important;
            margin-top: -5px !important;
            display: block !important;
            position: absolute;
            bottom: 10px;
            width: 100%;
            left: 0;
          }
        }
      `}} />
    </div>
  );
}