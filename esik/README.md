# EŞİK — Suyun Hafızası

Trial için bağımsız, Türkçe, üç boyutlu bir keşif ve bulmaca deneyimi. WebGL 2 üzerinde gerçek zamanlı çizilir. Three.js 0.180.0 ve geometrileri birleştirme yardımcısı yerel olarak `vendor/` klasöründedir; MIT lisansı aynı klasördedir. Arka uç, hesap, API anahtarı ve çalışma sırasında yapay zekâ servisi gerekmez.

## Oynanış

1. Kemer alanında **Geçmişi arala** ve **Kaynak kapağı**nı aç. Mercek eksik kemeri geri getirir; su sarnıcı doldurur. Sarnıç %70'e ulaşınca çark bahçe kapısını açar.
2. Bahçedeki kapağı Sol / Sağ / İkisi konumuna getir. İki havuz en az %64 dolmalıdır. Sarnıç boşalırsa kemere dönerek tekrar doldur. Merceği kapatmak ya da başka bir alana taşımak birikmiş suyu silmez.
3. Bahçenin geçmişindeki üç motifi keşfet. Çalgıya geç, geçmişi aralayarak kırık boruları tamamla, basınç oluşmasını bekle ve üç halkayı motiflere göre ayarla. Vadiyi uyandır.

Başlangıç, ipuçları, ses açma/kapama, yerel kayıt, kalite ayarı, hareketi azaltma, yeniden başlatma ve finalden sonra serbest keşif dahildir. Kapılar açıldıktan sonra yeniden kilitlenmez; bulmaca çıkmaza girmez. Arka planda kalan sekmede simülasyon durur.

## Kontroller

- Boş alanda sürükle: kamerayı döndür.
- Tekerlek veya iki parmak: yakınlaş / uzaklaş.
- Açık merceğin merkezini sürükle: zaman alanını taşı.
- Alttaki alan düğmeleri: kemer, bahçe ve çalgıya yaklaş.
- Klavye: oklar, +/−, Boşluk, 1/2/3. Etkin bir form kontrolünde klavye kısa yolları uygulanmaz.
- Ses kullanıcı dokunuşuyla açılır; Web Audio ile rüzgâr, akış sesi ve özgün nota dizileri oluşturulur.

## Çalıştırma

Repo kökünde `python3 -m http.server 8000`, ardından `/esik/`. Oyun dosyaları doğrudan statik olarak sunulabilir; uygulama derlemesi gerekmez. İsteğe bağlı Google Fonts erişilemezse sistem yazı tipleri kullanılır.

Testler: `node --test esik/simulation.test.js esik/scene.test.js`.

## Yapı

- `simulation.js`: sınırlandırılmış hazneler, su dağıtımı, kalıcı kapı durumu ve çalgı koşulları.
- `world.js`: sahne geometrisi, dünya koordinatında zaman merceği, su çizimleri, animasyon ve kamera.
- `app.js`: dokunma, fare, klavye, sahne kontrolleri, ilerleme, kayıt ve final.
- `audio.js`: kullanıcı etkileşimiyle başlatılan ses ortamı.

`createWorld` için isteğe bağlı renderer enjeksiyonu yalnız sahne oluşturma testlerinde kullanılır; normal uygulama her zaman WebGLRenderer kullanır.

## Doğrulama ve sınırlar

- Altı otomatik kontrol geçti: akış için etkin/doğru yerleştirilmiş mercek gereksinimi, suyun korunması, kapının kalıcılığı, tam bulmaca rotası, hazne sınırları, kayıt geri yükleme ve sahnenin kurulup güncellenmesi.
- 25 özel/mercek shader programı, Three.js shader parçaları genişletilerek Mesa yazılım OpenGL derleyicisinde derlendi. Bu, gerçek Android WebGL sürücü testi yerine geçmez.
- Sahne geometrisi ayrıca yerel yazılım çizimiyle incelendi. `cover.webp` bu geometrinin kapak amaçlı çizimidir; tarayıcı ekran görüntüsü değildir.
- Test ortamındaki bulut tarayıcısı WebGL bağlamı oluşturamadığı için gerçek WebGL görüntüsü, fiziksel Android dokunma davranışı ve cihaz FPS değeri doğrulanamadı. Tarayıcıda arayüz akışı ayrıca çizim katmanı çıkarılmış geçici bir test düzeneğiyle kontrol edildi; bu düzenek dağıtıma dahil değildir.
- Kalite ayarı piksel oranını sınırlar; hafif kipte gölgeler kapanır. “Otomatik” dar ekranlarda hafif kipi seçer. Tek bir WebGL tuvali ve yerel içerik kullanılır.
