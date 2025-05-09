import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Menu, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Home,
  Wallet,
  QrCode,
  CreditCard,
  Database,
  Shield,
  FileText,
  CheckCircle
} from 'lucide-react';

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      title: "CPXTB Payment Platform",
      subtitle: "Streamlined Cryptocurrency Payments for Merchants",
      content: "The simple way to accept CPXTB token payments for your business",
      icon: <Home className="h-20 w-20 text-primary" />
    },
    {
      title: "Platform Overview",
      content: [
        "Accept cryptocurrency payments in CPXTB tokens on the Base blockchain",
        "Customers can pay using their existing wallets or through PayPal integration",
        "Real-time transaction monitoring ensures payment verification",
        "Customizable payment pages to match your brand",
        "Comprehensive dashboard for payment management"
      ],
      icon: <Wallet className="h-20 w-20 text-primary" />
    },
    {
      title: "For Merchants - Getting Started",
      content: [
        "Register your business account with email or social login",
        "Connect your CPXTB wallet for receiving payments",
        "Complete your business profile",
        "Access your merchant dashboard",
        "Create your first payment request"
      ],
      icon: <CreditCard className="h-20 w-20 text-primary" />
    },
    {
      title: "Merchant Dashboard",
      content: [
        "Create new payment requests",
        "Monitor transaction history",
        "Track wallet balance",
        "Customize payment pages",
        "Generate QR codes",
        "Access API keys"
      ],
      icon: <Database className="h-20 w-20 text-primary" />
    },
    {
      title: "Creating Payment Requests",
      content: [
        "Enter payment amount in USD",
        "Add description and order ID (optional)",
        "Set expiration time",
        "Add success URL for redirecting customers",
        "Generate payment link and QR code",
        "Share with customers via email, SMS, or embed in your website"
      ],
      icon: <FileText className="h-20 w-20 text-primary" />
    },
    {
      title: "For Customers - Making Payments",
      content: [
        "Customer views payment page with merchant branding",
        "Connects wallet via social login or direct connection",
        "Scans QR code or uses direct payment button",
        "Confirms transaction in their wallet",
        "Receives real-time confirmation when payment is verified"
      ],
      icon: <QrCode className="h-20 w-20 text-primary" />
    },
    {
      title: "PayPal Integration",
      content: [
        "For customers without CPXTB tokens",
        "Purchase tokens directly within the payment flow",
        "PayPal checkout integration for familiar payment experience",
        "Tokens automatically credited to customer wallet",
        "Seamless return to the payment flow"
      ],
      icon: <CreditCard className="h-20 w-20 text-primary" />
    },
    {
      title: "Technical Architecture",
      content: [
        "Frontend: React with TypeScript, shadcn/ui components, Tailwind CSS",
        "Backend: Express.js with PostgreSQL database",
        "Blockchain: Base network integration with Web3Modal",
        "Real-time Updates: WebSocket for live payment status",
        "Security: Enhanced challenge middleware, email confirmation"
      ],
      icon: <Database className="h-20 w-20 text-primary" />
    },
    {
      title: "Security Features",
      content: [
        "Transaction validation with blockchain verification",
        "Email confirmation with database-level duplicate prevention",
        "Payment expiration handling for abandoned transactions",
        "Rate limiting to prevent abuse",
        "WebSocket security for real-time updates"
      ],
      icon: <Shield className="h-20 w-20 text-primary" />
    },
    {
      title: "Transaction Flow",
      content: [
        "Merchant creates payment request",
        "System generates payment page with QR code",
        "Customer connects wallet and initiates payment",
        "Transaction is monitored on the blockchain",
        "Payment is verified and status updated",
        "Merchant receives notification",
        "Customer sees confirmation screen"
      ],
      icon: <CheckCircle className="h-20 w-20 text-primary" />
    },
    {
      title: "Get Started Today",
      content: [
        "Register at cpxtbmining.com",
        "Create your first payment in minutes",
        "Access documentation at docs.cpxtbmining.com",
        "Contact support at support@cpxtbmining.com"
      ],
      icon: <Home className="h-20 w-20 text-primary" />
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const generatePDF = async () => {
    if (!presentationRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Create a loading state or notification here if needed
    
    // We need to capture each slide individually
    for (let i = 0; i < slides.length; i++) {
      // Navigate to the slide
      setCurrentSlide(i);
      
      // Wait for the rendering to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!presentationRef.current) continue;
      
      try {
        const canvas = await html2canvas(presentationRef.current, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Add new page if not the first page
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate the proper dimensions to fit the slide on the page
        const imgWidth = pdfWidth;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
        
      } catch (error) {
        console.error("Error generating PDF slide:", error);
      }
    }
    
    // Save the PDF
    pdf.save('CPXTB_Platform_Presentation.pdf');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Render the current slide
  const renderSlideContent = () => {
    const slide = slides[currentSlide];
    
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
        <div className="mb-8">
          {slide.icon}
        </div>
        <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
        {slide.subtitle && <h2 className="text-xl text-gray-600 mb-6">{slide.subtitle}</h2>}
        
        {typeof slide.content === 'string' ? (
          <p className="text-lg">{slide.content}</p>
        ) : (
          <ul className="text-left list-disc pl-6 space-y-2 max-w-xl mx-auto">
            {slide.content.map((item, index) => (
              <li key={index} className="text-lg">{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with hamburger menu */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">CPXTB Platform Presentation</h1>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 py-1 border">
              <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                Presentation Options
              </div>
              <button 
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={generatePDF}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col p-4">
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden" ref={presentationRef}>
          {renderSlideContent()}
        </div>
        
        {/* Navigation controls */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Slide {currentSlide + 1} of {slides.length}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}