const { config, getDatabaseUrl } = require("@higgsfield/api-config");

const appConfig = {
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
};

appConfig.database = {
  url: getDatabaseUrl()
};

appConfig.ai = {
  headshot: {
    apiKey: config.api.muapi.apiKey,
    endpoint: config.api.muapi.baseUrl + "/photo-pack",
  }
};

module.exports = appConfig;
