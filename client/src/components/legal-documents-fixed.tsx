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

  // LLC document fields
  const [llcFields, setLlcFields] = useState<DocumentField[]>([
    { name: 'llcName', value: '', placeholder: 'LLC Name', required: true, type: 'text' },
    { name: 'llcAddress', value: '', placeholder: 'LLC Address', required: true, type: 'text' },
    { name: 'memberName', value: '', placeholder: 'Member Name', required: true, type: 'text' },
    { name: 'memberTitle', value: '', placeholder: 'Member Title', required: true, type: 'text' },
    { name: 'memberEmail', value: '', placeholder: 'Member Email', required: true, type: 'email' },
    { name: 'taxId', value: '', placeholder: 'Tax ID (EIN)', required: true, type: 'text' },
    { name: 'stateOfFormation', value: '', placeholder: 'State of Formation', required: true, type: 'text' },
    { name: 'formationDate', value: '', placeholder: 'Date of Formation', required: true, type: 'date' },
  ]);

  // Get current fields based on document type
  const currentFields = documentType === 'merchant' ? merchantFields : llcFields;

  // Update field values
  const updateMerchantField = (index: number, value: string) => {
    const newFields = [...merchantFields];
    newFields[index].value = value;
    setMerchantFields(newFields);
  };

  const updateLlcField = (index: number, value: string) => {
    const newFields = [...llcFields];
    newFields[index].value = value;
    setLlcFields(newFields);
  };

  // Check if form is valid
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
      
      // Add image-based watermark using shapes and text
      // Create a circular seal/stamp
      doc.setFillColor(205, 175, 149, 0.6); // Beige/gold with transparency
      doc.circle(pageWidth / 2, 25, 15, 'F');
      
      // Add inner circle
      doc.setDrawColor(139, 101, 57, 0.8); // Darker brown with transparency
      doc.setLineWidth(0.5);
      doc.circle(pageWidth / 2, 25, 12, 'S');
      
      // Add text in the watermark
      doc.setTextColor(100, 70, 30, 0.8); // Dark brown with transparency
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL', pageWidth / 2, 22, { align: 'center' });
      doc.text('DOCUMENT', pageWidth / 2, 26, { align: 'center' });
      doc.setFontSize(5);
      doc.text('COIN PREDICTION TOOL', pageWidth / 2, 30, { align: 'center' });
      doc.text('ON BASE LLC', pageWidth / 2, 33, { align: 'center' });
      
      // Add diagonal "MERCHANT AGREEMENT" text as watermark
      doc.setTextColor(200, 190, 180, 0.3); // Light beige with high transparency
      doc.setFontSize(40);
      doc.setFont('helvetica', 'italic');
      doc.text('MERCHANT AGREEMENT', pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45
      });
      
      // Add serial number in the top right (simulating stamp paper numbering)
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Dark gray
      doc.setFont('helvetica', 'bold');
      const serialNumber = 'CPXTB-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      doc.text(`Serial No: ${serialNumber}`, pageWidth - 15, 15);
      
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
      
      // Add image-based watermark to continuation page
      // Create a circular seal/stamp (slightly smaller than first page)
      doc.setFillColor(205, 175, 149, 0.6); // Beige/gold with transparency
      doc.circle(pageWidth / 2, 22, 12, 'F');
      
      // Add inner circle
      doc.setDrawColor(139, 101, 57, 0.8); // Darker brown with transparency
      doc.setLineWidth(0.5);
      doc.circle(pageWidth / 2, 22, 10, 'S');
      
      // Add text in the watermark
      doc.setTextColor(100, 70, 30, 0.8); // Dark brown with transparency
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL', pageWidth / 2, 20, { align: 'center' });
      doc.text('DOCUMENT', pageWidth / 2, 24, { align: 'center' });
      doc.setFontSize(4);
      doc.text('COIN PREDICTION TOOL', pageWidth / 2, 27, { align: 'center' });
      doc.text('ON BASE LLC', pageWidth / 2, 29, { align: 'center' });
      
      // Add serial number in the top right (continuing from previous page)
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100); // Dark gray
      doc.setFont('helvetica', 'bold');
      doc.text(`Serial No: ${serialNumber} (continued)`, pageWidth - 15, 15);
      
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
      
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Coin Prediction Tool On Base LLC:', margin, y);
      doc.setFont('helvetica', 'normal');
      
      y += 15;
      doc.text('Signature: _______________________________', margin, y);
      
      y += 10;
      doc.text(`Name: _______________________________`, margin, y);
      
      y += 10;
      doc.text('Title: _______________________________', margin, y);
      
      y += 10;
      doc.text(`Date: _______________________________`, margin, y);
      
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('MERCHANT:', margin, y);
      doc.setFont('helvetica', 'normal');
      
      y += 15;
      doc.text('Signature: _______________________________', margin, y);
      
      y += 10;
      doc.text(`Name: ${merchantFields[2].value}`, margin, y);
      
      y += 10;
      doc.text(`Business Name: ${merchantFields[0].value}`, margin, y);
      
      y += 10;
      doc.text(`Date: ${merchantFields[6].value}`, margin, y);
      
      y += 10;
      doc.text(`Wallet Address: ${merchantFields[5].value}`, margin, y);
      
      // Save the PDF
      console.log('Saving merchant agreement PDF...');
      doc.save('CPXTB_Merchant_Agreement.pdf');
      console.log('Merchant agreement PDF saved successfully');
      return true;
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
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        console.log(`Adding LLC text at position (${x}, ${y}): ${text.substring(0, 30)}...`);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };
      
      // Add stamp paper / bond paper style header and border
      // Background color for the header (light blue/green for legal paper look)
      doc.setFillColor(233, 240, 243); // Light blue-green color for legal paper
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add decorative border
      doc.setDrawColor(70, 130, 130); // Blue-green border color
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S'); // Outer border
      
      // Add double border for more formal look
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S'); // Inner border
      
      // Add ornamental pattern in the corners
      const cornerSize = 15;
      // Top left corner ornament
      doc.setDrawColor(70, 130, 130);
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
      
      // Add image-based watermark using shapes and text
      // Create a circular seal/stamp
      doc.setFillColor(175, 205, 220, 0.6); // Blue-green with transparency
      doc.circle(pageWidth / 2, 25, 15, 'F');
      
      // Add inner circle
      doc.setDrawColor(70, 130, 150, 0.8); // Darker blue with transparency
      doc.setLineWidth(0.5);
      doc.circle(pageWidth / 2, 25, 12, 'S');
      
      // Add text in the watermark
      doc.setTextColor(20, 60, 80, 0.8); // Dark blue with transparency
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL', pageWidth / 2, 22, { align: 'center' });
      doc.text('LLC DOCUMENT', pageWidth / 2, 26, { align: 'center' });
      doc.setFontSize(5);
      doc.text('COIN PREDICTION TOOL', pageWidth / 2, 30, { align: 'center' });
      doc.text('ON BASE LLC', pageWidth / 2, 33, { align: 'center' });
      
      // Add diagonal "LLC OPERATING AGREEMENT" text as watermark
      doc.setTextColor(200, 220, 230, 0.3); // Light blue with high transparency
      doc.setFontSize(40);
      doc.setFont('helvetica', 'italic');
      doc.text('LLC AGREEMENT', pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45
      });
      
      // Add serial number in the top right (simulating stamp paper numbering)
      doc.setFontSize(8);
      doc.setTextColor(50, 100, 100); // Blue-green
      doc.setFont('helvetica', 'bold');
      const serialNumber = 'LLC-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      doc.text(`Serial No: ${serialNumber}`, pageWidth - 15, 15);
      
      // Add formal seal in top left
      doc.setFillColor(70, 130, 130); // Blue-green seal color
      doc.circle(25, 20, 10, 'F');
      doc.setTextColor(255, 255, 255); // White text for seal
      doc.setFontSize(7);
      doc.text('OFFICIAL', 25, 19, { align: 'center' });
      doc.text('LLC DOC', 25, 22, { align: 'center' });
      
      // Reset styles for regular content
      doc.setTextColor(0, 0, 0); // Black text for content
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const title = 'LLC OPERATING AGREEMENT FOR CRYPTOCURRENCY BUSINESS';
      doc.text(title, pageWidth / 2, 50, { align: 'center' });
      
      // Introduction
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      let y = 60; // Adjusted to start after the title
      
      // Agreement intro
      y = addWrappedText(
        `THIS LIMITED LIABILITY COMPANY OPERATING AGREEMENT (the "Agreement") is made and entered into as of ${llcFields[7].value} (the "Effective Date") by and among the Members of ${llcFields[0].value}, a limited liability company organized under the laws of the State of ${llcFields[6].value} (the "Company").`,
        margin, y, contentWidth, 6
      );
      
      // Article I
      y += 15;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('ARTICLE I - COMPANY FORMATION', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
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
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('ARTICLE II - MEMBERSHIP', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
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
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('ARTICLE III - CRYPTOCURRENCY OPERATIONS', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
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
      
      // Apply the same stamp paper style to new page
      // Background color for the header (light blue/green for legal paper look)
      doc.setFillColor(233, 240, 243); // Light blue-green color for legal paper
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Add decorative border
      doc.setDrawColor(70, 130, 130); // Blue-green border color
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S'); // Outer border
      
      // Add double border for more formal look
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S'); // Inner border
      
      // Add ornamental pattern in the corners
      // Top left corner ornament
      doc.setDrawColor(70, 130, 130);
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
      
      // Add image-based watermark to LLC continuation page
      // Create a circular seal/stamp (slightly smaller than first page)
      doc.setFillColor(175, 205, 220, 0.6); // Blue-green with transparency
      doc.circle(pageWidth / 2, 22, 12, 'F');
      
      // Add inner circle
      doc.setDrawColor(70, 130, 150, 0.8); // Darker blue with transparency
      doc.setLineWidth(0.5);
      doc.circle(pageWidth / 2, 22, 10, 'S');
      
      // Add text in the watermark
      doc.setTextColor(20, 60, 80, 0.8); // Dark blue with transparency
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL', pageWidth / 2, 20, { align: 'center' });
      doc.text('LLC DOCUMENT', pageWidth / 2, 24, { align: 'center' });
      doc.setFontSize(4);
      doc.text('COIN PREDICTION TOOL', pageWidth / 2, 27, { align: 'center' });
      doc.text('ON BASE LLC', pageWidth / 2, 29, { align: 'center' });
      
      // Add serial number in the top right (continuing from previous page)
      doc.setFontSize(8);
      doc.setTextColor(50, 100, 100); // Blue-green
      doc.setFont('helvetica', 'bold');
      doc.text(`Serial No: ${serialNumber} (continued)`, pageWidth - 15, 15);
      
      // Reset text color
      doc.setTextColor(0, 0, 0); // Black text for content
      
      y = 20;
      
      y = addWrappedText(
        '3.3 COMPLIANCE. The Company shall comply with all applicable laws and regulations regarding cryptocurrency operations, including anti-money laundering (AML) and know-your-customer (KYC) requirements, tax reporting obligations, and any registration or licensing requirements applicable to cryptocurrency businesses.',
        margin, y, contentWidth, 6
      );
      
      // Article IV - Taxation
      y += 15;
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('ARTICLE IV - TAXATION', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
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
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('ARTICLE V - DISSOLUTION', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
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
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('ARTICLE VI - MISCELLANEOUS', margin, y, contentWidth, 6);
      y += 3;
      doc.setFont('helvetica', 'normal');
      
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
      doc.setFont('helvetica', 'bold');
      y = addWrappedText('IN WITNESS WHEREOF, the Members have executed this Agreement as of the Effective Date.', margin, y, contentWidth, 6);
      
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Coin Prediction Tool On Base LLC MEMBER SIGNATURE:', margin, y);
      doc.setFont('helvetica', 'normal');
      
      y += 15;
      doc.text('Signature: _______________________________', margin, y);
      
      y += 10;
      doc.text(`Name: ${llcFields[2].value}`, margin, y);
      
      y += 10;
      doc.text(`Title: ${llcFields[3].value}`, margin, y);
      
      y += 10;
      doc.text(`Date: ${llcFields[7].value}`, margin, y);
      
      // Save the PDF
      console.log('Saving LLC agreement PDF...');
      doc.save('CPXTB_LLC_Operating_Agreement.pdf');
      console.log('LLC agreement PDF saved successfully');
      return true;
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