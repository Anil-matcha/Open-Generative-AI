import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

async function handleCustomer(req, res) {
    try {
        const customer = await stripe.subscriptions.update(
            req.body.stripe_sub_id,
            {
                cancel_at_period_end: false,
            },
        );

        return res.status(200).json(customer);
    } catch (err) {
        return res
            .status(400)
            .send(`cancel subscription failed: ${err.message}`);
    }
}

export default handleCustomer;
