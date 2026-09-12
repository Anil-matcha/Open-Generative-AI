// Fetches Muapi's live per-model pricing (GET /app/get_homepage_models, proxied through
// /api/app/*) and exposes it as a map keyed by model id/name, so pickers can show a price
// badge without an extra estimate-cost round trip per model. Uses the same localStorage
// 'muapi_key' the rest of the app reads (see AuthModal.js / SettingsModal.js).
let priceMapCache = null;
let priceMapPromise = null;

export async function getMuapiPriceMap() {
    if (priceMapCache) return priceMapCache;
    if (priceMapPromise) return priceMapPromise;
    if (typeof window === "undefined") return {};

    const apiKey = localStorage.getItem("muapi_key");
    if (!apiKey) return {};

    priceMapPromise = fetch("/api/app/get_homepage_models", {
        headers: { "x-api-key": apiKey },
    })
        .then((res) => (res.ok ? res.json() : []))
        .then((list) => {
            const map = {};
            (Array.isArray(list) ? list : []).forEach((task) => {
                if (task && task.name && task.cost != null) {
                    map[task.name] = { cost: task.cost, cost_strategy: task.cost_strategy };
                }
            });
            priceMapCache = map;
            return map;
        })
        .catch(() => ({}))
        .finally(() => {
            priceMapPromise = null;
        });

    return priceMapPromise;
}

// Turns { cost, cost_strategy } into a short label like "$0.05/s" or "$2.50/1M tok".
// Falls back to showing the raw cost_strategy text for units we don't recognize.
export function formatMuapiPrice(entry) {
    if (!entry || entry.cost == null) return null;
    const cost = Number(entry.cost);
    if (!Number.isFinite(cost)) return null;

    const amount = cost >= 1 ? cost.toFixed(2) : cost >= 0.01 ? cost.toFixed(3) : cost.toFixed(4);
    const strategy = String(entry.cost_strategy || "").toLowerCase();

    let unit = "";
    if (strategy.includes("token") && (strategy.includes("million") || strategy.includes("1m"))) unit = "/1M tok";
    else if (strategy.includes("token")) unit = "/tok";
    else if (strategy.includes("minute")) unit = "/min";
    else if (strategy.includes("second")) unit = "/s";
    else if (strategy.includes("char")) unit = "/char";
    else if (strategy.includes("image")) unit = "/img";
    else if (strategy.includes("video")) unit = "/clip";
    else if (strategy && !strategy.includes("flat") && !strategy.includes("fixed") && !strategy.includes("request")) {
        unit = ` (${entry.cost_strategy})`;
    }

    return `$${amount}${unit}`;
}
