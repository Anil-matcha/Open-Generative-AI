// Never persist raw provider errors: they may contain input data or credentials.
class ProviderDiagnosticError extends Error {}
export function diagnoseProviderFailure(error, providerId, phase, cspBlocked = false) {
  if (error instanceof ProviderDiagnosticError) return error;
  const text = String(error?.message || error || '');
  const status = Number(error?.status);
  let code = 'PROVIDER_FAILED';
  let message = 'Sağlayıcı üretimi tamamlayamadı. Resmi Space üzerinden durumu kontrol edin.';
  if (cspBlocked || /content security policy/i.test(text)) {
    code = 'CSP_BLOCKED'; message = 'Tarayıcı güvenlik politikası HF bağlantısını engelledi. Site yöneticisine tanı kodunu iletin.';
  } else if (/quota|gpu.*limit/i.test(text)) {
    code = 'QUOTA_EXHAUSTED'; message = 'Anonim API için ücretsiz GPU kotası yetersiz. Resmi Space’te oturum açtığınız hesabın kotası bu uygulamaya aktarılmaz. Hesabınızla resmi üreticiyi kullanıp MP4’ü içe aktarın.';
  } else if (status === 429 || /rate.?limit|too many requests/i.test(text)) {
    code = 'RATE_LIMITED'; message = 'Sağlayıcı istek hızını sınırladı. Bekleyin; otomatik tekrar veya farklı sağlayıcıya geçiş yapılmadı.';
  } else if ([401,403].includes(status) || /authenticat|sign.?in|log.?in|unauthori[sz]ed|\b401\b|\b403\b/i.test(text)) {
    code = 'AUTH_REQUIRED'; message = 'Sağlayıcı kimlik doğrulaması istiyor. Buraya HF token yapıştırmayın; resmi Space’te oturum açıp MP4’ü içe aktarın.';
  } else if (/schema|şema/i.test(text)) {
    code = 'SCHEMA_CHANGED'; message = 'Space API şeması değişti. Resmi üreticiyi kullanın.';
  } else if (/timeout|timed out/i.test(text)) {
    code = 'TIMEOUT'; message = 'İzleme süresi doldu. Uzak iş hâlâ çalışıyor olabilir; tekrar göndermeden önce resmi Space’i kontrol edin.';
  } else if (/fetch|network|connection|cors/i.test(text) || (['client','connect'].includes(phase) && /load|connect/i.test(text))) {
    code = 'NETWORK_OR_CORS'; message = 'HF bağlantısı kurulamadı. Tarayıcı Ağ panelinde CORS, TLS veya ağ hatasını kontrol edin; bu mesaj tek başına kota hatası demek değildir.';
  } else if (phase === 'events') {
    code = /404|not found|evicted/i.test(text) ? 'WORKER_UNAVAILABLE' : 'EVENT_STREAM_FAILED';
    message = 'Uzak iş veya Gradio olay akışı hata verdi. Resmi Space’i kontrol edin; iş otomatik tekrar gönderilmedi.';
  }
  const failure = new ProviderDiagnosticError(message);
  failure.diagnostic = { code, phase, providerId, authMode: 'anonymous', ...(Number.isInteger(status) && status >= 400 && status <= 599 ? { httpStatus: status } : {}) };
  return failure;
}
