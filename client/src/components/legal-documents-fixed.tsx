import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileText, FilePenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { PLATFORM_NAME } from "@shared/constants";

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
  const [isGenerating, setIsGenerating] = useState(false);

  // Merchant document fields
  const [merchantFields, setMerchantFields] = useState<DocumentField[]>([
    { name: 'businessName', value: '', placeholder: 'Business Name', required: true, type: 'text' },
    { name: 'businessAddress', value: '', placeholder: 'Business Address', required: true, type: 'text' },
    { name: 'contactName', value: '', placeholder: 'Contact Name', required: true, type: 'text' },
    { name: 'contactEmail', value: '', placeholder: 'Contact Email', required: true, type: 'email' },
    { name: 'contactPhone', value: '', placeholder: 'Contact Phone', required: false, type: 'text' },
    { name: 'walletAddress', value: '', placeholder: 'Wallet Address', required: true, type: 'text' },
    { name: 'effectiveDate', value: '', placeholder: 'Effective Date', required: true, type: 'date' },
  ]);

  // Update field values
  const updateMerchantField = (index: number, value: string) => {
    const newFields = [...merchantFields];
    newFields[index].value = value;
    setMerchantFields(newFields);
  };

  // Check if form is valid
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
        format: 'a4'
      });
      
      console.log('Setting up document dimensions...');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        console.log(`Adding text at position (${x}, ${y}): ${text.substring(0, 30)}...`);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };
      
      // Add stamp paper / bond paper style header and border
      // Background color for the header (light beige for stamp paper look)
      doc.setFillColor(245, 241, 231); // Light beige color for stamp paper
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add decorative border
      doc.setDrawColor(139, 101, 57); // Brown border color
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S'); // Outer border
      
      // Add ornamental pattern in the corners
      const cornerSize = 15;
      // Top left corner ornament
      doc.setDrawColor(139, 101, 57);
      doc.setLineWidth(0.7);
      doc.line(5, 5, 5 + cornerSize, 5); // Top horizontal
      doc.line(5, 5, 5, 5 + cornerSize); // Left vertical
      
      // Top right corner ornament
      doc.line(pageWidth - 5, 5, pageWidth - 5 - cornerSize, 5); // Top horizontal
      doc.line(pageWidth - 5, 5, pageWidth - 5, 5 + cornerSize); // Right vertical
      
      // Bottom left corner ornament
      doc.line(5, pageHeight - 5, 5 + cornerSize, pageHeight - 5); // Bottom horizontal
      doc.line(5, pageHeight - 5, 5, pageHeight - 5 - cornerSize); // Left vertical
      
      // Bottom right corner ornament
      doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5 - cornerSize, pageHeight - 5); // Bottom horizontal
      doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5, pageHeight - 5 - cornerSize); // Right vertical
      
      // Add serial number in the top right (simulating stamp paper numbering) that crosses the border
      // First create a small white background patch that goes over the border
      doc.setFillColor(255, 255, 255); 
      doc.rect(pageWidth - 35, 3, 30, 10, 'F');
      
      // Then add the serial number text crossing the border
      doc.setFontSize(8);
      doc.setTextColor(139, 101, 57); // Brown color matching the border
      doc.setFont('helvetica', 'bold');
      const serialNumber = 'CPXTB-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      doc.text(`Serial No: ${serialNumber}`, pageWidth - 15, 8, { 
        align: 'right'
      });
      
      // Add government-like seal in top left
      doc.setFillColor(139, 101, 57); // Brown seal color
      doc.circle(25, 20, 10, 'F');
      doc.setTextColor(255, 255, 255); // White text for seal
      doc.setFontSize(7);
      doc.text('OFFICIAL', 25, 19, { align: 'center' });
      doc.text('DOCUMENT', 25, 22, { align: 'center' });
      
      // Reset styles for regular content
      doc.setTextColor(0, 0, 0); // Black text for content
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const title = 'MERCHANT AGREEMENT FOR CPXTB TOKEN PAYMENTS';
      doc.text(title, pageWidth / 2, 50, { align: 'center' });
      
      // Introduction
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let y = 60; // Adjusted to start after the title
      
      y = addWrappedText(
        `THIS MERCHANT AGREEMENT (the "Agreement") is entered into as of ${merchantFields[6].value} (the "Effective Date"), by and between:`,
        margin, y, contentWidth, 6
      );
      
      // Parties
      y += 10;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(
        `Coin Prediction Tool On Base LLC ("Platform Provider")`,
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
        `${merchantFields[0].value} ("Merchant"), located at ${merchantFields[1].value}`,
        margin, y, contentWidth, 6
      );
      
      // Agreement body
      y += 10;
      doc.setFont('helvetica', 'normal');
      
      // Recitals
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('RECITALS', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        'WHEREAS, Platform Provider operates a cryptocurrency payment processing platform that enables merchants to accept CPXTB tokens as payment for goods and services;',
        margin, y, contentWidth, 6
      );
      
      y += 8;
      y = addWrappedText(
        'WHEREAS, Merchant desires to utilize the Platform to accept CPXTB tokens as payment for its goods and services;',
        margin, y, contentWidth, 6
      );
      
      y += 8;
      y = addWrappedText(
        'NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:',
        margin, y, contentWidth, 6
      );
      
      // Agreement terms
      y += 10;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('1. SERVICES', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        'Platform Provider will provide Merchant with access to the Platform, which enables Merchant to accept CPXTB tokens as payment. The Platform includes payment processing, transaction verification, and merchant dashboard functionality.',
        margin, y, contentWidth, 6
      );
      
      y += 10;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('2. MERCHANT OBLIGATIONS', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        '2.1 Merchant shall maintain accurate business information on the Platform.\n\n' +
        '2.2 Merchant shall provide a valid blockchain wallet address to receive CPXTB token payments.\n\n' +
        '2.3 Merchant agrees to comply with all applicable laws and regulations related to cryptocurrency transactions.\n\n' +
        '2.4 Merchant acknowledges the volatility of cryptocurrency values and assumes all risks associated with accepting CPXTB tokens as payment.',
        margin, y, contentWidth, 6
      );
      
      y += 30;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('3. FEES', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        'Platform Provider charges a 1% transaction fee on all completed CPXTB token payments. Fees are automatically calculated and deducted from each transaction.',
        margin, y, contentWidth, 6
      );
      
      y += 10;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('4. TERM AND TERMINATION', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        '4.1 This Agreement shall commence on the Effective Date and continue until terminated by either party.\n\n' +
        '4.2 Either party may terminate this Agreement with 30 days\' written notice.\n\n' +
        '4.3 Platform Provider may terminate this Agreement immediately if Merchant violates any terms of this Agreement.',
        margin, y, contentWidth, 6
      );
      
      y += 25;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('5. LIMITATION OF LIABILITY', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        'IN NO EVENT SHALL PLATFORM PROVIDER BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, OR DATA, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
        margin, y, contentWidth, 6
      );
      
      // Add new page for signatures
      doc.addPage();
      
      // Apply the same stamp paper style to new page
      // Background color for the header (light beige for stamp paper look)
      doc.setFillColor(245, 241, 231); // Light beige color for stamp paper
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add decorative border
      doc.setDrawColor(139, 101, 57); // Brown border color
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S'); // Outer border
      
      // Add ornamental pattern in the corners
      // Top left corner ornament
      doc.setDrawColor(139, 101, 57);
      doc.setLineWidth(0.7);
      doc.line(5, 5, 5 + cornerSize, 5); // Top horizontal
      doc.line(5, 5, 5, 5 + cornerSize); // Left vertical
      
      // Top right corner ornament
      doc.line(pageWidth - 5, 5, pageWidth - 5 - cornerSize, 5); // Top horizontal
      doc.line(pageWidth - 5, 5, pageWidth - 5, 5 + cornerSize); // Right vertical
      
      // Bottom left corner ornament
      doc.line(5, pageHeight - 5, 5 + cornerSize, pageHeight - 5); // Bottom horizontal
      doc.line(5, pageHeight - 5, 5, pageHeight - 5 - cornerSize); // Left vertical
      
      // Bottom right corner ornament
      doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5 - cornerSize, pageHeight - 5); // Bottom horizontal
      doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5, pageHeight - 5 - cornerSize); // Right vertical
      
      // Add serial number in the top right (continuing from previous page) that crosses the border
      // First create a small white background patch that goes over the border
      doc.setFillColor(255, 255, 255); 
      doc.rect(pageWidth - 45, 3, 40, 10, 'F');
      
      // Then add the serial number text crossing the border
      doc.setFontSize(8);
      doc.setTextColor(139, 101, 57); // Brown color matching the border
      doc.setFont('helvetica', 'bold');
      doc.text(`Serial No: ${serialNumber} (continued)`, pageWidth - 15, 8, { 
        align: 'right'
      });
      
      // Reset text color
      doc.setTextColor(0, 0, 0); // Black text for content
      
      y = 20;
      
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('6. GOVERNING LAW', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        'This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which Platform Provider is registered, without regard to conflict of law principles.',
        margin, y, contentWidth, 6
      );
      
      y += 15;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('7. ENTIRE AGREEMENT', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
      y = addWrappedText(
        'This Agreement constitutes the entire understanding between the parties concerning the subject matter hereof and supersedes all prior agreements, understandings, or negotiations.',
        margin, y, contentWidth, 6
      );
      
      // Signatures
      y += 20;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.', margin, y, contentWidth, 6);
      
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('PLATFORM PROVIDER:', margin, y);
      
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('Signature: ___________________________', margin, y);
      
      y += 10;
      doc.text('Print Name: ___________________________', margin, y);
      
      y += 10;
      doc.text('Title: ___________________________', margin, y);
      
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('MERCHANT:', margin, y);
      
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('Signature: ___________________________', margin, y);
      
      y += 10;
      doc.text(`Print Name: ${merchantFields[2].value}`, margin, y);
      
      y += 10;
      doc.text(`Email: ${merchantFields[3].value}`, margin, y);
      
      // Save document
      console.log('Saving merchant agreement...');
      const fileName = merchantFields[0].value.replace(/\s+/g, '-').toLowerCase() + '-merchant-agreement.pdf';
      doc.save(fileName);
      console.log(`Merchant agreement saved as ${fileName}`);
      
    } catch (error) {
      console.error('Error in generateMerchantAgreement:', error);
      throw error;
    }
  };
  
  // Handle document generation
  const handleGenerateDocument = async () => {
    try {
      setIsGenerating(true);
      console.log('Starting document generation process...');
      
      console.log('Generating merchant agreement...');
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
            Legal Documents
          </CardTitle>
          <CardDescription>
            Generate and download legal documents for merchants
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