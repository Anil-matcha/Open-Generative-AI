const { stripe } = require("@/lib/stripe");
const config = require("@/lib/config");
const { UserService } = require("./user");

module.exports = {
  async createCheckoutSession(userId, price, credits) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Credits Top-up",
              description: `Purchase ${credits} credits for generative manifestations.`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.database.url || "http://localhost:3000"}/?success=true`,
      cancel_url: `${config.database.url || "http://localhost:3000"}/pricing?canceled=true`,
      metadata: {
        userId: userId,
        credits: credits.toString(),
      },
    });

    return session.url;
  },

  async handleWebhook(body, signature) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits || "0", 10);

      if (userId && credits > 0) {
        await UserService.addCredits(userId, credits);
        return { success: true, userId, credits };
      }
    }

    return { success: false };
  }
};
