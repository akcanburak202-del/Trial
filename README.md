# Trial — etkileşimli deneyler

Bu repo, birbirinden bağımsız kısa tarayıcı deneylerini barındırır. Ana sayfa `index.html` deneyleri listeler.

**Tarayıcıdan aç:** [Deneyler koleksiyonu](https://trial-deneyler.akcanburak202.chatgpt.site) · [Yaşayan Minyatür](https://trial-deneyler.akcanburak202.chatgpt.site/yasayan-minyatur/) · [Yörünge Atölyesi](https://trial-deneyler.akcanburak202.chatgpt.site/yorunge-atolyesi/) · [Element Atölyesi](https://trial-deneyler.akcanburak202.chatgpt.site/element-atolyesi/) · [Kayıp Rasathane](https://trial-deneyler.akcanburak202.chatgpt.site/kayip-rasathane/). Bağlantılar site sahibi ChatGPT hesabına açıktır.

| Deney | Kaynak | Açıklama |
| --- | --- | --- |
| Yaşayan Minyatür | [`yasayan-minyatur/`](./yasayan-minyatur/) | Saat, hava ve etkileşimlerle değişen resimli köy. |
| Yörünge Atölyesi | [`yorunge-atolyesi/`](./yorunge-atolyesi/) | İki boyutlu kütleçekimi ve yörünge simülasyonu. |
| Element Atölyesi | [`element-atolyesi/`](./element-atolyesi/) | Kum, su, ateş, odun ve taşla oynanan dokunmatik parçacık simülasyonu. |
| Kayıp Rasathane | [`kayip-rasathane/`](./kayip-rasathane/) | Defter ipuçlarını üç kadrana uygulayarak çözülen kısa keşif oyunu. |

Yerelde açmak için repo kökünde `python3 -m http.server 8000` çalıştırıp `http://localhost:8000` adresini ziyaret edin. Alt klasörler kendi HTML, CSS ve JavaScript dosyalarını içerir. Yörünge fiziği testleri için `cd yorunge-atolyesi && npm test` çalıştırın.

Minyatürdeki yer hayalidir; özgün resim `yasayan-minyatur/assets/village.webp` içindedir. Animasyonlar Canvas ile, sayfa düzeni CSS ile hazırlanır. İnternet bağlantısı olmadan resim ve hareketler çalışır; uzaktan yüklenen yazı tipleri varsa sistem yazı tiplerine geri dönülür.

Element Atölyesi fiziği için `node --test element-atolyesi/physics.test.js` çalıştırılabilir. Rasathane görseli özgündür; `kayip-rasathane/assets/observatory.webp` içinde yer alır. Her iki deneyim de dokunmatik ekranda çalışır ve harici servis gerektirmez.
