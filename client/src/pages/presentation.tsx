import React, { useRef, useState, useEffect } from 'react';
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
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);
  
  // Define image URLs for slides
  const imageUrls = {
    platform: "https://cdn.prod.website-files.com/5ff66329429d880392f6cba2/61c1bd30d54cb587a3b1c6b1_Cryptocurrency%20design%20template.png",
    overview: "https://www.venafi.com/sites/default/files/content/body/Blockchain_Blog_1.png",
    merchant: "https://img.freepik.com/free-vector/business-person-working-computer-office-flat-vector-illustration_1262-18403.jpg",
    dashboard: "https://i.ytimg.com/vi/NZ9J40EZfA0/maxresdefault.jpg",
    payment: "https://cdn.dribbble.com/users/1821386/screenshots/14723773/media/0a9e34f5fb2a7bbf0ec2bf7480e013f2.png",
    customer: "https://img.freepik.com/free-vector/tiny-people-with-bitcoin-blockchain-cryptocurrency_74855-17541.jpg",
    paypal: "https://s.yimg.com/os/creatr-uploaded-images/2021-03/f6955150-8ee2-11eb-9f3c-b9bc84d917f8",
    architecture: "https://cdn.educba.com/academy/wp-content/uploads/2019/04/What-is-Enterprise-Architecture.jpg",
    security: "https://www.bitsight.com/hs-fs/hubfs/Imported_Blog_Media/Top-Three-Information-Security-Frameworks-1.jpeg",
    flow: "https://i.pinimg.com/originals/9a/18/c9/9a18c935c0e765282252feebac039f41.png",
    getStarted: "https://img.freepik.com/free-vector/business-team-discussing-ideas-startup_74855-4380.jpg"
  };
  
  // Function to get the right image for the current slide
  const getSlideImage = (index: number) => {
    switch(index) {
      case 0: return imageUrls.platform;
      case 1: return imageUrls.overview;
      case 2: return imageUrls.merchant;
      case 3: return imageUrls.dashboard;
      case 4: return imageUrls.payment;
      case 5: return imageUrls.customer;
      case 6: return imageUrls.paypal;
      case 7: return imageUrls.architecture;
      case 8: return imageUrls.security;
      case 9: return imageUrls.flow;
      case 10: return imageUrls.getStarted;
      default: return "";
    }
  };
  
  // Function to preload all images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const imagePromises = Object.values(imageUrls).map(url => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          });
        });
        
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Failed to preload images:", error);
        // If images fail to load, we'll still show the presentation without them
        setImagesLoaded(true);
      }
    };
    
    preloadImages();
  }, []);

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
    
    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
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
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Render the current slide
  const renderSlideContent = () => {
    const slide = slides[currentSlide];
    const slideImage = getSlideImage(currentSlide);
    
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
        <div className="mb-6">
          {slide.icon}
        </div>
        <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
        {slide.subtitle && <h2 className="text-xl text-gray-600 mb-4">{slide.subtitle}</h2>}
        
        {slideImage && (
          <div className="mb-6 max-w-md overflow-hidden rounded-lg shadow-md">
            <img 
              src={slideImage} 
              alt={`Slide ${currentSlide + 1} illustration`} 
              className="w-full h-auto object-cover"
              crossOrigin="anonymous"
            />
          </div>
        )}
        
        {typeof slide.content === 'string' ? (
          <p className="text-lg mt-4">{slide.content}</p>
        ) : (
          <ul className="text-left list-disc pl-6 space-y-2 max-w-xl mx-auto mt-4">
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
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
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