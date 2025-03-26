import { MiningPlan } from "@/components/mining-plan";
import { AIRecommendations } from "@/components/ai-recommendations";

export default function MiningPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mining Plans</h1>

      <div className="space-y-8">
        <AIRecommendations />
        <MiningPlan />
      </div>
    </div>
  );
}