// Blockchain-related constants
export const CPXTB_TOKEN_ADDRESS = "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b";
export const TREASURY_ADDRESS = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27";
export const BASE_CHAIN_ID = 8453;

// Platform-related constants
export const PLATFORM_NAME = "CPXTB Platform";
export const PLATFORM_URL = "https://cpxtb.io";

// Contact information
export const CONTACT_EMAIL = "info@coinpredictiontool.com";
export const TELEGRAM_SUPPORT = "@CPXTBOfficialSupport";
export const TELEGRAM_COMMUNITY = "@CPXTBOfficial";
export const TWITTER_HANDLE = "@cpxtbofficial";
export const DISCORD_URL = "discord.gg/cpxtbofficial";

// Mining plans configuration
export const PLANS = {
  bronze: {
    amount: "100.000000", // Amount in USDT (6 decimals)
    displayAmount: "$100",
    rewardUSD: 0.60,
    duration: "30 days",
    name: "Bronze",
    description: "Basic mining plan with starter returns",
    color: "bg-amber-800",
  },
  silver: {
    amount: "250.000000",
    displayAmount: "$250",
    rewardUSD: 1.75,
    duration: "30 days",
    name: "Silver",
    description: "Medium-tier plan with improved returns",
    color: "bg-gray-400",
  },
  gold: {
    amount: "500.000000",
    displayAmount: "$500",
    rewardUSD: 4.25,
    duration: "30 days",
    name: "Gold",
    description: "Premium plan with highest returns",
    color: "bg-yellow-500",
  }
};

// Theme templates mapping
export const THEME_TEMPLATES = {
  default: "Modern Blue",
  bold: "Crypto Gold",
  minimal: "Minimalist",
  tech: "Dark Mode"
};