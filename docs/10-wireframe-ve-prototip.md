# 10. Wireframe Yapısı ve Tıklanabilir Prototip

## 10.1 Prototip hakkında

`prototype/index.html`, kurulum gerektirmeyen, tarayıcıda açılan
**tıklanabilir düşük detaylı (low-fidelity) prototiptir.**

Bilinçli olarak süssüzdür: gri kutular, tek yazı tipi, renk yalnızca durum
anlamı taşıdığı yerde (yeşil ✓ / sarı ● / gri ○). Amaç UI değil, **akışın ve
metinlerin** test edilmesidir — kullanılabilirlik testinde katılımcının
"güzel/çirkin" yorumuna değil "buldum/bulamadım" davranışına odaklanılır.

### Kullanım

1. `prototype/index.html` dosyasını tarayıcıda açın.
2. Normal akış: giriş → ilk durum sorusu → yönlendirme.
3. Sağ üstteki **"Senaryo"** menüsü, öğrenciyi sürecin herhangi bir anına
   ışınlar (inceleme bekleyen, düzeltme istenen, stajı süren, teslim
   aşamasındaki öğrenci…). Kullanılabilirlik testindeki G1–G8 görevlerinin
   tamamı bu senaryolarla koşulabilir.

## 10.2 Ana ekran wireframe'i

```
┌──────────────────────────────────────────────────────────┐
│ BAÜN Staj Portalı        Stajım · Belgelerim · Yardım ·  │
│                          Staj rehberi          [Deniz ▾] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Başvurun onaylandı ✓                                    │
│  Staj başlangıcına 8 gün kaldı.                          │
│                                                          │
│  ✓──✓──✓──✓──✓──●──○──○──○──○──○──○                      │
│  yer  belge başv. inc. onay SGK OBS staj defter teslim   │
│                                        değerl. bitti     │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │ ŞİMDİ YAPMAN GEREKEN                           │      │
│  │ Staj başlangıcından 3 gün önce e-Devlet'ten    │      │
│  │ SGK girişini kontrol et.                       │      │
│  │                                                │      │
│  │ [ Nasıl kontrol edeceğimi göster ]             │      │
│  │ Kontrolü yapınca sıradaki adımın OBS kaydı.    │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  YAKLAŞAN TARİHLER                                       │
│  • 3 Tem — SGK kontrolü için son gün                     │
│  • 6 Tem — Staj başlangıcı                               │
│                                                          │
│  Takıldın mı? → bu aşamayla ilgili sık sorulan sorular   │
└──────────────────────────────────────────────────────────┘
```

## 10.3 Sihirbaz adımı wireframe'i (akıllı tarih örneği)

```
┌──────────────────────────────────────────────────────────┐
│  Staj Başvurusu                        Adım 5/7          │
│  ●──●──●──●──●──○──○                                     │
│  Bilgiler Tür Kurum Mühendis TARİHLER Belgeler Kontrol   │
├──────────────────────────────────────────────────────────┤
│  Staj tarihlerini seç                                    │
│  İş günü hesabını biz yaparız; sen sadece tarihleri seç. │
│                                                          │
│  Başlangıç: [ 6 Temmuz 2026  ▾]  Bitiş: [31 Temmuz ▾]    │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │ ⚠ Bu tarihler toplam 19 iş günü oluşturuyor.   │      │
│  │   Stajın en az 20 iş günü olmalı.              │      │
│  │   Önerilen bitiş tarihi: 3 Ağustos 2026        │      │
│  │   [ Önerilen tarihi kullan ]                   │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  [← Geri]                              [ Devam et ]      │
└──────────────────────────────────────────────────────────┘
```

## 10.4 Prototipte bulunan ekranlar

| Ekran | Prototipte gösterdiği UX kararı |
|---|---|
| Giriş | Açık alan etiketleri, ilk giriş yönlendirmesi |
| İlk durum sorusu | 4 seçenekli başlangıç, dashboard yerine tek soru |
| Stajım (9 farklı durumda) | Durum cümlesi + süreç göstergesi + tek işlem kartı |
| Staj yeri rehberi | Başvurunun kilitli olduğu "önce kurum bul" hâli |
| Kabul belgesi ekranı | Doğru formun otomatik seçimi, belge kartı |
| Başvuru sihirbazı 7 adım | İlerleme, otomatik kayıt, "Bilmiyorum", akıllı tarih, özet+gönder |
| Düzeltme ekranı | Ne+neden+nasıl formatlı komisyon açıklaması |
| SGK rehberi | Adım adım dış sistem yönlendirmesi |
| Defter teslimi | Zorunlu kontrol listesi + sicil fişi "elden" kutusu |
| Belgelerim | Aşamaya göre gruplama + 8 alanlı belge kartı |
| Yardım (3 seviye) | Kategoriler, doğal dil arama, benzer soru önerisi |
| Sonuç ekranları | Kabul 🎉 / düzeltme istendi |

## 10.5 Wireframe'den UI'a geçiş notları

UI tasarımı (renk, tipografi, marka) kullanılabilirlik testleri geçildikten
sonra bu wireframe'lerin **üzerine** giydirilir; yerleşim ve metinler test
edilmiş hâliyle korunur. UI aşamasında değişmesi yasak olanlar: durum
cümlesinin en üstte oluşu, tek işlem kartı ilkesi, buton adları, hata mesajı
formatı, kontrol listesi zorunluluğu.
