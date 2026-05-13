import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

async function handleCustomer(req, res) {
    try {
        const { email } = req.body;
        const customers = await stripe.customers.list({ email, limit: 1 });
        let customer;
        if (customers.data.length > 0) {
            // Customer already exists, use existing customer ID
            customer = customers.data[0];
        } else {
            // Create a new customer
            customer = await stripe.customers.create({ email });
        }

        const supabase = createClientComponentClient();
        await supabase
            .from("plan")
            .upsert({
                user_id: req.body.user_id,
                stipe_id: customer.id,
            })
            .eq("user_id", req.body.user_id)
            .select()
            .then((res) => {
                console.log("success..", res);
            });
        return res.status(200).json(customer);
    } catch (err) {
        return res.status(400).send(`Customer creation failed: ${err.message}`);
    }
}

export default handleCustomer;
