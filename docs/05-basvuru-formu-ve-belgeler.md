# 5. Başvuru Formu ve Belge Yükleme Deneyimi

## 5.1 Formun genel yapısı

Mevcut Google Forms başvurusu, sistem içinde **7 adımlı bir sihirbaza**
dönüştürülür. Tek uzun sayfa yoktur; her ekranda tek temel görev vardır.

```
Adım 1/7  Bilgilerin           (öğrenci bilgileri — çoğu otomatik dolu)
Adım 2/7  Staj türün           (yaz / dönem içi)
Adım 3/7  Staj yapacağın kurum (kurum bilgileri)
Adım 4/7  Sorumlu mühendis     ("Bilmiyorum" seçenekli)
Adım 5/7  Staj tarihlerin      (akıllı takvim + gün/ücret bilgisi)
Adım 6/7  Belgelerin           (yalnızca gerekli belgeler)
Adım 7/7  Kontrol ve gönder    (özet + "Başvuruyu gönder")
```

Sabit davranışlar:

- Üstte her zaman ilerleme: **"Adım 3/7"** + adım adları.
- Ara adımların butonu **"Devam et"**, son adımınki **"Başvuruyu gönder"**.
- Her adım **otomatik kaydedilir** (taslak). Öğrenci çıkarsa, sonraki girişte
  "Stajım" ekranında "Başvuruna kaldığın yerden devam et (Adım 3/7)" kartı
  görünür.
- Geri dönüş serbesttir ve veri kaybettirmez.
- Her alanın yanında bağlamsal kısa açıklama vardır (docs/07 §7.1).

## 5.2 Adımların ayrıntısı

### Adım 1 — Bilgilerin

Öğrenci no, ad soyad, bölüm ve sınıf sistemde zaten vardır; **salt okunur**
gösterilir ("Bu bilgiler öğrenci kayıtlarından geldi"). Öğrenci yalnızca
telefon numarasını girer/doğrular. Kural: kullanıcıya sistemin zaten bildiği
hiçbir şey yazdırılmaz.

### Adım 2 — Staj türün

Tek soru: "Stajını ne zaman yapacaksın?" → ○ Yaz tatilinde ○ Dönem içinde.
Bu cevap, sonraki adımlarda **doğru kabul formunun** (yaz EK-1 / dönem içi
sürüm) otomatik seçilmesini ve dönem içi staja özel kuralların (çalışılacak
günler) devreye girmesini sağlar. Öğrenci form adı/kodu hiç görmez.

### Adım 3 — Staj yapacağın kurum

Kurum adı, adres, telefon, faaliyet alanı. Yanında bağlamsal açıklama:
"Kurumda bilgisayar, yazılım veya ilgili alandan sorumlu bir mühendis
çalışıyor olmalı. Emin değilsen bir sonraki adımda 'Bilmiyorum' diyebilirsin."

### Adım 4 — Sorumlu mühendis

Ad soyad, unvan, e-posta/telefon. Unvan alanında **"Bilmiyorum"** seçeneği
vardır. Seçilirse sistem yardım eder:

> "Sorun değil. Kuruma şu soruyu sorabilirsin:
> *'Staj süresince benden sorumlu olacak mühendisin adı ve unvanı nedir?'*
> Cevabı alınca buraya dönüp devam edebilirsin — başvurun taslak olarak
> saklanacak."

### Adım 5 — Staj tarihlerin (akıllı tarih seçimi)

Öğrenciden **hiçbir hesap yapması istenmez.** Takvimden başlangıç ve bitiş
seçer; sistem anında hesaplar ve konuşur:

- Hafta sonları ve resmî tatiller takvimde soluk gösterilir, başlangıç günü
  olarak seçilemez.
- Seçim sonrası özet kutusu: "Bu tarihler **22 iş günü** oluşturuyor ✓
  (hafta sonları ve 30 Ağustos tatili sayılmadı)."
- Yetersizse hata değil **çözüm** gösterilir:

  > "Bu tarihler toplam 19 iş günü oluşturuyor. Stajın en az 20 iş günü
  > olmalı.
  > **Önerilen bitiş tarihi: 31 Ağustos 2026**
  > [Önerilen tarihi kullan]"

- Dönem içi stajda ek soru: "Hangi günler çalışacaksın?" (ders programı
  çakışması uyarısıyla).
- Ücret bilgisi de bu adımdadır: "İşletme staj ücreti ödeyecek mi?"
  ○ Evet ○ Hayır ○ Bilmiyorum — "Evet" ise devlet katkısı belgeleri
  (EK-3 vb.) Adım 6'da otomatik listeye eklenir; "Bilmiyorum" ise
  kuruma sorulacak hazır soru verilir.

### Adım 6 — Belgelerin

Yalnızca **bu başvuru için gerçekten gereken** belgeler listelenir (staj
türü ve ücret cevabına göre liste otomatik daralır/genişler). Her belge için
yükleme deneyimi §5.4'teki gibidir.

### Adım 7 — Kontrol ve gönder

Bütün girilen bilgiler tek ekranda özetlenir; her bölümün yanında "Düzenle"
bağlantısı vardır (tıklayınca ilgili adıma döner, sonra özete geri gelir).
Gönder butonunun üstünde:

> "Başvuruyu gönderdiğinde bilgiler staj komisyonunun incelemesine
> aktarılacak. İnceleme başlamadan önce bazı bilgileri güncelleyebilirsin."

CTA: **"Başvuruyu gönder"**

## 5.3 Doğrulamanın zamanlaması

- Alan bazlı doğrulama **alandan çıkarken** yapılır (yazarken kırmızı
  yanıp sönen alan olmaz).
- Adım bazlı doğrulama "Devam et"e basınca yapılır; eksik alan varsa sayfa
  o alana kayar ve alanın altında ne gerektiği yazar.
- Bütünsel doğrulama (iş günü, tarih çakışması, eksik belge) Adım 7'den
  **önce** ilgili adımda yakalanır; öğrenci son adıma "gönderilemez" bir
  başvuruyla asla ulaşmaz.

## 5.4 Belge yükleme deneyimi

Yükleme alanı asla çıplak bir "Dosya seç" butonu değildir. Her yükleme
bloğunun sırası sabittir:

```
① NE YÜKLEYECEĞİN (başlık, günlük dille)
   "İşletmenin imzaladığı staj kabul belgesini yükle"
   Zorunlu Staj Kabul Formu — EK-1        ← resmî ad, küçük punto

② YÜKLEMEDEN ÖNCE KONTROL ET (1-2 madde)
   "Belgenin imzalı VE kaşeli olduğundan emin ol."
   [Örnek doldurulmuş belgeyi gör]

③ YÜKLEME ALANI
   Sürükle-bırak + "Dosya seç" · "PDF veya fotoğraf (JPG), en fazla 10 MB"

④ SONUÇ
   Başarılı: "✓ Belgeni aldık." + dosya adı + [Değiştir]
   Sorunlu:  ne + neden + nasıl formatında mesaj, ör.
   "Yüklediğin dosya okunamıyor. Belgeyi telefonunla dik açıdan, aydınlık
    bir yerde çekip tekrar yüklemeyi dene."
```

Sistem yükleme anında şunları otomatik denetler: dosya türü, boyut,
okunabilirlik (boş/bozuk dosya), beklenen sayfa sayısı ve zararlı içerik.
Denetlenemeyen şeyler (kaşenin varlığı gibi) için sorumluluk komisyondadır;
öğrenciye ②'deki ön kontrol maddeleriyle hatırlatılır.

## 5.5 Belge kartı standardı

"Belgelerim" bölümündeki her belge, sekiz sorusu da doldurulmuş bir kartla
sunulur. Örnek — kabul belgesi:

| Alan | İçerik |
|---|---|
| Bu belge nedir? | Staj yapacağın işletmenin seni stajyer olarak kabul ettiğini gösteren belge. |
| Neden gerekiyor? | Komisyon, staj yerinin uygunluğunu bu belgeyle değerlendirir; sigorta girişin bu belgeye göre yapılır. |
| Kim dolduracak? | Üst kısmı sen, işletme bilgileri kısmını staj yapacağın kurum. |
| Kim imzalayacak? | İşletme yetkilisi. |
| Kaşe gerekiyor mu? | Evet — işletme kaşesi zorunlu. |
| Ne zaman hazırlanmalı? | Başvurudan önce (başvuruda yükleyeceksin). |
| Nereye teslim edilecek? | Bu sisteme yüklenecek; elden teslim gerekmez. |
| Örnek | [Örnek doldurulmuş belgeyi gör] |

Aynı standart bütün belgelere uygulanır: staj yönergesi, staj el kitabı,
staj zorunluluk belgesi, yaz/dönem içi kabul formları, ücret katkısı
belgeleri (EK-3), defter kapağı, günlük defter sayfası, sicil fişi, vlog
rehberi.

## 5.6 Defter teslimi kontrol listesi

"Defteri yükle" butonu, aşağıdaki maddelerin tümü işaretlenmeden **pasif**
kalır (buton altında nedeni yazar: "Listeyi tamamlayınca yükleme açılır"):

- [ ] Her staj günü için ayrı sayfa hazırladım (20 gün = 20 sayfa)
- [ ] Bütün sayfaları işyeri sorumlusu imzaladı
- [ ] Gerekli kaşeler sayfalarda var
- [ ] Kapak sayfasını ekledim
- [ ] Vlog bağlantısı ve QR kodu son sayfada
- [ ] PDF net okunuyor (bulanık/karanlık sayfa yok)
- [ ] Dosya boyutu sınırın altında

Listenin hemen altında, karıştırmayı önlemek için sabit bilgi kutusu:

> **Staj sicil fişi bu sisteme yüklenmez.** İşyerinin doldurduğu sicil
> fişini **kapalı ve kaşeli zarf** içinde bölüm sekreterliğine elden teslim
> etmelisin. Teslim ettiğinde aşağıdaki kutucuğu işaretle; komisyon zarf
> ulaşınca onaylayacak.
