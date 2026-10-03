// Availability of a Wan2GP catalog model for the configured engine.
//
// engine = { ok, error, mode: 'local' | 'remote', modelStatus: Map<modelType, status> }
//   local:  from <Wan2GP>/defaults/<modelType>.json + ckpts/ (see wan2gpLocal.localModelStatus)
//   remote: from WanGP's MCP `wangp_get_model_availability`
//   both:   'available' | 'missing' | 'installed'; anything else means the model is unknown
// Weights that are not on disk yet are still usable — Wan2GP downloads them on
// first use — so that case is ready with a note, not unavailable.
function withWan2gpAvailability(model, engine) {
    if (!engine?.ok) {
        return { ...model, ready: false, unavailableReason: engine?.error || 'Wan2GP is not configured' };
    }

    const status = engine.modelStatus?.get(model.modelType);
    if (status === 'installed' || status === 'available') {
        return { ...model, ready: true };
    }
    if (status === 'missing') {
        return { ...model, ready: true, availabilityNote: 'Weights not downloaded yet — the first run downloads them (several GB).' };
    }

    const where = engine.mode === 'remote' ? 'The Wan2GP server' : 'This Wan2GP install';
    return {
        ...model,
        ready: false,
        unavailableReason: `${where} has no model "${model.modelType}" — update Wan2GP.`,
    };
}

module.exports = { withWan2gpAvailability };
