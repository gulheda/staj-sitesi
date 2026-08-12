# 7. Yardım ve Soru-Cevap Deneyimi

## 7.1 Tasarım hedefi

İyi UX'in hedefi öğrencinin soru **sormak zorunda kalmamasıdır**. Yardım
sistemi bu yüzden bir huni gibi tasarlanır: her seviye, sorunun bir sonraki
seviyeye ulaşmasını azaltır.

```
Seviye 1  Bağlamsal yardım      → soruların ~%70'i hiç doğmadan cevaplanır
Seviye 2  Sık sorulan sorular   → doğan soruların çoğu burada biter
Seviye 3  Yeni soru gönderme    → yalnızca gerçekten yeni sorular komisyona ulaşır
```

Mevcut soru-cevap sitesindeki bütün içerik Seviye 2'ye **içe aktarılır**;
böylece sistem ilk günden dolu bir SSS ile açılır. (Mevcut sistemle canlı
entegrasyon, teknik aşamada API üzerinden yapılabilir.)

## 7.2 Seviye 1 — Bağlamsal yardım

Bilgi, sorunun doğduğu yerde verilir; öğrenci ayrı bir yardım sayfasına
gitmez.

- **Alan yanı açıklamalar:** ör. "Sorumlu mühendis" alanının yanında:
  "Staj yaptığın kurumda bilgisayar, yazılım veya ilgili alanda çalışan
  sorumlu bir mühendis bulunmalı."
- **Belge kartları:** her belgenin 8 sorusu (nedir, kim doldurur, kim
  imzalar, kaşe, ne zaman, nereye, neden, örnek) belgeyle birlikte gösterilir.
- **"Sonra ne olacak?" cümleleri:** her CTA'nın altında.
- **"Takıldın mı?" bağlantısı:** her ekranın altında; tıklanınca genel SSS
  değil, **bulunduğu aşamanın** SSS kategorisi açılır. (Tarih adımında
  takılan öğrenci "Staj tarihleri" SSS'sine düşer.)

## 7.3 Seviye 2 — Sık sorulan sorular

**Kategoriler:** Staj yeri bulma · Staj tarihleri · Yaz stajı · Dönem içi
staj · Belgeler · SGK işlemleri · OBS işlemleri · Staj defteri · Staj sicil
fişi · Vlog · Yurt dışı stajı · Mezun durumundaki öğrenciler

**Arama:** Öğrenci doğal dille yazar — "staj defterini ne zaman teslim
edeceğim?" — sistem anahtar kelime değil anlam eşleşmesiyle ilgili hazır
cevabı getirir. Arama kutusunun içindeki örnek metin de bunu öğretir:
*"Sorunu kendi cümlenle yaz, ör: kaç gün staj yapmam gerekiyor?"*

**Cevap formatı:** Her cevabın sonunda "Bu cevap işine yaradı mı? 👍 👎"
bulunur. 👎 verilirse Seviye 3'e yönlendirilir; 👎 oranı yüksek cevaplar
komisyon panelinde "iyileştirilmeli" olarak işaretlenir.

## 7.4 Seviye 3 — Yeni soru gönderme

Soru gönderme ekranı, tekrar soruları azaltacak şekilde tasarlanır:

1. Öğrenci sorusunu yazmaya başlar.
2. Yazarken sistem canlı olarak benzer soru/cevapları listeler:
   > "Göndermek istediğin soruya benzeyen cevaplar bulduk:"
   > • Staj defteri ne zaman teslim edilir? → cevabı gör
   > • Defter tesliminde sicil fişi de yüklenecek mi? → cevabı gör
3. Benzer cevaplar öğrencinin işini görmediyse **"Hiçbiri sorumu
   cevaplamıyor, soruyu gönder"** butonu aktifleşir.
4. Gönderim onayı: "Sorunu komisyona ilettik. Cevaplanınca sana bildirim ve
   e-posta ile haber vereceğiz."

**Sorularım listesi:** öğrenci gönderdiği soruların durumunu (cevap bekliyor /
cevaplandı) burada görür; cevaplar kaybolmaz.

**Komisyon tarafı:** komisyon bir soruyu cevaplarken tek tıkla "Bu cevabı
SSS'ye ekle" diyebilir — böylece SSS gerçek sorularla kendiliğinden büyür ve
aynı soru bir daha komisyona ulaşmaz. Soru kişisel değilse öğrenciye giden
cevapla SSS'ye giden cevap aynı metindir.

## 7.5 Yardımın ana deneyimdeki yeri

Soru-cevap, ana navigasyonda vardır ("Yardım") ama ana deneyimin merkezi
**değildir**. Ana ekran tasarımı doğru çalışıyorsa öğrenci yardıma nadiren
girer. Bu yüzden:

- Ana ekranda büyük "Yardım" kutuları, chatbot balonları vb. yoktur;
  yalnızca sayfa altında mütevazı bir "Takıldın mı?" bağlantısı vardır.
- Yardım kullanım istatistikleri (hangi aşamada, hangi arama) komisyon
  panelinde görünür; bir aşamada yardım kullanımı yoğunlaşıyorsa o **ekran**
  yeniden tasarlanır. Yardım sistemi aynı zamanda UX'in hata sinyalidir.
