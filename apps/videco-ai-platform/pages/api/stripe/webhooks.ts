import Stripe from "stripe";
import { buffer } from "micro";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOKS_SECRET!;


export const config = {
    api: {
        bodyParser: false,
    },
};
const options = {
    method: "POST",
    url: "https://api.partnero.com/v1/transactions",
    headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: "Bearer " + process.env.PARTNERO_API_KEY,
    },
    data: {
        product_type: "monthly", // optional
        action: "sale",
    },
};

async function handleWebhookEvent(req, res) {
    const sig = req.headers["stripe-signature"];
    const requestBuffer = await buffer(req);
    const payload = requestBuffer.toString();
    let event;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res
            .status(400)
            .send(`Webhook signature verification failed: ${err.message}`);
    }

    const session = event.data.object;
    if (
        event.type === "invoice.payment_succeeded" ||
        event.type === "payment_intent.succeeded"
    ) {
        const supabase = createClientComponentClient();
        await supabase
            .from("plan")
            .update({
                free_trial_start_date:
                    event.type === "payment_intent.succeeded"
                        ? new Date().toJSON().slice(0, 10)
                        : null,
                free_trial_ended: true,
                plan_name: session.subscription_details.metadata.plan_name,
                status:
                    event.type === "payment_intent.succeeded"
                        ? "free_trial"
                        : "active",
            })
            .eq(
                "user_id",
                event.type === "payment_intent.succeeded"
                    ? session.metadata.userId
                    : session.subscription_details.metadata.userId,
            )
            .select()
            .then((res) => {
                console.log("success..", res);
            });

        await supabase
            .from("profiles")
            .update({
                onboard_completed: true,
            })
            .eq(
                "id",
                event.type === "payment_intent.succeeded"
                    ? session.metadata.userId
                    : session.subscription_details.metadata.userId,
            );

        axios
            .request({
                ...options,
                data: {
                    email: session?.customer_email ?? "",
                    customer: {
                        email: session?.customer_email ?? "",
                    },
                    key: session?.customer_email ?? "",
                    amount: session?.amount_paid,
                    product_type: "monthly", // optional
                    action: "sale",
                },
            })
            .then(function (response) {
                // const lead = await insertLead();
                console.log(response.data);
            })
            .catch(function (error) {
                console.error(error);
            });
        return res.status(200).send({ received: session.customer });
    }

    res.status(200).end();
}

export default handleWebhookEvent;
