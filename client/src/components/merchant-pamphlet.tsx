import React from 'react';
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  // Function to generate QR code data for merchant's wallet
  const getWalletQrData = () => {
    return `ethereum:${walletAddress}?token=${CPXTB_TOKEN_ADDRESS}`;
  };

  // Function to generate PDF and download
  const handlePrint = () => {
    try {
      // Create new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Get pamphlet content element
      const content = document.querySelector('.merchant-pamphlet-container');
      
      if (!content) {
        console.error('Pamphlet content element not found');
        return;
      }
      
      // Clone the element to avoid modifying the original
      const printContent = content.cloneNode(true) as HTMLElement;
      
      // Get all images in the content
      const images = printContent.querySelectorAll('img, svg');
      const qrCode = printContent.querySelector('.qr-code-wrapper svg') as SVGElement;
      
      // Append to body to make it visible for html2canvas
      document.body.appendChild(printContent);
      printContent.style.position = 'absolute';
      printContent.style.left = '-9999px';
      
      // Convert to canvas with html2canvas
      html2canvas(printContent).then(canvas => {
        // Remove the cloned element after we're done with it
        document.body.removeChild(printContent);
        
        const imgData = canvas.toDataURL('image/png');
        
        // Add image to PDF (fitting to page width while maintaining aspect ratio)
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        // Save the PDF
        doc.save(`${businessName.replace(/\s+/g, '_')}_Payment_Guide.pdf`);
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fall back to regular print dialog if PDF generation fails
      window.print();
    }
  };

  return (
    <div className="merchant-pamphlet-container p-6 max-w-2xl mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <div className="print:block hidden absolute top-4 right-4">
        <p className="text-sm text-gray-500">Generated from CPXTB Platform</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Instructions</h2>
        <Button 
          onClick={handlePrint}
          className="print:hidden flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9 L6 2 L18 2 L18 9"/>
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <path d="M6 14h12v8H6z"/>
          </svg>
          Download PDF
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
          <div className="qr-code-wrapper border-4 border-primary p-3 rounded-lg bg-white mb-4 inline-block">
            <QRCodeSVG 
              value={getWalletQrData()}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          </div>
          <p className="text-sm text-gray-500 mb-2">Scan this QR code with any crypto wallet</p>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
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
                <p className="font-medium">Scan the QR code or enter wallet address</p>
                <p className="text-sm text-gray-600">Make sure you're sending <strong>CPXTB tokens</strong>, not ETH or BASE coins</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">3</span>
              <div>
                <p className="font-medium">Enter the exact amount in CPXTB</p>
                <p className="text-sm text-gray-600">We'll provide the exact CPXTB amount at checkout</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white font-bold mr-2">4</span>
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
          <code className="bg-gray-100 p-1 rounded text-xs font-mono">{CPXTB_TOKEN_ADDRESS}</code>
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} {businessName} | Powered by CPXTB Platform</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .merchant-pamphlet-container,
          .merchant-pamphlet-container * {
            visibility: visible;
          }
          .merchant-pamphlet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
        }
      `}} />
    </div>
  );
}