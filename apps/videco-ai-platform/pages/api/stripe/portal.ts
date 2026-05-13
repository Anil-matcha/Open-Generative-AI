import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: req.body.stipe_customer,
                return_url: `${req.headers.origin}/videos`,
            });

            res.status(200).json({ sessionId: session.id, url: session.url });
        } catch (err) {
            res.status(500).json({ error: err });
        }
    } else {
        res.setHeader("Allow", "POST");
        res.status(405).end("Method Not Allowed");
    }
}
