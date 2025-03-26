import OpenAI from "openai";
import { storage } from '../storage';
import type { User, MiningPlan, InsertRecommendation } from '@shared/schema';

// Check if API key exists
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OpenAI API key is missing. AI recommendations will use fallback mode.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
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

      console.log('Generating recommendation with context:', {
        userAddress: user.username,
        context: userContext,
        hasApiKey: !!OPENAI_API_KEY,
        timestamp: new Date().toISOString()
      });

      // If no API key, return fallback recommendation immediately
      if (!OPENAI_API_KEY) {
        console.log('No API key available, using fallback recommendation');
        return this.getFallbackRecommendation(activePlans);
      }

      const systemMessage = `You are a crypto mining advisor specializing in CPXTB mining strategies. 
      Your role is to provide clear, actionable recommendations to help users optimize their mining rewards.`;

      const userMessage = `Based on this user's mining behavior:
      - Mining History: ${userContext.miningHistory} active plans
      - Total Investment: ${userContext.totalInvestment} WETH
      - Preferred Plan: ${userContext.preferredPlanType}
      - Last Claim: ${userContext.lastClaimTime}

      Provide a concise, personalized recommendation focusing on maximizing their CPXTB mining rewards.`;

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          model: "gpt-3.5-turbo",
          max_tokens: 150,
          temperature: 0.7,
        });

        console.log('OpenAI API Response:', {
          status: 'success',
          content: completion.choices[0].message.content,
          timestamp: new Date().toISOString()
        });

        return completion.choices[0].message.content || 
          this.getFallbackRecommendation(activePlans);
      } catch (error: any) {
        console.error('OpenAI API Error:', {
          error: error.message,
          status: error.status,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        });
        if (error.message.includes('403')) {
          console.error('OpenAI API access denied. Please check API key configuration.');
        }

        return this.getFallbackRecommendation(activePlans);
      }
    } catch (error: any) {
      console.error('Error in recommendation generation:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      return this.getFallbackRecommendation(activePlans);
    }
  }

  private getFallbackRecommendation(plans: MiningPlan[]): string {
    const planCount = plans.length;
    if (planCount === 0) {
      return "Start your mining journey with our Bronze plan - it's perfect for beginners and offers steady rewards.";
    } else if (planCount === 1) {
      return "Great start with your first plan! Consider adding a second mining plan to diversify your rewards.";
    } else {
      return "You're doing well with multiple plans! Keep monitoring your rewards and consider upgrading plans when possible.";
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
      console.log('Starting recommendation creation for user:', userId);

      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found:', userId);
        return null;
      }

      const activePlans = await storage.getActiveMiningPlans(user.username);
      console.log('Active plans found:', activePlans.length);

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

      console.log('Successfully created recommendation:', {
        userId,
        type: recommendation.recommendationType,
        timestamp: new Date().toISOString()
      });

      return recommendation;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      return null;
    }
  }
}

export const recommendationService = new RecommendationService();