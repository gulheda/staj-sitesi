# Balıkesir Üniversitesi Bilgisayar Mühendisliği — Staj Yönetim Sistemi

Öğrencilerin bütün staj işlemlerini **tek bir platform** üzerinden, kimseye soru
sormadan tamamlayabileceği, kullanıcı deneyimi (UX) odaklı bir self-service staj
portalı.

> **Bu depo şu anda projenin 1. ve 2. aşamasını içerir: Süreç Analizi ve UX
> Tasarımı.** Hocamızın talebi doğrultusunda önce kod değil, kullanıcı deneyimi
> tasarlandı. Teknik geliştirme (Node.js) bu tasarım onaylandıktan sonra
> başlayacaktır.

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
