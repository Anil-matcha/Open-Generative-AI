export const plans = [
    [
        {
            name: "Starter",
            description: "Starter Plan",
            price: "€19/month",
            stripePriceId: "price_1OFMoBBV627Dgso64OERRQsE",
        },
        {
            name: "Premium",
            description: "Premium Plan",
            price: "€59/month",
            stripePriceId: "price_1OFMoVBV627Dgso6gPajHjpF",
        },
    ],
];

export const planSelector = (plan_name: string, frequency: string) => {
    let stripe_plan_id;
    switch (plan_name) {
        case "trial":
            stripe_plan_id =
                process.env.NEXT_PUBLIC_PLAN_GROWTH_TRIAL ??
                "price_1R8O6EAcgHuoZ5np2Nu75nEz";
            break;
        case "lite":
            stripe_plan_id =
                frequency === "month"
                    ? process.env.NEXT_PUBLIC_PLAN_LITE_MONTH ??
                      "price_1R8O6EAcgHuoZ5np2Nu75nEz"
                    : process.env.NEXT_PUBLIC_PLAN_LITE_YEAR ??
                      "price_1R8O6EAcgHuoZ5npCHSaS1iu";
            break;
        case "growth":
            stripe_plan_id =
                frequency === "month"
                    ? process.env.NEXT_PUBLIC_PLAN_GROWTH_MONTH ??
                      "price_1R8O6CAcgHuoZ5npDDPX70Io"
                    : process.env.NEXT_PUBLIC_PLAN_GROWTH_YEAR ??
                      "price_1R8O6BAcgHuoZ5npfQ0ji1Sa";
            break;
        case "scale":
            stripe_plan_id =
                frequency === "month"
                    ? process.env.NEXT_PUBLIC_PLAN_SCALE_MONTH ??
                      "price_1R8O68AcgHuoZ5npwet38tre"
                    : process.env.NEXT_PUBLIC_PLAN_SCALE_YEAR ??
                      "price_1R8O68AcgHuoZ5npwet38tre";
            break;
        default:
            break;
    }
    return stripe_plan_id;
};
export const planUsage = (plan_name: string) => {
    let planUsage: {
        dynamicVideos: any[];
        seat: any[];
        videos: number[];
    } = {
        dynamicVideos: [1500, 1500],
        seat: [5, 5],
        videos: [100, 100],
    };
    switch (plan_name) {
        case "trial":
            planUsage = {
                dynamicVideos: [0, 1500],
                seat: [1, 5],
                videos: [0, 100],
            };
            break;
        case "lite":
            planUsage = {
                dynamicVideos: [0, 100],
                seat: [1, 1],
                videos: [0, 20],
            };
            break;
        case "growth":
            planUsage = {
                dynamicVideos: [0, 1500],
                seat: [1, 5],
                videos: [0, 100],
            };
            break;
        case "scale":
            planUsage = {
                dynamicVideos: [0, 3000],
                seat: [10, 10],
                videos: [0, 250],
            };
            break;
        case "enterprise":
            planUsage = {
                dynamicVideos: [0, 5000],
                seat: [10, 25],
                videos: [0, 1000000],
            };
            break;
        default:
            break;
    }
    return planUsage;
};
