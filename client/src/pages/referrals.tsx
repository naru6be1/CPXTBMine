import { ReferralStats } from "@/components/referral-stats";

export default function ReferralsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Referral Program</h1>
      <ReferralStats />
    </div>
  );
}
