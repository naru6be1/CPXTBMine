import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export function FAQSection() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What are CPXTB Mining Plans?</AccordionTrigger>
            <AccordionContent>
              CPXTB Mining Plans are investment opportunities that allow you to earn CPXTB tokens. We offer two types of plans:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Daily Plan: 0.1 USDT investment with rewards in 24 hours</li>
                <li>Weekly Plan: 100 USDT investment with rewards over 7 days</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>How do I receive my CPXTB rewards?</AccordionTrigger>
            <AccordionContent>
              After your mining plan period ends (24 hours for daily, 7 days for weekly), your CPXTB rewards will be automatically distributed to your provided Base network wallet address. Make sure you've provided the correct withdrawal address during plan activation.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Which networks do you support?</AccordionTrigger>
            <AccordionContent>
              We support two networks:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Ethereum Mainnet: For USDT deposits</li>
                <li>Base Network: For receiving CPXTB rewards</li>
              </ul>
              Make sure you have both networks configured in your wallet.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>How are rewards calculated?</AccordionTrigger>
            <AccordionContent>
              Rewards are calculated based on your plan:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Daily Plan: Earn CPXTB worth $0.15 per day</li>
                <li>Weekly Plan: Earn CPXTB worth $15 per week</li>
              </ul>
              The exact amount of CPXTB tokens depends on the current CPXTB/USDT price.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>How do I track my mining plans?</AccordionTrigger>
            <AccordionContent>
              Once you activate a plan, you can track its status in the "Active Mining Plans" section. This shows:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Plan type and investment amount</li>
                <li>Daily reward amount</li>
                <li>Start and end times</li>
                <li>Withdrawal status</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>What happens after my plan expires?</AccordionTrigger>
            <AccordionContent>
              When your plan expires:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The plan status will change to "Expired"</li>
                <li>CPXTB rewards will be distributed to your Base network address</li>
                <li>You can start a new plan at any time</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}