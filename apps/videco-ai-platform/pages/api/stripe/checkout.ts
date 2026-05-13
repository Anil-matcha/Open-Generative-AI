import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handleCheckout(req, res) {
    if (req.method === "POST") {
        try {
            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                currency: "eur",
                customer_email: req.body.customer_email,
                allow_promotion_codes: true,
                line_items: [
                    {
                        price: req.body.stripe_plan_id,
                        quantity: 1,
                    },
                ],
                success_url: `https://app.videco.io/settings?success=true`,
            });
            return res
                .status(200)
                .json({ sessionId: session.id, url: session.url });
        } catch (err) {
            res.status(500).json({ error: err });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
}

export default handleCheckout;
