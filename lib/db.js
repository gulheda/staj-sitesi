const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "staj.db"));
db.pragma("journal_mode = WAL");

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
    "Murat Öz", "Bilgisayar Mühendisi", "2026-06-29", "2026-07-24", "hayir");
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

module.exports = { db, hash, verify, notify };
