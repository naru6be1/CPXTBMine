import React from "react";
import {
  PaymentProcessIllustration,
  MerchantDashboardIllustration,
  BlockchainIllustration,
  SecurityIllustration,
  DevicesMockupIllustration,
  TrustBadgeIllustration
} from "./Illustrations";

/**
 * A component that displays a gallery of platform feature illustrations
 */
export function FeatureImageGallery({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
        <PaymentProcessIllustration width={300} height={200} className="mx-auto" />
        <h3 className="text-lg font-semibold mt-4 text-center text-gray-800">Seamless Payment Processing</h3>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Accept cryptocurrency payments with a simple QR code scan
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
        <MerchantDashboardIllustration width={300} height={200} className="mx-auto" />
        <h3 className="text-lg font-semibold mt-4 text-center text-gray-800">Advanced Merchant Dashboard</h3>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Track all transactions with detailed analytics and reporting
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
        <BlockchainIllustration width={300} height={200} className="mx-auto" />
        <h3 className="text-lg font-semibold mt-4 text-center text-gray-800">Blockchain-Powered Security</h3>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Leverage the security and transparency of blockchain technology
        </p>
      </div>
    </div>
  );
}

/**
 * A hero image component with a device mockup illustration
 */
export function HeroImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-100 rounded-full opacity-50 mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200 rounded-full opacity-40 mix-blend-multiply"></div>
      <DevicesMockupIllustration 
        width={500} 
        height={400} 
        className="relative z-10" 
      />
    </div>
  );
}

/**
 * A trust indicators component with security badges
 */
export function TrustIndicators({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col md:flex-row items-center justify-center gap-6 ${className}`}>
      <TrustBadgeIllustration width={250} height={80} className="mx-auto" />
      <div className="flex flex-col items-center md:items-start">
        <h3 className="text-lg font-semibold text-gray-800">Trusted by Merchants</h3>
        <p className="text-sm text-gray-600 mt-1 text-center md:text-left">
          Our platform prioritizes security and transparency
        </p>
        <div className="flex mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg 
              key={star} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="#f59e0b" 
              className="w-5 h-5"
            >
              <path 
                fillRule="evenodd" 
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" 
                clipRule="evenodd" 
              />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A security features showcase component with illustrations
 */
export function SecurityFeatures({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Enterprise-Grade Security</h2>
        <p className="mt-3 text-gray-600">
          Our platform employs advanced security measures to protect your transactions and data:
        </p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Real-time Transaction Monitoring
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Blockchain Verification
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Secure Wallet Integration
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Fraud Prevention Systems
          </li>
        </ul>
      </div>
      <div>
        <SecurityIllustration width={400} height={300} className="mx-auto" />
      </div>
    </div>
  );
}

/**
 * A step-by-step guide visual component
 */
export function StepByStepGuide({ className = "" }: { className?: string }) {
  const steps = [
    {
      title: "Create Your Account",
      description: "Sign up and create your merchant profile with basic business details.",
      icon: (
        <svg className="w-10 h-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: "Set Up Your Wallet",
      description: "Connect your Base blockchain wallet to receive payments.",
      icon: (
        <svg className="w-10 h-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      title: "Create Payment Links",
      description: "Generate payment requests that your customers can easily access.",
      icon: (
        <svg className="w-10 h-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    {
      title: "Start Accepting Payments",
      description: "Customers scan a QR code to complete payments in CPXTB tokens.",
      icon: (
        <svg className="w-10 h-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
            <div className="relative">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                {step.icon}
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">{step.title}</h3>
            <p className="text-gray-600 text-center text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}