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
  
  // Function to convert SVG QR code to data URL
  const getQRCodeDataUrl = async (qrCodeElement: SVGElement): Promise<string> => {
    // Get the QR code SVG as a string
    const svgString = new XMLSerializer().serializeToString(qrCodeElement);
    
    // Create a Blob with the SVG string
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create an Image element to load the SVG
    const img = new Image();
    
    // Wait for the image to load
    return new Promise((resolve) => {
      img.onload = () => {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const scale = 2; // Increase scale for better quality
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx!.fillStyle = '#ffffff';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Clean up
        URL.revokeObjectURL(url);
        
        // Return the data URL
        resolve(dataUrl);
      };
      
      // Set the image source to the Blob URL
      img.src = url;
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
      
      // Create new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Get pamphlet content element using ref if available
      const content = pamphletRef.current;
      
      if (!content) {
        console.error('Pamphlet content element not found');
        document.body.removeChild(loadingDiv);
        setIsGenerating(false);
        
        toast({
          title: "PDF Generation Error",
          description: "Could not find the pamphlet content. Please try again.",
          variant: "destructive"
        });
        
        return;
      }
      
      // Clone the element to avoid modifying the original
      const printContent = content.cloneNode(true) as HTMLElement;
      
      // Replace all QR code elements with simple image elements for better PDF rendering
      if (qrCodeImage) {
        const qrWrapper = printContent.querySelector('.qr-code-wrapper');
        if (qrWrapper) {
          // Clear the wrapper and add a simple image
          qrWrapper.innerHTML = '';
          const img = document.createElement('img');
          img.src = qrCodeImage;
          img.width = 200;
          img.height = 200;
          img.style.display = 'block';
          qrWrapper.appendChild(img);
        }
      }
      
      // Append to body to make it visible for html2canvas but hide it
      document.body.appendChild(printContent);
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      printContent.style.width = '794px'; // A4 width in pixels at 96 DPI
      
      // Wait a moment for everything to render
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Convert to canvas with html2canvas - use higher scale for better quality
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      
      // Remove the cloned element after we're done with it
      document.body.removeChild(printContent);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF (fitting to page width while maintaining aspect ratio)
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add white background to ensure visibility
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      // Add the image on top of the white background
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // If we have a QR code image, add it directly to the PDF as well for guaranteed visibility
      if (qrCodeImage) {
        // Calculate position for QR code - find its relative position in the pamphlet
        const qrBoxSize = Math.min(pdfWidth * 0.25, pdfHeight * 0.25); // Take smaller dimension for consistent sizing
        const qrPosition = {
          x: pdfWidth * 0.132, // Moved very slightly right from previous position
          y: pdfHeight * 0.272, // Moved very slightly up from previous position
          width: qrBoxSize, // Square sizing based on page dimensions
          height: qrBoxSize // Square, so same as width
        };
        
        // Draw a white background for the QR code with larger padding
        doc.setFillColor(255, 255, 255);
        doc.rect(qrPosition.x - 5, qrPosition.y - 5, qrPosition.width + 10, qrPosition.height + 10, 'F');
        
        // Draw a border with primary color
        doc.setDrawColor(0, 78, 152); // Primary blue color 
        doc.setLineWidth(1.5);
        doc.rect(qrPosition.x - 5, qrPosition.y - 5, qrPosition.width + 10, qrPosition.height + 10, 'S');
        
        // Add the QR code image on top of this
        doc.addImage(qrCodeImage, 'PNG', qrPosition.x, qrPosition.y, qrPosition.width, qrPosition.height);
      }
      
      // Save the PDF
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
          <h1 style={{ fontSize: '20px', textAlign: 'center', marginBottom: '8px' }}>{businessName}</h1>
          
          {/* QR code at the very top */}
          <div style={{ textAlign: 'center', marginTop: '0px' }}>
            <div style={{ display: 'inline-block', border: '4px solid #3b82f6', borderRadius: '8px', padding: '4px', backgroundColor: 'white', width: '170px', height: '170px' }}>
              {prerenderedQrCode && (
                <img 
                  src={prerenderedQrCode} 
                  alt="QR code for wallet"
                  width={160}
                  height={160}
                  style={{ display: 'block' }}
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
          body * {
            display: none !important;
          }
          
          /* Show only our print-specific version */
          .print-only-pamphlet {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20px;
          }
          
          .print-only-pamphlet * {
            visibility: visible !important;
            display: block !important;
          }
        }
      `}} />
    </div>
  );
}