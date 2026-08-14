// Node'un yerleşik SQLite modülü: harici paket ve C++ derleyici gerektirmez,
// Windows/macOS/Linux'ta ek kurulum olmadan çalışır (Node 22+).
const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const db = new DatabaseSync(path.join(__dirname, "..", "staj.db"));
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  ogrenci_no TEXT UNIQUE NOT NULL,
  tc TEXT,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  sinif INTEGER DEFAULT 3
);
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  staj_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  wizard_step INTEGER NOT NULL DEFAULT 1,
  tur TEXT, telefon TEXT,
  kurum_adi TEXT, kurum_sehir TEXT, kurum_faaliyet TEXT,
  muh_ad TEXT, muh_unvan TEXT,
  start_date TEXT, end_date TEXT, ucret TEXT,
  calisma_gunleri TEXT,
  cumartesi INTEGER DEFAULT 0,
  yurtdisi INTEGER DEFAULT 0,
  sgk_checked INTEGER DEFAULT 0,
  obs_done INTEGER DEFAULT 0,
  sicil_delivered INTEGER DEFAULT 0,
  sicil_confirmed INTEGER DEFAULT 0,
  fix_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  kind TEXT NOT NULL,               -- 'kabul' | 'defter'
  filename TEXT NOT NULL,
  orig_name TEXT,
  uploaded_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  answer TEXT,
  answered_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS faq (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  q TEXT NOT NULL,
  a TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  seen INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Eski veritabanlarından yükseltme: eksik kolonları ekle.
try { db.exec("ALTER TABLE applications ADD COLUMN calisma_gunleri TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN sinif INTEGER DEFAULT 3"); } catch {}
try { db.exec("ALTER TABLE applications ADD COLUMN cumartesi INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE applications ADD COLUMN yurtdisi INTEGER DEFAULT 0"); } catch {}

function hash(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + crypto.scryptSync(pw, salt, 32).toString("hex");
}
function verify(pw, stored) {
  if (!stored) return false;
  const [salt, h] = stored.split(":");
  const calc = crypto.scryptSync(pw, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(calc, "hex"));
}
function notify(userId, text) {
  db.prepare("INSERT INTO notifications (user_id, text) VALUES (?, ?)").run(userId, text);
}

// Komisyon hesabı her koşulda vardır (canlıda ilk iş: şifresini değiştirmek).
if (!db.prepare("SELECT id FROM users WHERE ogrenci_no='komisyon'").get()) {
  db.prepare("INSERT INTO users (ogrenci_no, tc, name, email, password_hash, role) VALUES (?,?,?,?,?,'admin')")
    .run("komisyon", null, "Staj Komisyonu", "staj@ceng.balikesir.edu.tr", hash("komisyon123"));
}

// ── SSS: gerçek yönerge, form ve bölüm duyurularından derlenen cevaplar ──
function ensureFaq(category, q, a) {
  if (!db.prepare("SELECT id FROM faq WHERE q=?").get(q))
    db.prepare("INSERT INTO faq (category, q, a) VALUES (?,?,?)").run(category, q, a);
}
ensureFaq("Staj tarihleri", "Staj en az kaç iş günü olmalı?",
  "Bölümde toplam 40 iş günü staj yapılır: Staj-I (20 iş günü) ve Staj-II (20 iş günü). Hafta sonları ve resmî tatiller sayılmaz — tarih seçerken sistem senin yerine hesaplar.");
ensureFaq("Staj tarihleri", "Cumartesi günleri staj yapabilir miyim?",
  "Pazar günleri asla sayılmaz. Cumartesi çalışılması staj komisyonunun onayına tabidir — başvuruda 'Cumartesileri de çalışacağım' seçeneğini işaretlersen cumartesi günleri iş gününden sayılır ve komisyon bunu görerek değerlendirir.");
ensureFaq("Staj tarihleri", "Başvuruyu en geç ne zaman yapmalıyım?",
  "Kabul formunun (EK-1) staj başlangıcından en az 20 gün önce teslim edilmesi gerekir. Sistem bugünden itibaren en erken başlayabileceğin tarihi otomatik hesaplar; daha erken bir tarih seçmene izin vermez.");
ensureFaq("Başvuru", "Staj başvurusu ne zaman yapılır?",
  "Yaz dönemi staj başvuruları 1 Haziran – 15 Temmuz tarihleri arasında kabul edilir. Dönem içi staj başvuruları her ayın 10. gününe kadar (10. gün dâhil) yapılmalıdır.");
ensureFaq("Başvuru", "Başvurum onaylandı mı, nereden görebilirim?",
  "'Stajım' sayfasının ilk cümlesi her zaman güncel durumundur. Durum değiştiğinde ayrıca bildirim alırsın; sayfa açıkken kendini yeniler.");
ensureFaq("Başvuru", "Aynı anda iki staj başvurusu yapabilir miyim?",
  "3. ve 4. sınıf öğrencileri iki stajı aynı dönemde yapabilir; iki başvuruyu aynı anda açıp ayrı ayrı yürütebilirsin (tarihleri çakışamaz). 2. sınıf öğrencileri aynı anda tek başvuru yapabilir.");
ensureFaq("Belgeler", "Kabul belgesini (EK-1) kim imzalayacak?",
  "Üst kısmını sen doldurursun; staj yapacağın kurumun yetkilisi imzalar ve kaşeler. İmza veya kaşe eksikse komisyon belgeyi geri gönderir.");
ensureFaq("Belgeler", "Kamu kurumunda staj yapacağım, EK-2 formu gerekiyor mu?",
  "Hayır. Ücret katkısı formu (EK-2) kamu kurum ve kuruluşlarında staj yapan öğrenciler için doldurulmaz.");
ensureFaq("Staj defteri", "Staj defterini ne zaman teslim edeceğim?",
  "Staj bittikten sonra ilan edilen son tarihe kadar bu sistemden PDF olarak yüklersin. Stajın bittiğinde ana sayfan seni zaten teslim adımına yönlendirir.");
ensureFaq("Staj defteri", "Staj defterini bilgisayarda yazabilir miyim?",
  "Hayır — yönerge gereği defter mürekkepli kalemle, okunaklı el yazısıyla ve mesleki terminolojiye dikkat edilerek yazılır. Her sayfa staj yaptığın işyerinin yetkilisine onaylatılır.");
ensureFaq("Staj sicil fişi", "Sicil fişini de sisteme mi yükleyeceğim?",
  "Hayır. İşyerinin fotoğraflı doldurduğu sicil fişi kapalı ve kaşeli zarf içinde bölüm sekreterliğine elden teslim edilir.");
ensureFaq("Staj sicil fişi", "Sicil fişinde ne değerlendiriliyor?",
  "İşyerindeki amirin seni beş konuda A(Pekiyi)–D(Başarısız) ölçeğinde değerlendirir: devam durumu, sorumluluk duygusu, işi vaktinde ve tam yapma, grup çalışmasına yatkınlık ve kendini geliştirme isteği. Form gizlidir.");
ensureFaq("Vlog", "Vlog nasıl olmalı?",
  "Toplam en az 10 dakikalık, işyerinde çekilmiş kısa videolardan oluşmalı: yaptığın işler, deneyimlerin ve çalışma ortamın. Stajın ilk, orta ve son günlerinden bölümler içermeli — son gün birkaç fotoğrafla olmaz. İşyerinin izin verdiği bölümlerde çek; online stajda ekran görüntünün canlı aktığı video parçaları da olur. Videoyu YouTube gibi bir platforma yükleyip bağlantısını hem link hem QR kod olarak defterin son sayfasına ekle.");
ensureFaq("SGK işlemleri", "Sigortamı kim yapıyor, benim bir şey yapmam gerekiyor mu?",
  "Yurt içi stajlarda SGK primlerini Fakülte yatırır. Senin tek görevin staj başlamadan önce e-Devlet'ten 'SGK Tescil ve Hizmet Dökümü' sayfasından girişin yapılmış mı diye bakmak.");
ensureFaq("SGK işlemleri", "İki stajı peş peşe yapabilir miyim?",
  "1. stajın SGK çıkışı yapılmadan sonraki stajın için yeni sigorta girişi yapılamaz. Stajlarını art arda planlıyorsan aralarında SGK çıkış-giriş işlemi için zaman bırak.");
ensureFaq("SGK işlemleri", "SGK işlemleriyle ilgili kime ulaşabilirim?",
  "Sigorta (SGK) işlemleri hakkında bilgi almak için mfstaj@balikesir.edu.tr adresine yazabilirsin.");
ensureFaq("Dönem içi staj", "Stajı dönem içinde yapabilir miyim?",
  "Evet — aynı toplam sürede ve haftada en az 3 gün çalışmak şartıyla dönem içinde staj yapılabilir. Başvuruda 'Dönem içinde' seçersen kurallar otomatik uygulanır ve doğru form (EK-1A) verilir.");
ensureFaq("Yurt dışı stajı", "Yurt dışında staj yapabilir miyim?",
  "Evet, ancak yurt dışı stajında SGK sigortanı üniversite yapamaz — kendi imkânlarınla yaptırman gerekir. Başvuruda kurumun yurt dışında olduğunu işaretlersen sistem seni bilgilendirir.");
ensureFaq("Staj yeri bulma", "Staj yapacağım şirkette kimin çalışması gerekiyor?",
  "Kurumda bilgisayar, yazılım veya ilgili alanda çalışan sorumlu bir mühendis bulunmalı. Emin değilsen kuruma şunu sorabilirsin: 'Staj süresince benden sorumlu olacak mühendisin unvanı nedir?'");

/* ═══════════════════════════════════════════════════════════════════
   DEMO VERİ SETİ — her senaryodan bir öğrenci.
   Canlıda DEMO_VERI=0 ile hiçbiri oluşturulmaz.
   Şifreli hesapların tümü: ogrenci123
   Şifresiz (ilk giriş) hesaplar TC ile girer.
   ═══════════════════════════════════════════════════════════════════ */
const DEMO = process.env.DEMO_VERI !== "0";

function demoVerisiKur() {
  if (!DEMO) return;
  if (db.prepare("SELECT COUNT(*) c FROM users WHERE role='student'").get().c > 0) return;

  // Komisyonun indirebileceği örnek dosyalar
  const upDir = path.join(__dirname, "..", "uploads");
  fs.mkdirSync(upDir, { recursive: true });
  const miniPdf = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\n%%EOF");
  fs.writeFileSync(path.join(upDir, "demo-kabul-belgesi.pdf"), miniPdf);
  fs.writeFileSync(path.join(upDir, "demo-staj-defteri.pdf"), miniPdf);

  const pw = hash("ogrenci123");
  const addU = db.prepare(
    "INSERT INTO users (ogrenci_no, tc, name, email, password_hash, role, sinif) VALUES (?,?,?,?,?,'student',?)");
  const addA = db.prepare(`INSERT INTO applications
    (user_id, staj_no, status, wizard_step, tur, telefon, kurum_adi, kurum_sehir, kurum_faaliyet,
     muh_ad, muh_unvan, start_date, end_date, ucret, calisma_gunleri, cumartesi, yurtdisi,
     sgk_checked, obs_done, sicil_delivered, fix_note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const addDoc = db.prepare(
    "INSERT INTO documents (application_id, kind, filename, orig_name) VALUES (?,?,?,?)");
  const addQ = db.prepare("INSERT INTO questions (user_id, text) VALUES (?,?)");

  let tcSay = 10000000146;
  const user = (no, ad, sinif, ilkGiris) =>
    ({ id: addU.run(no, String(tcSay += 101), ad,
        ad.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + "@ogr.balikesir.edu.tr",
        ilkGiris ? null : pw, sinif).lastInsertRowid, no });

  // app(): varsayılanları doldurup başvuru oluşturur, belge ekler
  function app(u, o) {
    const r = addA.run(u.id, o.stajNo ?? 1, o.durum, 6, o.tur ?? "yaz", "0555 000 00 01",
      o.kurum ?? "Balıkesir Teknokent Yazılım", o.sehir ?? "Balıkesir", o.alan ?? "Yazılım geliştirme",
      o.muh ?? "Ali Kaya", o.unvan ?? "Bilgisayar Mühendisi",
      o.s ?? null, o.e ?? null, o.ucret ?? "hayir", o.gunler ?? null,
      o.cumartesi ?? 0, o.yurtdisi ?? 0, o.sgk ?? 0, o.obs ?? 0, o.sicil ?? 0, o.not ?? null);
    const id = r.lastInsertRowid;
    if (!["draft"].includes(o.durum))
      addDoc.run(id, "kabul", "demo-kabul-belgesi.pdf", "kabul_belgesi.pdf");
    if (["evaluating", "fix_defter", "accepted"].includes(o.durum))
      addDoc.run(id, "defter", "demo-staj-defteri.pdf", "staj_defteri.pdf");
    return id;
  }

  /* ── A. İlk giriş deneyimi (şifresiz — TC ile girilir) ── */
  user("20241001001", "Elif Aydın", 3, true);       // TC: 10000000247
  user("20241001002", "Yağmur Kaya", 3, true);      // TC: 10000000348
  user("20241001003", "Arda Demirtaş", 3, true);    // TC: 10000000449
  user("20241001004", "Mira Erdoğan", 2, true);     // 2. SINIF + ilk giriş — TC: 10000000550

  /* ── B. Başvuru öncesi / başvuru aşamaları ── */
  // Giriş yapmış, henüz staj yeri yok
  user("20241001005", "Deniz Yılmaz", 3);
  // Taslak: sihirbazı 3. adımda bırakmış
  const zeynep = user("20241001006", "Zeynep Şahin", 3);
  db.prepare(`INSERT INTO applications (user_id, staj_no, status, wizard_step, tur, telefon, kurum_adi, kurum_sehir, kurum_faaliyet)
    VALUES (?,1,'draft',3,'yaz','0555 000 00 06','Ege Bilişim A.Ş.','İzmir','Kurumsal yazılım')`).run(zeynep.id);
  // İncelemede
  const mert = user("20241001007", "Mert Kaya", 3);
  app(mert, { durum: "submitted", s: "2026-09-07", e: "2026-10-02" });
  // Düzeltme istenmiş
  const ayse = user("20241001008", "Ayşe Demir", 3);
  app(ayse, { durum: "fix", s: "2026-09-21", e: "2026-10-16", ucret: "evet",
    kurum: "Marmara Veri Sistemleri", sehir: "Bursa", alan: "Veri analitiği / Yapay zekâ",
    not: "Yüklediğin kabul belgesinde işletme kaşesi görünmüyor. Belgeyi işletmeye kaşelettikten sonra yeniden yükle." });
  notify(ayse.id, "Yüklediğin kabul belgesinde işletme kaşesi görünmüyor. Belgeyi işletmeye kaşelettikten sonra yeniden yükle.");
  // Reddedilmiş (yeni başvuru açabilir)
  const tolga = user("20241001019", "Tolga Erdem", 3);
  app(tolga, { durum: "rejected", s: "2026-09-07", e: "2026-10-02", kurum: "X Reklam Ajansı",
    alan: "Reklamcılık", not: "Kurumda bilgisayar/yazılım alanında sorumlu mühendis bulunmadığı için staj yeri uygun görülmedi. Uygun bir kurum bulup yeniden başvurabilirsin." });

  /* ── C. Onay sonrası aşamalar ── */
  // SGK kontrolü bekliyor
  const emre = user("20241001009", "Emre Doğan", 3);
  app(emre, { durum: "approved", s: "2026-09-07", e: "2026-10-02" });
  notify(emre.id, "Başvurun onaylandı ✓ Staj başlamadan önce SGK kontrolünü unutma.");
  // OBS kaydı bekliyor
  const selin = user("20241001010", "Selin Koç", 3);
  app(selin, { durum: "approved", s: "2026-09-07", e: "2026-10-02", sgk: 1,
    kurum: "Delta Siber Güvenlik", sehir: "Ankara", alan: "Siber güvenlik" });
  // Staja hazır (her şey tamam, başlangıç yaklaşıyor)
  const burak = user("20241001011", "Burak Aydın", 3);
  app(burak, { durum: "approved", s: "2026-08-24", e: "2026-09-18", sgk: 1, obs: 1,
    kurum: "Simya Oyun Stüdyosu", sehir: "İstanbul", alan: "Oyun geliştirme" });
  // Stajı şu an devam ediyor
  const mehmet = user("20241001012", "Mehmet Ergin", 3);
  app(mehmet, { durum: "approved", s: "2026-07-27", e: "2026-08-21", sgk: 1, obs: 1,
    kurum: "Anadolu Gömülü Teknolojiler", sehir: "Eskişehir", alan: "Gömülü sistemler / IoT" });
  // Stajı bitti — defter teslimi bekliyor
  const gizem = user("20241001013", "Gizem Ak", 3);
  app(gizem, { durum: "approved", s: "2026-06-22", e: "2026-07-20", sgk: 1, obs: 1,
    kurum: "Kuzey Yazılım Ltd.", sehir: "İstanbul", alan: "Web teknolojileri" });

  /* ── D. Teslim ve değerlendirme ── */
  // Defter değerlendirmede + sicil zarfı teslim edilmiş (komisyon onayı bekliyor)
  const naz = user("20241001014", "Naz Güler", 3);
  app(naz, { durum: "evaluating", s: "2026-06-15", e: "2026-07-13", sgk: 1, obs: 1, sicil: 1 });
  // Defter değerlendirmede, sicil fişi henüz getirilmemiş (uyarı görünür)
  const cem = user("20241001015", "Cem Aksoy", 3);
  app(cem, { durum: "evaluating", s: "2026-06-15", e: "2026-07-13", sgk: 1, obs: 1,
    kurum: "Aksa Otomasyon", alan: "Endüstriyel otomasyon" });
  // Defterde düzeltme istenmiş
  const deren = user("20241001016", "Deren Işık", 3);
  app(deren, { durum: "fix_defter", s: "2026-06-15", e: "2026-07-13", sgk: 1, obs: 1,
    not: "Defterinde 3 ve 6 Temmuz günlerinin sayfaları eksik. Her staj günü için ayrı sayfa olacak şekilde tamamlayıp yeniden yükle." });
  notify(deren.id, "Defterinde 3 ve 6 Temmuz günlerinin sayfaları eksik. Tamamlayıp yeniden yükle.");

  /* ── E. Kabul ve çoklu staj senaryoları ── */
  // 1. stajı kabul edilmiş → 2. staj açabilir
  const baran = user("20241001017", "Baran Ünal", 3);
  app(baran, { durum: "accepted", s: "2026-06-15", e: "2026-07-13", sgk: 1, obs: 1, sicil: 1 });
  notify(baran.id, "Tebrikler — 1. stajın kabul edildi 🎉");
  // İki stajı AYNI ANDA yürüyen: staj1 devam ediyor, staj2 incelemede
  const ceyda = user("20241001018", "Ceyda Polat", 4);
  app(ceyda, { durum: "approved", s: "2026-07-27", e: "2026-08-21", sgk: 1, obs: 1 });
  app(ceyda, { stajNo: 2, durum: "submitted", s: "2026-10-05", e: "2026-11-02",
    kurum: "Ege Bilişim A.Ş.", sehir: "İzmir", alan: "Kurumsal yazılım" });
  // Her iki stajı da kabul edilmiş (süreci tamamen bitirmiş)
  const kaan = user("20241001023", "Kaan Yılmaz", 4);
  app(kaan, { durum: "accepted", s: "2025-06-16", e: "2025-07-11", sgk: 1, obs: 1, sicil: 1 });
  app(kaan, { stajNo: 2, durum: "accepted", s: "2026-06-15", e: "2026-07-13", sgk: 1, obs: 1, sicil: 1 });

  /* ── F. Özel kurallar ── */
  // Dönem içi staj (Pzt-Çar-Cum), onaylı — SGK aşamasında
  const irem = user("20241001020", "İrem Şen", 3);
  app(irem, { durum: "approved", tur: "donem", gunler: "1,3,5", s: "2026-10-05", e: "2026-11-18" });
  // Cumartesi dahil yaz stajı, incelemede
  const onur = user("20241001021", "Onur Bulut", 3);
  app(onur, { durum: "submitted", s: "2026-09-07", e: "2026-09-29", cumartesi: 1 });
  // Yurt dışı stajı, incelemede (SGK öğrencide)
  const aylin = user("20241001022", "Aylin Tan", 3);
  app(aylin, { durum: "submitted", s: "2026-09-14", e: "2026-10-09", yurtdisi: 1,
    kurum: "Berlin Tech GmbH", sehir: "Berlin, Almanya", alan: "Veri analitiği / Yapay zekâ" });
  // 2. sınıf, tek başvuru hakkını kullanmış (limit dolu)
  const ece = user("20241001024", "Ece Kara", 2);
  app(ece, { durum: "submitted", s: "2026-09-07", e: "2026-10-02" });

  /* ── G. Komisyon kuyruğuna cevapsız sorular ── */
  addQ.run(gizem.id, "Stajımı ikiye bölerek iki farklı şirkette 10'ar gün yapabilir miyim?");
  addQ.run(mehmet.id, "Defterde bir günün sayfasını yanlış yazdım, karalayabilir miyim yoksa sayfayı yeniden mi yazmalıyım?");
}

demoVerisiKur();

// İlk giriş deneyimi için yedek hesaplar: mevcut veritabanına dokunmadan,
// eksik olan varsa ekler (biri denemede "harcanınca" diğerine geçilir).
if (DEMO) {
  const taze = [
    ["20241001025", "20000000101", "Ela Yıldırım", 3],
    ["20241001026", "20000000202", "Rüzgar Koçak", 3],
    ["20241001027", "20000000303", "Lina Avcı", 3],
    ["20241001028", "20000000404", "Aras Güneş", 3],
    ["20241001029", "20000000505", "Masal Tekin", 3],
    ["20241001030", "20000000606", "Umut Bozkurt", 3],
    ["20241001031", "20000000707", "Deniz Aydemir", 3],
    ["20241001032", "20000000808", "Selin Çakır", 4],
    ["20241001033", "20000000909", "Kerem Baş", 3],
  ];
  for (const [no, tc, ad, sinif] of taze) {
    if (!db.prepare("SELECT id FROM users WHERE ogrenci_no=?").get(no)) {
      db.prepare("INSERT INTO users (ogrenci_no, tc, name, email, password_hash, role, sinif) VALUES (?,?,?,?,NULL,'student',?)")
        .run(no, tc, ad, ad.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + "@ogr.balikesir.edu.tr", sinif);
    }
  }
}

module.exports = { db, hash, verify, notify };
