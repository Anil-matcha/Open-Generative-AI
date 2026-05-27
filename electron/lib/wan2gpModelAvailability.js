function withWan2gpAvailability(model, probeResult, cachedResolution) {
    if (!probeResult?.ok) {
        return {
            ...model,
            ready: false,
            unavailableReason: probeResult?.error || 'Wan2GP probe failed',
        };
    }

    const apiNames = Array.isArray(cachedResolution?.apiNames) ? cachedResolution.apiNames : [];
    const realFn = cachedResolution?.resolved?.get?.(model.id) || null;

    if (realFn) {
        return { ...model, ready: true, fn: realFn };
    }

    if (apiNames.length === 0) {
        return {
            ...model,
            ready: true,
            fn: model.fn,
            availabilityNote: 'Wan2GP did not expose endpoint metadata; using the default api_name.',
        };
    }

    return {
        ...model,
        ready: false,
        unavailableReason: `Wan2GP server has no api_name matching "${model.fn}". Check Wan2GP version or load this model in its UI.`,
    };
}

module.exports = { withWan2gpAvailability };
