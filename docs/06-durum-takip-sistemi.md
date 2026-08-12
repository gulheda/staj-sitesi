# 6. Başvuru Durum Takip Sistemi

## 6.1 Tasarım kuralı

Durumlar sistemin iç dilinde değil, **öğrencinin dilinde** gösterilir. Her
durumun ekranda üç parçası vardır:

1. **Durum cümlesi** — tek cümle, ne olduğunu söyler.
2. **Açıklama** — öğrenciden işlem beklenip beklenmediğini ve beklenmiyorsa
   ne olacağını söyler.
3. **CTA** — yalnızca öğrencinin yapacağı bir iş varsa görünür.

Bir öğrencinin hocaya "başvurum ne durumda?" diye sorması, bu sistemin
başarısızlık sayacıdır; hedef sıfırdır.

## 6.2 Durum makinesi

```
Taslak ─► Gönderildi ─► Komisyon incelemesinde ─┬─► Onaylandı ─► SGK/Fakülte
   ▲                                            │                 işlemleri
   │                                            ├─► Eksik belge / │
   │                                            │   Düzeltme      ▼
   └────── (öğrenci düzeltir, yeniden) ◄────────┘   bekleniyor   Staja hazır
                                                                     │
        Staj reddedildi ◄── (ret) ──┐                                ▼
                                    │                          Staj devam ediyor
   Staj kabul edildi ◄─┬─ Defter değerlendirmede ◄─ Defter teslimi   │
                       │            ▲                bekleniyor ◄────┘
   Düzeltme istendi ───┘            │                    │
   (defter için)  └── (yeniden yükleme) ─────────────────┘
```

## 6.3 Durumlar ve öğrenciye görünen metinler

| İç durum | Durum cümlesi | Açıklama | CTA |
|---|---|---|---|
| Taslak | "Başvurun henüz gönderilmedi." | "Kaldığın yerden devam edebilirsin (Adım 4/7)." | "Devam et" |
| Gönderildi | "Başvurunu aldık." | "Komisyon en kısa sürede inceleyecek. Şu anda senden bir işlem beklenmiyor." | — |
| Komisyon incelemesinde | "Başvurun inceleniyor." | "Şu anda senden bir işlem beklenmiyor. Sonuçlanınca e-posta ile haber vereceğiz." | — |
| Eksik belge | "Başvurunda eksik bir belge var." | Komisyon açıklaması, ör. "Ücret katkısı belgesi (EK-3) yüklenmemiş." | "Belgeyi yükle" |
| Düzeltme bekleniyor | "Başvurunda düzeltmen gereken bir belge var." | Ör. "Kabul belgende işletme kaşesi görünmüyor. Belgeyi kaşelettikten sonra yeniden yükle." | "Belgeyi yeniden yükle" |
| Bölüm onayladı | "Başvurun onaylandı ✓" | "Staj başlangıcına X gün kaldı. Şimdi yapman gereken: …" | Sıradaki işlem |
| Fakülte/SGK bekleniyor | "Sigorta işlemlerin yapılıyor." | "Bu işlemi üniversite yürütüyor; senden işlem beklenmiyor. Staj başlangıcından 3 gün önce e-Devlet'ten kontrol etmeni isteyeceğiz." | — |
| Staja hazır | "Her şey hazır — stajın X gün sonra başlıyor." | "Başlamadan önce SGK girişini kontrol etmeyi unutma." | "Nasıl kontrol edeceğimi göster" |
| Staj devam ediyor | "Stajın devam ediyor — 7. gün / 20 gün." | "Her staj günü için defter sayfanı doldurmayı ve imzalatmayı unutma." | "Defter sayfasını indir" |
| Defter teslimi bekleniyor | "Stajını tamamladın." | "Şimdi staj defterini yükleyip sicil fişini elden teslim etmelisin. Son tarih: 15 Ekim." | "Teslim adımlarına başla" |
| Defter değerlendirmede | "Defterin değerlendiriliyor." | "Şu anda senden bir işlem beklenmiyor." | — |
| Düzeltme istendi (defter) | "Defterinde düzeltmen gereken bir bölüm var." | Komisyon açıklaması + kalan süre. | "Defteri yeniden yükle" |
| Staj kabul edildi | "Tebrikler — stajın kabul edildi 🎉" | "Staj sürecin tamamlandı. Yapman gereken başka bir işlem yok." | — |
| Staj reddedildi | "Stajın kabul edilmedi." | Gerekçe + "Ne yapabileceğini öğrenmek için bölümle iletişime geç: …" | "Gerekçeyi gör" |

## 6.4 Bildirim kuralları

- **Her durum değişikliği** sistem içi bildirim üretir; öğrenci tercih
  ettiyse aynı içerik e-posta ile de gider (tek bir açık/kapalı anahtar,
  varsayılan: açık).
- Bildirim metni, ekrandaki durum cümlesiyle **aynıdır** — iki farklı dil
  kullanılmaz.
- İşlem gerektiren durumlarda bildirimde CTA bağlantısı vardır ve tıklanınca
  doğrudan ilgili ekrana (ör. yeniden yükleme alanına) açılır.
- Tarih bazlı hatırlatmalar: SGK kontrolü (staj başlangıcından 3 gün önce),
  defter teslimi (son tarihten 7 ve 3 gün önce), başvuru dönemi kapanışı.

## 6.5 Süreç göstergesiyle ilişkisi

Ana ekrandaki 12 aşamalı süreç göstergesi bu durum makinesinin
sadeleştirilmiş görüntüsüdür: tamamlanan aşamalar **yeşil ✓**, aktif aşama
**sarı ●**, gelecek aşamalar **gri ○**. Düzeltme/eksik belge durumlarında
ilgili aşama sarı kalır ve yanında "işlem gerekli" rozeti görünür — kırmızı
"hata" rengi kullanılmaz; öğrenciye sorun değil, yapılacak iş gösterilir.
