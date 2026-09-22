# Yörünge Atölyesi

Tarayıcıda çalışan küçük bir yörünge simülasyonu. Turkuaz hız okunu sürükleyin, aracı fırlatın ve üç sahnede kütleçekiminin rotaya etkisini izleyin.

## Çalıştırma

Projede derleme adımı veya bağımlılık yoktur. ES modüllerinin yüklenmesi için dizinde bir HTTP sunucusu başlatın:

```sh
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. Fizik doğrulaması için `npm test` çalıştırın.

## Kontroller

- Sahne seçin, ok ucunu fareyle veya dokunarak sürükleyin ve **Aracı fırlat** düğmesine basın.
- Zaman kaydırıcısı simülasyon hızını 1–10× arasında değiştirir.
- Boşluk tuşu veya oynatma düğmesi simülasyonu duraklatır; `R` sahneyi sıfırlar.
- **Yörünge kur** sahnesinde aracı merkezden 0,98–1,34 AU aralığında iki simülasyon yılı tutun.

## Modelin sınırları

İki boyutlu Newton kütleçekimi, astronomik birim, güneş kütlesi ve yıl ölçekleriyle modellenir (`G = 4π²`). Hareket velocity Verlet yöntemiyle hesaplanır; araç kütlesiz bir test parçacığıdır. Çarpışma yarıçapları ile ekrandaki daire boyutları farklıdır. Görsel tahmin yolu bir süre sonrasını simüle eder ve ekran dışında kırpılır. Bu bir öğrenme ve keşif aracı; gerçek uzay uçuşu planlaması için değildir.

Tüm görseller Canvas/CSS ile çizilir. Yazı tipleri internet olmadığında sistem yazı tiplerine döner.
