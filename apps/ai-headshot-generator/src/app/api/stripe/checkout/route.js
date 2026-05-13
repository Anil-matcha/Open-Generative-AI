const { NextResponse } = require("next/server");
const { BillingService } = require("@/lib/services/billing");

module.exports = async function POST(req) {
  try {
    const { price, credits, userId } = await req.json();
    
    if (!userId) {
      return new NextResponse("User ID required", { status: 401 });
    }
    
    const checkoutUrl = await BillingService.createCheckoutSession(
      userId, 
      price, 
      credits
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
