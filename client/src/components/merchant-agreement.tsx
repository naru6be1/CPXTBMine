import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileText, FilePenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { PLATFORM_NAME } from "@shared/constants";

// Helper function to ensure colors render properly in the PDF 
// by converting hex colors to direct RGB values
function convertHexToRGB(hex: string): { r: number, g: number, b: number } {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Parse the hex values to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

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
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
        floatPrecision: 16 // Higher precision for better color rendering
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
      
      // Enable better color rendering with document properties
      (doc as any).setProperties({
        title: 'CPXTB Merchant Agreement',
        subject: 'Legal Agreement',
        author: 'CPXTB Platform',
        keywords: 'agreement, merchant, cpxtb, cryptocurrency',
        creator: 'CPXTB Platform'
      });
      
      // Set professional colors using RGB values for jsPDF compatibility
      // Using direct hex to RGB conversion to ensure proper color rendering
      const primaryColor = convertHexToRGB('#1a457a');
      const primaryColorR = primaryColor.r;
      const primaryColorG = primaryColor.g;
      const primaryColorB = primaryColor.b;
      
      const accentColor = convertHexToRGB('#203864');
      const accentColorR = accentColor.r;
      const accentColorG = accentColor.g;
      const accentColorB = accentColor.b;
      
      // Add a subtle header with logo effect
      doc.setFillColor(primaryColorR, primaryColorG, primaryColorB);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text on blue background
      const title = 'MERCHANT AGREEMENT FOR CPXTB TOKEN PAYMENTS';
      doc.text(title, pageWidth / 2, 20, { align: 'center' });
      
      // Add page number to footer of first page
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`CPXTB Merchant Agreement - ${merchantFields[0].value} - Page 1 of 2`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
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
      
      // Always add a new page for section 6 and signatures
      doc.addPage();
      y = 20;
      
      // Section 6 header
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
      
      // Signature section - Always start on a new page
      doc.addPage();
      y = 20;
      
      // Add signature header
      doc.setFillColor(accentColorR, accentColorG, accentColorB);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for section header
      y = addWrappedText('SIGNATURES', margin + 2, y + 5, contentWidth, 6);
      y += 10;
      doc.setTextColor(0, 0, 0); // Reset to black for regular text
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText('IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the Effective Date.', margin, y, contentWidth, 6);
      
      // Add signature boxes
      y += 15;
      
      // Platform Provider signature box
      const bgColor = convertHexToRGB('#f0f5fb');
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b); // Light blue background
      doc.roundedRect(margin, y, contentWidth/2 - 5, 80, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColorR, accentColorG, accentColorB);
      doc.text('PLATFORM PROVIDER:', margin + 5, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Signature lines - Platform Provider
      doc.text(`${PLATFORM_NAME} (Coin Prediction Tool On Base LLC)`, margin + 5, y + 25);
      doc.text('By: _______________________________', margin + 5, y + 40);
      doc.text('Name: ____________________________', margin + 5, y + 55);
      doc.text('Title: _____________________________', margin + 5, y + 70);
      
      // Merchant signature box
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b); // Light blue background
      doc.roundedRect(margin + contentWidth/2 + 5, y, contentWidth/2 - 5, 80, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColorR, accentColorG, accentColorB);
      doc.text('MERCHANT:', margin + contentWidth/2 + 10, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Signature lines - Merchant
      doc.text(`${merchantFields[0].value}`, margin + contentWidth/2 + 10, y + 25);
      doc.text('By: _______________________________', margin + contentWidth/2 + 10, y + 40);
      doc.text(`Name: ${merchantFields[2].value}`, margin + contentWidth/2 + 10, y + 55);
      doc.text(`Date: ${merchantFields[6].value}`, margin + contentWidth/2 + 10, y + 70);
      
      // Document footer
      y += 90;
      doc.setDrawColor(accentColorR, accentColorG, accentColorB);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`CPXTB Merchant Agreement - ${merchantFields[0].value} - Page 2 of 2`, pageWidth / 2, y, { align: 'center' });
      
      // Save the PDF
      doc.save('CPXTB_Merchant_Agreement.pdf');
      
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