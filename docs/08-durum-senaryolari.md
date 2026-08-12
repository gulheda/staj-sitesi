# 8. Empty / Success / Error State Senaryoları

Her ekran üç özel durumda da tasarlanmıştır; "boş beyaz sayfa", "sessiz
başarı" ve "anlamsız hata" bu sistemde yoktur.

## 8.1 Empty state (boş durumlar)

Kural: boş ekran asla gerçekten boş değildir; her boş durum **bir sonraki
adımı öğretir.**

| Ekran | Boş durum | Gösterilen |
|---|---|---|
| Stajım (hiç başvuru yok) | Öğrenci sürece hiç başlamamış | "Staj sürecine başlayalım. Şu anda hangi durumdasın?" başlangıç sorusu — boş dashboard değil |
| Stajım (staj yeri yok) | Başvuru öncesi | "Önce staj yapacağın bir kurum bulmalısın." + işyeri şartları + "Kurum buldum, devam et" |
| Belgelerim | Henüz belge yüklenmemiş | "Henüz belge yüklemedin. Bulunduğun aşamada gereken belgeler şunlar:" + aşamaya uygun liste |
| Sorularım | Hiç soru sorulmamış | "Henüz soru sormadın. Çoğu sorunun cevabı hazır: [Sık sorulan sorulara bak]" |
| Yaklaşan tarihler | Tarih yok | "Şu anda seni bekleyen bir tarih yok." (bölüm gizlenmez — güven verir) |
| SSS arama | Sonuç yok | "Bu soruya uygun hazır cevap bulamadık. [Soruyu komisyona gönder]" — çıkmaz sokak yok |
| Komisyon: bekleyen işler | Kuyruk boş | "Bekleyen iş yok 👍 Son incelenenler aşağıda." |

## 8.2 Success state (başarı durumları)

Kural: her başarı mesajı iki şey söyler — **ne oldu** + **sonra ne olacak.**

| Olay | Mesaj |
|---|---|
| Belge yüklendi | "✓ Belgeni aldık." + dosya adı + "Komisyon incelemesinde bu belge de değerlendirilecek." |
| Başvuru gönderildi | "Başvurunu aldık." + özet + "Komisyon inceleyecek; sonuçlanınca e-posta ile haber vereceğiz. Şu anda senden bir işlem beklenmiyor." |
| Düzeltme sonrası yeniden yükleme | "✓ Yeni belgen komisyona iletildi. İnceleme sonucunu bekle." |
| SGK kontrolü işaretlendi | "✓ Harika. Sıradaki adımın: OBS'de staj dersini seçmek." |
| Defter yüklendi | "✓ Defterini aldık. Unutma: sicil fişini kapalı zarfla bölüm sekreterliğine elden teslim etmen gerekiyor." |
| Sicil fişi teslimi komisyon tarafından onaylandı | "✓ Sicil fişin bölüme ulaştı. Bütün belgelerin tamam — değerlendirme sonucunu bekle." |
| Staj kabul edildi | "Tebrikler — stajın kabul edildi 🎉 Staj sürecin tamamlandı. Yapman gereken başka bir işlem yok." |
| Soru gönderildi | "Sorunu komisyona ilettik. Cevaplanınca bildirim ve e-posta ile haber vereceğiz." |

## 8.3 Error state (hata durumları)

Kural: hata mesajı formatı sabittir — **ne yanlış + neden + nasıl düzeltilir**,
mümkünse tek tıklık düzeltme butonuyla. Suçlayıcı dil ("geçersiz giriş
yaptınız") kullanılmaz.

| Senaryo | Yanlış yaklaşım | Bu sistemde |
|---|---|---|
| İş günü yetersiz | "Geçersiz tarih aralığı" | "Bu tarihler toplam 19 iş günü oluşturuyor. Stajın en az 20 iş günü olmalı. Önerilen bitiş tarihi: 31 Ağustos 2026. [Önerilen tarihi kullan]" |
| Tatile denk başlangıç | "Hata: tarih seçilemez" | Takvimde o gün zaten seçilemez; üzerine gelince: "30 Ağustos resmî tatil — staj bu gün başlayamaz." |
| Okunmayan dosya | "Yükleme başarısız" | "Yüklediğin dosya okunamıyor. Belgeyi telefonunla dik açıdan, aydınlık bir yerde çekip tekrar yüklemeyi dene." |
| Yanlış dosya türü | "Invalid file type" | "Bu alana PDF veya fotoğraf (JPG) yükleyebilirsin. Word dosyasını PDF olarak kaydedip tekrar dene." |
| Dosya çok büyük | "Dosya boyutu aşıldı" | "Dosyan 25 MB — sınır 10 MB. Tarama çözünürlüğünü düşürüp tekrar dene; nasıl yapacağını bilmiyorsan [şu kısa rehbere bak]." |
| Eksik zorunlu alan | Kırmızı çerçeveler | "Devam et"e basınca sayfa eksik alana kayar: "Sorumlu mühendisin adını yazmalısın. Bilmiyorsan 'Bilmiyorum'u seçebilirsin." |
| Oturum süresi doldu | Veriler kayboldu | Hiçbir veri kaybolmaz (otomatik taslak): "Güvenlik için yeniden giriş yapmalısın. Bilgilerin kaydedildi — kaldığın yerden devam edeceksin." |
| Sunucu hatası | "500 Internal Server Error" | "Bir şeyler ters gitti ama bilgilerin güvende. Birazdan tekrar dene; sorun sürerse [bize bildir]." |
| Başvuru dönemi kapalı | Form sessizce çalışmaz | Form hiç açılmaz; onun yerine: "Başvuru dönemi 1 Haziran'da açılacak. Açıldığında sana e-posta ile haber verelim mi? [Evet, haber ver]" |

## 8.4 Bekleme durumları (öğrenciden işlem beklenmeyen anlar)

Bekleme, belirsizlik hissettirmemelidir:

- Durum cümlesi + "Şu anda senden bir işlem beklenmiyor." + "Sonuçlanınca
  e-posta ile haber vereceğiz." her bekleme ekranında birlikte bulunur.
- Ortalama bekleme bilgisi verilebilir: "Başvurular genellikle 5 iş günü
  içinde incelenir."
- Bekleme ekranında CTA yoktur; ama "Bu arada yapabileceklerin" kutusu
  gösterilebilir (ör. onay beklerken: "Staj defteri şablonunu şimdiden
  indirebilirsin").
