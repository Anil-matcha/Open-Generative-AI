// Separate namespace from the upstream studio's en/zh bundles. Add full English
// panel translations here as localization expands; Turkish is the MVP default.
export const messages = {
  tr: {
    brand: 'KARE', subtitle: 'KİŞİSEL AI STÜDYO',
    navigation: { dashboard: 'Kontrol Paneli', video: 'AI Video Stüdyo', characters: 'Karakter Stüdyo', scenes: 'Sahne Stüdyo', history: 'Üretim Geçmişi', settings: 'Ayarlar' },
    descriptions: { dashboard: 'Fikirden ilk kareye, ilk kareden hikâyeye.', video: 'Bir görselden yeni bir dünya yaratın.', characters: 'Hikâyenizin yüzlerini bir arada tutun.', scenes: 'Her sahne, daha büyük bir hikâyenin parçası.', history: 'Çekimleriniz, denemeleriniz ve tamamlanan videolarınız.', settings: 'Stüdyonuzun sağlayıcıları, gizliliği ve depolaması.' },
  },
  en: { brand: 'KARE', subtitle: 'PERSONAL AI STUDIO', navigation: { dashboard: 'Dashboard', video: 'AI Video Studio', characters: 'Character Studio', scenes: 'Scene Studio', history: 'Generation History', settings: 'Settings' } },
};
export const copy = messages.tr;
