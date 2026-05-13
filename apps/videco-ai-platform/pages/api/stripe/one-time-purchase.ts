import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
});

async function handleOneTimePurchase(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    if (!req.body.customer || !req.body.stripe_plan_id || !req.body.user_id) {
        return res.status(400).json({ message: "Missing required fields" });
    }

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

        const session = await stripe.checkout.sessions.create({
            customer: req.body.customer,
            mode: "payment",
            line_items: [
                {
                    price: req.body.stripe_plan_id,
                    quantity: 1,
                },
            ],
            discounts: validPromoCodeId
                ? [{ promotion_code: validPromoCodeId }]
                : undefined,
            metadata: {
                userId: req.body.user_id,
                planId: req.body.stripe_plan_id,
                plan_name: req.body.plan_name,
            },
            success_url: `https://app.videco.io/settings?success=true`,
            cancel_url: `https://app.videco.io/pricing?canceled=true`,
        });

        const supabase = createClientComponentClient();
        await supabase
            .from("plan")
            .update({
                onboard_completed: true,
            })
            .eq("user_id", req.body.user_id)
            .select()
            .then((res) => {
                console.log("success..", res);
            });

        res.status(200).json({
            sessionId: session.id,
        });
    } catch (err) {
        const error = err as Error;
        console.error("One-time purchase error:", error);
        return res
            .status(400)
            .send(`One-time purchase creation failed: ${error.message}`);
    }
}

export default handleOneTimePurchase;
