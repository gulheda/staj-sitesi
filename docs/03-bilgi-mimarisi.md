# 3. Bilgi Mimarisi

## 3.1 Genel yapı

Sistem üç rol için üç ayrı alan sunar; öğrenci alanı bilinçli olarak **düz ve
sığ** tutulmuştur (en fazla 2 seviye derinlik — öğrenci hiçbir bilgiye 2
tıktan fazla uzakta değildir).

```
Staj Portalı
│
├── Öğrenci alanı
│   ├── Stajım (ana ekran — giriş sonrası varsayılan)
│   │   ├── Durum cümlesi + süreç göstergesi
│   │   ├── "Şimdi yapman gereken" kartı (tek ana CTA)
│   │   ├── Yaklaşan tarihler
│   │   └── (duruma göre) başvuru sihirbazı / SGK rehberi /
│   │       defter teslimi / sonuç ekranı
│   ├── Belgelerim
│   │   ├── Aşamaya göre belgeler (başvuru öncesi / staj sırası / teslim)
│   │   └── Belge detay kartları (nedir, kim doldurur, kim imzalar…)
│   ├── Yardım
│   │   ├── Sık sorulan sorular (kategorili + doğal dil arama)
│   │   ├── Soru sor (benzer soru önerili)
│   │   └── Sorularım (gönderdiği soruların cevap durumu)
│   └── Staj rehberi (isteğe bağlı okuma: sürecin tamamının görselli anlatımı
│       — hocanın hazırladığı adım adım anlatım ve görseller buraya taşınır)
│
├── Komisyon paneli
│   ├── Bekleyen işler (öncelik sıralı tek kuyruk)
│   │   ├── Yeni başvurular
│   │   ├── İncelenecek belgeler
│   │   ├── Değerlendirilecek staj defterleri
│   │   └── Cevaplanacak öğrenci soruları
│   ├── Öğrenciler (arama + durum filtresi + öğrenci detayı)
│   ├── Takvim görünümü (başlangıcı yaklaşan stajlar, SGK kontrolleri,
│   │   teslim tarihleri)
│   └── Soru-cevap yönetimi (SSS'ye cevap ekleme/düzenleme)
│
└── Yönetici alanı
    ├── Kullanıcı yönetimi (öğrenci listesi içe aktarma, komisyon üyeleri)
    ├── Dönem ve tarih ayarları (başvuru dönemleri, son tarihler, resmî
    │   tatil takvimi)
    ├── Belge şablonları (EK-1/2/3 sürümleri, örnek belgeler)
    ├── Duyurular
    └── İşlem geçmişi (audit log)
```

## 3.2 Öğrenci navigasyonu

Öğrenci tarafında menü yalnızca **4 kalemdir** ve her ekranda sabittir:

**Stajım · Belgelerim · Yardım · Staj rehberi**

Bu kadar. "Başvurularım", "Defter teslimi", "SGK işlemleri" gibi kalemler
menüye **konmaz** — bunlar zaten "Stajım" ekranının duruma göre gösterdiği
içeriklerdir. Menü kalemi arttıkça öğrencinin "acaba hangisine tıklamalıyım?"
sorusu doğar; bu soru tasarım hatasıdır.

## 3.3 "Stajım" ana ekranının bilgi mimarisi

Ana ekran yukarıdan aşağıya sabit bir hiyerarşi izler. Sıralama, öğrencinin
sorularının doğal sırasıdır: *neredeyim → ne yapacağım → ne zaman → başka?*

```
┌────────────────────────────────────────────────┐
│ 1. DURUM CÜMLESİ  (h1, tek cümle)              │  "Neredeyim?"
│    "Başvurun onaylandı."                       │
│    + kısa alt açıklama                         │
├────────────────────────────────────────────────┤
│ 2. SÜREÇ GÖSTERGESİ (yatay, 12 aşama)          │  "Bütünün neresindeyim?"
│    ✓ yeşil = tamamlandı                        │
│    ● sarı  = şu anki aşama                     │
│    ○ gri   = henüz gelmedi                     │
├────────────────────────────────────────────────┤
│ 3. "ŞİMDİ YAPMAN GEREKEN" KARTI                │  "Ne yapacağım?"
│    Tek işlem + tek ana CTA                     │
│    + "Bu işlemi yapınca ne olacak?" cümlesi    │
│    + işleme özel yardımcı butonlar             │
│      (Belgeyi indir / Nasıl doldurulur? /      │
│       Örnek belge / Belgeyi yükle)             │
├────────────────────────────────────────────────┤
│ 4. YAKLAŞAN TARİHLER (en fazla 3 satır)        │  "Ne zamana kadar?"
│    yalnızca öğrenciyi ilgilendirenler          │
├────────────────────────────────────────────────┤
│ 5. "TAKILDIN MI?" BAĞLANTISI                   │  "Sorum var"
│    bulunduğu aşamayla ilgili SSS'ye götürür    │
└────────────────────────────────────────────────┘
```

Kart 3'te **her zaman tek bir işlem** vardır. İki işlem aynı anda gerekiyorsa
(ör. defter yükleme + sicil fişi teslimi) bunlar tek kart içinde numaralı
adımlar olarak gösterilir; iki ayrı eşdeğer kart asla yan yana konmaz.

## 3.4 Belgelerim ekranının bilgi mimarisi

Belgeler alfabetik/düz liste değil, **öğrencinin aşamasına göre** gruplanır ve
bulunduğu aşamanın grubu açık gelir:

- **Başvurudan önce gerekenler** — staj yönergesi, staj el kitabı, staj
  zorunluluk belgesi, kabul formu (yaz — EK-1 / dönem içi sürümü), ücret
  katkısı belgeleri, EK-3
- **Staj sırasında kullanacakların** — defter kapağı, günlük defter sayfası,
  sicil fişi (boş), vlog rehberi
- **Teslim ederken gerekenler** — staj defteri (yüklenecek), sicil fişi
  (elden), vlog bağlantısı

Her belge satırı bir **belge kartına** açılır; kartın sabit alanları (hepsi
her belgede doldurulur, ayrıntı docs/05 §5.5):

Bu belge nedir? · Neden gerekiyor? · Kim dolduracak? · Kim imzalayacak? ·
Kaşe gerekiyor mu? · Ne zaman hazırlanmalı? · Nereye teslim edilecek? ·
Örnek doldurulmuş belge

## 3.5 Rehber içeriğinin yeri

Hocanın hazırladığı süreç anlatımı ve yapay zekâ görselleri iki yerde yaşar:

1. **Parçalanmış hâlde, bağlam içinde:** her adımın "Nasıl yapılır?"
   açıklamasında ilgili görsel ve metin gösterilir (asıl kullanım).
2. **Bütün hâlde, "Staj rehberi" sayfasında:** baştan sona okumak isteyen
   öğrenci için. Bu sayfa navigasyonda vardır ama hiçbir akışın zorunlu
   adımı değildir.

## 3.6 Komisyon paneli bilgi mimarisi

Komisyonun ekranı öğrencininkinin tersine bir **iş kuyruğudur**; buradaki UX
hedefi hız ve önceliklendirmedir:

- Panelin ilk ekranı "Bekleyen işler"dir; işler tür + aciliyet sırasıyla
  listelenir (başlangıcı yaklaşan stajların başvuruları üstte).
- Belge inceleme ekranında belge önizlemesi ile **Onayla / Düzeltme iste /
  Reddet** butonları aynı ekrandadır; sayfa değiştirmeden art arda inceleme
  yapılabilir.
- "Düzeltme iste" seçilince hazır açıklama şablonları sunulur ("kaşe eksik",
  "imza eksik", "belge okunmuyor", "yanlış belge yüklenmiş"…) — komisyon tek
  tıkla, öğrencinin anlayacağı dilde yazılmış açıklamayı seçer; isterse
  düzenler. Bu şablonlar, öğrenciye giden metnin kalitesini garanti eder.
- Her karar öğrencinin durumunu otomatik günceller ve bildirimini gönderir;
  komisyon ayrıca e-posta yazmaz.
