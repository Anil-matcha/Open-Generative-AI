# İlk üretim dağıtımı — Vercel Hobby

Durum: dağıtıma hazırlık. **Bu belge bir dağıtımın başarılı olduğu anlamına gelmez.** Üretim URL'si, parola koruması ve gerçek MP4 testi ayrıca doğrulanmalıdır. Yeni ürün özelliği eklenmedi.

## Doğru depo ve proje kökü

Yalnızca `zeynptfn/personal-ai-video-studio` fork'unu kullanın. `Anil-matcha/Open-Generative-AI` upstream deposuna gönderim veya dağıtım yapmayın.

| Vercel alanı | Değer |
| --- | --- |
| Root Directory | Depo kökü: `.`; varsayılan kök seçili kalsın |
| Framework Preset | Next.js |
| Node.js Version | 24.x; kök `package.json` içindeki `engines.node` da bunu sabitler |
| Install Command | `node scripts/prepare-web-workspaces.mjs && npm ci --ignore-scripts --include=dev` |
| Build Command | `npm run build:packages && npm run build` |
| Output Directory | Next.js varsayılanı; override kapalı (`.next`) |
| Development Command | Varsayılan; üretim için özel komut gerekmez |

`/personal` bir URL rotasıdır; dağıtım dizini değildir. `app/personal` veya `packages/studio` da Root Directory seçilmemelidir. Kök `package.json`, Next.js yapılandırması, `app/`, Tailwind ve dört workspace bir arada derlenir.

Kurulum yardımcısı dört workspace manifestini kontrol eder. Eksik alt modül varsa Git checkout'unda `git submodule update --init --recursive` çalıştırır ve kayıtlı commit'leri kullanır. Vercel alt modülleri önceden hazırlamışsa yeniden indirmez. Eksik kaynak ve `.git` olmayan yüklemede açık hatayla durur. `--include=dev`, Babel ve Tailwind derleyicilerini getirir; `--ignore-scripts`, web için gerekmeyen Electron indirmesini önler. FFmpeg yalnızca sentetik test videosu oluşturmak için test ortamında kullanılır; üretim bağımlılığı değildir.

## Ortam değişkenleri — yalnızca adlar

Vercel projesinde **Settings → Environment Variables** bölümüne ekleyin. İlk import ekranında da deploy işleminden önce girilebilir. **Production** ve kullanacağınız **Preview** ortamlarına tanımlayın; tercihen farklı parola ve sır kullanın. Bir değişiklikten sonra yeni deployment/redeploy gerekir.

| Ad | Gereklilik ve kullanım |
| --- | --- |
| `STUDIO_PASSWORD` | Zorunlu; en az 12 karakterli, uzun ve rastgele bir giriş parolası. Sunucu tarafında kalır. |
| `STUDIO_SESSION_SECRET` | Zorunlu; en az 32 karakterli, rastgele HMAC oturum sırrı. Sunucu tarafında kalır. |
| `ENABLE_PAID_APIS` | Açıkça `false` olarak ayarlayın; eski MuAPI proxy yolları kapalı kalır. |

Gerçek değerleri GitHub dosyalarına, issue/PR açıklamasına, build komutuna, ekrana veya sohbet mesajına yazmayın. Vercel'de hassas değerler için sunulan gizleme/sensitive seçeneğini kullanın. `.env.example` boş alanlar içerir; gerçek `.env*` ve `.vercel/` commit edilmez. `NEXT_PUBLIC_*` adıyla parola, oturum sırrı veya API anahtarı tanımlamayın.

**Hugging Face:** bu ilk sürüm anonim, herkese açık ZeroGPU erişimi kullanır. HF kimlik doğrulaması etkin değildir ve istemciye token gönderilmez. `HF_TOKEN`, `HUGGINGFACEHUB_API_TOKEN` veya MuAPI/ElevenLabs anahtarı gerekli değildir; bunları eklemek bu sürümde oturum açmayı etkinleştirmez. İleride kimlik doğrulaması eklenirse token yalnızca sunucu ortamında kalmalıdır; bunun için yeni bir entegrasyon ve ücret/kota politikası gerekir. Bu dağıtım hazırlığında böyle bir özellik eklenmedi. HF oturum istediğinde resmi Space ve açıkça manuel MP4 içe aktarma yolu kullanılır.

## GitHub'dan Vercel'e adım adım

1. GitHub fork'unda `feat/personal-studio-production-ready` dalının gerçekten push edildiğini ve commit'in bulunduğunu doğrulayın. Yerel commit veya hazırlanmış PR metni GitHub'a gönderilmiş sayılmaz. GitHub erişimi düzelmeden Vercel'in yeni kodu alacağı varsayılmamalıdır.
2. İlk üretim için önerilen yol: fork'un **kendi** `main` dalına açılmış PR'ı inceleyip, siz uygun gördüğünüzde birleştirin. Bu işlem burada otomatik yapılmaz. `main` hâlâ eski kodu içeriyorsa ilk Deploy düğmesine basmayın; eski sürümde yeni parola koruması yoktur.
3. Vercel'e GitHub hesabınızla giriş yapın. Kişisel **Hobby** hesabınızı seçin. Pro denemesi, ücretli takım veya ücretli eklenti seçmeyin.
4. **Add New → Project → Import Git Repository** açın. Gerekirse GitHub bağlantısında yalnızca `zeynptfn/personal-ai-video-studio` deposuna erişim verin. Fork'u seçip **Import** ile ilerleyin.
5. Yukarıdaki tabloda yazan Root Directory, Next.js, Node 24.x, install ve build komutlarını kontrol edin. Depodaki `vercel.json` komutları sağlar. Output Directory override'ını açmayın. Statik export seçmeyin; oturum API'si ve middleware gereklidir.
6. İlk deploy'dan **önce** üç ortam değişkenini ekleyin. Ücretli API bayrağını `false` bırakın. Değerleri loglamayın.
7. Seçili kaynak commit'in incelenen uygulamayı içerdiğini kontrol edin; ardından **Deploy** başlatın. GitHub'a push veya Vercel Deploy, çalışan üretim kanıtı değildir.
8. Build loglarında dört workspace'in bulunduğunu ve paketlerin/Next.js'in derlendiğini doğrulayın. Hata olursa ücretli plana geçmeyin; önce alt modül, kök dizin, Node sürümü ve komutları kontrol edin.
9. **Settings → Environments → Production → Branch Tracking** içinde dağıtılmasını istediğiniz dalı doğrulayın. Önerilen `main` yolunda PR birleştirilmiş olmalıdır. `main`'i değiştirmeden feature dalını kullanacaksanız, bu alanı feature dalına ayarlayın; ardından **Deployments → Create Deployment** ile dalı veya kesin commit SHA'sını seçin. Preview dağıtımını Production başarı kanıtı olarak göstermeyin. Eski sürümü yanlışlıkla yayınlamayın.
10. Hazır durumdaki deployment'ın GitHub repo/dal/commit bilgisini kontrol edin. Ücretsiz `*.vercel.app` adresini kullanın; özel alan adı, veritabanı, depolama, cron veya GPU eklentisi gerekmez.
11. Aşağıdaki üretim smoke testini uygulayın. URL ve sonuçlar doğrulanmadan dağıtım tamamlandı demeyin.

Hobby, kişisel/ticari olmayan kullanım ve kaynak kotalarıyla sınırlıdır. Vercel commit yazarı/hesap bağlantısı için onay isterse GitHub/Vercel hesap eşleştirmesini düzeltin veya kendi hesabınızla PR'ı inceleyip birleştirin; bu engel için Pro satın almayın. Otomatik yenileme veya ücretli kapasite eklemeyin.

## Özel erişim denetimi

- Üretimde eksik veya kısa parola/sır ile uygulama kapalı kalır. `/personal`, `/personal/video`, `/personal/characters`, `/personal/scenes`, `/personal/history`, `/personal/settings` oturumsuz ziyaretçiyi `/login`'e yönlendirir.
- `/api/*` yolları oturumsuz istekleri 401 ile reddeder. Mevcut generation/upload/history/media ve agent/workflow proxy yolları da kapsam içindedir. Oturum açıldıktan sonra ücretli eski yollar `ENABLE_PAID_APIS=false` ile 403 kalır.
- `/api/personal/session` giriş/çıkış için bilerek erişilebilirdir. POST parolayı ve istek kaynağını kontrol eder; büyük giriş gövdesini reddeder. Oturum 12 saatlik imzalı HttpOnly, Secure, SameSite=Strict çerezi kullanır. Sunucu fonksiyonuna 10 saniyelik `maxDuration` sınırı kondu; GPU beklemez.
- Kişisel ücretsiz akışta uygulamaya ait sunucu generation/upload/history/download API'si **yoktur**: yükleme ve kuyruk doğrudan HF'ye, geçmiş IndexedDB'ye, indirme tarayıcıya gider. Bu nedenle olmayan bir özel dosya API'sinin korunduğu iddia edilmez.
- Stüdyo parolası, HF'nin dışarıdaki geçici dosya URL'sine veya aynı cihazın IndexedDB içeriğine erişim kontrolü eklemez. Güvenilir kişisel tarayıcı profili kullanın. Çıkış kayıtları silmez. Dosya/oturum bilgilerini URL, log veya PR'a eklemeyin.

## Vercel sınırları ve asenkron model

Güncel Fluid compute belgelerinde Hobby fonksiyonları için 300 saniye ve istek/yanıt gövdesi için 4.5 MB sınırları listelenir. **Uygulama çıkarımın bu sürede biteceğine dayanmaz.** Resmi Gradio istemcisi tarayıcıda yükleme/gönderim yapar ve uzak kuyruk olaylarını izler. Büyük görsel ve MP4 Vercel fonksiyonundan geçmez. IndexedDB, Vercel diskine veya süreç belleğine dayanmaz; sunucuda iş haritası yoktur.

Bu model yerel derleme sonucundan bağımsız olarak gerçek Vercel URL'sinde CSP, CORS, TLS, Secure çerez ve uzun kuyruk açısından doğrulanmalıdır. Sekme kapatılırsa izleme kesilir; otomatik yeniden gönderim veya kalıcı sunucu worker'ı yoktur. On dakikalık tarayıcı izleme sınırı Vercel fonksiyonunun çalışma süresi değildir. Kota, oturum, ağ veya CORS engelinde manuel alternatif gösterilir; başarı uydurulmaz.

## Üretim smoke testi — dağıtımdan sonra zorunlu

Sonuç formu: **henüz çalıştırılmadı**. Test URL'si, kaynak commit, model, istek zamanı, sonuç ve engel türünü değerleri gizleyerek kaydedin. Görsel/MP4 dosyasını veya parola/token'ı Git'e koymayın.

1. Gizli/temiz bir tarayıcı oturumunda gerçek HTTPS URL'sini açın. Yukarıdaki bütün `/personal` bölümleri giriş istemeli; `/api/v1/history`, `/api/v1/get_upload_url`, `/api/upload-binary`, `/api/v1/predictions/test/media` oturumsuz erişime izin vermemeli.
2. Yanlış parola erişim vermemeli. Doğru parolayla giriş yaptıktan sonra sayfa Türkçe açılmalı. Çerezin HttpOnly/Secure/SameSite=Strict olduğunu tarayıcıda kontrol edin; değerini kopyalamayın.
3. Varsayılan LTX ücretsiz motorunu seçin. Kamuya paylaşılmasında sorun olmayan bir test görselini başlangıç karesi olarak yükleyin. Bir saniye ve hızlı kaliteyle tek bir iş başlatın; aynı işi otomatik tekrar etmeyin.
4. Network panelinde yükleme, Gradio gönderimi ve kuyruk bağlantısının HTTPS HF alanlarına gittiğini; herhangi bir token'ın JS paketinde, tarayıcı depolamasında veya istekte bulunmadığını doğrulayın. Vercel fonksiyonunun GPU bitene kadar açık kalmadığını kontrol edin.
5. Gerçek tamamlanmayı bekleyin. Yalnızca MP4 import edilmesi veya mock testin geçmesi bu adımın yerine geçmez. Kimlik, kota, CORS veya TLS hatası varsa türünü yazın ve üretimi engellenmiş olarak raporlayın. TLS doğrulamasını kapatmayın.
6. Tamamlanan MP4'ü önizlemede **oynatın**; görüntünün gerçekten hareket ettiğini ve dosyanın çözülebildiğini kontrol edin. **MP4 indir ve sakla** ile indirin. Dosya sıfır bayt olmamalı; başka bir oynatıcıda açılmalı. İmkân varsa `ffprobe` ile codec, boyut ve süreyi doğrulayın.
7. Sayfayı yenileyin; geçmiş ve tarayıcıya saklanan video kalmalı. Bir sahneye bağlama ve tekrar indirmeyi deneyin. Manuel import ayrıca denenirse kaydı `İçe aktarıldı` olmalı.
8. Çıkış yapın ve korumalı sayfalara/API'lere erişimin yeniden kesildiğini doğrulayın. Başka bir tarayıcı profilinin yerel arşivi görmemesi beklenir.
9. Ücretsiz kota ve ücretli API bayrağını tekrar kontrol edin. Hiçbir MuAPI/ElevenLabs/ücretli inference çağrısı veya yükseltme yapılmamalı.

## Kaynaklar

- [Vercel proje kökü ve build ayarları](https://vercel.com/docs/builds/configure-a-build)
- [Vercel Git, production branch ve belirli commit'ten deployment](https://vercel.com/docs/git)
- [Node.js sürümleri](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Fonksiyon çalışma ve gövde sınırları](https://vercel.com/docs/functions/limitations)
- [Hobby koşulları](https://vercel.com/docs/plans/hobby)
- [HF Space API ve anonim/hesap kotası](https://huggingface.co/docs/hub/spaces-api-endpoints)

## Hazırlık doğrulamaları

Yerel production-mode testlerinde tüm altı `/personal` bölümü oturumsuz istekleri yönlendirdi. Mevcut generation/upload/history/media/agent/workflow API örneklerinde GET ve POST 401; girişten sonra kapalı ücretli proxy POST'ları 403 döndü. Çerez nitelikleri ve çıkıştan sonra yeniden engelleme test edildi. Ayrıca parola/sır hiç tanımlanmamış ayrı üretim sunucusunda giriş 503 ve özel API'ler 401 kaldı.

Temiz `npm ci --ignore-scripts --include=dev`, dört workspace build'i, Next.js üretim build'i, 13 sağlayıcı/erişim testi ve scoped lint geçti. Tarayıcı akışı için gerçek üretilmiş video commit edilmeden sentetik MP4 oluşturuldu; oynatıcı metadata/duration ve indirme doğrulandı. Gerçek dış GPU testi bu hazırlıkta tekrar çalıştırılmadı: önceki yerel Chromium denemesi proxy CA güveni nedeniyle engellenmişti. TLS doğrulaması değiştirilmedi. Bu sonuçlar Vercel üzerinde çalıştırılmış testler değildir.

Commit adayları dosya türü ve anahtar/token/özel anahtar/kimlik bilgili URL örüntüleri açısından tarandı. Gerçek credential veya yeni medya/binary bulunmadı. Yalnızca URL reddetme testindeki bilerek kullanılan sahte kimlik bilgili adres incelenip test verisi olarak sınıflandırıldı. `.env.example` gerçek sır içermez; client kaynakları sunucu sırlarını okumaz ve derlenmiş `.next/static` içinde sunucu parola/sır veya HF token ortam adları bulunmadı. Bu tarama mutlak bir güvenlik garantisi değildir; yayın öncesi GitHub diff'ini de inceleyin.

Mevcut upstream'den gelen örnek görseller/video ve sabit submodule commit'leri değiştirilmedi. Yeni özel görsel, gerçek MP4, screenshot, tarayıcı arşivi, test logu, `.env` veya Vercel bağlantı dosyası commit kapsamına alınmaz.
