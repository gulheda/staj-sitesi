# 2. Kullanıcı Yolculukları

## 2.1 Persona'lar

Tasarım kararları üç persona üzerinden test edilir. Sistem **her zaman
Persona 1'e göre** tasarlanır; o rahat kullanabiliyorsa diğerleri zaten
kullanabilir.

### Persona 1 — "İlk kez staj yapan Deniz" (ana persona)

- 3. sınıf, staj yönetmeliğini hiç okumadı, EK-1'in ne olduğunu bilmiyor.
- Kafasındaki tek soru: **"Ne yapmam gerekiyor?"**
- Uzun metin okumaz; okusa da bürokratik dili anlamaz.
- Yanlış bir şey yapmaktan ve stajının yanmasından korkuyor.
- Bir şeyi bulamazsa hocaya mesaj atar (tasarımın engellemesi gereken davranış).

### Persona 2 — "Süreci yarıda olan Mert"

- Başvurusunu geçen hafta gönderdi; onaylanıp onaylanmadığını bilmiyor.
- Belgesinde eksik varsa bundan haberi yok.
- Tek ihtiyacı: girdiğinde **durumunu ve varsa üzerine düşen işi** görmek.

### Persona 3 — "Stajı biten Zeynep"

- Stajını tamamladı; defteri nasıl hazırlayıp nereye teslim edeceğini,
  sicil fişinin ne olduğunu bilmiyor.
- Teslim tarihini kaçırmaktan korkuyor.

### Komisyon persona'sı — "Hüseyin Hoca"

- Günde onlarca başvuru ve belge inceliyor; aynı soruların tekrar tekrar
  gelmesinden yorulmuş durumda.
- Tek ihtiyacı: bekleyen işleri öncelik sırasıyla görmek, tek tıkla
  onaylamak / düzeltme istemek ve düzeltme isterken **öğrencinin anlayacağı**
  açıklamayı kolayca yazabilmek.

## 2.2 Ana kullanıcı yolculuğu (uçtan uca)

Sürecin tamamı 12 aşamadır. Öğrenci bu haritanın tamamını hiçbir zaman tek
seferde görmez; her an yalnızca **bulunduğu aşama + sıradaki tek işlem**
gösterilir.

| # | Aşama | Öğrencinin gördüğü sıradaki işlem | Sistemin yaptığı |
|---|---|---|---|
| 1 | Staj yeri bulma | "Staj yapacağın kurumu bul" | İşyeri şartlarını ve sorumlu mühendis koşulunu anlatır |
| 2 | Belgeleri hazırlama | "Kabul belgesini işletmeye imzalat" | Doğru formu (yaz/dönem içi) otomatik seçer, örnek gösterir |
| 3 | Ön başvuru | "Başvuru formunu doldur" | 7 adımlı sihirbaz, otomatik kayıt, akıllı doğrulama |
| 4 | Komisyon değerlendirmesi | "Senden işlem beklenmiyor" | Durumu gösterir, değişince bildirir |
| 5 | Onay | "Başvurun onaylandı" | Sonraki aşamayı otomatik açar |
| 6 | SGK kontrolü | "e-Devlet'ten SGK girişini kontrol et" | Adım adım nasıl yapılacağını gösterir, tarihi hatırlatır |
| 7 | OBS kaydı | "OBS'de staj dersini seç" | Ekran görüntülü rehber |
| 8 | Staj dönemi | "Her gün defter sayfanı doldur" | Defter şablonu + vlog rehberi + kalan gün sayacı |
| 9 | Defter hazırlama | "Defterini kontrol listesiyle tamamla" | Teslim öncesi kontrol listesi |
| 10 | Teslim | "Defteri PDF yükle + sicil fişini elden teslim et" | Yükleme + elden teslim adımını ayrı ayrı takip eder |
| 11 | Değerlendirme | "Senden işlem beklenmiyor" | Sonucu bildirir |
| 12 | Tamamlandı | "Stajın kabul edildi 🎉" | Süreci arşivler |

## 2.3 İlk giriş deneyimi (bütün akışların başlangıcı)

İlk girişte dashboard **gösterilmez**. Tek soruluk bir başlangıç ekranı gelir:

> **Staj sürecine başlayalım.**
> Şu anda hangi durumdasın?
>
> - ○ İlk kez staj başvurusu yapacağım
> - ○ Daha önce başvuru yaptım
> - ○ Stajım başladı
> - ○ Stajımı tamamladım

Seçime göre sistem öğrenciyi doğru akışa yerleştirir. Bu soru yalnızca ilk
girişte sorulur; sonraki girişlerde sistem durumu zaten bildiği için doğrudan
"Stajım" ekranı açılır.

## 2.4 Akış A — İlk kez staj yapacak öğrenci

```
Giriş → "İlk kez başvuracağım"
  │
  ▼
"Staj yerin hazır mı?"
  │
  ├─ HAYIR ──► "Önce staj yapacağın bir kurum bulmalısın."
  │            • İşyeri hangi şartları taşımalı? (bilgisayar/yazılım müh.
  │              veya ilgili alanda sorumlu mühendis çalıştırmalı)
  │            • Kurum bulunca ne yapacağı: "Kurumu bulunca buraya dön,
  │              kabul belgesini birlikte hazırlayacağız."
  │            • CTA: "Kurum buldum, devam et" (her girişte aynı yerden sorar)
  │            ⚠ Bu aşamada başvuru formu görünmez bile.
  │
  └─ EVET ──► Staj türü sorusu: "Stajını ne zaman yapacaksın?"
              ○ Yaz tatilinde   ○ Dönem içinde
              (Cevaba göre sistem EK-1'in doğru sürümünü otomatik seçer;
               öğrenci hangi formun hangisi olduğunu hiç düşünmez.)
                │
                ▼
              "İşletmeye imzalatman gereken kabul belgesi" ekranı
              • Belgeyi indir  • Nasıl doldurulur?  • Örnek doldurulmuş belge
              • "Belgeyi imzalattım" → başvuru sihirbazı açılır
                │
                ▼
              7 adımlı başvuru sihirbazı (docs/05)
                │
                ▼
              "Başvurun gönderildi" onay ekranı
              • "Sonra ne olacak?": komisyon inceleyecek, sonuç bildirilecek,
                şu anda senden işlem beklenmiyor.
```

**Bu akışın kritik UX kararı:** Öğrenci staj yeri bulmadan form dolduramaz.
Böylece "kurum bilgisi boş/yanlış başvuru" hatası oluşmadan engellenir.

## 2.5 Akış B — Başvurusu devam eden öğrenci

Girişte doğrudan "Stajım" ekranı açılır; ekranın tamamı başvurunun durumuna
göre şekillenir (durum listesi ve metinleri: docs/06).

```
Giriş → Stajım
  │
  ├─ "Başvurun inceleniyor."
  │   Alt metin: "Şu anda senden bir işlem beklenmiyor.
  │              Sonuçlandığında sana e-posta ile haber vereceğiz."
  │   (CTA yok — öğrencinin yapacağı iş yokken buton da yoktur.)
  │
  ├─ "Başvurunda düzeltmen gereken bir belge var."
  │   Komisyonun açıklaması aynen gösterilir:
  │   "Yüklediğin kabul belgesinde işletme kaşesi görünmüyor."
  │   CTA: "Belgeyi yeniden yükle"
  │   Sonrası: "Yeni belgen doğrudan komisyona iletilecek."
  │
  └─ "Başvurun onaylandı ✓"
      "Staj başlangıcına 8 gün kaldı."
      "Şimdi yapman gereken: staj başlangıcından 3 gün önce e-Devlet'ten
       SGK girişini kontrol etmek."
      CTA: "Nasıl kontrol edeceğimi göster"
      Ardından: OBS kaydı adımı.
```

**Bu akışın kritik UX kararı:** "Başvurum ne durumda?" sorusunun cevabı her
girişte ekranın en üst cümlesidir. Öğrencinin hocaya mesaj atma sebebi ortadan
kalkar.

## 2.6 Akış C — Stajı başlayan öğrenci

Staj başlangıç tarihi geldiğinde "Stajım" ekranı **otomatik** değişir:

```
"Stajın devam ediyor — 7. gün / 20 gün"
  │
  ├─ "Staj süresince yapman gerekenler" (bağlamsal, kısa):
  │   • Her staj günü için defter sayfası doldur → "Defter sayfasını indir"
  │   • Sayfaları işyeri sorumlusuna imzalat
  │   • Vlog çekimlerini unutma → "Vlog rehberini aç"
  │
  ├─ Yaklaşan tarih: "Defter teslimi için son tarih: 15 Ekim"
  │
  └─ Sık ihtiyaç duyulan belgeler bu aşamada öne çıkar:
      defter kapağı, günlük sayfa şablonu, vlog rehberi
```

**Kritik UX kararı:** Defter, staj bittiğinde değil staj **sürerken**
gündeme getirilir; "defteri en son gün topluca yazma" hatası azaltılır.

## 2.7 Akış D — Stajı tamamlayan öğrenci

Staj bitiş tarihi geçtiğinde ekran yine otomatik değişir:

```
"Stajını tamamladın. Şimdi staj belgelerini teslim etmelisin."
  │
  ▼
Teslim, iki ayrı ve açık adımdır:
  1) "Staj defterini PDF olarak yükle"
     → Yüklemeden önce kontrol listesi (docs/05 §5.6):
       her gün için sayfa var mı, imzalar, kaşeler, kapak,
       vlog bağlantısı + QR kod son sayfada mı, dosya okunabilir mi…
     → Tüm maddeler işaretlenmeden "Defteri yükle" aktif olmaz.
  2) "Staj sicil fişini elden teslim et"
     → Sistem açıkça söyler:
       "Staj sicil fişi çevrimiçi YÜKLENMEZ. İşyerinin doldurduğu fişi
        kapalı ve kaşeli zarf içinde bölüm sekreterliğine elden teslim
        etmelisin."
     → Öğrenci "Zarfı teslim ettim" kutusunu işaretler; komisyon zarf
       ulaştığında sistemden doğrular.
  │
  ▼
"Belgelerini aldık. Komisyon değerlendirmesi bekleniyor."
  │
  ├─ "Stajın kabul edildi 🎉" → süreç tamamlandı ekranı
  ├─ "Defterinde düzeltme istendi" → komisyon açıklaması + yeniden yükleme
  └─ (Ret durumu) → gerekçe + itiraz/iletişim yolu
```

**Kritik UX kararı:** Sicil fişinin elden teslim edildiği gerçeği
saklanmaz; sistem bunu **kendi içinde bir adım olarak** gösterir ve takip
eder. Öğrenci "fişi de mi yükleyecektim?" karmaşası yaşamaz.

## 2.8 Yolculuklar arası ortak kurallar

- Öğrenci hangi akışta olursa olsun, giriş sonrası ilk ekran her zaman
  **"Stajım"** ekranıdır ve ilk cümle her zaman güncel durumdur.
- Her durum değişikliğinde sistem içi bildirim + (tercihe göre) e-posta
  gönderilir; öğrencinin "acaba değişti mi?" diye girip kontrol etmesi
  gerekmez.
- Süreç göstergesindeki geçmiş aşamalara tıklanabilir (bilgi amaçlı),
  gelecek aşamalar kilitli görünür ama üzerine gelindiğinde "Bu aşamaya
  geldiğinde sistem seni yönlendirecek" açıklaması çıkar.
