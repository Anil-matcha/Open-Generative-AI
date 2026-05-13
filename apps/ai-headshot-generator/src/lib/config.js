const { config: apiConfig } = require("@higgsfield/api-config");

const config = {
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    plans: {
      default: {
        amount: 50,
        price: 900,
        currency: "usd",
      }
    }
  },
  database: {
    url: process.env.DATABASE_URL,
  }
};

config.ai = {
  headshot: {
    apiKey: apiConfig.api.muapi.apiKey,
    endpoint: apiConfig.api.muapi.baseUrl + "/photo-pack",
  }
};

module.exports = config;
