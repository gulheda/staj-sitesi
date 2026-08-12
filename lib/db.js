// Node'un yerleşik SQLite modülü: harici paket ve C++ derleyici gerektirmez,
// Windows/macOS/Linux'ta ek kurulum olmadan çalışır (Node 22+).
const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const path = require("path");

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
  role TEXT NOT NULL DEFAULT 'student'
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
`);

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

// ── Tanıtım verisi: farklı aşamalarda örnek öğrenciler ──
function seed() {
  if (db.prepare("SELECT COUNT(*) c FROM users").get().c > 0) return;

  const addUser = db.prepare(
    "INSERT INTO users (ogrenci_no, tc, name, email, password_hash, role) VALUES (?,?,?,?,?,?)");
  const addApp = db.prepare(`INSERT INTO applications
    (user_id, staj_no, status, wizard_step, tur, telefon, kurum_adi, kurum_sehir, kurum_faaliyet,
     muh_ad, muh_unvan, start_date, end_date, ucret)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  addUser.run("komisyon", null, "Staj Komisyonu", "staj@ceng.balikesir.edu.tr", hash("komisyon123"), "admin");

  // Deniz: hiç başlamamış (ilk giriş TC ile)
  addUser.run("20251001234", "11111111111", "Deniz Yılmaz", "deniz@ogr.balikesir.edu.tr", null, "student");

  // Mert: başvurusu incelemede
  const mert = addUser.run("20251001111", "22222222222", "Mert Kaya", "mert@ogr.balikesir.edu.tr", hash("mert1234"), "student");
  addApp.run(mert.lastInsertRowid, 1, "submitted", 7, "yaz", "0555 111 11 11",
    "Örnek Yazılım A.Ş.", "Balıkesir", "Yazılım geliştirme",
    "Ali Kaya", "Bilgisayar Mühendisi", "2026-09-07", "2026-10-02", "hayir");

  // Ayşe: düzeltme istendi
  const ayse = addUser.run("20251002222", "33333333333", "Ayşe Demir", "ayse@ogr.balikesir.edu.tr", hash("ayse1234"), "student");
  const ayseApp = addApp.run(ayse.lastInsertRowid, 1, "fix", 7, "yaz", "0555 222 22 22",
    "Balıkesir Teknokent", "Balıkesir", "Ar-Ge",
    "Elif Yıldız", "Yazılım Mühendisi", "2026-09-07", "2026-10-02", "evet");
  db.prepare("UPDATE applications SET fix_note=? WHERE id=?").run(
    "Yüklediğin kabul belgesinde işletme kaşesi görünmüyor. Belgeyi işletmeye kaşelettikten sonra yeniden yükle.",
    ayseApp.lastInsertRowid);

  // Zeynep: stajı bitti, defter teslimi bekleniyor
  const zeynep = addUser.run("20251003333", "44444444444", "Zeynep Şahin", "zeynep@ogr.balikesir.edu.tr", hash("zeynep1234"), "student");
  const zApp = addApp.run(zeynep.lastInsertRowid, 1, "approved", 7, "yaz", "0555 333 33 33",
    "Akıllı Sistemler Ltd.", "İzmir", "Gömülü yazılım",
    "Murat Öz", "Bilgisayar Mühendisi", "2026-06-29", "2026-07-27", "hayir"); // 15 Temmuz tatili düşülünce 20 iş günü
  db.prepare("UPDATE applications SET sgk_checked=1, obs_done=1 WHERE id=?").run(zApp.lastInsertRowid);

  const addFaq = db.prepare("INSERT INTO faq (category, q, a) VALUES (?,?,?)");
  addFaq.run("Staj tarihleri", "Staj en az kaç iş günü olmalı?",
    "Bölümde toplam 40 iş günü staj yapılır: iki ayrı 20 iş günlük staj. Her staj en az 20 iş günü olmalı; hafta sonları ve resmî tatiller sayılmaz — tarih seçerken sistem senin yerine hesaplar.");
  addFaq.run("Staj defteri", "Staj defterini ne zaman teslim edeceğim?",
    "Staj bittikten sonra ilan edilen son tarihe kadar bu sistemden PDF olarak yüklersin. Stajın bittiğinde ana sayfan seni zaten teslim adımına yönlendirir.");
  addFaq.run("Staj sicil fişi", "Sicil fişini de sisteme mi yükleyeceğim?",
    "Hayır. İşyerinin fotoğraflı doldurduğu sicil fişi kapalı ve kaşeli zarf içinde bölüm sekreterliğine elden teslim edilir.");
  addFaq.run("Başvuru", "Başvurum onaylandı mı, nereden görebilirim?",
    "'Stajım' sayfasının ilk cümlesi her zaman güncel durumundur. Durum değiştiğinde ayrıca bildirim alırsın.");
  addFaq.run("Belgeler", "Kabul belgesini (EK-1) kim imzalayacak?",
    "Üst kısmını sen doldurursun; staj yapacağın kurumun yetkilisi imzalar ve kaşeler. İmza veya kaşe eksikse komisyon belgeyi geri gönderir.");
  addFaq.run("SGK işlemleri", "Sigortamı kim yapıyor, benim bir şey yapmam gerekiyor mu?",
    "Sigorta girişini üniversite yapar. Senin tek görevin staj başlamadan önce e-Devlet'ten 'SGK Tescil ve Hizmet Dökümü' sayfasından girişin yapılmış mı diye bakmak.");
  addFaq.run("Dönem içi staj", "Stajı dönem içinde yapabilir miyim?",
    "Evet — aynı toplam sürede ve haftada en az 3 gün çalışmak şartıyla dönem içinde staj yapılabilir. Başvuruda 'Dönem içinde' seçersen kurallar otomatik uygulanır.");
  addFaq.run("Staj yeri bulma", "Staj yapacağım şirkette kimin çalışması gerekiyor?",
    "Kurumda bilgisayar, yazılım veya ilgili alanda çalışan sorumlu bir mühendis bulunmalı. Emin değilsen kuruma şunu sorabilirsin: 'Staj süresince benden sorumlu olacak mühendisin unvanı nedir?'");
}

seed();

// Şema güncellemeleri: mevcut veritabanlarına eksik kolonları ekler.
try { db.exec("ALTER TABLE applications ADD COLUMN calisma_gunleri TEXT"); } catch {}
try { db.exec("ALTER TABLE applications ADD COLUMN cumartesi INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE applications ADD COLUMN yurtdisi INTEGER DEFAULT 0"); } catch {}

// Yönerge ve formlardan gelen gerçek kurallar: SSS'ye eksikse ekle.
function ensureFaq(category, q, a) {
  if (!db.prepare("SELECT id FROM faq WHERE q=?").get(q))
    db.prepare("INSERT INTO faq (category, q, a) VALUES (?,?,?)").run(category, q, a);
}
ensureFaq("Staj tarihleri", "Cumartesi günleri staj yapabilir miyim?",
  "Pazar günleri asla sayılmaz. Cumartesi çalışılması ise staj komisyonunun onayına tabidir — başvuruda 'Cumartesileri de çalışacağım' seçeneğini işaretlersen cumartesi günleri iş gününden sayılır ve komisyon bunu görerek değerlendirir.");
ensureFaq("Staj tarihleri", "Başvuruyu en geç ne zaman yapmalıyım?",
  "Kabul formunun (EK-1) staj başlangıcından en az 20 gün önce teslim edilmesi gerekir. Sistem bugünden itibaren en erken başlayabileceğin tarihi otomatik hesaplar; daha erken bir tarih seçmene izin vermez.");
ensureFaq("Staj tarihleri", "Toplamda kaç gün staj yapacağım?",
  "Bilgisayar Mühendisliğinde Staj-I (20 iş günü) ve Staj-II (20 iş günü) olmak üzere toplam 40 iş günü staj yapılır. Yönergeye göre toplam süre en az 40, en çok 60 iş günüdür.");
ensureFaq("Belgeler", "Kamu kurumunda staj yapacağım, EK-2 formu gerekiyor mu?",
  "Hayır. Ücret katkısı formu (EK-2) kamu kurum ve kuruluşlarında staj yapan öğrenciler için doldurulmaz. Sistem, kurum türünü ve ücret cevabını dikkate alarak bu formu yalnızca gerektiğinde ister.");
ensureFaq("Staj defteri", "Staj defterini bilgisayarda yazabilir miyim?",
  "Hayır — yönerge gereği defter mürekkepli kalemle, okunaklı el yazısıyla ve mesleki terminolojiye dikkat edilerek yazılır. Her sayfa staj yaptığın işyerinin yetkilisine onaylatılır.");
ensureFaq("Yurt dışı stajı", "Yurt dışında staj yapabilir miyim?",
  "Evet, ancak yurt dışı stajında SGK sigortanı üniversite yapamaz — kendi imkânlarınla yaptırman gerekir. Başvuruda kurumun yurt dışında olduğunu işaretlersen sistem seni bilgilendirir.");
ensureFaq("Staj sicil fişi", "Sicil fişinde ne değerlendiriliyor?",
  "İşyerindeki amirin seni beş konuda A(Pekiyi)–D(Başarısız) ölçeğinde değerlendirir: devam durumu, sorumluluk duygusu, işi vaktinde ve tam yapma, grup çalışmasına yatkınlık ve kendini geliştirme isteği. Form gizlidir; kapalı-kaşeli zarfla bölüme elden teslim edilir ve komisyon kabul/red kararında kullanır.");
ensureFaq("SGK işlemleri", "İki stajı peş peşe yapabilir miyim?",
  "1. stajın SGK çıkışı yapılmadan sonraki stajın için yeni sigorta girişi yapılamaz. Stajlarını art arda planlıyorsan aralarında SGK çıkış-giriş işlemi için zaman bırak; komisyon tarihlerini buna göre değerlendirir.");
ensureFaq("SGK işlemleri", "Sigorta primimi kim ödüyor?",
  "Yurt içi stajlarda, staj yapacağın gün sayısı kadar SGK primi 6111 ve 5510 sayılı yasalar gereği Fakülte tarafından yatırılır. Senin tek görevin staj başlamadan girişin yapılmış mı diye e-Devlet'ten bakmak.");

// Sonradan eklenen demo kullanıcılar: mevcut veritabanını bozmadan,
// eksikse ekler (git pull + yeniden başlatma yeterli olsun diye).
function ensureUser(no, tc, name, email) {
  if (!db.prepare("SELECT id FROM users WHERE ogrenci_no=?").get(no)) {
    db.prepare("INSERT INTO users (ogrenci_no, tc, name, email, password_hash, role) VALUES (?,?,?,?,NULL,'student')")
      .run(no, tc, name, email);
  }
}
// Elif: hiç başvurusu olmayan, sürece sıfırdan başlayacak öğrenci.
ensureUser("20251004444", "55555555555", "Elif Aydın", "elif@ogr.balikesir.edu.tr");

// ── Eksiksiz öğrenci veri seti ──
// Gerçekçi bir dönem görüntüsü: her aşamadan öğrenciler. Tümü eksikse eklenir;
// ortak şifre: ogrenci123 (pilot tanıtımı için).
function seedStudents() {
  if (db.prepare("SELECT COUNT(*) c FROM users WHERE role='student'").get().c >= 20) return;
  const pw = hash("ogrenci123");
  const addU = db.prepare("INSERT INTO users (ogrenci_no, tc, name, email, password_hash, role) VALUES (?,?,?,?,?,'student')");
  const addA = db.prepare(`INSERT INTO applications
    (user_id, staj_no, status, wizard_step, tur, telefon, kurum_adi, kurum_sehir, kurum_faaliyet,
     muh_ad, muh_unvan, start_date, end_date, ucret, cumartesi, sgk_checked, obs_done, fix_note, calisma_gunleri)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const FIRMS = [
    ["Balıkesir Teknokent Yazılım", "Balıkesir", "Yazılım geliştirme"],
    ["Ege Bilişim A.Ş.", "İzmir", "Kurumsal yazılım"],
    ["Marmara Veri Sistemleri", "Bursa", "Veri analitiği"],
    ["Anadolu Gömülü Teknolojiler", "Eskişehir", "Gömülü sistemler"],
    ["Kuzey Yazılım Ltd.", "İstanbul", "Web teknolojileri"],
    ["Aksa Otomasyon", "Balıkesir", "Endüstriyel otomasyon"],
    ["Delta Siber Güvenlik", "Ankara", "Siber güvenlik"],
    ["Simya Oyun Stüdyosu", "İstanbul", "Oyun geliştirme"],
  ];
  const ENG = [["Ali Kaya", "Bilgisayar Mühendisi"], ["Elif Yıldız", "Yazılım Mühendisi"],
    ["Murat Öz", "Bilgisayar Mühendisi"], ["Seda Acar", "Yazılım Mühendisi"]];
  // [no, ad, durum, staj_no, tur, start, end, ekstra]
  const ROWS = [
    ["20221001001", "Yusuf Arslan",  "submitted",  1, "yaz", "2026-09-07", "2026-10-02", {}],
    ["20221001002", "Merve Çetin",   "submitted",  1, "yaz", "2026-09-14", "2026-10-09", {}],
    ["20221001003", "Emre Doğan",    "submitted",  2, "yaz", "2026-09-07", "2026-10-02", {}],
    ["20221001004", "Zehra Kurt",    "fix",        1, "yaz", "2026-09-21", "2026-10-16", { fix: "Yüklediğin kabul belgesinde işletme kaşesi görünmüyor. Belgeyi işletmeye kaşelettikten sonra yeniden yükle." }],
    ["20221001005", "Kaan Yılmaz",   "fix",        1, "yaz", "2026-09-21", "2026-10-16", { fix: "Yanlış belge yüklenmiş görünüyor. İşletmenin imzaladığı staj kabul belgesini (EK-1) yüklemelisin." }],
    ["20221001006", "İrem Şen",      "approved",   1, "yaz", "2026-09-07", "2026-10-02", {}],
    ["20221001007", "Burak Aydın",   "approved",   2, "yaz", "2026-08-24", "2026-09-18", { sgk: 1 }],
    ["20221001008", "Selin Koç",     "approved",   1, "yaz", "2026-08-24", "2026-09-18", { sgk: 1, obs: 1 }],
    ["20221001009", "Mehmet Ergin",  "approved",   1, "yaz", "2026-07-27", "2026-08-21", { sgk: 1, obs: 1 }],   // stajı sürüyor
    ["20221001010", "Aylin Tan",     "approved",   2, "yaz", "2026-07-20", "2026-08-14", { sgk: 1, obs: 1 }],   // son günleri
    ["20221001011", "Onur Bulut",    "approved",   1, "donem", "2026-10-05", "2026-11-27", { sgk: 1, obs: 1, gun: "1,3,5" }],
    ["20221001012", "Gizem Ak",      "approved",   1, "yaz", "2026-06-22", "2026-07-20", { sgk: 1, obs: 1 }],   // bitti, teslim bekliyor
    ["20221001013", "Tolga Erdem",   "approved",   2, "yaz", "2026-06-22", "2026-07-20", { sgk: 1, obs: 1 }],
    ["20221001014", "Naz Güler",     "evaluating", 1, "yaz", "2026-06-15", "2026-07-13", { sgk: 1, obs: 1, sicil: 1 }],
    ["20221001015", "Cem Aksoy",     "evaluating", 2, "yaz", "2026-06-15", "2026-07-13", { sgk: 1, obs: 1 }],
    ["20221001016", "Deren Işık",    "fix_defter", 1, "yaz", "2026-06-15", "2026-07-13", { sgk: 1, obs: 1, fix: "Defterinde 3 ve 4 Temmuz günlerinin sayfaları eksik. Her staj günü için ayrı sayfa olacak şekilde tamamlayıp yeniden yükle." }],
    ["20221001017", "Baran Ünal",    "accepted",   1, "yaz", "2026-06-15", "2026-07-13", { sgk: 1, obs: 1, sicil: 1 }],
    ["20221001018", "Ceyda Polat",   "accepted",   2, "yaz", "2026-06-15", "2026-07-13", { sgk: 1, obs: 1, sicil: 1 }],
  ];
  ROWS.forEach(([no, ad, durum, stajNo, tur, start, end, x], i) => {
    if (db.prepare("SELECT id FROM users WHERE ogrenci_no=?").get(no)) return;
    const mail = ad.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) + "@ogr.balikesir.edu.tr";
    const u = addU.run(no, String(10000000000 + i * 137), ad, mail, pw);
    const [f, sehir, alan] = FIRMS[i % FIRMS.length];
    const [mAd, mUnvan] = ENG[i % ENG.length];
    const a = addA.run(u.lastInsertRowid, stajNo, durum, 7, tur, "0555 000 00 " + String(10 + i),
      f, sehir, alan, mAd, mUnvan, start, end, i % 3 === 0 ? "evet" : "hayir",
      0, x.sgk || 0, x.obs || 0, x.fix || null, x.gun || null);
    if (x.sicil) db.prepare("UPDATE applications SET sicil_delivered=1 WHERE id=?").run(a.lastInsertRowid);
  });
}
seedStudents();

module.exports = { db, hash, verify, notify };
