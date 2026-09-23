# Trial — etkileşimli deneyler

Bu repo, birbirinden bağımsız kısa tarayıcı deneylerini barındırır. Ana sayfa `index.html` deneyleri listeler.

**Tarayıcıdan aç:** [Deneyler koleksiyonu](https://trial-deneyler.akcanburak202.chatgpt.site) · [Yaşayan Minyatür](https://trial-deneyler.akcanburak202.chatgpt.site/yasayan-minyatur/) · [Yörünge Atölyesi](https://trial-deneyler.akcanburak202.chatgpt.site/yorunge-atolyesi/) · [Element Atölyesi](https://trial-deneyler.akcanburak202.chatgpt.site/element-atolyesi/) · [Kayıp Rasathane](https://trial-deneyler.akcanburak202.chatgpt.site/kayip-rasathane/) · [EŞİK](https://trial-deneyler.akcanburak202.chatgpt.site/esik/) · [Yaban Vadi](https://trial-deneyler.akcanburak202.chatgpt.site/voxel-vadi/). Bağlantılar site sahibi ChatGPT hesabına açıktır.

| Deney | Kaynak | Açıklama |
| --- | --- | --- |
| EŞİK — Suyun Hafızası | [`esik/`](./esik/) | Zaman merceği, kalıcı su hazneleri ve üç bağlantılı bulmacayla vadiyi uyandıran 3D keşif oyunu. |
| Yaşayan Minyatür | [`yasayan-minyatur/`](./yasayan-minyatur/) | Saat, hava ve etkileşimlerle değişen resimli köy. |
| Yörünge Atölyesi | [`yorunge-atolyesi/`](./yorunge-atolyesi/) | İki boyutlu kütleçekimi ve yörünge simülasyonu. |
| Element Atölyesi | [`element-atolyesi/`](./element-atolyesi/) | Kum, su, ateş, odun ve taşla oynanan dokunmatik parçacık simülasyonu. |
| Kayıp Rasathane | [`kayip-rasathane/`](./kayip-rasathane/) | Defter ipuçlarını üç kadrana uygulayarak çözülen kısa keşif oyunu. |
| Yaban Vadi | [`voxel-vadi/`](./voxel-vadi/) | Bağımsız WebGL 2 ile çizilen etkileşimli üç boyutlu voxel manzara. |

Yerelde açmak için repo kökünde `python3 -m http.server 8000` çalıştırıp `http://localhost:8000` adresini ziyaret edin. Alt klasörler kendi HTML, CSS ve JavaScript dosyalarını içerir. Yörünge fiziği testleri için `cd yorunge-atolyesi && npm test` çalıştırın.

Minyatürdeki yer hayalidir; özgün resim `yasayan-minyatur/assets/village.webp` içindedir. Animasyonlar Canvas ile, sayfa düzeni CSS ile hazırlanır. İnternet bağlantısı olmadan resim ve hareketler çalışır; uzaktan yüklenen yazı tipleri varsa sistem yazı tiplerine geri dönülür.

Element Atölyesi fiziği için `node --test element-atolyesi/physics.test.js` çalıştırılabilir. Rasathane görseli özgündür; `kayip-rasathane/assets/observatory.webp` içinde yer alır. Her iki deneyim de dokunmatik ekranda çalışır ve harici servis gerektirmez.

Yaban Vadi için kurulum gerekmez: `voxel-vadi/` altındaki HTML, CSS ve JavaScript dosyaları tarayıcıda çalışır. Android tarayıcısında sürükleyerek dön, iki parmakla yakınlaş; alttaki kontrollerle ışık ve yağmuru değiştir. Manzara sahnesi çevrimdışı çalışır, tarayıcının WebGL 2 desteği gerekir. Arazi matematiği testleri için `cd voxel-vadi && npm test` çalıştırılabilir. Koleksiyon kartındaki çizim yalnızca kapak görselidir; üç boyutlu sahne ayrı ve anlık çizilir.

EŞİK için ayrıntılar ve doğrulama sınırları [`esik/README.md`](./esik/README.md) içinde. Testler: `node --test esik/simulation.test.js esik/scene.test.js`.
