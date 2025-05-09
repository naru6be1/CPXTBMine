import React from "react";

/**
 * This file contains reusable, copyright-free SVG illustrations
 * for use throughout the application.
 */

export const PaymentProcessIllustration: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 400, height = 300, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="payment-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="payment-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Background Elements */}
      <rect
        x="50"
        y="50"
        width="700"
        height="500"
        rx="20"
        fill="url(#payment-grad1)"
        opacity="0.3"
      />
      <circle cx="150" cy="150" r="80" fill="url(#payment-grad2)" opacity="0.5" />
      <circle cx="650" cy="450" r="100" fill="url(#payment-grad2)" opacity="0.5" />

      {/* Payment Terminal */}
      <rect x="300" y="200" width="200" height="300" rx="15" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
      <rect x="320" y="230" width="160" height="80" rx="5" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="400" cy="380" r="40" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="400" cy="380" r="35" fill="#f1f5f9" />
      <rect x="350" y="440" width="100" height="40" rx="5" fill="#3b82f6" />
      <text x="400" y="465" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">PAY</text>

      {/* Phone with Wallet */}
      <rect x="120" y="250" width="120" height="220" rx="10" fill="#334155" />
      <rect x="130" y="270" width="100" height="180" rx="5" fill="#f8fafc" />
      <rect x="150" y="300" width="60" height="40" rx="5" fill="#3b82f6" opacity="0.8" />
      <text x="180" y="325" textAnchor="middle" fill="white" fontSize="14">CPXTB</text>
      <circle cx="180" cy="360" r="20" fill="#3b82f6" opacity="0.5" />
      <path
        d="M170 360 L175 365 L190 350"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />

      {/* QR Code */}
      <rect x="520" y="250" width="120" height="120" rx="10" fill="white" stroke="#3b82f6" strokeWidth="2" />
      <g transform="translate(535, 265)">
        {/* Simplified QR Code pattern */}
        <rect x="0" y="0" width="90" height="90" fill="white" />
        <rect x="10" y="10" width="20" height="20" fill="#334155" />
        <rect x="60" y="10" width="20" height="20" fill="#334155" />
        <rect x="10" y="60" width="20" height="20" fill="#334155" />
        <rect x="40" y="40" width="10" height="10" fill="#334155" />
        <rect x="40" y="10" width="10" height="10" fill="#334155" />
        <rect x="10" y="40" width="10" height="10" fill="#334155" />
        <rect x="60" y="40" width="10" height="10" fill="#334155" />
        <rect x="40" y="60" width="30" height="10" fill="#334155" />
        <rect x="70" y="60" width="10" height="20" fill="#334155" />
      </g>

      {/* Connection Lines */}
      <path
        d="M240 350 Q 270 350, 300 350"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="5,5"
        fill="none"
      />
      <path
        d="M500 350 Q 510 350, 520 310"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="5,5"
        fill="none"
      />

      {/* Icons */}
      <circle cx="270" cy="350" r="10" fill="#3b82f6" />
      <circle cx="510" cy="350" r="10" fill="#3b82f6" />
    </svg>
  );
};

export const MerchantDashboardIllustration: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 400, height = 300, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="dashboard-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="dashboard-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Background Elements */}
      <rect
        x="50"
        y="50"
        width="700"
        height="500"
        rx="20"
        fill="url(#dashboard-grad1)"
        opacity="0.3"
      />

      {/* Dashboard Screen */}
      <rect x="150" y="120" width="500" height="360" rx="10" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
      <rect x="150" y="120" width="500" height="40" rx="10" fill="#4f46e5" />
      <circle cx="175" cy="140" r="8" fill="#ef4444" />
      <circle cx="200" cy="140" r="8" fill="#f59e0b" />
      <circle cx="225" cy="140" r="8" fill="#10b981" />

      {/* Side Navigation */}
      <rect x="150" y="160" width="100" height="320" fill="#f8fafc" />
      <rect x="170" y="180" width="60" height="10" rx="5" fill="#4f46e5" opacity="0.7" />
      <rect x="170" y="210" width="60" height="10" rx="5" fill="#64748b" opacity="0.3" />
      <rect x="170" y="240" width="60" height="10" rx="5" fill="#64748b" opacity="0.3" />
      <rect x="170" y="270" width="60" height="10" rx="5" fill="#64748b" opacity="0.3" />
      <rect x="170" y="300" width="60" height="10" rx="5" fill="#64748b" opacity="0.3" />

      {/* Charts and Data */}
      <rect x="270" y="180" width="180" height="120" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M290 260 L310 230 L330 250 L350 210 L370 240 L390 200 L410 220 L430 190" 
            stroke="#4f46e5" strokeWidth="3" fill="none" />
      <circle cx="310" cy="230" r="4" fill="#4f46e5" />
      <circle cx="350" cy="210" r="4" fill="#4f46e5" />
      <circle cx="390" cy="200" r="4" fill="#4f46e5" />
      <circle cx="430" cy="190" r="4" fill="#4f46e5" />
      
      {/* Bar Chart */}
      <rect x="470" y="180" width="160" height="120" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="490" y="250" width="20" height="30" fill="#4f46e5" opacity="0.8" />
      <rect x="520" y="230" width="20" height="50" fill="#4f46e5" opacity="0.6" />
      <rect x="550" y="210" width="20" height="70" fill="#4f46e5" opacity="0.8" />
      <rect x="580" y="220" width="20" height="60" fill="#4f46e5" opacity="0.6" />

      {/* Data Tables */}
      <rect x="270" y="320" width="360" height="140" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="270" y1="350" x2="630" y2="350" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="270" y1="380" x2="630" y2="380" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="270" y1="410" x2="630" y2="410" stroke="#e2e8f0" strokeWidth="1" />
      <line x1="270" y1="440" x2="630" y2="440" stroke="#e2e8f0" strokeWidth="1" />
      
      {/* Table Headers */}
      <rect x="280" y="330" width="40" height="10" rx="2" fill="#4f46e5" opacity="0.2" />
      <rect x="350" y="330" width="60" height="10" rx="2" fill="#4f46e5" opacity="0.2" />
      <rect x="440" y="330" width="50" height="10" rx="2" fill="#4f46e5" opacity="0.2" />
      <rect x="520" y="330" width="70" height="10" rx="2" fill="#4f46e5" opacity="0.2" />
      
      {/* Table Data */}
      <rect x="280" y="360" width="30" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="350" y="360" width="50" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="440" y="360" width="40" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="520" y="360" width="60" height="8" rx="2" fill="#64748b" opacity="0.3" />
      
      <rect x="280" y="390" width="30" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="350" y="390" width="50" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="440" y="390" width="40" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="520" y="390" width="60" height="8" rx="2" fill="#64748b" opacity="0.3" />
      
      <rect x="280" y="420" width="30" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="350" y="420" width="50" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="440" y="420" width="40" height="8" rx="2" fill="#64748b" opacity="0.3" />
      <rect x="520" y="420" width="60" height="8" rx="2" fill="#64748b" opacity="0.3" />
    </svg>
  );
};

export const BlockchainIllustration: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 400, height = 300, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="blockchain-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0891b2" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Background Element */}
      <rect
        x="50"
        y="50"
        width="700"
        height="500"
        rx="20"
        fill="url(#blockchain-grad1)"
        opacity="0.3"
      />

      {/* Block 1 */}
      <rect x="120" y="200" width="150" height="200" rx="10" fill="#ffffff" stroke="#0891b2" strokeWidth="2" />
      <rect x="120" y="200" width="150" height="40" rx="10" fill="#0891b2" />
      <text x="195" y="225" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">BLOCK #1</text>
      <rect x="140" y="260" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="140" y="290" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="140" y="320" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="140" y="350" width="70" height="30" rx="5" fill="#0891b2" opacity="0.8" />
      <text x="175" y="370" textAnchor="middle" fill="white" fontSize="14">HASH</text>

      {/* Block 2 */}
      <rect x="320" y="200" width="150" height="200" rx="10" fill="#ffffff" stroke="#0891b2" strokeWidth="2" />
      <rect x="320" y="200" width="150" height="40" rx="10" fill="#0891b2" />
      <text x="395" y="225" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">BLOCK #2</text>
      <rect x="340" y="260" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="340" y="290" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="340" y="320" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="340" y="350" width="70" height="30" rx="5" fill="#0891b2" opacity="0.8" />
      <text x="375" y="370" textAnchor="middle" fill="white" fontSize="14">HASH</text>

      {/* Block 3 */}
      <rect x="520" y="200" width="150" height="200" rx="10" fill="#ffffff" stroke="#0891b2" strokeWidth="2" />
      <rect x="520" y="200" width="150" height="40" rx="10" fill="#0891b2" />
      <text x="595" y="225" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">BLOCK #3</text>
      <rect x="540" y="260" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="540" y="290" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="540" y="320" width="110" height="15" rx="2" fill="#e2e8f0" />
      <rect x="540" y="350" width="70" height="30" rx="5" fill="#0891b2" opacity="0.8" />
      <text x="575" y="370" textAnchor="middle" fill="white" fontSize="14">HASH</text>

      {/* Connection Lines */}
      <path
        d="M210 370 L320 370"
        stroke="#0891b2"
        strokeWidth="3"
        strokeDasharray="5,5"
        fill="none"
      />
      <path
        d="M410 370 L520 370"
        stroke="#0891b2"
        strokeWidth="3"
        strokeDasharray="5,5"
        fill="none"
      />

      {/* Nodes */}
      <circle cx="265" cy="370" r="10" fill="#0891b2" />
      <circle cx="465" cy="370" r="10" fill="#0891b2" />

      {/* Networks */}
      <circle cx="220" cy="140" r="40" fill="#f8fafc" stroke="#0891b2" strokeWidth="2" />
      <circle cx="400" cy="100" r="30" fill="#f8fafc" stroke="#0891b2" strokeWidth="2" />
      <circle cx="580" cy="140" r="40" fill="#f8fafc" stroke="#0891b2" strokeWidth="2" />

      {/* Network Connections */}
      <path
        d="M220 180 L220 200"
        stroke="#0891b2"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
      <path
        d="M400 130 L400 200"
        stroke="#0891b2"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
      <path
        d="M580 180 L580 200"
        stroke="#0891b2"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
      <path
        d="M220 140 L400 100"
        stroke="#0891b2"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
      <path
        d="M400 100 L580 140"
        stroke="#0891b2"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
    </svg>
  );
};

export const SecurityIllustration: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 400, height = 300, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="security-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Background Element */}
      <rect
        x="50"
        y="50"
        width="700"
        height="500"
        rx="20"
        fill="url(#security-grad1)"
        opacity="0.3"
      />

      {/* Shield */}
      <path
        d="M400 150 L250 200 L250 350 Q325 450, 400 500 Q475 450, 550 350 L550 200 Z"
        fill="#ffffff"
        stroke="#059669"
        strokeWidth="4"
      />
      <path
        d="M400 190 L290 230 L290 340 Q345 420, 400 460 Q455 420, 510 340 L510 230 Z"
        fill="#f0fdfa"
        stroke="#059669"
        strokeWidth="2"
      />

      {/* Check Mark */}
      <path
        d="M350 320 L380 350 L450 280"
        stroke="#059669"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Lock */}
      <rect x="370" y="100" width="60" height="60" rx="10" fill="#059669" />
      <circle cx="400" cy="120" r="10" fill="#ffffff" />
      <rect x="395" y="120" width="10" height="20" fill="#ffffff" />

      {/* Background Circles */}
      <circle cx="200" cy="200" r="30" fill="#059669" opacity="0.2" />
      <circle cx="600" cy="400" r="40" fill="#059669" opacity="0.2" />
      <circle cx="250" cy="450" r="25" fill="#059669" opacity="0.2" />
      <circle cx="550" cy="150" r="35" fill="#059669" opacity="0.2" />

      {/* Binary code-like elements */}
      <text x="150" y="150" fill="#059669" opacity="0.5" fontSize="12">10110101</text>
      <text x="600" y="200" fill="#059669" opacity="0.5" fontSize="12">01001101</text>
      <text x="200" y="500" fill="#059669" opacity="0.5" fontSize="12">11100010</text>
      <text x="500" y="500" fill="#059669" opacity="0.5" fontSize="12">00111010</text>
    </svg>
  );
};

export const DevicesMockupIllustration: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 400, height = 300, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 800 600"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="devices-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Background Element */}
      <rect
        x="50"
        y="50"
        width="700"
        height="500"
        rx="20"
        fill="url(#devices-grad1)"
        opacity="0.2"
      />

      {/* Desktop */}
      <rect x="200" y="150" width="400" height="250" rx="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
      <rect x="210" y="160" width="380" height="210" rx="2" fill="#f8fafc" />
      <rect x="300" y="400" width="200" height="20" rx="5" fill="#3b82f6" opacity="0.8" />
      <rect x="350" y="420" width="100" height="10" fill="#3b82f6" opacity="0.8" />

      {/* Browser UI in Desktop */}
      <rect x="230" y="180" width="340" height="20" rx="3" fill="#e2e8f0" />
      <circle cx="240" cy="190" r="5" fill="#ef4444" />
      <circle cx="255" cy="190" r="5" fill="#f59e0b" />
      <circle cx="270" cy="190" r="5" fill="#10b981" />
      <rect x="290" y="185" width="200" height="10" rx="2" fill="#cbd5e1" />

      {/* Content in Desktop */}
      <rect x="240" y="210" width="320" height="140" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <rect x="260" y="230" width="280" height="10" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="260" y="250" width="200" height="10" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="260" y="270" width="250" height="10" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="260" y="290" width="150" height="40" rx="5" fill="#3b82f6" opacity="0.7" />
      <text x="335" y="315" textAnchor="middle" fill="white" fontSize="16">Pay Now</text>

      {/* Tablet */}
      <rect x="100" y="250" width="180" height="240" rx="10" fill="#334155" />
      <rect x="110" y="270" width="160" height="200" rx="5" fill="#f8fafc" />
      <circle cx="190" cy="480" r="10" fill="#f8fafc" stroke="#334155" strokeWidth="1" />

      {/* Content in Tablet */}
      <rect x="125" y="290" width="130" height="10" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="125" y="310" width="100" height="10" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="125" y="330" width="130" height="80" rx="5" fill="#3b82f6" opacity="0.1" />
      <rect x="135" y="420" width="70" height="30" rx="5" fill="#3b82f6" opacity="0.7" />
      <text x="170" y="440" textAnchor="middle" fill="white" fontSize="12">Pay</text>

      {/* Phone */}
      <rect x="620" y="270" width="100" height="180" rx="10" fill="#334155" />
      <rect x="628" y="285" width="84" height="150" rx="5" fill="#f8fafc" />
      <circle cx="670" cy="445" r="8" fill="#f8fafc" stroke="#334155" strokeWidth="1" />

      {/* Content in Phone */}
      <rect x="640" y="300" width="60" height="8" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="640" y="315" width="40" height="8" rx="2" fill="#3b82f6" opacity="0.2" />
      <rect x="640" y="330" width="60" height="50" rx="5" fill="#3b82f6" opacity="0.1" />
      <rect x="645" y="390" width="40" height="25" rx="5" fill="#3b82f6" opacity="0.7" />
      <text x="665" y="407" textAnchor="middle" fill="white" fontSize="10">Pay</text>
    </svg>
  );
};

export const TrustBadgeIllustration: React.FC<{
  width?: number;
  height?: number;
  className?: string;
}> = ({ width = 300, height = 100, className = "" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Security Badge */}
      <rect x="50" y="50" width="500" height="100" rx="10" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2" />
      
      {/* Lock Icon */}
      <circle cx="110" cy="100" r="30" fill="#3b82f6" opacity="0.1" />
      <rect x="100" y="95" width="20" height="25" rx="3" fill="#3b82f6" />
      <rect x="95" y="95" width="30" height="15" rx="3" fill="#3b82f6" />
      <circle cx="110" cy="105" r="4" fill="#ffffff" />
      <line x1="110" y1="105" x2="110" y2="110" stroke="#ffffff" strokeWidth="2" />
      
      {/* Checkmark Icon */}
      <circle cx="210" cy="100" r="30" fill="#10b981" opacity="0.1" />
      <path d="M195 100 L205 110 L225 90" stroke="#10b981" strokeWidth="4" fill="none" />
      
      {/* Shield Icon */}
      <circle cx="310" cy="100" r="30" fill="#3b82f6" opacity="0.1" />
      <path d="M310 80 L290 90 L290 110 Q300 125, 310 130 Q320 125, 330 110 L330 90 Z" fill="#3b82f6" />
      <path d="M305 105 L315 95" stroke="#ffffff" strokeWidth="2" />
      <path d="M305 95 L315 105" stroke="#ffffff" strokeWidth="2" />
      
      {/* Trust Text */}
      <text x="410" y="105" textAnchor="middle" fill="#334155" fontSize="18" fontWeight="bold">SECURE PAYMENTS</text>
      
      {/* Stars */}
      <path d="M480 90 L485 100 L495 100 L487 105 L490 115 L480 110 L470 115 L473 105 L465 100 L475 100 Z" fill="#f59e0b" />
      <path d="M500 90 L505 100 L515 100 L507 105 L510 115 L500 110 L490 115 L493 105 L485 100 L495 100 Z" fill="#f59e0b" />
      <path d="M520 90 L525 100 L535 100 L527 105 L530 115 L520 110 L510 115 L513 105 L505 100 L515 100 Z" fill="#f59e0b" />
    </svg>
  );
};