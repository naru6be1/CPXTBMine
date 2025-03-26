import OpenAI from 'openai';
import { storage } from '../storage';
import type { User, MiningPlan, InsertRecommendation } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class RecommendationService {
  private async generateRecommendation(
    user: User,
    activePlans: MiningPlan[],
    context: Record<string, any>
  ): Promise<string> {
    try {
      const userContext = {
        miningHistory: activePlans.length,
        totalInvestment: activePlans.reduce((sum, plan) => sum + parseFloat(plan.amount), 0),
        preferredPlanType: this.getPreferredPlanType(activePlans),
        lastClaimTime: user.lastCPXTBClaimTime,
      };

      const prompt = `As a crypto mining advisor, analyze this user's mining behavior:
      - Mining History: ${userContext.miningHistory} active plans
      - Total Investment: ${userContext.totalInvestment} WETH
      - Preferred Plan: ${userContext.preferredPlanType}
      - Last Claim: ${userContext.lastClaimTime}
      
      Based on this data, provide a concise, personalized recommendation for their CPXTB mining strategy.
      Focus on maximizing rewards and suggesting the most suitable mining plans.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        max_tokens: 150,
        temperature: 0.7,
      });

      return completion.choices[0].message.content || 
        "Consider diversifying your mining portfolio with different plan types to optimize rewards.";
    } catch (error) {
      console.error('Error generating AI recommendation:', error);
      return "Unable to generate personalized recommendation at this time. Please try again later.";
    }
  }

  private getPreferredPlanType(plans: MiningPlan[]): string {
    const planCounts = plans.reduce((acc, plan) => {
      acc[plan.planType] = (acc[plan.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(planCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';
  }

  async createRecommendation(userId: number): Promise<InsertRecommendation | null> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return null;

      const activePlans = await storage.getActiveMiningPlans(user.username);
      
      const recommendationContent = await this.generateRecommendation(
        user,
        activePlans,
        { timestamp: new Date() }
      );

      const recommendation: InsertRecommendation = {
        userId,
        recommendationType: 'mining_plan',
        content: recommendationContent,
        context: {
          activePlans: activePlans.length,
          timestamp: new Date().toISOString(),
        },
      };

      // Store recommendation in database
      return recommendation;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      return null;
    }
  }
}

export const recommendationService = new RecommendationService();
