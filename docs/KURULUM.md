# Kişisel Bulut AI Video Stüdyosu — kurulum ve dağıtım

Bu sürüm mevcut Next.js uygulamasını korur ve `/personal` altında Türkçe kişisel stüdyo ekler. GPU, Python sunucusu, veritabanı veya zorunlu ücretli API hesabı gerekmez. Video çıkarımı Hugging Face bulutunda yapılır; uygulamayı bilgisayarınızda açmanız yerel GPU çıkarımı başlatmaz.

## Kurulum

Node.js 24 kullanın. Depo kökünde:

```sh
git submodule update --init --recursive
npm ci --ignore-scripts
npm run build:packages
cp .env.example .env.local
```

`--ignore-scripts`, web kullanımı için gerekmeyen Electron indirmesini atlar. Dört çalışma alanının derlenmesi gereklidir. Alt modül kaynaklarını veya sabitlenmiş sürümlerini değiştirmeyin.

`.env.local` içinde:

- `STUDIO_PASSWORD`: en az 12 karakterli, uzun ve rastgele bir parola.
- `STUDIO_SESSION_SECRET`: en az 32 karakterli rastgele bir oturum sırrı. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` ile üretilebilir.
- `ENABLE_PAID_APIS=false`: bu değeri koruyun. Kişisel stüdyo ücretli sağlayıcı çağırmaz. `true` yalnızca önceki arayüzün MuAPI proxy yollarını açar ve ücretli kullanıma izin verir; bu işlemi otomatik olarak yapmayız.

Değerleri `NEXT_PUBLIC_*` değişkenlerine koymayın. `.env.local` Git tarafından yok sayılır. Gerçek sırları commit etmeyin.

```sh
npm run dev
# http://localhost:3000/personal

# Üretim kontrolü:
npm run build
npm start
```

Üretim modunda her iki erişim değişkeni tanımlı değilse uygulama kapalı kalır; giriş sayfası yapılandırma gerektiğini bildirir. Geliştirme modunda değişkenler yoksa yerel geliştirmeye izin verilir. Parola ve sır tanımlanırsa geliştirmede de giriş gerekir. Oturum HttpOnly, SameSite=Strict ve üretimde Secure çereziyle 12 saat sürer. Oturum sırrını değiştirmek oturumları geçersiz kılar. Bu çözüm kişisel kullanım içindir; kurumsal kimlik, çok kullanıcı veya dağıtık giriş denemesi sınırlaması sağlamaz.

## Vercel Hobby için hazırlık

`vercel.json` şu adımları tanımlar:

1. `node scripts/prepare-web-workspaces.mjs && npm ci --ignore-scripts --include=dev`
2. `npm run build:packages && npm run build`

Fork'u Vercel'de Next.js projesi olarak içe aktarın. Kök dizini deponun kökü olarak bırakın ve Node.js 24 seçin. Production ve kullanacağınız Preview ortamlarına üç ortam değişkenini ekleyin. Alt modüller herkese açık depolardır; dağıtım günlüğünde tam olarak başlatıldıklarını doğrulayın. GitHub bağlantınızı veya faturalandırmanızı burada değiştirmedik; dağıtım yapılmadı.

Ücretsiz Hobby planının güncel koşullarını, kişisel kullanım sınırlarını ve kaynak kotalarını Vercel hesabınızda kontrol edin. Ücretli plana veya eklentiye geçmeyin. Uygulama Vercel GPU/FFmpeg işlemi, ücretli depolama veya veritabanı istemez.

**Uzun çıkarım için hosting fonksiyonu kullanılmaz.** Resmi Gradio JS istemcisi tarayıcıdan Space'e bağlanır, dosyayı doğrudan yükler ve asenkron kuyruğu izler. Next.js yalnızca arayüz ve kısa oturum işlemlerini sunar. Görseller Vercel fonksiyonunun istek gövdesinden geçmediği için platformun küçük yükleme sınırına takılmaz. Anahtar sunucudan tarayıcıya taşınmaz; bu sürüm anonim ücretsiz erişim kullanır.

Hugging Face CORS, kurumsal ağ, kota veya oturum gereksinimi doğrudan bağlantıyı engellerse resmi Space'i açın ve MP4'ü **manuel içe aktarın**. Uygulama bunu otomatik üretim olarak göstermez. Giriş sayfasının çalıştığını ve oturumsuz `/personal` erişiminin engellendiğini dağıtım sonrası kontrol edin.

## Günlük kullanım

1. **Karakter Stüdyo:** ad, ana görsel, ek referanslar, görünüm, kişilik, stil ve açıklama şablonları ekleyin.
2. **Sahne Stüdyo:** karakter, mekân, aksiyon, kamera açıklaması, diyalog ve isteğe bağlı MP3/WAV/M4A kaydedin.
3. **AI Video Stüdyo:** LTX veya Wan seçin, tek başlangıç karesini ve hareket açıklamasını hazırlayın. Yalnızca desteklenen ayarlar gösterilir. Sahne görseli kullanmak karakter görselinin yerine geçer; iki görsel birleştirilmez.
4. Kamera şablonları açıklama metnidir. Kamera hareketi veya kusursuz karakter tutarlılığı garantisi yoktur.
5. Gönderim onayını verip üretimi başlatın. Bir seferde bir iş izlenir. Başka kişisel stüdyo bölümüne geçebilirsiniz; sekmeyi kapatmayın.
6. Hazır videoda **MP4 indir ve sakla** düğmesi dosyayı indirir ve bu tarayıcıda kalıcı bir kopya saklar.
7. **Üretim Geçmişi:** bulut üretimi ve manuel MP4 ayrımı, durum, sahne bağlantısı ve yeniden indirme.
8. **Sahne Stüdyo:** JSON manifesti dışa aktarın. Görsel/ses/video dosyaları JSON içine gömülmez; bunları ayrıca yedekleyin.

## Saklama, gizlilik ve maliyet

- IndexedDB, görselleri, sesleri ve videoları bu tarayıcı profilinde tutar. Tercihler de tarayıcıda saklanır. Cihazlar arası senkronizasyon yoktur.
- Görsel sınırı 10 MB, ses 30 MB, MP4 100 MB'dır. Dosya türü, boyutu ve temel dosya imzası kontrol edilir. Büyük dosyalar tarayıcı belleği/depolamasını etkiler.
- Tarayıcı verilerini silmek kayıtları silebilir. Ayarlar bölümünden kalıcı depolama isteyebilirsiniz; izin garanti değildir. Silinen karakter/sahne/geçmiş kayıtlarının kullanılmayan dosyaları tam arşiv temizlenene kadar depolamada kalabilir.
- Uzak sonuç adresleri geçicidir. İndirilmeyen sonuçlar kaybolabilir. Sayfayı yenilemek devam eden işi `Bağlantı kesildi` olarak işaretler; otomatik yeniden üretim yapılmaz. Önce resmi Space'i kontrol edin.
- Durdurma veya zaman aşımı uzak GPU işinin iptalini garanti etmez. Varsayılan izleme süresi 10 dakikadır. Kota hatasında otomatik yeniden deneme veya ücretli modele geçiş yoktur.
- Anonim ZeroGPU erişimi ortak havuz ve daha sıkı sınırlara tabidir; kendi hesabınıza ait kota varmış gibi gösterilmez. Token veya kullanıcı kimliği taklidi yapılmaz. Kendi ücretsiz hesabınızla resmi sayfayı kullanmak ayrı bir manuel işlemdir.
- Kamuya açık bir Space'e üretim için görsel ve açıklama gönderilir. Sağlayıcının kullanım koşullarını inceleyin. Parolalı uygulama, sağlayıcı altyapısını özel veya kalıcı depolama yapmaz.
- Drive, Make.com, ElevenLabs API, ses/video birleştirme ve dudak senkronizasyonu etkin değildir. Sahne ses dosyaları ayrı referans olarak saklanır. JSON manifesti, ileride kurulabilecek otomasyona veri sınırı sağlar.

## Testler

```sh
npm run test:personal
npm run lint:personal
npm run build:packages
npm run build
npx playwright install chromium
npm run test:browser
```

Tarayıcı testleri geçici bir parola ve oturum sırrıyla üretim sunucusunu açar. Gerçek API anahtarı kullanmaz. Karakter/sahne/ses saklama, MP4 içe aktarma, indirme, manifest, mobil gezinme, giriş koruması, ücretli API engeli ve yeniden yüklemede iş durumunu test eder. İçe aktarma testinin videosu test sırasında FFmpeg ile sentetik olarak oluşturulur ve yalnızca yok sayılan `work/browser-fixtures/` altında tutulur. Gerçek üretilmiş MP4 veya özel medya Git'e eklenmez. FFmpeg yalnızca bu test için gerekir; uygulamanın dağıtımında gerekmez.

Gerçek GPU testi isteğe bağlıdır ve ücretsiz kotayı tüketir:

```sh
STUDIO_LIVE_TEST=1 npm run test:browser -- --grep 'optional real browser'
```

Kota veya ağ nedeniyle bu testin başarısız olması yerel/mocked test başarısı olarak raporlanmaz. Proje JavaScript'tir; ayrı bir TypeScript kontrolü yapılandırılmamıştır. `lint:personal` yeni/değişen kişisel stüdyo kapsamını denetler; eski bileşenleri topluca yeniden düzenlemez.

## Korunan önceki işlevler

Mevcut `/studio` ve `packages/studio` bileşenleri, model kataloğu, agent/workflow alt modülleri ve Electron kaynakları korunur. Kişisel akışın varsayılan adresi `/personal` olur. Eski `/studio/cloud-video` adresi `/personal/video`'ya yönlenir. Önceki uzun bekleyen sunucu API denemesi kaldırılmıştır; yeni akış tarayıcıdan doğrudan Gradio kullanır.

## Bu çalışma alanındaki doğrulama notu

Yerel arayüz testleri geçti. Gerçek LTX adaptör testi bir MP4 üretip indirdi. Ancak çalışma alanındaki Chromium, HTTPS proxy CA'sını tanımadığı için gerçek tarayıcıdan HF erişimi `ERR_CERT_AUTHORITY_INVALID` ile engellendi. Uygulama bu durumu kullanılabilirlik hatası olarak gösterdi; güvenlik kontrolü kapatılmadı. Normal dağıtımda kullanıcı tarayıcısı doğrudan Hugging Face sertifikasını doğrular. Kurumsal/proxy ağında çalışıyorsanız kurumun desteklenen sertifika güven kurulumunu kullanın.

Mevcut masaüstü testlerinin 50'sinden 49'u geçti; `tests/wan2gpLocal.test.js:77` içindeki `killTree` alt süreç temizleme testi bu ortamda tek başına da başarısız oldu. İlgili Electron kaynakları ve test dosyası değiştirilmedi. Bu test GPU çalıştırmaz; sahte Python işçisi kullanır. Kişisel stüdyo için 13 odaklı test ve lint kontrolü geçti. Ayrı TypeScript yapılandırması bulunmuyor.

İlk üretim dağıtımı için kesin ayarlar, GitHub dalı, özel erişim denetimi ve zorunlu canlı smoke testi: `docs/VERCEL-YAYIN.md`. Yerel testler üretim başarısı değildir.
