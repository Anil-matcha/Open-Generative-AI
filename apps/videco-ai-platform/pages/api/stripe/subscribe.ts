import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

async function handleSubscription(req, res) {
    try {
        // Validate the promotion code if provided
        let validPromoCodeId: string | undefined;
        if (req.body.promoCode) {
            const promoCodeObject = await stripe.promotionCodes.list({
                code: req.body.promoCode,
                active: true,
            });

            if (promoCodeObject.data.length > 0) {
                validPromoCodeId = promoCodeObject.data[0].id;
            } else {
                throw new Error("Invalid or expired promo code.");
            }
        }

        const subscription = await stripe.subscriptions.create({
            customer: req.body.customer,
            items: [
                {
                    price: req.body.stripe_plan_id,
                },
            ],
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
            promotion_code: validPromoCodeId, // Apply valid promo code
            metadata: {
                userId: req.body.user_id,
                planId: req.body.stripe_plan_id,
                plan_name: req.body.plan_name,
            },
        });
        const supabase = createClientComponentClient();
        await supabase
            .from("plan")
            .update({
                stripe_sub_id: subscription.id,
                onboard_completed: true,
            })
            .eq("user_id", req.body.user_id)
            .select()
            .then((res) => {
                console.log("success..", res);
            });

        // Safely handle the type of latest_invoice
        const latestInvoice = subscription.latest_invoice;

        // Ensure latest_invoice is an object (not a string)
        if (typeof latestInvoice === "object" && latestInvoice.payment_intent) {
            const paymentIntent =
                latestInvoice.payment_intent as Stripe.PaymentIntent;

            res.status(200).json({
                clientSecret: paymentIntent.client_secret,
                subscriptionId: subscription.id,
            });
        } else {
            throw new Error("Failed to retrieve payment intent.");
        }
    } catch (err) {
        return res
            .status(400)
            .send(`Subscription creation failed: ${err.message}`);
    }
}

export default handleSubscription;
