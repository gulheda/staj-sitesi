# 9. Kullanılabilirlik Testi Planı

## 9.1 Yöntem

- **Katılımcılar:** Sistemi (ve tercihen staj sürecini) daha önce hiç
  görmemiş 5–8 öğrenci. Nielsen'in kuralı gereği 5 kullanıcı, sorunların
  ~%85'ini ortaya çıkarır; 2. ve 3. sınıflardan, teknik becerisi düşük
  öğrenciler özellikle dahil edilir (ana persona onlardır).
- **Ortam:** Tıklanabilir prototip (prototype/index.html) bir bilgisayarda
  açılır; katılımcı **sesli düşünme** (think-aloud) yöntemiyle görevleri
  yapar. Yürütücü yardım etmez, yönlendirmez; yalnızca gözlemler.
- **Kayıt:** Her görev için: tamamlandı mı (yardımsız/yardımla/başarısız),
  süre, yanlış tıklamalar, duraksama anları, söylenen "acaba…?" cümleleri.
- **Değerlendirme ilkesi:** Öğrencinin takıldığı, yanlış yere tıkladığı
  veya soru sorduğu **her nokta bir tasarım problemi** olarak kaydedilir —
  asla "kullanıcı hatası" olarak değil.

## 9.2 Test görevleri

Görevler katılımcıya senaryo diliyle verilir (arayüz terimleri
kullanılmadan — "başvuru sihirbazını aç" değil, "staja başvur"):

| # | Görev senaryosu | Başarı ölçütü |
|---|---|---|
| G1 | "Yaz tatilinde staj yapmak istiyorsun. Sisteme gir ve başvuru sürecini başlat." | İlk giriş + durum seçimi + staj yeri sorusuna doğru cevapla ilerleme |
| G2 | "Staj yapacağın şirket senden kabul belgesi istiyor. Doğru belgeyi bul ve indir." | Doğru (yaz) kabul formunu bulup indirme; EK-1 adını bilmesine gerek kalmadan |
| G3 | "Stajını 6 Temmuz – 31 Temmuz arasında yapmayı planlıyorsun. Tarihleri gir." | Akıllı takvimi kullanıp iş günü geri bildirimini anlama; yetersizse önerilen tarihi kullanma |
| G4 | "Başvurunda eksik belge olup olmadığını öğren." | Durum ekranındaki açıklamayı bulma ve ne yapacağını söyleyebilme |
| G5 | "Başvurunun onaylanıp onaylanmadığını kontrol et." | Ana ekrandaki durum cümlesini gösterme (menülerde aramadan) |
| G6 | "Stajın bitti. Staj defterini sisteme teslim et." | Kontrol listesini tamamlayıp yükleme akışını bitirme |
| G7 | "Sicil fişini nasıl teslim edeceğini öğren." | "Elden, kapalı zarfla, bölüm sekreterliğine" cevabını sistemden bulma |
| G8 | "Stajı dönem içinde yapıp yapamayacağını merak ediyorsun. Cevabı bul." | SSS'de arama ile hazır cevaba ulaşma; bulamazsa soru gönderme akışına doğru geçme |

## 9.3 Görev sonrası sorular

Her görevden sonra: "Bu ekranda ne yapman gerektiğini nereden anladın?" /
"Bu işlemi yapınca ne olacağını biliyor musun?" Test sonunda SUS (System
Usability Scale) anketi uygulanır.

## 9.4 Başarı kriterleri

Tasarım ancak şu eşikleri geçerse geliştirme aşamasına ilerler:

- G1–G8 görevlerinin **yardımsız tamamlanma oranı ≥ %80**
- G5 (durum kontrolü) ve G7 (sicil fişi) görevlerinde **%100** — çünkü bu
  ikisi hocaya en çok sorulan sorulardır
- SUS puanı ≥ 75
- Hiçbir katılımcı hiçbir görevde yürütücüye soru sormak zorunda kalmamalı

Eşik geçilemeyen her görev için: sorunlu ekran belirlenir → tasarım
düzeltilir → yalnızca o görevler yeni katılımcılarla tekrar test edilir.

## 9.5 Canlıya alındıktan sonraki ölçüm

Sistem yayına girdikten sonra başarı, hocanın gerçek dertleri üzerinden
izlenir:

| Ölçüt | Kaynak |
|---|---|
| Komisyona gelen tekrar eden soru sayısı ↓ | Soru kayıtları (Seviye 3'e düşen soru sayısı) |
| Eksik/hatalı başvuru oranı ↓ | "Düzeltme bekleniyor" durumuna düşen başvuru yüzdesi |
| "Durumum ne?" sorusu ~0 | Komisyona e-posta/mesajla gelen durum soruları |
| Yanlış belge yükleme ↓ | Komisyonun "yanlış belge" şablonunu kullanma sıklığı |
| Defter geri gönderme oranı ↓ | Defter için "düzeltme istendi" yüzdesi |
| İnceleme süresi ↓ | Başvuru gönderimi → komisyon kararı arası ortalama süre |
