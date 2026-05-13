/**
 * Centralized configuration for the SaaS template.
 * All environment variables are validated and exported from here.
 */

const config = {
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    webhook_url: process.env.WEBHOOK_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    plans: {
      default: {
        amount: 50, // 10 Headshots (5 credits each)
        price: 900, // $9.00
        currency: "usd",
      }
    }
  },
  ai: {
    headshot: {
      apiKey: process.env.HEADSHOT_API_KEY,
      endpoint: "https://api.muapi.ai/api/v1/photo-pack",
    }
  },
  db: {
    url: process.env.DATABASE_URL,
  }
};

// Simple validation to warn if critical keys are missing
const requiredKeys = [
  ["GOOGLE_CLIENT_ID", config.auth.google.clientId],
  ["GOOGLE_CLIENT_SECRET", config.auth.google.clientSecret],
  ["STRIPE_SECRET_KEY", config.stripe.secretKey],
  ["DATABASE_URL", config.db.url],
];

if (typeof window === "undefined") {
  requiredKeys.forEach(([name, value]) => {
    if (!value) {
      console.warn(`[CONFIG] Warning: Missing critical environment variable: ${name}`);
    }
  });
}

export default config;
