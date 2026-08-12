# 1. Genel UX Stratejisi

## 1.1 Problemin tanımı

Bugünkü staj süreci öğrenci açısından dağınıktır:

- Başvuru **Google Forms**'ta, soru-cevap **ayrı bir sitede**, defter teslimi
  **Teams'te**, sicil fişi **elden**, süreç anlatımı **başka bir sayfada**.
- Öğrenci hangi belgenin (EK-1, EK-2, EK-3) ne olduğunu, kimin imzalayacağını,
  ne zaman hazırlanacağını bilmiyor.
- Başvurusunun durumunu göremediği için hocaya soruyor: *"Hocam 5 gün önce
  başvurmuştum, durumum nedir?"*
- Aynı sorular komisyona tekrar tekrar geliyor.

Bu problemler **öğrencinin bilgisizliğinden değil, sistemin dağınıklığından**
kaynaklanır. Strateji bu yüzden şudur: kuralları öğrenciye ezberletmek yerine,
**kuralları sistemin öğrenci adına uygulamasını** sağlamak.

## 1.2 Temel tasarım ilkesi: "Tek soru, tek cevap, tek buton"

Sistem klasik bir üniversite otomasyonu ya da her şeyin aynı anda göründüğü bir
dashboard **değildir**. Referans, Google ana sayfasının sadeliğidir: Google'a
giren kullanıcı arama yapmayı öğrenmek zorunda kalmaz; bu sisteme giren öğrenci
de staj sürecini öğrenmek zorunda kalmamalıdır.

Her ekran şu üç soruya açıkça cevap verir:

1. **Şu anda sürecin neresindeyim?** → üstte durum cümlesi + ilerleme göstergesi
2. **Şimdi ne yapmam gerekiyor?** → ekranın ortasında tek bir "sıradaki işlem"
   kartı ve tek bir ana CTA
3. **Bu işlemi yaptıktan sonra ne olacak?** → CTA'nın hemen altında "sonra ne
   olacağı" cümlesi

Bu üçlüden herhangi biri bir ekranda cevapsızsa o ekran hatalıdır ve yeniden
tasarlanır.

## 1.3 Beş temel UX ilkesi

### İlke 1 — Durum odaklı gösterim (state-driven UI)

Kullanıcıya bütün seçenekler gösterilip karar vermesi istenmez. Sistem
öğrencinin süreçteki konumunu bilir ve **yalnızca o an gereken bilgiyi ve
işlemi** gösterir.

- Staj yeri bulmamış öğrenciye defter teslim ekranı gösterilmez; işyeri seçim
  şartları ve sorumlu mühendis koşulu gösterilir.
- Başvurusu onaylanmış öğrenciye "yeniden başvur" butonu gösterilmez; SGK
  kontrolü, OBS kaydı ve defter hazırlığı gösterilir.

### İlke 2 — Hata önleme > hata mesajı (error prevention)

Hata olduktan sonra mesaj göstermek yerine, hatanın **oluşmasına izin
verilmez**:

- Staj yeri bulunmadan başvuru formu açılmaz.
- Tarih seçiminde sistem iş günü sayısını kendisi hesaplar; 20 iş gününün
  altındaysa **doğru bitiş tarihini önerir** ve "Önerilen tarihi kullan"
  butonu sunar.
- Belge yükleme alanında hangi belgenin gerektiği, kimin imzalayacağı ve nasıl
  hazırlanacağı yüklemeden **önce** anlatılır.
- Hata kaçınılmazsa mesaj her zaman üç parçadır: **ne yanlış + neden yanlış +
  nasıl düzeltilir.** Asla yalnızca "Hata oluştu" yazılmaz.

### İlke 3 — Kademeli bilgi açma (progressive disclosure)

Bilgi, ihtiyaç anında ve küçük parçalar hâlinde verilir:

- İlk girişte 12 adımlık süreç haritası değil, tek bir soru gösterilir:
  *"Şu anda hangi durumdasın?"*
- Form tek uzun sayfa değil, her ekranda tek görev olan 7 adımdır.
- Belge açıklamalarının kısa hâli görünür; "Ayrıntılar" ile uzun hâli açılır.

### İlke 4 — Bürokratik dil yasak

Öğrencinin "EK-1", "SGK işe giriş bildirgesi", "sicil fişi" gibi kavramları
bildiği varsayılmaz. Kural: **önce günlük dille ne olduğu, altında küçük
puntoyla resmî adı.**

| Yazılmaz | Yazılır |
|---|---|
| "EK-1 yükle" | "İşletmenin imzaladığı staj kabul belgesini yükle" <br> <small>Zorunlu Staj Kabul Formu — EK-1</small> |
| "İlgili evrakın eksiksiz ibraz edilmesi gerekmektedir." | "Bu belgeyi imzalı ve kaşeli olarak yüklemelisin." |
| "Müracaatınız değerlendirme sürecindedir." | "Başvurun inceleniyor. Şu anda senden bir işlem beklenmiyor." |

Bütün arayüz metinleri "sen" diliyle, tek okumada anlaşılacak şekilde yazılır.

### İlke 5 — Kaybolma ve veri kaybı korkusu olmamalı

- Form her adımda otomatik kaydedilir; öğrenci çıkıp girdiğinde kaldığı yerden
  devam eder.
- Geri dönmek hiçbir veriyi silmez.
- Geri alınamaz işlemlerden önce ne olacağı açıkça söylenir:
  *"Başvuruyu gönderdiğinde bilgiler komisyon incelemesine aktarılacak.
  İnceleme başlamadan önce bazı bilgileri güncelleyebilirsin."*

## 1.4 Tek kapı stratejisi

Öğrenciye **tek bir link** verilir. Bugün dört ayrı yerde olan her şey bu tek
kapının arkasında toplanır:

| Bugün | Yeni sistemde |
|---|---|
| Google Forms başvurusu | Adım adım başvuru sihirbazı (sistem içinde) |
| Ayrı soru-cevap sitesi | 3 seviyeli yardım sistemi (sistem içinde; mevcut soru-cevap içeriği içe aktarılır) |
| Teams'e defter yükleme | Sistem içi defter teslim modülü (kontrol listesiyle) |
| Süreç anlatım sayfası | Durumla bütünleşik bağlamsal anlatım + rehber sayfaları |
| Sicil fişi (elden) | Sistem elden teslimi **açıkça söyler** ve adım olarak takip eder |

Sicil fişi gibi sistem dışında kalmak zorunda olan adımlar bile sistemin
içinde bir adım olarak görünür; öğrenci "bu sistemde yok, acaba nerede?"
sorusunu asla yaşamaz.

## 1.5 Kimlik doğrulama yaklaşımı

Hocamızın önerisi "kullanıcı adı = öğrenci no, şifre = TC kimlik no" idi.
Öğrenci numarası kullanıcı adı olarak korunur; ancak TC kimlik numarasının
**sürekli parola** olarak kullanılması KVKK ve güvenlik açısından risklidir
(TC no gizli bir bilgi değildir ve değiştirilemez). UX'i bozmayan güvenli
uyarlama:

1. Öğrenci, **öğrenci numarası + TC kimlik numarası** ile ilk girişini yapar
   (TC no yalnızca ilk kimlik doğrulamada kullanılır).
2. Sistem kurumsal e-postaya tek kullanımlık doğrulama bağlantısı gönderir.
3. Öğrenci kendi parolasını belirler; parola özetlenerek (hash) saklanır.
4. Parola unutulursa kurumsal e-posta ile sıfırlanır.

Böylece hocanın istediği "öğrenci hiçbir kimlik bilgisi ezberlemeden girsin"
hedefi ilk girişte korunur, güvenlik açığı kapatılır. Üniversitenin merkezi
giriş sistemi (SSO) kullanılabilir hâle gelirse doğrudan ona geçilir.

## 1.6 Sadelik testi

Her yeni özellik önerisi şu sorudan geçer:

> "Bu özellik kullanıcının işini gerçekten kolaylaştırıyor mu, yoksa sisteme
> gereksiz karmaşıklık mı ekliyor?"

Cevap net bir "evet" değilse özellik eklenmez. Bu ilkeyle **bilinçli olarak
tasarıma alınmayanlar**: öğrenci profil sayfası süslemeleri, bildirim tercih
merkezi (yalnızca tek bir "e-posta ile de bilgilendir" anahtarı vardır),
karanlık tema, çoklu dil, sosyal özellikler, dashboard grafikleri.
