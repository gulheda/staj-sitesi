# 4. Ekranlar: Amaç, Ana CTA, Olası Hatalar ve Önleyici UX Çözümleri

Bu doküman sistemin her ekranı için dört şeyi tanımlar: **amaç**, **ana CTA**,
**kullanıcının bu ekranda yapabileceği hatalar** ve **bu hataları oluşmadan
engelleyen UX çözümleri**.

Genel kural: Bir ekranda hata mesajı göstermek zorunda kaldıysak önce şunu
sorarız: *"Sistem kullanıcının bu hatayı yapmasına nasıl izin verdi?"*

---

## E1 — Giriş ekranı

**Amaç:** Öğrencinin hiçbir bilgi ezberlemeden sisteme girmesi.
**Ana CTA:** "Giriş yap"

| Olası hata | Önleyici UX çözümü |
|---|---|
| Öğrenci hangi bilgiyle gireceğini bilmiyor | Alan etiketleri açık yazılır: "Öğrenci numaran" / "Şifren". İlk girişte: "İlk kez mi giriyorsun? Öğrenci numaran ve TC kimlik numaranla başla." |
| Öğrenci no'yu yanlış formatta yazma | Alan yalnızca rakam kabul eder; beklenen hane sayısı ipucu olarak gösterilir |
| Şifreyi unutma | "Şifreni mi unuttun?" bağlantısı görünür yerde; sıfırlama kurumsal e-posta ile tek adımda |
| İlk giriş ile normal girişi karıştırma | Sistem öğrenci numarasından ilk giriş olup olmadığını kendisi anlar ve doğru akışı açar; öğrenciye "ilk giriş / normal giriş" seçimi sorulmaz |

## E2 — Başlangıç ekranı (yalnızca ilk girişte)

**Amaç:** Öğrencinin mevcut durumunu tespit edip doğru akışa yerleştirmek.
**Ana CTA:** "Devam et" (durum seçildikten sonra aktifleşir)

| Olası hata | Önleyici UX çözümü |
|---|---|
| Yanlış durum seçme | Seçenekler günlük dille, birbirini dışlayacak netlikte yazılır. Yanlış seçilse bile sonraki ekran durumu doğrular ("Henüz başvuru yapmamış görünüyorsun") ve geri dönüş tek tıktır |
| Kararsız kalma | Yalnızca 4 seçenek vardır; "Bilmiyorum" durumu için ekranın altında "Emin değilsen: daha önce bu sistemden veya Google Forms'tan başvuru yapmadıysan ilk seçeneği işaretle" ipucu bulunur |

## E3 — "Stajım" ana ekranı

**Amaç:** Üç soruya tek bakışta cevap: Neredeyim? / Ne yapmalıyım? / Sonra ne olacak?
**Ana CTA:** Duruma göre değişen **tek** işlem butonu (ör. "Belgeyi yükle",
"Nasıl kontrol edeceğimi göster"). Öğrencinin işi yoksa CTA da yoktur.

| Olası hata | Önleyici UX çözümü |
|---|---|
| Ne yapacağını bulamama | Ekranda aynı anda tek işlem kartı vardır; rekabet eden buton yoktur |
| Süreci yanlış sırayla yapmaya çalışma | Gelecek aşamalar kilitlidir; üzerine gelince "Bu aşamaya geldiğinde sistem seni yönlendirecek" açıklaması çıkar |
| Beklerken tekrar tekrar işlem arama | "Şu anda senden bir işlem beklenmiyor" durumu açıkça yazılır + "Değişiklik olduğunda e-posta ile haber vereceğiz" güvencesi verilir |
| Tarih kaçırma | Yaklaşan tarihler ana ekranda; son 3 gün kala sistem içi bildirim + e-posta |

## E4 — Staj yeri rehberi (staj yeri olmayan öğrenci)

**Amaç:** Doğru işyeri seçimini sağlamak; uygunsuz işyeri başvurusunu baştan engellemek.
**Ana CTA:** "Kurum buldum, devam et"

| Olası hata | Önleyici UX çözümü |
|---|---|
| Sorumlu mühendisi olmayan işyeri seçme | Şart, form doldurulurken değil kurum **aranırken** anlatılır: "Staj yapacağın kurumda bilgisayar/yazılım mühendisi veya ilgili alandan sorumlu bir mühendis çalışmalı." + "Kuruma sorabileceğin soru" hazır metni |
| Kurum bulmadan formu doldurmaya çalışma | Başvuru formu bu aşamada hiç görünmez |
| "Kurum buldum" dedikten sonra vazgeçme | Sihirbazın kurum adımından geriye dönüş serbesttir; hiçbir veri kaybolmaz |

## E5 — Kabul belgesi ekranı (başvuru öncesi)

**Amaç:** Doğru kabul formunun (yaz / dönem içi) indirilip doğru şekilde imzalatılması.
**Ana CTA:** "Belgeyi indir" → sonrasında "Belgeyi imzalattım, devam et"

| Olası hata | Önleyici UX çözümü |
|---|---|
| Yanlış formu indirme (yaz ↔ dönem içi) | Sistem staj türü cevabına göre **tek doğru formu** gösterir; öğrenci iki form arasından seçim yapmaz |
| Eksik imza/kaşe ile ilerleme | Belge kartında "Kim imzalayacak? Kaşe gerekiyor mu?" alanları + örnek doldurulmuş belge; yükleme ekranında da aynı uyarı tekrarlanır |
| Formu kime dolduracağını bilememe | "Nasıl doldurulur?" adım adım rehber: hangi alanı öğrenci, hangi alanı işletme doldurur — renkli işaretli örnek üzerinde gösterilir |

## E6 — Başvuru sihirbazı (7 adım — ayrıntı docs/05)

**Amaç:** Başvurunun eksiksiz ve doğru tamamlanması.
**Ana CTA:** Ara adımlarda daima "Devam et", son adımda "Başvuruyu gönder".

| Olası hata | Önleyici UX çözümü |
|---|---|
| Formu yarıda bırakıp verilerin kaybolması | Her adım otomatik kaydedilir; girişte "Kaldığın yerden devam et (Adım 4/7)" kartı |
| İş günü hesabını yanlış yapma | Öğrenci hesap yapmaz; sistem hafta sonu + resmî tatilleri düşerek iş gününü hesaplar, yetersizse doğru bitiş tarihini önerir |
| Pazartesi başlamayan / tatile denk gelen başlangıç | Takvimde uygunsuz günler seçilemez veya seçilince anında açıklamalı uyarı + önerilen tarih |
| Sorumlu mühendis bilgisini bilememe | "Bilmiyorum" seçeneği vardır; sistem kuruma sorulacak hazır soruyu verir, form taslak olarak bekler |
| Yanlış dosya yükleme | Yükleme alanı belgeye özeldir; beklenen belge adı ve içeriği alanın üstünde yazar; tür/boyut anında denetlenir |
| Son adımda gönderme korkusu | Gönder öncesi özet ekranı + "Gönderdiğinde ne olacağı" açıklaması + gönderdikten sonra inceleme başlayana dek düzenleyebilme |

## E7 — Başvuru gönderildi (onay ekranı)

**Amaç:** "İşlem tamam, sıradaki ne?" belirsizliğini yok etmek.
**Ana CTA:** "Stajıma dön"

| Olası hata | Önleyici UX çözümü |
|---|---|
| "Gönderildi mi acaba?" şüphesi | Büyük ve net onay: "Başvurunu aldık." + başvuru özeti + e-posta teyidi |
| Bekleme sürecinde ne olacağını bilmeme | "Sonra ne olacak?" bloğu: komisyon inceleyecek → sonuç bildirilecek → şimdilik işlem beklenmiyor |

## E8 — Düzeltme ekranı (komisyon düzeltme istediğinde)

**Amaç:** Öğrencinin neyi, neden, nasıl düzelteceğini tek bakışta anlaması.
**Ana CTA:** "Belgeyi yeniden yükle" (veya düzeltilecek alana giden buton)

| Olası hata | Önleyici UX çözümü |
|---|---|
| Neyin yanlış olduğunu anlamama | Komisyon açıklaması şablonlardan geldiği için her zaman "ne + neden + nasıl" formatındadır: "Kabul belgende işletme kaşesi görünmüyor. Belgeyi işletmeye kaşelettikten sonra yeniden yükle." |
| Yanlış belgeyi yeniden yükleme | Yeniden yükleme alanı yalnızca düzeltme istenen belgeye açılır; diğer belgeler kilitli ve "✓ onaylandı" görünür |
| Düzelttikten sonra ne olacağını bilmeme | CTA altı: "Yeni belgen doğrudan komisyona iletilecek." |

## E9 — SGK kontrol rehberi

**Amaç:** Öğrencinin e-Devlet üzerinden SGK girişini kendi başına kontrol edebilmesi.
**Ana CTA:** "SGK girişimi gördüm ✓" / ikincil: "SGK girişimi göremiyorum"

| Olası hata | Önleyici UX çözümü |
|---|---|
| e-Devlet'te nereye bakacağını bilememe | Ekran görüntülü adım adım rehber (4734 sayılı sorgu ekranına kadar) |
| Kontrolü unutma | Staj başlangıcından 3 gün önce bildirim + e-posta |
| Giriş görünmüyorsa panik | "Göremiyorum" butonu durumu komisyona iletir; öğrenciye "Bölüme bildirdik, seninle iletişime geçilecek. Staja başlamadan bekle." denir — öğrenci ne yapacağını yine bilir |

## E10 — OBS kayıt rehberi

**Amaç:** Staj dersinin OBS'de seçilmesinin atlanmaması.
**Ana CTA:** "OBS kaydımı yaptım ✓"

| Olası hata | Önleyici UX çözümü |
|---|---|
| OBS adımından haberdar olmama | Adım, süreç göstergesinde ayrı bir aşamadır; sırası gelince ana karta düşer |
| Yanlış dersi seçme | Rehberde dersin tam kodu/adı + OBS ekran görüntüsü |

## E11 — Staj dönemi ekranı

**Amaç:** Staj sürerken defter ve vlog hazırlığının güncel tutulması.
**Ana CTA:** "Günlük defter sayfasını indir"

| Olası hata | Önleyici UX çözümü |
|---|---|
| Defteri son güne bırakma | "X. gün / 20 gün" sayacı + "defteri her gün doldur" hatırlatması + haftalık bildirim |
| Vlog'u unutma / yanlış hazırlama | Vlog rehberi bu aşamada görünür; teslim kontrol listesinde de tekrar sorulur |
| İmzaları biriktirip unutma | Rehber metni: "Sayfaları hafta sonunu beklemeden imzalat" |

## E12 — Defter teslim ekranı (kontrol listeli)

**Amaç:** Defterin eksiksiz teslim edilmesi; geri gönderme oranının düşmesi.
**Ana CTA:** "Defteri yükle" (kontrol listesi tamamlanmadan pasiftir)

| Olası hata | Önleyici UX çözümü |
|---|---|
| Eksik sayfa/imza/kaşe ile teslim | Yükleme **öncesi** zorunlu kontrol listesi: her gün için sayfa, imzalar, kaşeler, kapak, vlog bağlantısı + QR kod son sayfada, dosya okunabilirliği |
| Yanlış format/boyut | Kabul edilen format (PDF) ve boyut sınırı alanın üstünde yazar; uygun olmayan dosya seçilirse anında açıklamalı geri bildirim: "Yüklediğin dosya okunamıyor. Belgeyi tarayıp tekrar yüklemeyi dene." |
| Sicil fişini de yüklemeye çalışma | Ekranda ayrı ve net kutu: "Sicil fişi çevrimiçi yüklenmez — kapalı ve kaşeli zarfla bölüm sekreterliğine elden teslim edilir." |
| Teslimi son güne bırakma | Son tarih ekranda + son 3 gün bildirim/e-posta |

## E13 — Sonuç ekranı (değerlendirme sonrası)

**Amaç:** Sonucun ve (gerekirse) sonraki adımın net bildirilmesi.
**Ana CTA:** Kabul: yok (süreç bitti). Düzeltme: "Defteri yeniden yükle".

| Olası hata | Önleyici UX çözümü |
|---|---|
| Düzeltme istenince ne yapacağını bilememe | Komisyon açıklaması + tek CTA + teslim için kalan süre |
| Kabul sonrası "başka bir şey var mı?" şüphesi | "Staj sürecin tamamlandı. Yapman gereken başka bir işlem yok." açıkça yazılır |

## E14 — Yardım ekranları (ayrıntı docs/07)

**Amaç:** Sorunun hocaya gitmeden sistem içinde cevaplanması.
**Ana CTA:** SSS'de: arama alanı. Soru sor ekranında: "Soruyu gönder"
(benzer sorular gösterildikten sonra aktifleşir).

| Olası hata | Önleyici UX çözümü |
|---|---|
| Cevabı var olan soruyu tekrar sorma | Soru yazılırken benzer soru/cevaplar canlı gösterilir: "Buna benzer cevaplar bulduk" |
| Yanlış kategoriye bakma | Doğal dil arama + "Takıldın mı?" bağlantısının öğrenciyi bulunduğu aşamanın SSS'sine götürmesi |
| Sorusunun cevabını kaçırma | "Sorularım" listesinde cevap durumu; cevap gelince bildirim + e-posta |

## Kesişen (tüm ekranlar için geçerli) kurallar

1. **Buton dili tutarlıdır:** ara adımlarda "Devam et", son adımda işlemin
   adıyla biten fiil ("Başvuruyu gönder", "Defteri yükle"). "Kaydet",
   "İşlem yap", "Onayla", "İleri" gibi eş anlamlı ifadeler karışık kullanılmaz.
2. **Geri dönüş her zaman güvenlidir** ve bunun güvenli olduğu söylenir.
3. **Hata mesajı formatı sabittir:** ne yanlış + neden + nasıl düzeltilir
   (+ mümkünse tek tıklık düzeltme butonu).
4. **Boş CTA yoktur:** öğrencinin yapacağı iş yoksa buton da yoktur; "işlem
   beklenmiyor" hâli açıkça yazılır.
5. **Jargon ilk geçtiği yerde çevrilir:** günlük dil büyük, resmî ad küçük.
