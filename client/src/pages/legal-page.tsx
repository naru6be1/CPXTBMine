import { LegalDocuments } from "@/components/legal-documents";
import { Separator } from "@/components/ui/separator";

export default function LegalPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Legal Documents</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
          Generate and download legal documents required for merchants accepting CPXTB tokens
          and LLC owners operating in the cryptocurrency space.
        </p>
        <Separator className="mt-8 mb-8" />
      </div>
      
      <LegalDocuments />
      
      <div className="mt-16 p-6 bg-muted/30 border border-border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Legal Document Usage Guidelines</h2>
        <div className="space-y-4 text-sm">
          <p>
            <strong>Disclaimer:</strong> The documents provided on this page are templates designed to assist merchants and LLC owners. These templates are not a substitute for qualified legal advice.
          </p>
          <p>
            <strong>Consult with Legal Professionals:</strong> We strongly recommend that you have these documents reviewed by a qualified attorney before signing or implementing them.
          </p>
          <p>
            <strong>Customization Required:</strong> These templates may need to be modified to comply with your specific business needs and local laws.
          </p>
          <p>
            <strong>Digital Signatures:</strong> These documents can be signed electronically in jurisdictions that recognize electronic signatures. However, physical signatures may be preferred for certain legal purposes.
          </p>
          <p>
            <strong>Document Retention:</strong> Keep signed copies of these documents in a secure location for your records. We recommend maintaining both digital and physical copies.
          </p>
        </div>
      </div>
    </div>
  );
}