# Balıkesir Üniversitesi Bilgisayar Mühendisliği — Staj Yönetim Sistemi

Öğrencilerin bütün staj işlemlerini **tek bir platform** üzerinden, kimseye soru
sormadan tamamlayabileceği, kullanıcı deneyimi (UX) odaklı bir self-service staj
portalı.

Depo üç şey içerir: **UX tasarım dokümanları** (`docs/`), **tıklanabilir
prototip** (`prototype/`) ve tasarımı birebir uygulayan **çalışan Node.js
uygulaması** (`server.js` + `public/`).

## Çalıştırma

```bash
npm install
npm start        # http://localhost:3000
```

**Demo hesaplar** (ilk çalıştırmada otomatik oluşturulur; öğrenci şifreleri `ogrenci123`):

| Öğrenci no | Ad | Senaryo |
|---|---|---|
| `20241001001` | Elif Aydın | İlk giriş (şifre yerine TC: `10000000247`) |
| `20241001002` | Yağmur Kaya | İlk giriş (TC: `10000000348`) |
| `20241001003` | Arda Demirtaş | İlk giriş (TC: `10000000449`) |
| `20241001004` | Mira Erdoğan | İlk giriş + **2. sınıf** (TC: `10000000550`) |
| `20241001005` | Deniz Yılmaz | Giriş yapmış, henüz staj yeri yok |
| `20241001006` | Zeynep Şahin | Taslak başvuru (sihirbaz 3. adımda) |
| `20241001007` | Mert Kaya | Başvurusu incelemede |
| `20241001008` | Ayşe Demir | Düzeltme istenmiş (kaşe eksik) |
| `20241001009` | Emre Doğan | Onaylı — SGK kontrolü aşaması |
| `20241001010` | Selin Koç | Onaylı — OBS kaydı aşaması |
| `20241001011` | Burak Aydın | Staja hazır (başlangıç yaklaşıyor) |
| `20241001012` | Mehmet Ergin | **Stajı şu an devam ediyor** |
| `20241001013` | Gizem Ak | Staj bitti — defter teslimi bekliyor |
| `20241001014` | Naz Güler | Defter değerlendirmede + sicil zarfı teslimli |
| `20241001015` | Cem Aksoy | Defter değerlendirmede, sicil henüz yok |
| `20241001016` | Deren Işık | Defterde düzeltme istenmiş |
| `20241001017` | Baran Ünal | 1. staj kabul — 2. stajı açabilir |
| `20241001018` | Ceyda Polat | **İki staj aynı anda** (1. sürüyor, 2. incelemede) |
| `20241001019` | Tolga Erdem | Başvurusu reddedilmiş (yeniden başvurabilir) |
| `20241001020` | İrem Şen | **Dönem içi staj** (Pzt-Çar-Cum) |
| `20241001021` | Onur Bulut | **Cumartesi dahil** staj |
| `20241001022` | Aylin Tan | **Yurt dışı** stajı (Berlin) |
| `20241001023` | Kaan Yılmaz | Her iki stajı da tamamlanmış |
| `20241001024` | Ece Kara | 2. sınıf, tek başvuru hakkı dolu |
| `komisyon` | Staj Komisyonu | Yönetici paneli (`/admin.html`, şifre `komisyon123`) |

Hızlı gezinti: `localhost:3000/demo-giris/20241001012` gibi bir adres, o
hesapla şifresiz oturum açar (yalnız demo modunda). Veritabanını sıfırlamak
için sunucu kapalıyken `staj.db` dosyasını silip yeniden başlatın.

**Gerçek belgeler** `public/belgeler/` altındadır ve sistemden indirilir:
EK-1 kabul formu, EK-2 ücret/İşsizlik Fonu formu, staj zorunluluk belgesi,
staj yönergesi, defter sayfaları şablonu. Yönerge ve formlardaki gerçek
kurallar (20 gün önce başvuru, cumartesi komisyon onayı, pazar sayılmaz,
el yazısı defter, kamu kurumunda EK-2 muafiyeti, yurt dışında SGK öğrencide)
sisteme işlenmiştir.

**Teknik yapı:** Node.js + Express, SQLite (better-sqlite3), dosya yükleme
tür/boyut denetimli (multer). Öğrencinin aşaması (`deriveStage`) veriden
türetilir — arayüz yalnızca sunucunun bildirdiği aşamayı çizer. Pilot
sürümde SQLite kullanılır; şema PostgreSQL'e birebir taşınabilir.
Sıfırlamak için `staj.db` dosyasını silip yeniden başlatın.

## Projenin tek cümlelik hedefi

> Staj sürecini hiç bilmeyen, yönetmeliği hiç okumamış bir öğrenci bile sisteme
> ilk kez girdiğinde **kimseye soru sormadan, hata yapmadan** bütün staj
> sürecini tamamlayabilmelidir.

Bunun ölçüsü şudur: Öğrenci hocaya "Başvurum onaylandı mı?", "Hangi belgeyi
yükleyeceğim?", "Defteri nereye teslim edeceğim?" diye **hiç sormamalıdır** —
çünkü cevap her an ekranda yazmaktadır.

## Depo yapısı

```
docs/        UX tasarım dokümanları (aşağıdaki tabloya bakın)
prototype/   Tıklanabilir düşük detaylı (low-fidelity) wireframe prototipi
             → prototype/index.html dosyasını tarayıcıda açın
```

## Dokümanlar ve istenen çıktıların karşılığı

| Doküman | İçerik | Karşıladığı istenen çıktılar |
|---|---|---|
| [docs/01-ux-stratejisi.md](docs/01-ux-stratejisi.md) | UX felsefesi, temel ilkeler, tasarım kararları | 1 |
| [docs/02-kullanici-yolculuklari.md](docs/02-kullanici-yolculuklari.md) | Persona'lar, ana yolculuk haritası, 4 durum akışı | 2, 3, 4, 5, 6 |
| [docs/03-bilgi-mimarisi.md](docs/03-bilgi-mimarisi.md) | Bilgi mimarisi, ana sayfa yapısı, ekran envanteri | 7 |
| [docs/04-ekranlar-ve-hata-onleme.md](docs/04-ekranlar-ve-hata-onleme.md) | Her ekranın amacı, ana CTA'sı, olası kullanıcı hataları ve önleyici UX çözümleri | 8, 9, 10, 11 |
| [docs/05-basvuru-formu-ve-belgeler.md](docs/05-basvuru-formu-ve-belgeler.md) | Adım adım form yapısı, akıllı tarih seçimi, belge yükleme deneyimi | 12, 13 |
| [docs/06-durum-takip-sistemi.md](docs/06-durum-takip-sistemi.md) | Başvuru durum makinesi, her durumun öğrenciye görünen metni | 14 |
| [docs/07-yardim-sistemi.md](docs/07-yardim-sistemi.md) | 3 seviyeli yardım: bağlamsal yardım, SSS, yeni soru | 15 |
| [docs/08-durum-senaryolari.md](docs/08-durum-senaryolari.md) | Empty state, success state, error state senaryoları | 16 |
| [docs/09-kullanilabilirlik-testi.md](docs/09-kullanilabilirlik-testi.md) | Test görevleri, ölçüm yöntemi, başarı kriterleri | 17 |
| [docs/10-wireframe-ve-prototip.md](docs/10-wireframe-ve-prototip.md) | Wireframe yapısı ve prototip kullanım kılavuzu | 18 |
| [prototype/index.html](prototype/index.html) | Tıklanabilir düşük detaylı prototip | 18 |

## Prototipi çalıştırma

Kurulum gerekmez; tek bir HTML dosyasıdır:

```
prototype/index.html dosyasını herhangi bir tarayıcıda açın
```

Prototip bilinçli olarak **düşük detaylıdır** (gri kutular, basit tipografi).
Amaç görsel tasarımı değil, **akışı ve metinleri** test etmektir. Sağ üstteki
"Senaryo" menüsü ile öğrencinin farklı süreç aşamalarındaki deneyimi
görülebilir.

## Canlıya alma

Gerçek kullanım için (bölüm sunucusunda):

```bash
DEMO_VERI=0 STAJ_DONEM_ZORUNLU=1 PORT=3000 npm start
```

- `DEMO_VERI=0` → demo öğrenciler oluşturulmaz; yalnızca `komisyon` hesabı
  açılır. **İlk iş komisyon şifresini değiştirmek** (pilotta sabittir).
- `STAJ_DONEM_ZORUNLU=1` → başvuru dönemleri (yaz: 1 Haziran–15 Temmuz,
  dönem içi: ayın 10'una kadar) kesin engel olarak uygulanır.
- Gerçek öğrenci listesi komisyon panelindeki **Öğrenci yönetimi**
  bölümünden yüklenir (satır biçimi: `öğrenciNo;TC;Ad Soyad;eposta`).
  Öğrenci ilk girişini öğrenci no + TC ile yapar, kendi şifresini oluşturur.
- Oturumlar veritabanında tutulur; sunucu yeniden başlasa da düşmez.
- HTTPS için üniversitenin ters vekili (nginx/IIS) arkasına konumlandırın;
  `staj.db` ve `uploads/` klasörünün düzenli yedeğini alın.
- Giriş denemeleri sınırlıdır (8 hatalı deneme → 5 dk bekleme).

## Sonraki aşamalar

1. ~~Araştırma ve süreç analizi~~ ✅ (bu depo)
2. ~~UX tasarımı ve tıklanabilir prototip~~ ✅ (bu depo)
3. Kullanılabilirlik testleri — prototip, sistemi hiç görmemiş öğrencilerle
   test edilecek ([test planı](docs/09-kullanilabilirlik-testi.md))
4. Backend geliştirme (Node.js + Express/NestJS, PostgreSQL)
5. Frontend geliştirme (React / Next.js)
6. Entegrasyonlar (e-posta, mevcut soru-cevap sistemi)
7. Güvenlik ve kullanılabilirlik testleri
8. Pilot kullanım
