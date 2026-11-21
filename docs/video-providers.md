# Video sağlayıcıları: doğrulama ve sınırlar

Doğrulama tarihi: 6 Kasım 2026. İnceleme Hugging Face Hub runtime API, canlı Gradio şeması ve Space kaynak kodu üzerinden yapıldı. Uygulama üretim sırasında şemayı yeniden kontrol eder; adları uydurulmuş uç noktalar kullanmaz.

## LTX Video Distilled — varsayılan

- Space: https://huggingface.co/spaces/Lightricks/ltx-video-distilled
- Host: `https://lightricks-ltx-video-distilled.hf.space`
- Runtime: `RUNNING`, ZeroGPU; Space Gradio sürümü 5.42.0.
- Model: LTX Video 0.9.8 13B Distilled.
- Gerçek görselden-video uç noktası: `/image_to_video`.
- Diğer mevcut uç noktalar arasında `/text_to_video`, `/video_to_video` ve boyut yardımcıları bulunur; bu MVP bunları açmaz.
- Parametreler: `prompt`, `negative_prompt`, `input_image_filepath`, `input_video_filepath`, `height_ui`, `width_ui`, `mode`, `duration_ui`, `ui_frames_to_use`, `seed_ui`, `randomize_seed`, `ui_guidance_scale`, `improve_texture_flag`.
- Görsel girdisi Gradio ImageData'dır. Resmi JS istemcisi Blob'u yükleyip dosya referansına dönüştürür. Tek başlangıç karesi kullanılır.
- Kaynakta süre 0.3–8.5 saniye, boyutlar 256–1280 aralığında ve 32'ye bölünecek biçimde tanımlıdır. Uygulama kota tasarrufu için daha küçük doğrulanmış boyutlar kullanır: 9:16 = 288×512, 16:9 = 512×288, 1:1 = 512×512. Sunulan süreler bu desteklenen aralığın alt kümesidir.
- Tek geçiş / doku iyileştirme seçenekleri gerçek `improve_texture_flag` parametresini değiştirir. Yerel kamera kontrolü veya çoklu kimlik referansı sunulmaz.
- Canlı testte kimlik doğrulaması olmadan bir görsel yüklendi ve bir MP4 üretildi. Dosya HTTP 200 ile indirildi; 28.374 bayt, H.264, 288×512, 33 kare, 1.1 saniye. Bir saniyelik istek modelin kare sayısı yuvarlaması nedeniyle tam 1.000 saniye olmak zorunda değildir. Gerçek çıktı yalnızca çalışma alanındaki yok sayılan test kanıtında tutulur; üretilmiş MP4 Git'e dahil edilmez.

## Wan 2.2 14B Fast — ikinci ücretsiz seçenek

- Space: https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster
- Host: `https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space`
- Runtime: `RUNNING`, ZeroGPU; Gradio 6.1.0.
- Uç nokta: `/generate_video`.
- Parametreler: `input_image`, `prompt`, `steps`, `negative_prompt`, `duration_seconds`, `guidance_scale`, `guidance_scale_2`, `seed`, `randomize_seed`.
- Uygulama dört adım ve 1–5 saniye sunar. Model görüntü oranını kaynak görselden belirler ve gerekirse kırpar. Sunucunun sunmadığı bağımsız oran, kalite veya sahne referansı ayarı gösterilmez.
- Önceki REST denemesinde bir MP4 URL'si döndü; sonraki denemeler işçi `404: Not Found` olayları verdi. Bu nedenle LTX varsayılan seçildi. Wan'ın bu sürümdeki resmi JS istemcisi adaptörü şemaya göre bağlanmıştır; aynı düzeyde gerçek MP4 indirme doğrulaması yapılmış sayılmaz.

## Asenkron sağlayıcı sözleşmesi

`lib/personal/provider.mjs` şu işlemleri sağlar:

- `getCapabilities()` — katalogdaki gerçek ayarlar.
- `submitGeneration()` — resmi `@gradio/client` ile bağlantı, güncel şema kontrolü ve asenkron gönderim.
- `getGenerationStatus()` — Gradio olaylarından kuyruk, gerçek sıra/progress bilgisi, hata ve tamamlanma akışı.
- `getGenerationResult()` — tamamlanmış dosya URL'si ve seed.
- `cancel()` — istemci iptal isteği. Sağlayıcının GPU işini kesin olarak durduracağı iddia edilmez.

İşler ve dosyalar IndexedDB'ye kaydedilir. Sunucuda süreç belleğine bağlı bir iş haritası yoktur. Hosting fonksiyonu çıkarım boyunca açık tutulmaz. Uygulama gezintisinde izleme sürer; tarayıcı kapanırsa yeniden yüklemede devam eden iş kesildi olarak işaretlenir. Kalıcı bulut iş kuyruğu, otomatik yeniden bağlanma ve otomatik batch yoktur. İşler tek tek kullanıcı tarafından başlatılır.

## Ücretsiz erişim ve kullanıcı atfı

[Hugging Face Space API belgeleri](https://huggingface.co/docs/hub/spaces-api-endpoints), Gradio Space'lerinin dış uygulamalardan resmi istemciyle kullanılmasını tarif eder. [ZeroGPU belgeleri](https://huggingface.co/docs/hub/spaces-zerogpu), ücretsiz erişimin kota ve kuyruklara tabi olduğunu açıklar. Dokümantasyonda anonim kullanım için ortak ve daha sıkı bir havuz; oturum açılmış hesaplar için hesap bazlı kota belirtilir. Bu sınırlar ve Space'ler zamanla değişebilir.

Bu sürüm token almaz, token iletmez, başka kullanıcıyı taklit etmez ve ZeroGPU başlıkları üretmez. Resmi istemci anonim erişimi kullanır. Hesap kotasına erişildiği iddia edilmez. Oturum gerektiren veya kota sınırına ulaşan Space için otomatik ücretli geçiş yoktur. Bazı ücretli HF hesapları kota sonrası ön ödemeli kredi kullanabildiğinden, token tabanlı gelecek entegrasyon ayrıca maliyet politikası gerektirir.

Space'in herkese açık API sunması sınırsız kullanım veya süreklilik garantisi değildir. Space/model lisansları ve Hugging Face kullanım koşulları geçerlidir. İlgili modelin lisansını ayrıca inceleyin; uygulama bunları değiştirmez veya ek hak vermez.

## Şeffaf alternatif

Resmi Space'i ayrı sekmede açın, üretimi orada yapın, indirilen MP4'ü uygulamaya aktarın. Bu iş `origin: imported` ve `İçe aktarıldı` olarak kaydedilir; bulut üretimi gibi gösterilmez. ElevenLabs sesi sahneye bağımsız dosya olarak eklenebilir; bu dudak senkronizasyonu veya ses/video birleştirme değildir.

## Tarayıcı entegrasyon testi sonucu

Gerçek tarayıcı testinde, bu bulut çalışma alanının HTTPS proxy CA sertifikası Chromium tarafından güvenilir bulunmadı. Salt-okunur ağ tanısında üç hedef de `net::ERR_CERT_AUTHORITY_INVALID` verdi: `huggingface.co/api/spaces/Lightricks/ltx-video-distilled`, Space `/config` ve `/gradio_api/info`. Bu yüzden bu ortamda gerçek tarayıcı → sağlayıcı → MP4 testi tamamlanamadı. TLS doğrulaması kapatılmadı; kota engeli veya üretim başarısı gibi farklı bir sonuç iddia edilmedi. Ortam CA'sını desteklenen tarayıcı güven deposuna eklemek ortam yönetiminin konusudur.

Buna karşılık aynı resmi istemcinin Node sürümü ortamın sağlanan CA güvenini kullanarak gerçek LTX üretimini ve MP4 indirmesini tamamladı. Bu, sağlayıcı/adaptör için gerçek bir testtir; otomatik tarayıcı uçtan uca başarısı olarak raporlanmaz. Tarayıcıdaki diğer dört kullanıcı akışı testi, HTTPS dış sağlayıcı bağlantısı kullanmadan başarılıdır.
