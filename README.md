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

**Demo hesaplar** (ilk çalıştırmada otomatik oluşturulur):

| Kim | Giriş | Şifre | Durumu |
|---|---|---|---|
| Elif Aydın | `20251004444` | ilk giriş: TC `55555555555` → kendi şifresini belirler | hiç başvurusu yok, sıfırdan başlar |
| Deniz Yılmaz | `20251001234` | ilk giriş: TC `11111111111` → kendi şifresini belirler | süreç başında |
| Mert Kaya | `20251001111` | `mert1234` | başvurusu incelemede |
| Ayşe Demir | `20251002222` | `ayse1234` | düzeltme istendi |
| Zeynep Şahin | `20251003333` | `zeynep1234` | stajı bitti, defter teslim aşamasında |
| Komisyon | `komisyon` | `komisyon123` | yönetici paneli (`/admin.html`) |

Ayrıca **18 öğrencilik tam veri seti** yüklüdür (`20221001001` … `20221001018`,
hepsinin şifresi `ogrenci123`) — başvurusu incelemede, düzeltmede, stajı süren,
defteri değerlendirmede ve kabul edilmiş öğrencilerle gerçekçi bir dönem
görüntüsü. Komisyon paneli bu veriyle dolu gelir.

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
