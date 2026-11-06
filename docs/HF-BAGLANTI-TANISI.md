# HF oturumu, anonim API ve güvenli çalışma yolu

## Gözlenen kanıt ve sınırı

Kullanıcı LTX Video Distilled'ın resmi sayfasında kendi HF hesabıyla gerçek video ürettiğini bildirdi. Bu oturum ve hesabın kotası, Vercel üzerinde çalışan ayrı bir sitenin anonim istemcisine aktarılmaz.

Bu incelemede kimliksiz resmi Gradio JS istemcisi `/image_to_video` kuyruğuna ulaştı: `pending`, `process_starts`, ardından `error`. Uzak hata tam olarak şuydu:

> You have exceeded your ZeroGPU quota (120s requested vs. -60s left). Try again in 0:00:00. Authenticate with a Hugging Face token for more quota

Bu testteki kesin engel **anonim ZeroGPU kota yetersizliğidir**. Hata metnindeki sıfır bekleme süresini güvenilir bir yeniden deneme zamanı saymıyoruz; otomatik tekrar veya alternatif kimlikle kota aşma yapılmaz. Anonim dış API çağrıları evrensel olarak yasak değildir: bu çağrı kuyruk işleyicisine kadar ulaşmıştır. Kullanıcının tarayıcı/IP'sinin aynı kota durumunda olduğu buradan çıkarılamaz.

Üretim `/personal` adresi anonim isteği `/login`'e yönlendirdi; parola atlatılmadı, kullanıcının tarayıcı oturumu veya kişisel kayıtları okunmadı. Canlı CSP `connect-src` içinde `https://huggingface.co`, `https://*.hf.space` ve `https://*.huggingface.co` izinleri var. Üretim origin'i `Origin` başlığıyla yapılan probes:

| Kaynak | Sonuç |
| --- | --- |
| HF `/api/spaces/Lightricks/ltx-video-distilled/host` | 200; allow-origin üretim origin'ini içeriyor |
| LTX `/config` | 200; aynı CORS izni |
| LTX `/gradio_api/info` | 200; aynı CORS izni ve doğrulanan parametre adları |
| LTX `/gradio_api/queue/join` OPTIONS | 200; aynı CORS izni ve POST izni |
| LTX `/gradio_api/queue/data` GET (iş oluşturmayan tanı oturumu) | 200; `text/event-stream` ve aynı CORS izni |

Bunlar tarayıcıya ait tam Network kaydı değildir; **genel bir CSP/CORS yasağına dair kanıt bulunmadığı** anlamına gelir. Kullanıcının gördüğü eski “Space, kuyruğu veya ağ bağlantısı…” mesajı bağlantı yükleme, fetch, kuyruk ve worker hatalarını birleştiriyordu. Aynı eski mesajdan kullanıcının kesin hata nedeni çıkarılamaz. Kullanıcının hatasının kota mı, tarayıcı ağı mı, eklenti/CORS/TLS mi olduğunu iddia etmek için yeni tanı kodu veya gizli verilerden arındırılmış Network kaydı gerekir.

İzole Firefox ile ayrı TLS doğrulamalı tarayıcı probu bu çalışma alanında profil başlatma hatasıyla çalıştırılamadı. Önceki Chromium testinin proxy CA hatası da kullanıcının üretim tarayıcısına mal edilmez. TLS kontrolü kapatılmadı.

## Uygulanan güvenli çözüm

- Varsayılan yol: **HF hesabımla resmi Space · manuel MP4 aktarımı**. Açıklama kopyalanabilir; başlangıç görseli resmi sayfaya kullanıcı tarafından yüklenir. Üretilen MP4, uygulamaya manuel aktarılır ve mevcut sahne/geçmiş/indirme akışında saklanır. Otomatik üretim gibi etiketlenmez.
- Anonim API korunur, ancak ayrı ve açık bir seçimdir. Resmi sayfada oturum açmak bunu kimlikli hale getirmez. Manuel modda form gönderimi yanlışlıkla anonim iş başlatamaz.
- Hatalarda yalnızca güvenli tanı kodu, aşama, sağlayıcı ve anonim erişim bilgisi saklanır. Ham sağlayıcı mesajları prompt/gizli bilgi içerebileceği için kayda alınmaz veya kullanıcıya kopyalanmaz.
- `QUOTA_EXHAUSTED`, `RATE_LIMITED`, `AUTH_REQUIRED`, `CSP_BLOCKED`, `NETWORK_OR_CORS`, `SCHEMA_CHANGED`, `WORKER_UNAVAILABLE`, `EVENT_STREAM_FAILED`, `TIMEOUT` ayrılır. JavaScript fetch hatası tek başına CORS ile TLS'yi ayıramaz; tanı böyle bir ayrım uydurmaz.
- SDK bağlantı hataları da kuyruk hataları gibi aşamalarıyla yakalanır. Gerçek Gradio hata olayları genel “Space kullanılamıyor” mesajına dönüştürülmez. Dinlenen CSP olayları işlem bitince/iptal edilince kaldırılır.

## Token'ı gizleyerek kimlikli API mümkün mü?

Resmi Gradio istemcisi bir **sunucu** üzerinde HF token ile çalışabilir; token tarayıcıya gönderilmek zorunda değildir. Ancak bu sürüme gelişigüzel `HF_TOKEN` eklemek güvenli ve sıfır maliyetli bir çözüm sayılmaz:

1. Token sunucu ortamında, yalnızca sabit izinli Space'e gönderilmeli; URL, hata, response veya JS paketine girmemelidir.
2. Hesap kotası resmi yöntemle uygulanmalıdır. Ücretli HF hesapları günlük kota sonrası ön ödemeli kredi tüketebilir. Sağlayıcıda doğrulanmış harcama engeli olmadan sıfır ücret garantisi verilemez.
3. Sunucuda kalıcı/asenkron iş yürütme ve güvenli sonuç aktarımı gerekir. Vercel fonksiyon belleğinde bir Gradio işi saklayıp sonraki istekte bulunacağını varsaymak hatalıdır; uzun SSE bağlantısını bir fonksiyonda tutmak da execution sınırlarını çözmez.
4. Kullanıcının token'ı veya kimlikli test yetkisi bu görevde mevcut değildi. Bu nedenle kimlikli uçtan uca başarı iddia edilmedi, test edilmemiş token proxy'si veya maliyet riski etkinleştirilmedi.

HF çerezlerini `credentials: include` ile göndermeye çalışmak, resmi HF sayfasının ZeroGPU kullanıcı atfının eşdeğeri değildir. SDK'nın resmi HF iframe handshake'i yalnızca uygun HF origin/parent bağlamında çalışır. Başlık, kimlik veya oturum taklidi yapılmaz.

## Diğer ücretsiz yollar

- Doğrulanmış kullanıcı yolu: resmi LTX sayfasında ücretsiz hesapla üretim ve açık manuel import. Hesabın kendi kota/koşulları geçerlidir.
- Mevcut Wan anonim adaptörü alternatif olarak korunur; kullanıcı isteği olmadan oraya otomatik geçilmez. Aynı ZeroGPU sınırlamalarından muaf sayılmaz.
- Kendi ZeroGPU Space'inizi açmak hesap uygunluğu ve GPU kotası gerektirir; otomatik donanım yükseltmesi veya çoğaltma yapılmaz.
- Ücretsiz CPU Space üzerinde bu video modellerinin pratik GPU çıkarımı sağlandığı iddia edilmez. Yeni, doğrulanmış sınırsız ücretsiz inference hizmeti bulunmuş gibi gösterilmez.

## İnceleme sonrası üretimde gereken doğrulama

PR birleştirilmedi ve deploy edilmedi. Yeni sürüm kullanıcı tarafından yayımlandıktan sonra anonim yolu **tek bir kez** deneyip tanı kodunu/aşamasını kaydedin. HF hesabıyla üretim için resmi bağlantıyı açın, gerçek MP4'ü içe aktarın, oynatın ve indirin. Bu iki testin sonuçlarını ayrı raporlayın; token, özel görsel, ham istek/yanıt, çerez veya MP4'ü GitHub'a koymayın.

Kaynaklar: [HF Space API ve hesap bazlı kota](https://huggingface.co/docs/hub/spaces-api-endpoints), [ZeroGPU kota ve kredi koşulları](https://huggingface.co/docs/hub/spaces-zerogpu). Ayrıca kurulu resmi `@gradio/client` içindeki `helpers/zerogpu.ts` ve `utils/submit.ts` incelendi.

Bu PR dalı için `vercel.json` içinde `git.deploymentEnabled["fix/hf-anonymous-diagnostics"]=false` ayarlanmıştır; bağlı Vercel Git entegrasyonunda otomatik preview tetiklenmesini önlemek içindir. Production/main için otomatik dağıtım ayarı değiştirilmez.
