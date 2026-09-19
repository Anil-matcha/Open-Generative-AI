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

// Turns { cost } into a short "~$0.60" label. Muapi's `cost` is a flat base price for one
// default-settings generation (not a per-second/per-token rate), and `cost_strategy` is an
// internal pricing-group id rather than a display unit (verified against the live API —
// e.g. cost_strategy "veo3.1-fast-video" for a $0.60 image-to-video task), so we only show
// the amount, prefixed with "~" since the real cost can move with resolution/duration/etc.
export function formatMuapiPrice(entry) {
    if (!entry || entry.cost == null) return null;
    const cost = Number(entry.cost);
    if (!Number.isFinite(cost) || cost <= 0) return null;

    const amount = cost >= 1 ? cost.toFixed(2) : cost >= 0.01 ? cost.toFixed(3) : cost.toFixed(4);
    return `~$${amount}`;
}
