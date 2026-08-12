# 11. Gerçek Öğrenci Soruları → Arayüz Cevabı Eşlemesi

## Neden bu doküman var?

Komisyona gelen her soru, arayüzün cevapsız bıraktığı bir noktayı gösterir.
Bu dokümanda toplanan her gerçek soru için üç şey belirlenir:

1. **Doğru cevap nedir?** (kaynak: staj yönergesi / komisyon — tahmin değil)
2. **Arayüzde nerede cevaplanmalı?** (sorunun doğduğu ekranda — SSS'de değil)
3. **Nasıl yazılmalı?** (tek cümle, günlük dil)

Kural: Bir soru SSS'ye eklenerek "çözülmüş" sayılmaz. SSS son çaredir;
hedef, sorunun doğduğu ekranda hiç doğmamasıdır.

## Veri toplama görevi (yapılacak)

- [ ] Hocadan komisyona en çok gelen soruların listesini iste
- [ ] Mevcut soru-cevap sitesindeki bütün soru-cevapları çıkar
- [ ] ceng.balikesir.edu.tr/staj ve staj süreci sayfasındaki bütün kural ve
      belge metinlerini bu depoya aktar (`docs/kaynak/` klasörüne)
- [ ] Her cevabın doğruluğunu komisyona onaylat — **tahminle kural yazılmaz**

## Eşleme tablosu

> ⚠ "Cevap" sütunundaki içerikler komisyona DOĞRULATILMADAN prototipe
> kesin kural olarak yazılamaz. Doğrulanmamış olanlar ❓ ile işaretli.

| Gerçek soru (öğrencilerden geldiği hâliyle) | Cevap | Arayüzde nerede cevaplanır? | Ekranda yazılacak metin |
|---|---|---|---|
| "Kaşe mi mühür mü? Mühür olabilir mi?" | ❓ Komisyona sorulacak | Belge yükleme alanı, yüklemeden ÖNCE | ❓ Ör: "Belgede işletmenin kaşesi **veya** resmî mührü olmalı — ikisi de geçerli." (ya da tersi; komisyon ne derse o) |
| "Yetkili kişi / sorumlu mühendis ne mühendisi olmalı?" | ❓ Kabul edilen unvan listesi komisyondan alınacak | Sihirbaz Adım 4, unvan alanı | Unvan serbest metin DEĞİL, açılır liste olur: yalnızca kabul edilen unvanlar seçilebilir + "Bilmiyorum". Yanlış unvan yazmak **fiziksel olarak imkânsız** hâle gelir. |
| "Hocam başvurum ne durumda?" | Sistemden bakılır | "Stajım" ekranının ilk cümlesi | "Başvurun inceleniyor. Senden işlem beklenmiyor." |
| "Staj defterini nasıl hazırlayacağız?" | El kitabındaki kurallar | Staj dönemi ekranı + defter teslim kontrol listesi | "Her staj günü için bir sayfa doldur, sorumluna imzalat." + örnek doldurulmuş sayfa |
| "Sicil fişini nereye teslim edeceğim?" | Elden, kapalı zarfla, bölüm sekreterliğine | Teslim ekranında sabit sarı kutu | "Sicil fişi buraya yüklenmez — kapalı zarfla bölüm sekreterliğine elden götür." |

Yeni satırlar: hocadan/siteden gelen her soru bu tabloya eklenir.

## "Hata yapma seçeneği bile olmasın" — üç teknik

Aynı sorunun bir daha sorulmamasını garanti eden üç yöntem, güçlüden zayıfa:

1. **İmkânsızlaştır (en iyi):** Yanlışın seçilemediği arayüz.
   - Unvan → serbest metin yerine kabul edilen unvanların listesi
   - Tarih → tatil/hafta sonu takvimde zaten seçilemez
   - Yanlış form → sistem staj türüne göre tek doğru formu verir, seçim yok
2. **Yerinde cevapla:** İmkânsızlaştırılamıyorsa (kaşe/mühür gibi fiziksel
   dünyada olan şeyler), cevabı işlemin yapıldığı alanın hemen yanına yaz —
   öğrenci sormaya fırsat bulamadan görsün.
3. **Kontrol listesiyle yakala (son savunma):** Gönder/yükle butonundan önce
   zorunlu onay maddeleri ("Belgede kaşe veya mühür var ✓").

Her gerçek soru için önce 1 denenır; olmuyorsa 2; o da olmuyorsa 3.
Soru yalnızca SSS'ye eklenip bırakılıyorsa tasarım pes etmiş demektir.
