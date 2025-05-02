// PDFGenerator.ts
import PDFDocument from 'pdfkit';
import { PLATFORM_NAME } from "@shared/constants";

// Interface for document fields
interface DocumentField {
  name: string;
  value: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'date' | 'email';
}

// Function to generate Merchant Agreement PDF using PDFKit
export const generateMerchantAgreementPDFKit = (
  merchantFields: DocumentField[],
  onComplete: (blob: Blob) => void
) => {
  // Create a document
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4'
  });
  
  // Build the chunks array to collect the PDF data
  const chunks: Uint8Array[] = [];
  let result: Blob;
  
  // Handle document stream events
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    result = new Blob(chunks, { type: 'application/pdf' });
    onComplete(result);
  });
  
  // Navy blue color
  const HEADER_COLOR = '#203864';
  const ACCENT_COLOR = '#1a457a';
  
  // Document dimensions
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Set up the document with a header
  doc.fillColor(ACCENT_COLOR)
     .rect(0, 0, pageWidth, 80)
     .fill();
  
  // Add the title
  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text('MERCHANT AGREEMENT FOR CPXTB TOKEN PAYMENTS', margin, 30, {
       align: 'center',
       width: contentWidth
     });
  
  // Content start position
  let y = 100;
  
  // Helper function to add a section heading
  const addSectionHeading = (text: string) => {
    doc.fillColor(HEADER_COLOR)
       .rect(margin, y, contentWidth, 22)
       .fill();
    
    doc.fillColor('white')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(text, margin + 10, y + 6);
    
    y += 30;
  };
  
  // Helper function to add text content
  const addContent = (text: string) => {
    doc.fillColor('black')
       .font('Helvetica')
       .fontSize(10)
       .text(text, margin, y, {
         width: contentWidth,
         align: 'justify'
       });
    
    // Calculate height of the text
    const textHeight = doc.heightOfString(text, {
      width: contentWidth,
      align: 'justify'
    });
    
    y += textHeight + 10;
  };
  
  // Introduction
  doc.fillColor('black')
     .font('Helvetica')
     .fontSize(10)
     .text(`THIS MERCHANT AGREEMENT (the "Agreement") is entered into as of ${merchantFields[6].value} (the "Effective Date"), by and between:`, margin, y, {
       width: contentWidth
     });
  
  y += 30;
  
  // Parties
  doc.font('Helvetica-Bold')
     .text(`${PLATFORM_NAME} ("Platform Provider")`, margin, y);
  
  y += 15;
  
  doc.text('and', margin, y);
  
  y += 15;
  
  doc.text(`${merchantFields[0].value} ("Merchant"), located at ${merchantFields[1].value}`, margin, y, {
    width: contentWidth
  });
  
  y += 30;
  
  // Recitals section
  addSectionHeading('RECITALS');
  
  addContent('WHEREAS, Platform Provider operates a cryptocurrency payment processing platform that enables merchants to accept CPXTB tokens as payment for goods and services;');
  
  addContent('WHEREAS, Merchant desires to utilize the Platform to accept CPXTB tokens as payment for its goods and services;');
  
  addContent('NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:');
  
  // 1. Services
  addSectionHeading('1. SERVICES');
  
  addContent('Platform Provider agrees to provide Merchant with access to the Platform, which enables Merchant to accept CPXTB tokens as payment. The Platform includes payment processing, transaction verification, and merchant dashboard functionality.');
  
  // 2. Merchant Obligations
  addSectionHeading('2. MERCHANT OBLIGATIONS');
  
  addContent('2.1 Merchant shall maintain accurate business information on the Platform.\n\n2.2 Merchant shall provide a valid blockchain wallet address to receive CPXTB token payments.\n\n2.3 Merchant agrees to comply with all applicable laws and regulations related to cryptocurrency transactions.\n\n2.4 Merchant acknowledges the volatility of cryptocurrency values and assumes all risks associated with accepting CPXTB tokens as payment.');
  
  // 3. Fees
  addSectionHeading('3. FEES AND PAYMENT TERMS');
  
  addContent('3.1 Platform Provider shall charge a transaction fee of 1.0% of all CPXTB token payments processed through the Platform.\n\n3.2 The Transaction Fee shall be automatically deducted from each payment transaction at the time of settlement.');
  
  // 4. Term and Termination
  addSectionHeading('4. TERM AND TERMINATION');
  
  addContent('4.1 This Agreement shall commence on the Effective Date and continue until terminated by either party with 30 days written notice.\n\n4.2 Either party may terminate this Agreement immediately upon written notice if the other party breaches any material term of this Agreement.');
  
  // 5. Limitation of Liability
  addSectionHeading('5. LIMITATION OF LIABILITY');
  
  addContent('5.1 IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT.\n\n5.2 PLATFORM PROVIDER\'S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE TRANSACTION FEES PAID BY MERCHANT DURING THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE CLAIM.');
  
  // 6. Governing Law
  addSectionHeading('6. GOVERNING LAW');
  
  addContent('This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which Platform Provider is established, without regard to its conflict of law principles.');
  
  // Add a new page for signatures
  doc.addPage();
  y = 50;
  
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.', margin, y, {
       width: contentWidth,
       align: 'center'
     });
  
  y += 50;
  
  // Platform Provider signature block
  doc.fillColor('#f0f0f5')
     .roundedRect(margin, y, contentWidth, 80, 5)
     .fill();
  
  doc.fillColor(HEADER_COLOR)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('PLATFORM PROVIDER:', margin + 10, y + 10);
  
  doc.fillColor('black')
     .font('Helvetica')
     .fontSize(10)
     .text('Signature: _______________________________', margin + 10, y + 30)
     .text('Name: _______________________________', margin + 10, y + 45)
     .text('Title: _______________________________', margin + 10, y + 60);
  
  y += 100;
  
  // Merchant signature block
  doc.fillColor('#f0f0f5')
     .roundedRect(margin, y, contentWidth, 80, 5)
     .fill();
  
  doc.fillColor(HEADER_COLOR)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('MERCHANT:', margin + 10, y + 10);
  
  doc.fillColor('black')
     .font('Helvetica')
     .fontSize(10)
     .text('Signature: _______________________________', margin + 10, y + 30)
     .text(`Name: ${merchantFields[2].value}`, margin + 10, y + 45)
     .text(`Business Name: ${merchantFields[0].value}`, margin + 10, y + 60);
  
  y += 100;
  
  // Wallet address box
  doc.fillColor('#dce1eb')
     .roundedRect(margin, y, contentWidth, 40, 5)
     .fill();
  
  doc.fillColor('black')
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('Wallet Address (Base Network):', margin + 10, y + 10);
  
  doc.font('Helvetica')
     .text(`${merchantFields[5].value}`, margin + 10, y + 25);
  
  // Finalize the PDF
  doc.end();
};

// Function to generate LLC Agreement PDF using PDFKit
export const generateLlcAgreementPDFKit = (
  llcFields: DocumentField[],
  onComplete: (blob: Blob) => void
) => {
  // Create a document
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4'
  });
  
  // Build the chunks array to collect the PDF data
  const chunks: Uint8Array[] = [];
  let result: Blob;
  
  // Handle document stream events
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    result = new Blob(chunks, { type: 'application/pdf' });
    onComplete(result);
  });
  
  // Navy blue color
  const HEADER_COLOR = '#203864';
  const ACCENT_COLOR = '#1a457a';
  
  // Document dimensions
  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Set up the document with a header
  doc.fillColor(ACCENT_COLOR)
     .rect(0, 0, 80, pageWidth)
     .fill();
  
  // Add the title
  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text('LLC OPERATING AGREEMENT FOR CRYPTOCURRENCY BUSINESS', margin, 30, {
       align: 'center',
       width: contentWidth
     });
  
  // Content start position
  let y = 100;
  
  // Helper function to add a section heading
  const addSectionHeading = (text: string) => {
    doc.fillColor(HEADER_COLOR)
       .rect(margin, y, contentWidth, 22)
       .fill();
    
    doc.fillColor('white')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(text, margin + 10, y + 6);
    
    y += 30;
  };
  
  // Helper function to add text content
  const addContent = (text: string) => {
    doc.fillColor('black')
       .font('Helvetica')
       .fontSize(10)
       .text(text, margin, y, {
         width: contentWidth,
         align: 'justify'
       });
    
    // Calculate height of the text
    const textHeight = doc.heightOfString(text, {
      width: contentWidth,
      align: 'justify'
    });
    
    y += textHeight + 10;
  };
  
  // Introduction
  doc.fillColor('black')
     .font('Helvetica')
     .fontSize(10)
     .text(`THIS LIMITED LIABILITY COMPANY OPERATING AGREEMENT (the "Agreement") is made and entered into as of ${llcFields[7].value} (the "Effective Date") by and among the Members of ${llcFields[0].value}, a limited liability company organized under the laws of the State of ${llcFields[6].value} (the "Company").`, margin, y, {
       width: contentWidth
     });
  
  y += 30;
  
  // Article I
  addSectionHeading('ARTICLE I - COMPANY FORMATION');
  
  addContent(`1.1 FORMATION. The Members have formed a Limited Liability Company named ${llcFields[0].value} by filing the Articles of Organization with the Secretary of State in the State of ${llcFields[6].value}. The operation of the Company shall be governed by the terms of this Agreement and the applicable laws of the State of ${llcFields[6].value}.`);
  
  addContent('1.2 PURPOSE. The primary purpose of the Company is to engage in the business of cryptocurrency trading, mining, and payment processing, specifically utilizing the CPXTB token on the Base blockchain network.');
  
  addContent(`1.3 PRINCIPAL PLACE OF BUSINESS. The Company's principal place of business shall be at ${llcFields[1].value}, or such other place as the Members may from time to time designate.`);
  
  // Article II
  addSectionHeading('ARTICLE II - MEMBERSHIP');
  
  addContent('2.1 INITIAL MEMBERS. The initial Member(s) of the Company is/are:');
  addContent(`Name: ${llcFields[2].value}\nTitle: ${llcFields[3].value}`);
  
  // Article III
  addSectionHeading('ARTICLE III - CRYPTOCURRENCY OPERATIONS');
  
  addContent('3.1 CRYPTOCURRENCY ASSETS. The Company shall maintain cryptocurrency assets, including CPXTB tokens, for operational purposes. The Company acknowledges the volatility and risks associated with cryptocurrency investments.');
  
  addContent('3.2 WALLETS AND SECURITY. The Company shall implement industry-standard security measures to protect its cryptocurrency holdings, including but not limited to multi-signature wallets, cold storage solutions, and regular security audits.');
  
  // Add a new page for more content
  doc.addPage();
  y = 50;
  
  addContent('3.3 COMPLIANCE. The Company shall comply with all applicable laws and regulations regarding cryptocurrency operations, including anti-money laundering (AML) and know-your-customer (KYC) requirements, tax reporting obligations, and any registration or licensing requirements applicable to cryptocurrency businesses.');
  
  // Article IV
  addSectionHeading('ARTICLE IV - TAXATION');
  
  addContent(`4.1 TAX CLASSIFICATION. The Company shall be taxed as specified in the Articles of Organization. The Company's Tax Identification Number (EIN) is: ${llcFields[5].value}`);
  
  addContent('4.2 CRYPTOCURRENCY TAXATION. The Company acknowledges that cryptocurrency transactions may be subject to capital gains tax and other tax obligations. The Company shall maintain detailed records of all cryptocurrency transactions for tax reporting purposes.');
  
  // Article V
  addSectionHeading('ARTICLE V - DISSOLUTION');
  
  addContent('5.1 DISSOLUTION. The Company shall be dissolved upon the occurrence of any of the following events:\n(a) By unanimous written agreement of all Members;\n(b) The sale or transfer of all or substantially all of the Company\'s assets;\n(c) As required by law or judicial decree.');
  
  addContent('5.2 WINDING UP. Upon dissolution, the Company shall wind up its affairs, liquidate its cryptocurrency assets, and distribute any remaining assets to the Members in accordance with their ownership interests.');
  
  // Article VI
  addSectionHeading('ARTICLE VI - MISCELLANEOUS');
  
  addContent('6.1 ENTIRE AGREEMENT. This Agreement constitutes the entire understanding and agreement among the Members with respect to the subject matter hereof.');
  
  addContent(`6.2 GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of ${llcFields[6].value}.`);
  
  // Signatures
  y += 20;
  
  doc.fillColor(HEADER_COLOR)
     .moveTo(margin, y)
     .lineTo(pageWidth - margin, y)
     .stroke();
  
  y += 10;
  
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .fillColor('black')
     .text('IN WITNESS WHEREOF', margin, y, {
       width: contentWidth,
       align: 'center'
     });
  
  y += 20;
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('The Members have executed this Agreement as of the Effective Date.', margin, y, {
       width: contentWidth,
       align: 'center'
     });
  
  y += 30;
  
  // Member signature block
  doc.fillColor('#f0f0f5')
     .roundedRect(margin, y, contentWidth, 100, 5)
     .fill();
  
  doc.fillColor(HEADER_COLOR)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text('MEMBER SIGNATURE:', margin + 10, y + 10);
  
  doc.fillColor('black')
     .font('Helvetica')
     .fontSize(10)
     .text('Signature: _______________________________', margin + 10, y + 30)
     .text(`Name: ${llcFields[2].value}`, margin + 10, y + 45)
     .text(`Title: ${llcFields[3].value}`, margin + 10, y + 60)
     .text(`Date: ${llcFields[7].value}`, margin + 10, y + 75);
  
  // Finalize the PDF
  doc.end();
};