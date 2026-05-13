import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { BillingService } from "@/lib/services/billing";

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature");

  try {
    await BillingService.handleWebhook(body, signature);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}
