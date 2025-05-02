import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileText, FilePenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from 'jspdf';
import { PLATFORM_NAME } from "@shared/constants";
import { addPDFMetadata, convertHexToRGB } from './pdf-utils/pdf-helper';

// Interface for document fields
interface DocumentField {
  name: string;
  value: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'date' | 'email';
}

export function MerchantAgreement() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for merchant agreement fields
  const [merchantFields, setMerchantFields] = useState<DocumentField[]>([
    { name: 'businessName', value: '', placeholder: 'Business Name', required: true, type: 'text' },
    { name: 'businessAddress', value: '', placeholder: 'Business Address', required: true, type: 'text' },
    { name: 'contactName', value: '', placeholder: 'Contact Person Name', required: true, type: 'text' },
    { name: 'contactEmail', value: '', placeholder: 'Contact Email', required: true, type: 'email' },
    { name: 'businessType', value: '', placeholder: 'Business Type', required: true, type: 'text' },
    { name: 'walletAddress', value: '', placeholder: 'Wallet Address', required: true, type: 'text' },
    { name: 'agreementDate', value: '', placeholder: 'Agreement Date', required: true, type: 'date' },
  ]);
  
  // Update field values for merchant agreement
  const updateMerchantField = (index: number, value: string) => {
    const updatedFields = [...merchantFields];
    updatedFields[index].value = value;
    setMerchantFields(updatedFields);
  };
  
  // Check if all required fields are filled
  const isFormValid = () => {
    return merchantFields.every(field => !field.required || field.value.trim() !== '');
  };
  
  // Generate merchant agreement PDF
  const generateMerchantAgreement = async () => {
    try {
      console.log('Initializing jsPDF for merchant agreement...');
      
      // Initialize jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Add metadata
      addPDFMetadata(doc, 'CPXTB Merchant Agreement');
      
      // Page dimensions and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };
      
      // Set colors using RGB values for better compatibility
      const primaryColor = convertHexToRGB('#1a457a');
      const primaryColorR = primaryColor.r;
      const primaryColorG = primaryColor.g;
      const primaryColorB = primaryColor.b;
      
      const accentColor = convertHexToRGB('#203864');
      const accentColorR = accentColor.r;
      const accentColorG = accentColor.g;
      const accentColorB = accentColor.b;
      
      // Add a header with logo effect
      doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text on blue background
      const title = 'MERCHANT AGREEMENT FOR CPXTB TOKEN PAYMENTS';
      doc.text(title, pageWidth / 2, 20, { align: 'center' });
      
      // Page 1 footer - Add margin at bottom for footer
      const footerMargin = 20; // Increased footer margin
      
      // Add white background rectangle for footer to ensure it doesn't overlap with content
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - (footerMargin + 5), pageWidth, footerMargin + 5, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`CPXTB Merchant Agreement - ${merchantFields[0].value} - Page 1 of 3`, pageWidth / 2, pageHeight - footerMargin, { align: 'center' });
      
      // Introduction
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset text color to black for body text
      let y = 40; // Start content below header
      
      // Add decorative line under header
      doc.setDrawColor(accentColorR, accentColorG, accentColorB);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);
      
      // Agreement intro
      y = addWrappedText(
        `THIS MERCHANT AGREEMENT (the "Agreement") is made and entered into effective as of ${merchantFields[6].value} (the "Effective Date"), by and between the parties identified below:`,
        margin, y, contentWidth, 6
      );
      
      // Parties
      y += 10;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(
        `${PLATFORM_NAME} (Coin Prediction Tool On Base LLC), a blockchain payment solutions provider ("Platform Provider")`,
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
      
      // Section 1
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
      
      // Section 2 - Start on a new page
      doc.addPage();
      
      // Add header with the same style as page 1
      doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text on blue background
      doc.text('MERCHANT AGREEMENT (continued)', pageWidth / 2, 20, { align: 'center' });
      
      // Add decorative line under header
      doc.setDrawColor(accentColorR, accentColorG, accentColorB);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);
      
      y = 40; // Reset y position for the new page
      
      // Add page number with white background to ensure it doesn't overlap with content
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - (footerMargin + 5), pageWidth, footerMargin + 5, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`CPXTB Merchant Agreement - ${merchantFields[0].value} - Page 2 of 3`, pageWidth / 2, pageHeight - footerMargin, { align: 'center' });
      
      // Reset font for section header
      doc.setFontSize(10);
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
      
      // Section 3
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
      
      // Section 4
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
      
      // Section 5
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
      
      // Add new page for Section 6 and Signatures
      doc.addPage();
      
      // Add header with the same style as previous pages
      doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text on blue background
      doc.text('MERCHANT AGREEMENT (continued)', pageWidth / 2, 20, { align: 'center' });
      
      // Add decorative line under header
      doc.setDrawColor(accentColorR, accentColorG, accentColorB);
      doc.setLineWidth(0.5);
      doc.line(margin, 32, pageWidth - margin, 32);
      
      y = 40; // Reset y position for the new page
      
      // Add page number to third page footer
      // First add a white background rectangle to ensure footer is readable
      doc.setFillColor(255, 255, 255);
      doc.rect(0, pageHeight - (footerMargin + 5), pageWidth, footerMargin + 5, 'F');
      
      // Then add the footer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`CPXTB Merchant Agreement - ${merchantFields[0].value} - Page 3 of 3`, pageWidth / 2, pageHeight - footerMargin, { align: 'center' });
      
      // Section 6
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
        '6.2 Dispute Resolution. Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or invalidity thereof, shall be settled by arbitration in accordance with the rules of the arbitration institution in the jurisdiction where Platform Provider is registered. The number of arbitrators shall be one. The language of arbitration shall be English.\n\n' +
        '6.3 Waiver of Class Actions. MERCHANT AGREES THAT ANY CLAIM OR DISPUTE AGAINST PLATFORM PROVIDER SHALL BE RESOLVED ON AN INDIVIDUAL BASIS AND WAIVES ANY RIGHT TO PARTICIPATE IN A CLASS ACTION OR CONSOLIDATED ACTION.',
        margin, y, contentWidth, 6
      );
      
      // Section 7
      y += 20;
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section headers
      y = addWrappedText('7. MISCELLANEOUS', margin + 2, y + 5, contentWidth, 6);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      
      y = addWrappedText(
        '7.1 Entire Agreement. This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior agreements, negotiations, and discussions between the parties relating to the same.\n\n' +
        '7.2 Amendments. This Agreement may only be amended by a written document signed by both parties.\n\n' +
        '7.3 Force Majeure. Neither party shall be liable for any failure or delay in performance under this Agreement due to causes beyond its reasonable control, including but not limited to acts of God, war, terrorism, civil unrest, fire, explosion, accident, flood, strikes, labor disputes, Internet or blockchain network disruptions.\n\n' +
        '7.4 Relationship of Parties. Nothing in this Agreement shall be construed to create a partnership, joint venture, or agency relationship between the parties. Neither party has the authority to bind the other or to incur obligations on the other\'s behalf.\n\n' +
        '7.5 Notices. All notices under this Agreement shall be in writing and delivered to the addresses set forth below, or to such other address as either party may designate in writing.',
        margin, y, contentWidth, 6
      );
      
      // Make sure we have a fresh page specifically for signatures
      // Calculate if we need to add a page (if there's not enough space)
      // Added extra footer margin to prevent content overlapping with footer
      if (y > pageHeight - (150 + footerMargin)) {
        doc.addPage();
        
        // Add header with the same style as previous pages
        doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // White text on blue background
        doc.text('MERCHANT AGREEMENT - SIGNATURES', pageWidth / 2, 20, { align: 'center' });
        
        // Add decorative line under header
        doc.setDrawColor(accentColorR, accentColorG, accentColorB);
        doc.setLineWidth(0.5);
        doc.line(margin, 32, pageWidth - margin, 32);
        
        y = 40; // Reset y position on the new page
        
        // Add page number to signature page with white background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, pageHeight - (footerMargin + 5), pageWidth, footerMargin + 5, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`CPXTB Merchant Agreement - ${merchantFields[0].value} - Page 3 of 3`, pageWidth / 2, pageHeight - footerMargin, { align: 'center' });
      }
      
      // Signature section header
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section header
      doc.text('SIGNATURES', margin + 2, y + 5);
      y += 15;
      
      // Witness text
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      doc.text('IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the Effective Date.', margin, y);
      y += 20;
      
      // Create simple signature lines instead of boxes
      // This approach is more reliable for PDF rendering
      
      // Platform Provider signature
      doc.setLineWidth(0.2);
      doc.setDrawColor(100, 100, 100);
      
      // First column - Platform Provider
      doc.setFont('helvetica', 'bold');
      doc.text('PLATFORM PROVIDER:', margin, y);
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text("Coin Prediction Tool On Base LLC", margin, y);
      y += 20;
      
      // Signature line
      doc.line(margin, y, margin + 70, y);
      doc.text('Signature', margin, y + 5);
      y += 15;
      
      // Name line
      doc.line(margin, y, margin + 70, y);
      doc.text('Name (Print)', margin, y + 5);
      y += 15;
      
      // Title line
      doc.line(margin, y, margin + 70, y);
      doc.text('Title', margin, y + 5);
      y += 15;
      
      // Date line
      doc.line(margin, y, margin + 70, y);
      doc.text('Date', margin, y + 5);
      
      // Reset y position for merchant column
      y -= 45;
      
      // Second column - Merchant 
      const col2X = margin + contentWidth / 2 + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('MERCHANT:', col2X, y - 30);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${merchantFields[0].value}`, col2X, y - 20);
      
      // Signature line
      doc.line(col2X, y, col2X + 70, y);
      doc.text('Signature', col2X, y + 5);
      y += 15;
      
      // Name line
      doc.line(col2X, y, col2X + 70, y);
      doc.text(`Name: ${merchantFields[2].value}`, col2X, y + 5);
      y += 15;
      
      // Title/Position line
      doc.line(col2X, y, col2X + 70, y);
      doc.text('Title/Position', col2X, y + 5);
      y += 15;
      
      // Date line
      doc.line(col2X, y, col2X + 70, y);
      doc.text(`Date: ${merchantFields[6].value}`, col2X, y + 5);
      
      // Save the PDF
      doc.save('CPXTB_Merchant_Agreement.pdf');
      
      return true;
    } catch (error) {
      console.error('Error in generateMerchantAgreement:', error);
      throw error;
    }
  };

  // Handle document generation
  const handleGenerateDocument = async () => {
    try {
      setIsGenerating(true);
      console.log('Starting merchant agreement generation...');
      await generateMerchantAgreement();
      console.log('Document generation completed');
      
      // Show success toast
      toast({
        title: "Document Generated",
        description: "The Merchant Agreement has been generated and downloaded successfully.",
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
            Merchant Agreement
          </CardTitle>
          <CardDescription>
            Generate and download a customized legal agreement for merchants
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
                Download Merchant Agreement
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}