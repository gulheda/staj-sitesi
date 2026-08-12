# 12. Kaynak Araştırması — Resmî Sayfalardan Doğrulanan Kurallar

> Bu ortamdan balikesir.edu.tr alan adlarına doğrudan erişim engelli olduğu
> için bilgiler arama motoru üzerinden sayfa içeriklerinden derlendi.
> Her kuralın kaynağı ve güven durumu işaretlidir:
> ✅ = kaynağı BAÜN sayfası, CENG için geçerli · ⚠️ = başka bölümün (makine
> vb.) sayfasından — CENG komisyonuna doğrulatılmadan kesin kural yazılmaz.

## Doğrulanan kurallar

| # | Kural | Durum | Kaynak |
|---|---|---|---|
| 1 | Bilgisayar Müh. öğrencisi toplam **40 iş günü** staj yapar: **iki ayrı 20 iş günlük** staj | ✅ | BAÜN bölüm sayfası |
| 2 | Staj **dönem içinde de** yapılabilir: aynı süre ve **haftada en az 3 gün** şartıyla | ✅ | Staj yönergesi |
| 3 | **EK-1 / EK-1A**: Zorunlu Staj Kabul Formu (dönem içi / yaz dönemi için ayrı sürümler) | ✅ | MF staj evrakları |
| 4 | **EK-2**: Staj Ücretlerine İşsizlik Fonu Katkısı Bilgi Formu — yalnızca **ücret ödenecekse** gerekir; işletme eksiksiz doldurup onaylar | ✅ | MF staj evrakları |
| 5 | **EK-3**: Excel formatında ek belge | ✅ (içeriği netleştirilecek) | MF staj evrakları |
| 6 | **Staj Sicil Fişi fotoğraflı** doldurulmalı; işletme doldurur | ✅ | MF staj evrakları |
| 7 | **SGK girişini üniversite yapar** | ✅ | MF staj evrakları |
| 8 | Staj başvuruları **yalnızca web'deki bağlantıdan**; **e-posta ile gönderilen başvurular değerlendirilmez** | ✅ | CENG staj sayfası |
| 9 | Staja başlamadan önce **Staj Kılavuzu ve Staj El Kitabı** okunmalı | ✅ | CENG staj sayfası |
| 10 | 2025-2026 Bahar'dan itibaren 4. sınıflar **7+1 modeli** ile 8. yarıyılı işletmede geçirir (İşletmede Mesleki Eğitim dersi) | ✅ | CENG haberler |
| 11 | Staj defteri **mürekkepli kalemle, el yazısıyla** yazılır (bilgisayarda yazılmaz) | ⚠️ makine bölümü kaynağı | Makine defter teslim sayfası |
| 12 | **Yaz okulundan ders alırken yapılan staj geçersiz** sayılır | ⚠️ makine bölümü kaynağı | Makine bölüm sayfası |
| 13 | Her staj için **ayrı defter** düzenlenir (aynı firmada olsa bile) | ⚠️ makine bölümü kaynağı | Makine defter teslim sayfası |

Kaynak sayfalar:
- https://ceng.balikesir.edu.tr/staj (bölüm staj sayfası)
- https://ceng.balikesir.edu.tr/sik-sorulan-sorular
- https://mf.balikesir.edu.tr/staj-evraklari (fakülte staj evrakları)
- https://makine.balikesir.edu.tr/staj-defter-teslim-sureci
- https://www.balikesir.edu.tr/site/icerik/bilgisayar-muhendisligi-bolumu-3354
- http://endustri.balikesir.edu.tr/dokumanlar/stajyonergesiguncel.pdf (yönerge)
- https://civa.gen.tr/ceng_staj/staj_sureci.html (hocanın süreç anlatımı — erişilemedi, içerik öğrenciden alınacak)

## Bu kuralların UX'e etkisi

| Kural | Tasarıma yansıması |
|---|---|
| 1 (2 × 20 gün) | Sistem "1. staj / 2. staj" kavramını bilmeli; öğrenci hangi stajında olduğunu seçmez, sistem kayıttan bilir. Ana ekranda "Bu senin 1. stajın" görünür. |
| 2 (dönem içi ≥3 gün/hafta) | Sihirbaz Adım 5'te dönem içi seçilirse "çalışılacak günler" sorusu haftada 3 günün altına izin vermez. |
| 4 (EK-2 yalnız ücretliyse) | "Ücret ödenecek mi?" cevabı Evet ise EK-2 belge listesine otomatik eklenir; Hayır ise öğrenci EK-2'yi hiç görmez. |
| 6 (fotoğraflı sicil fişi) | Sicil fişi kutusuna eklendi: "fişte fotoğrafın yapıştırılmış olmalı." |
| 8 (e-posta değerlendirilmez) | Sistem tek başvuru kapısı olduğu için bu hata sınıfı kendiliğinden ölür — yine de rehberde belirtilir. |
| 11 (el yazısı) ⚠️ | Doğrulanırsa: defter teslim kontrol listesine "sayfaları el yazısıyla (mürekkepli kalem) yazdım" maddesi eklenir; staj dönemi ekranındaki uyarıya da girer. |
| 12 (yaz okulu çakışması) ⚠️ | Doğrulanırsa: sihirbaz Adım 5'te tarih seçiminde sistem yaz okulu kaydı çakışmasını sorar/uyarır — staj sonradan geçersiz sayılma felaketini baştan engeller. |

## Hâlâ eksik olan ve öğrenciden/hocadan istenecekler

1. civa.gen.tr'deki adım adım süreç anlatımının tam metni ve görselleri
2. CENG SSS sayfasındaki soru-cevapların tam listesi
3. Vlog gereksinimlerinin resmî tanımı (süre, içerik, QR kod kuralı)
4. "Sorumlu mühendis" için kabul edilen unvanların kesin listesi
5. Kaşe/mühür kuralının kesin cevabı
6. EK-3'ün tam olarak ne olduğu ve kimin doldurduğu
7. Defter teslim tarihleri ve başvuru dönemi tarihleri
8. ⚠️ işaretli kuralların (11, 12, 13) CENG için geçerli olup olmadığı
