import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2, Download, FileText, FilePenLine, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import PDFDocument from 'pdfkit';
import { PLATFORM_NAME } from "@shared/constants";

// Document types
type DocumentType = 'merchant' | 'llc';

// Interface for document fields
interface DocumentField {
  name: string;
  value: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'date' | 'email';
}

export function LegalDocuments() {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<DocumentType>('merchant');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for document fields
  const [merchantFields, setMerchantFields] = useState<DocumentField[]>([
    { name: 'businessName', value: '', placeholder: 'Business Name', required: true, type: 'text' },
    { name: 'businessAddress', value: '', placeholder: 'Business Address', required: true, type: 'text' },
    { name: 'contactName', value: '', placeholder: 'Contact Person Name', required: true, type: 'text' },
    { name: 'contactEmail', value: '', placeholder: 'Contact Email', required: true, type: 'email' },
    { name: 'businessType', value: '', placeholder: 'Business Type', required: true, type: 'text' },
    { name: 'walletAddress', value: '', placeholder: 'Wallet Address', required: true, type: 'text' },
    { name: 'agreementDate', value: '', placeholder: 'Agreement Date', required: true, type: 'date' },
  ]);
  
  const [llcFields, setLlcFields] = useState<DocumentField[]>([
    { name: 'llcName', value: '', placeholder: 'LLC Name', required: true, type: 'text' },
    { name: 'llcAddress', value: '', placeholder: 'LLC Registered Address', required: true, type: 'text' },
    { name: 'ownerName', value: '', placeholder: 'LLC Owner Full Name', required: true, type: 'text' },
    { name: 'ownerTitle', value: '', placeholder: 'Owner Title (e.g., Managing Member)', required: true, type: 'text' },
    { name: 'ownerEmail', value: '', placeholder: 'Owner Email', required: true, type: 'email' },
    { name: 'taxId', value: '', placeholder: 'Tax ID / EIN', required: true, type: 'text' },
    { name: 'stateOfFormation', value: '', placeholder: 'State of Formation', required: true, type: 'text' },
    { name: 'agreementDate', value: '', placeholder: 'Agreement Date', required: true, type: 'date' },
  ]);
  
  // Update field values for merchant agreement
  const updateMerchantField = (index: number, value: string) => {
    const updatedFields = [...merchantFields];
    updatedFields[index].value = value;
    setMerchantFields(updatedFields);
  };
  
  // Update field values for LLC agreement
  const updateLlcField = (index: number, value: string) => {
    const updatedFields = [...llcFields];
    updatedFields[index].value = value;
    setLlcFields(updatedFields);
  };
  
  // Current fields based on document type
  const currentFields = documentType === 'merchant' ? merchantFields : llcFields;
  const updateField = documentType === 'merchant' ? updateMerchantField : updateLlcField;
  
  // Check if all required fields are filled
  const isFormValid = () => {
    return currentFields.every(field => !field.required || field.value.trim() !== '');
  };
  
  // Generate merchant agreement PDF
  const generateMerchantAgreement = async () => {
    try {
      console.log('Initializing jsPDF for merchant agreement...');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('Setting up document dimensions...');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        console.log(`Adding text at position (${x}, ${y}): ${text.substring(0, 30)}...`);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };
      
      // Set professional colors using RGB values for jsPDF compatibility
      const primaryColorR = 26;   // RGB for #1a457a
      const primaryColorG = 69;
      const primaryColorB = 122;
      
      const accentColorR = 32;    // RGB for #203864
      const accentColorG = 56;
      const accentColorB = 100;
      
      // Add a subtle header with logo effect
      doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text on blue background
      const title = 'MERCHANT AGREEMENT FOR CPXTB TOKEN PAYMENTS';
      doc.text(title, pageWidth / 2, 20, { align: 'center' });
      
      // Introduction
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset text color to black for body text
      let y = 40; // Start content a bit lower to avoid header
      
      // Add decorative line under header
      doc.setDrawColor(accentColorR, accentColorG, accentColorB);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);
      
      y = addWrappedText(
        `THIS MERCHANT AGREEMENT (the "Agreement") is made and entered into effective as of ${merchantFields[6].value} (the "Effective Date"), by and between the parties identified below:`,
        margin, y, contentWidth, 6
      );
      
      // Parties
      y += 10;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(
        `${PLATFORM_NAME}, a blockchain payment solutions provider ("Platform Provider")`,
        margin, y, contentWidth, 6
      );
      
      y += 6;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(
        `and`,
        margin, y, contentWidth, 6
      );
      
      y += 6;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(
        `${merchantFields[0].value}, a ${merchantFields[4].value} ("Merchant"), with its principal place of business located at ${merchantFields[1].value}`,
        margin, y, contentWidth, 6
      );
      
      // Agreement body
      y += 10;
      doc.setFont('helvetica', 'normal');
      
      // Recitals
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('RECITALS', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        'WHEREAS, Platform Provider has developed and operates a proprietary blockchain-based payment processing platform (the "Platform") that enables merchants to securely accept CPXTB tokens as payment for goods and services;',
        margin, y, contentWidth, 6
      );
      
      y += 8;
      y = addWrappedText(
        'WHEREAS, Merchant desires to utilize the Platform to accept CPXTB tokens as payment for its goods and services in accordance with the terms and conditions set forth herein;',
        margin, y, contentWidth, 6
      );
      
      y += 8;
      y = addWrappedText(
        'NOW, THEREFORE, for good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties, intending to be legally bound, hereby agree as follows:',
        margin, y, contentWidth, 6
      );
      
      // Agreement terms - 1. SERVICES
      y += 10;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('1. SERVICES', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '1.1 Subject to the terms and conditions of this Agreement, Platform Provider shall provide Merchant with access to the Platform, which enables Merchant to accept CPXTB tokens as payment for goods and services.\n\n' +
        '1.2 The Platform services include, but are not limited to: (a) secure payment processing infrastructure; (b) automated transaction verification on the Base blockchain network; (c) merchant dashboard with transaction reporting and analytics; (d) payment notification system; and (e) customizable customer-facing payment interfaces.',
        margin, y, contentWidth, 6
      );
      
      y += 10;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('2. MERCHANT OBLIGATIONS', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '2.1 Merchant Information. Merchant shall maintain accurate and up-to-date business information on the Platform, including but not limited to legal business name, contact information, and business description.\n\n' +
        '2.2 Wallet Address. Merchant shall provide and maintain a valid blockchain wallet address on the Base network to receive CPXTB token payments. Merchant shall be solely responsible for the security and control of its wallet private keys.\n\n' +
        '2.3 Legal Compliance. Merchant represents and warrants that it shall comply with all applicable laws, regulations, and industry standards related to cryptocurrency transactions, including but not limited to anti-money laundering (AML) requirements, tax reporting obligations, and consumer protection laws.\n\n' +
        '2.4 Risk Acknowledgment. Merchant expressly acknowledges and accepts the inherent volatility of cryptocurrency values and assumes all risks associated with accepting CPXTB tokens as payment, including but not limited to price fluctuations, liquidity risks, and regulatory uncertainties.',
        margin, y, contentWidth, 6
      );
      
      y += 30;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('3. FEES AND PAYMENT TERMS', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '3.1 Transaction Fee. Platform Provider shall charge a transaction fee equal to one percent (1.0%) of the value of all completed CPXTB token payments processed through the Platform ("Transaction Fee").\n\n' +
        '3.2 Fee Calculation and Collection. The Transaction Fee shall be automatically calculated and deducted from each payment transaction at the time of settlement. Merchant hereby authorizes Platform Provider to deduct the applicable Transaction Fee from each payment prior to settlement to Merchant\'s wallet address.',
        margin, y, contentWidth, 6
      );
      
      y += 10;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('4. TERM AND TERMINATION', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '4.1 Term. This Agreement shall commence on the Effective Date and continue in full force and effect until terminated in accordance with the provisions set forth herein (the "Term").\n\n' +
        '4.2 Termination for Convenience. Either party may terminate this Agreement for any reason or no reason upon thirty (30) days\' prior written notice to the other party.\n\n' +
        '4.3 Termination for Cause. Platform Provider may terminate this Agreement immediately and without prior notice if: (a) Merchant breaches any material term of this Agreement; (b) Merchant engages in any unlawful activity in connection with its use of the Platform; (c) Merchant\'s use of the Platform poses a security risk to Platform Provider or other Platform users; or (d) Platform Provider is required to do so by law or regulatory action.\n\n' +
        '4.4 Effect of Termination. Upon termination of this Agreement: (a) Merchant shall immediately cease all use of the Platform; (b) Platform Provider shall settle all pending transactions in accordance with their terms; and (c) all rights and licenses granted to Merchant under this Agreement shall immediately terminate.',
        margin, y, contentWidth, 6
      );
      
      y += 25;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('5. REPRESENTATIONS, WARRANTIES, AND LIMITATION OF LIABILITY', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '5.1 Merchant Representations and Warranties. Merchant represents and warrants that: (a) it has the full power and authority to enter into and perform its obligations under this Agreement; (b) its use of the Platform will comply with all applicable laws and regulations; and (c) it has obtained all necessary approvals, consents, and authorizations to accept cryptocurrency payments.\n\n' +
        '5.2 Platform Provider Representations and Warranties. Platform Provider represents and warrants that: (a) it has the full power and authority to enter into and perform its obligations under this Agreement; and (b) the Platform will perform substantially in accordance with its documentation when used as authorized herein.\n\n' +
        '5.3 Disclaimer of Warranties. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND. PLATFORM PROVIDER EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.\n\n' +
        '5.4 Limitation of Liability. IN NO EVENT SHALL PLATFORM PROVIDER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES (EVEN IF PLATFORM PROVIDER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), RESULTING FROM THE USE OR INABILITY TO USE THE PLATFORM OR ANY OTHER MATTER RELATING TO THIS AGREEMENT.',
        margin, y, contentWidth, 6
      );
      
      // Add new page for signatures
      doc.addPage();
      y = 20;
      
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('6. GOVERNING LAW AND DISPUTE RESOLUTION', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '6.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which Platform Provider is registered, without giving effect to any choice of law or conflict of law provisions.\n\n' +
        '6.2 Dispute Resolution. Any controversy or claim arising out of or relating to this Agreement, or the breach thereof, shall first be addressed through good faith negotiation between the parties. If such negotiation fails to resolve the dispute within thirty (30) days, either party may initiate binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in the jurisdiction where Platform Provider is headquartered, and judgment on the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof.',
        margin, y, contentWidth, 6
      );
      
      y += 15;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('7. MISCELLANEOUS PROVISIONS', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '7.1 Entire Agreement. This Agreement constitutes the entire understanding between the parties concerning the subject matter hereof and supersedes all prior agreements, understandings, or negotiations, whether written or oral.\n\n' +
        '7.2 Amendments. No amendment or modification of this Agreement shall be valid or binding unless made in writing and signed by both parties.\n\n' +
        '7.3 Assignment. Merchant may not assign this Agreement or any rights or obligations hereunder without the prior written consent of Platform Provider. Platform Provider may assign this Agreement to any successor to its business or assets.\n\n' +
        '7.4 Force Majeure. Neither party shall be liable for any failure or delay in performance due to causes beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, war, terrorism, riots, civil unrest, governmental actions, labor disputes, or internet or blockchain network disruptions.',
        margin, y, contentWidth, 6
      );
      
      // Signatures
      y += 20;
      // Add a decorative line above signatures
      doc.setDrawColor(accentColorR, accentColorG, accentColorB);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section header
      y = addWrappedText('IN WITNESS WHEREOF', margin + 2, y + 5, contentWidth, 6);
      y += 10;
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText('The parties have executed this Agreement as of the Effective Date.', margin, y, contentWidth, 6);
      
      // Add signature boxes with light backgrounds
      y += 15;
      // First signature box - Platform Provider
      doc.setFillColor(240, 240, 245); // Light gray background
      doc.roundedRect(margin, y, contentWidth, 65, 2, 2, 'F');
      
      // Platform Provider header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColorR, accentColorG, accentColorB);
      doc.text('PLATFORM PROVIDER:', margin + 5, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Signature lines
      y += 25;
      doc.text('Signature: _______________________________', margin + 5, y);
      
      y += 10;
      doc.text(`Name: _______________________________`, margin + 5, y);
      
      y += 10;
      doc.text('Title: _______________________________', margin + 5, y);
      
      y += 10;
      doc.text(`Date: _______________________________`, margin + 5, y);
      
      // Second signature box - Merchant
      y += 20;
      doc.setFillColor(240, 240, 245); // Light gray background
      doc.roundedRect(margin, y, contentWidth, 65, 2, 2, 'F');
      
      // Merchant header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColorR, accentColorG, accentColorB);
      doc.text('MERCHANT:', margin + 5, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Merchant signature lines
      y += 25;
      doc.text('Signature: _______________________________', margin + 5, y);
      
      y += 10;
      doc.text(`Name: ${merchantFields[2].value}`, margin + 5, y);
      
      y += 10;
      doc.text(`Business Name: ${merchantFields[0].value}`, margin + 5, y);
      
      y += 10;
      doc.text(`Date: ${merchantFields[6].value}`, margin + 5, y);
      
      // Add wallet address in a specialized box
      y += 15;
      doc.setFillColor(220, 225, 235); // Light blue background
      doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Wallet Address (Base Network):', margin + 5, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${merchantFields[5].value}`, margin + 5, y + 18);
      
      // Save the PDF
      doc.save('CPXTB_Merchant_Agreement.pdf');
      
    } catch (error) {
      console.error('Error in generateMerchantAgreement:', error);
      throw error;
    }
  };
  
  // Generate LLC agreement PDF
  const generateLlcAgreement = async () => {
    try {
      console.log('Initializing jsPDF for LLC agreement...');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('Setting up LLC document dimensions...');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      // Navy blue color for headers - individual r,g,b values
      const accentColorR = 41; 
      const accentColorG = 65;
      const accentColorB = 148;
      
      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        console.log(`Adding LLC text at position (${x}, ${y}): ${text.substring(0, 30)}...`);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = 'LLC OPERATING AGREEMENT FOR CRYPTOCURRENCY BUSINESS';
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Introduction
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let y = 30;
    
    // Agreement intro
    y = addWrappedText(
      `THIS LIMITED LIABILITY COMPANY OPERATING AGREEMENT (the "Agreement") is made and entered into as of ${llcFields[7].value} (the "Effective Date") by and among the Members of ${llcFields[0].value}, a limited liability company organized under the laws of the State of ${llcFields[6].value} (the "Company").`,
      margin, y, contentWidth, 6
    );
    
    // Article I
    y += 15;
    doc.setFillColor(accentColorR, accentColorG, accentColorB); // Navy blue header
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section headers
    y = addWrappedText('ARTICLE I - COMPANY FORMATION', margin + 2, y + 5, contentWidth, 6);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    
    y = addWrappedText(
      '1.1 FORMATION. The Members have formed a Limited Liability Company named ' + 
      llcFields[0].value + ' by filing the Articles of Organization with the Secretary of State in the State of ' + 
      llcFields[6].value + '. The operation of the Company shall be governed by the terms of this Agreement and the applicable laws of the State of ' + 
      llcFields[6].value + '.',
      margin, y, contentWidth, 6
    );
    
    y += 15;
    y = addWrappedText(
      '1.2 PURPOSE. The primary purpose of the Company is to engage in the business of cryptocurrency trading, mining, and payment processing, specifically utilizing the CPXTB token on the Base blockchain network.',
      margin, y, contentWidth, 6
    );
    
    y += 15;
    y = addWrappedText(
      '1.3 PRINCIPAL PLACE OF BUSINESS. The Company\'s principal place of business shall be at ' + 
      llcFields[1].value + ', or such other place as the Members may from time to time designate.',
      margin, y, contentWidth, 6
    );
    
    // Article II
    y += 15;
    doc.setFillColor(accentColorR, accentColorG, accentColorB); // Navy blue header
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section headers
    y = addWrappedText('ARTICLE II - MEMBERSHIP', margin + 2, y + 5, contentWidth, 6);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    
    y = addWrappedText(
      '2.1 INITIAL MEMBERS. The initial Member(s) of the Company is/are:',
      margin, y, contentWidth, 6
    );
    
    y += 8;
    y = addWrappedText(
      'Name: ' + llcFields[2].value,
      margin + 10, y, contentWidth, 6
    );
    
    y += 6;
    y = addWrappedText(
      'Title: ' + llcFields[3].value,
      margin + 10, y, contentWidth, 6
    );
    
    // Article III - Cryptocurrency Operations
    y += 15;
    doc.setFillColor(accentColorR, accentColorG, accentColorB); // Navy blue header
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section headers
    y = addWrappedText('ARTICLE III - CRYPTOCURRENCY OPERATIONS', margin + 2, y + 5, contentWidth, 6);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    
    y = addWrappedText(
      '3.1 CRYPTOCURRENCY ASSETS. The Company shall maintain cryptocurrency assets, including CPXTB tokens, for operational purposes. The Company acknowledges the volatility and risks associated with cryptocurrency investments.',
      margin, y, contentWidth, 6
    );
    
    y += 15;
    y = addWrappedText(
      '3.2 WALLETS AND SECURITY. The Company shall implement industry-standard security measures to protect its cryptocurrency holdings, including but not limited to multi-signature wallets, cold storage solutions, and regular security audits.',
      margin, y, contentWidth, 6
    );
    
    // Add a new page for more content
    doc.addPage();
    y = 20;
    
    y = addWrappedText(
      '3.3 COMPLIANCE. The Company shall comply with all applicable laws and regulations regarding cryptocurrency operations, including anti-money laundering (AML) and know-your-customer (KYC) requirements, tax reporting obligations, and any registration or licensing requirements applicable to cryptocurrency businesses.',
      margin, y, contentWidth, 6
    );
    
    // Article IV - Taxation
    y += 15;
    doc.setFillColor(accentColorR, accentColorG, accentColorB); // Navy blue header
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section headers
    y = addWrappedText('ARTICLE IV - TAXATION', margin + 2, y + 5, contentWidth, 6);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    
    y = addWrappedText(
      '4.1 TAX CLASSIFICATION. The Company shall be taxed as specified in the Articles of Organization. The Company\'s Tax Identification Number (EIN) is: ' + llcFields[5].value,
      margin, y, contentWidth, 6
    );
    
    y += 15;
    y = addWrappedText(
      '4.2 CRYPTOCURRENCY TAXATION. The Company acknowledges that cryptocurrency transactions may be subject to capital gains tax and other tax obligations. The Company shall maintain detailed records of all cryptocurrency transactions for tax reporting purposes.',
      margin, y, contentWidth, 6
    );
    
    // Article V - Dissolution
    y += 15;
    doc.setFillColor(accentColorR, accentColorG, accentColorB); // Navy blue header
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section headers
    y = addWrappedText('ARTICLE V - DISSOLUTION', margin + 2, y + 5, contentWidth, 6);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    
    y = addWrappedText(
      '5.1 DISSOLUTION. The Company shall be dissolved upon the occurrence of any of the following events:\n' +
      '(a) By unanimous written agreement of all Members;\n' +
      '(b) The sale or transfer of all or substantially all of the Company\'s assets;\n' +
      '(c) As required by law or judicial decree.',
      margin, y, contentWidth, 6
    );
    
    y += 20;
    y = addWrappedText(
      '5.2 WINDING UP. Upon dissolution, the Company shall wind up its affairs, liquidate its cryptocurrency assets, and distribute any remaining assets to the Members in accordance with their ownership interests.',
      margin, y, contentWidth, 6
    );
    
    // Article VI - Miscellaneous
    y += 15;
    doc.setFillColor(accentColorR, accentColorG, accentColorB); // Navy blue header
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section headers
    y = addWrappedText('ARTICLE VI - MISCELLANEOUS', margin + 2, y + 5, contentWidth, 6);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    
    y = addWrappedText(
      '6.1 ENTIRE AGREEMENT. This Agreement constitutes the entire understanding and agreement among the Members with respect to the subject matter hereof.',
      margin, y, contentWidth, 6
    );
    
    y += 15;
    y = addWrappedText(
      '6.2 GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of ' + llcFields[6].value + '.',
      margin, y, contentWidth, 6
    );
    
    // Signatures
    y += 20;
    // Add a decorative line above signatures
    doc.setDrawColor(accentColorR, accentColorG, accentColorB);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    doc.setFillColor(accentColorR, accentColorG, accentColorB);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // White text for section header
    y = addWrappedText('IN WITNESS WHEREOF', margin + 2, y + 5, contentWidth, 6);
    y += 10;
    doc.setTextColor(0, 0, 0); // Reset to black for regular text
    doc.setFont('helvetica', 'normal');
    
    y = addWrappedText('The Members have executed this Agreement as of the Effective Date.', margin, y, contentWidth, 6);
    
    // Add signature box with light background
    y += 15;
    doc.setFillColor(240, 240, 245); // Light gray background
    doc.roundedRect(margin, y, contentWidth, 70, 2, 2, 'F');
    
    // Member signature header
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColorR, accentColorG, accentColorB);
    doc.text('MEMBER SIGNATURE:', margin + 5, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Signature lines
    y += 25;
    doc.text('Signature: _______________________________', margin + 5, y);
    
    y += 10;
    doc.text(`Name: ${llcFields[2].value}`, margin + 5, y);
    
    y += 10;
    doc.text(`Title: ${llcFields[3].value}`, margin + 5, y);
    
    y += 10;
    doc.text(`Date: ${llcFields[7].value}`, margin + 5, y);
    
    // Add company info in a specialized box
    y += 20;
    doc.setFillColor(220, 225, 235); // Light blue background
    doc.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('LLC Information:', margin + 5, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Company Name: ${llcFields[0].value}`, margin + 5, y + 20);
    doc.text(`State of Formation: ${llcFields[6].value}`, margin + 5, y + 30);
    
    // Save the PDF
    doc.save('CPXTB_LLC_Operating_Agreement.pdf');
    } catch (error) {
      console.error('Error in generateLlcAgreement:', error);
      throw error;
    }
  };
  
  // Handle document generation
  const handleGenerateDocument = async () => {
    try {
      setIsGenerating(true);
      console.log('Starting document generation process...');
      
      if (documentType === 'merchant') {
        console.log('Generating merchant agreement...');
        await generateMerchantAgreement();
      } else {
        console.log('Generating LLC agreement...');
        await generateLlcAgreement();
      }
      
      console.log('Document generation completed');
      
      // Show success toast
      toast({
        title: "Document Generated",
        description: `The ${documentType === 'merchant' ? 'Merchant Agreement' : 'LLC Operating Agreement'} has been generated and downloaded successfully.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error generating document:', error);
      
      // Show error toast
      toast({
        title: "Document Generation Failed",
        description: "There was an error generating your document. Please try again: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="shadow-lg border-border bg-card text-card-foreground">
        <CardHeader className="bg-muted/40">
          <CardTitle className="flex items-center gap-2">
            <FilePenLine className="h-5 w-5" />
            Legal Documents
          </CardTitle>
          <CardDescription>
            Generate and download legal documents for merchants and LLC owners
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs 
            defaultValue="merchant" 
            onValueChange={(value) => setDocumentType(value as DocumentType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="merchant">Merchant Agreement</TabsTrigger>
              <TabsTrigger value="llc">LLC Operating Agreement</TabsTrigger>
            </TabsList>
            
            <TabsContent value="merchant" className="mt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md mb-6">
                  <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5" />
                    Merchant Agreement
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This agreement outlines the terms and conditions for merchants accepting CPXTB token payments through our platform.
                    Fill out the form below to generate a customized Merchant Agreement document.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {merchantFields.map((field, index) => (
                    <div key={field.name} className="space-y-2">
                      <label htmlFor={field.name} className="text-sm font-medium">
                        {field.placeholder} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        id={field.name}
                        type={field.type}
                        value={field.value}
                        onChange={(e) => updateMerchantField(index, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full p-2 border border-border rounded-md bg-card text-card-foreground"
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="llc" className="mt-6">
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-4 rounded-md mb-6">
                  <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5" />
                    LLC Operating Agreement
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    This document establishes the legal structure for your LLC operating a cryptocurrency business.
                    Fill out the form below to generate a customized LLC Operating Agreement.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {llcFields.map((field, index) => (
                    <div key={field.name} className="space-y-2">
                      <label htmlFor={field.name} className="text-sm font-medium">
                        {field.placeholder} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        id={field.name}
                        type={field.type}
                        value={field.value}
                        onChange={(e) => updateLlcField(index, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full p-2 border border-border rounded-md bg-card text-card-foreground"
                        required={field.required}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/20 p-4 flex justify-end">
          <Button
            onClick={handleGenerateDocument}
            disabled={isGenerating || !isFormValid()}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download {documentType === 'merchant' ? 'Merchant Agreement' : 'LLC Agreement'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}