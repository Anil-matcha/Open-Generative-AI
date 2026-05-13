import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { amount, currency, description, userId, planId } = req.body;

        try {
            // Create a Payment Intent with the specified amount
            const paymentIntent = await stripe.paymentIntents.create({
                amount, // Amount in smallest currency unit (e.g., 1000 = $10.00)
                currency, // e.g., 'usd'
                description, // Optional description for the payment
                automatic_payment_methods: { enabled: true }, // Enables Payment Element compatibility
                metadata: { userId, planId },
            });

            res.status(200).json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
}
