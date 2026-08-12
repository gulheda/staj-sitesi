const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { db, hash, verify, notify } = require("./lib/db");
const { checkDates, countWorkdays, trDate } = require("./lib/dates");

// Dönem içi stajda öğrencinin seçtiği günler ("1,3,5") hesaba katılır.
const allowedDaysOf = (appRow) =>
  appRow?.tur === "donem" && appRow.calisma_gunleri
    ? appRow.calisma_gunleri.split(",").map(Number).filter(n => n >= 1 && n <= 5)
    : null;

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Oturum: httpOnly çerez + bellek içi tablo ──
const sessions = new Map();
function setSession(res, userId) {
  const sid = crypto.randomBytes(24).toString("hex");
  sessions.set(sid, userId);
  res.setHeader("Set-Cookie", `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`);
}
function getUser(req) {
  const sid = (req.headers.cookie || "").split(";").map(s => s.trim())
    .find(s => s.startsWith("sid="))?.slice(4);
  const id = sid && sessions.get(sid);
  return id ? db.prepare("SELECT * FROM users WHERE id=?").get(id) : null;
}
function auth(role) {
  return (req, res, next) => {
    const u = getUser(req);
    if (!u) return res.status(401).json({ error: "Oturum bulunamadı. Yeniden giriş yap." });
    if (role && u.role !== role) return res.status(403).json({ error: "Bu işlem için yetkin yok." });
    req.user = u;
    next();
  };
}

// ── Dosya yükleme: tür ve boyut denetimi yüklemeden önce ──
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, Date.now() + "-" + crypto.randomBytes(4).toString("hex") + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [".pdf", ".jpg", ".jpeg", ".png"].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Bu alana PDF veya fotoğraf (JPG, PNG) yükleyebilirsin."), ok);
  },
});

const today = () => new Date().toISOString().slice(0, 10);

// Öğrencinin süreçteki aşaması veriden türetilir; öğrenciye asla sorulmaz.
function deriveStage(appRow) {
  if (!appRow) return "noplace";
  const s = appRow.status;
  if (s === "draft") return "draft";
  if (s === "submitted") return "review";
  if (s === "fix") return "fix";
  if (s === "rejected") return "rejected";
  if (s === "evaluating") return "evaluating";
  if (s === "fix_defter") return "fix_defter";
  if (s === "accepted") return "accepted";
  // approved: SGK → OBS → staj → teslim
  if (!appRow.sgk_checked) return "sgk";
  if (!appRow.obs_done) return "obs";
  if (today() < appRow.start_date) return "ready";
  if (today() <= appRow.end_date) return "during";
  return "deliver";
}
const currentApp = (userId) =>
  db.prepare("SELECT * FROM applications WHERE user_id=? ORDER BY id DESC LIMIT 1").get(userId);

// ─────────── Kimlik ───────────
app.post("/api/login", (req, res) => {
  const { no, pass } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE ogrenci_no=?").get((no || "").trim());
  if (!u) return res.status(401).json({ error: "Bu numarayla kayıtlı öğrenci bulunamadı. Numaranı kontrol et." });
  if (!u.password_hash) {
    // İlk giriş: TC kimlik no ile kimlik doğrulama, ardından şifre oluşturma.
    if ((pass || "").trim() !== u.tc)
      return res.status(401).json({ error: "İlk girişte şifre alanına TC kimlik numaranı yazmalısın." });
    setSession(res, u.id);
    return res.json({ firstLogin: true, name: u.name });
  }
  if (!verify(pass || "", u.password_hash))
    return res.status(401).json({ error: "Şifre yanlış. Unuttuysan 'Şifremi unuttum' bağlantısını kullan." });
  setSession(res, u.id);
  res.json({ ok: true, role: u.role, name: u.name });
});

app.post("/api/set-password", auth(), (req, res) => {
  const pw = (req.body.password || "").trim();
  if (pw.length < 8) return res.status(400).json({ error: "Şifren en az 8 karakter olmalı." });
  db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash(pw), req.user.id);
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  const sid = (req.headers.cookie || "").match(/sid=([a-f0-9]+)/)?.[1];
  if (sid) sessions.delete(sid);
  res.setHeader("Set-Cookie", "sid=; HttpOnly; Path=/; Max-Age=0");
  res.json({ ok: true });
});

// ─────────── Öğrenci durumu ───────────
app.get("/api/me", auth(), (req, res) => {
  const appRow = currentApp(req.user.id);
  const docs = appRow
    ? db.prepare("SELECT id, kind, orig_name, uploaded_at FROM documents WHERE application_id=?").all(appRow.id)
    : [];
  const notifications = db.prepare(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 10").all(req.user.id);
  db.prepare("UPDATE notifications SET seen=1 WHERE user_id=?").run(req.user.id);
  // İş günü ilerlemesi sunucuda hesaplanır: arayüz asla hesap yapmaz.
  let progress = null;
  if (appRow && appRow.start_date && appRow.end_date) {
    const ad = allowedDaysOf(appRow);
    progress = { total: countWorkdays(appRow.start_date, appRow.end_date, ad) };
    if (today() >= appRow.start_date)
      progress.done = countWorkdays(appRow.start_date, today() <= appRow.end_date ? today() : appRow.end_date, ad);
  }
  res.json({
    user: { name: req.user.name, no: req.user.ogrenci_no, role: req.user.role },
    stage: deriveStage(appRow),
    application: appRow || null,
    documents: docs,
    notifications,
    progress,
    today: today(),
  });
});

// ─────────── Başvuru sihirbazı (otomatik kayıt) ───────────
app.post("/api/application", auth(), (req, res) => {
  let appRow = currentApp(req.user.id);
  if (appRow && !["draft", "fix"].includes(appRow.status) && appRow.status !== "rejected")
    return res.status(400).json({ error: "Aktif bir başvurun zaten var." });
  if (!appRow || appRow.status === "rejected") {
    const stajNo = db.prepare(
      "SELECT COUNT(*) c FROM applications WHERE user_id=? AND status='accepted'").get(req.user.id).c + 1;
    const r = db.prepare("INSERT INTO applications (user_id, staj_no) VALUES (?,?)").run(req.user.id, stajNo);
    appRow = db.prepare("SELECT * FROM applications WHERE id=?").get(r.lastInsertRowid);
  }
  res.json(appRow);
});

app.patch("/api/application", auth(), (req, res) => {
  const appRow = currentApp(req.user.id);
  if (!appRow || appRow.status !== "draft")
    return res.status(400).json({ error: "Düzenlenebilir bir taslak başvurun yok." });
  const allowed = ["wizard_step", "tur", "telefon", "kurum_adi", "kurum_sehir", "kurum_faaliyet",
    "muh_ad", "muh_unvan", "start_date", "end_date", "ucret", "calisma_gunleri"];
  const sets = [], vals = [];
  for (const k of allowed) if (k in req.body) { sets.push(`${k}=?`); vals.push(req.body[k]); }
  if (sets.length) {
    vals.push(appRow.id);
    db.prepare(`UPDATE applications SET ${sets.join(",")}, updated_at=datetime('now') WHERE id=?`).run(...vals);
  }
  res.json(db.prepare("SELECT * FROM applications WHERE id=?").get(appRow.id));
});

app.post("/api/application/check-dates", auth(), (req, res) => {
  const days = Array.isArray(req.body.days) && req.body.days.length
    ? req.body.days.map(Number).filter(n => n >= 1 && n <= 5) : null;
  const allowedDays = req.body.tur === "donem" ? (days || []) : null;
  res.json(checkDates(req.body.start, req.body.end, { allowedDays }));
});

app.post("/api/application/submit", auth(), (req, res) => {
  const appRow = currentApp(req.user.id);
  if (!appRow || appRow.status !== "draft") return res.status(400).json({ error: "Gönderilecek taslak yok." });
  const missing = [];
  if (!appRow.tur) missing.push("staj türü");
  if (!appRow.kurum_adi) missing.push("kurum bilgisi");
  if (!appRow.muh_ad) missing.push("sorumlu mühendis");
  if (appRow.muh_unvan === "Bilmiyorum")
    return res.status(400).json({ error: "Sorumlu mühendisin unvanı henüz 'Bilmiyorum' olarak seçili. Kurumdan öğrenip Adım 4'te güncelledikten sonra gönderebilirsin — başvurun taslak olarak saklanıyor, acele etme." });
  if (appRow.tur === "donem" && (allowedDaysOf(appRow) || []).length < 3)
    missing.push("çalışma günleri (haftada en az 3)");
  const dateCheck = checkDates(appRow.start_date, appRow.end_date, { allowedDays: allowedDaysOf(appRow) });
  if (!dateCheck.ok) missing.push("geçerli staj tarihleri");
  const hasKabul = db.prepare(
    "SELECT COUNT(*) c FROM documents WHERE application_id=? AND kind='kabul'").get(appRow.id).c > 0;
  if (!hasKabul) missing.push("kabul belgesi (yüklenmemiş)");
  if (missing.length)
    return res.status(400).json({ error: "Başvuru gönderilemedi. Eksik: " + missing.join(", ") + "." });
  db.prepare("UPDATE applications SET status='submitted', updated_at=datetime('now') WHERE id=?").run(appRow.id);
  notify(req.user.id, "Başvurunu aldık. Komisyon inceleyecek; sonuçlanınca haber vereceğiz.");
  res.json({ ok: true });
});

// ─────────── Belgeler ───────────
app.post("/api/upload/:kind", auth(), (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE"
        ? "Dosyan 10 MB sınırını aşıyor. Tarama çözünürlüğünü düşürüp tekrar dene."
        : err.message;
      return res.status(400).json({ error: msg });
    }
    const kind = req.params.kind;
    if (!["kabul", "defter"].includes(kind)) return res.status(400).json({ error: "Bilinmeyen belge türü." });
    if (!req.file) return res.status(400).json({ error: "Dosya seçilmedi." });
    const appRow = currentApp(req.user.id);
    if (!appRow) return res.status(400).json({ error: "Önce başvuru oluşturmalısın." });

    db.prepare("INSERT INTO documents (application_id, kind, filename, orig_name) VALUES (?,?,?,?)")
      .run(appRow.id, kind, req.file.filename, req.file.originalname);

    if (kind === "kabul" && appRow.status === "fix") {
      db.prepare("UPDATE applications SET status='submitted', fix_note=NULL, updated_at=datetime('now') WHERE id=?")
        .run(appRow.id);
      notify(req.user.id, "Yeni belgen komisyona iletildi. Sonuçlanınca haber vereceğiz.");
    }
    if (kind === "defter") {
      const newStatus = appRow.status === "fix_defter" ? "evaluating" : "evaluating";
      db.prepare("UPDATE applications SET status=?, fix_note=NULL, updated_at=datetime('now') WHERE id=?")
        .run(newStatus, appRow.id);
      notify(req.user.id, "Defterini aldık. Komisyon değerlendirmesi sonuçlanınca haber vereceğiz.");
    }
    res.json({ ok: true, name: req.file.originalname });
  });
});

// ─────────── Aşama işaretleri ───────────
app.post("/api/sgk", auth(), (req, res) => {
  const appRow = currentApp(req.user.id);
  if (!appRow || appRow.status !== "approved") return res.status(400).json({ error: "Bu adım şu an aktif değil." });
  if (req.body.seen) {
    db.prepare("UPDATE applications SET sgk_checked=1 WHERE id=?").run(appRow.id);
    return res.json({ ok: true });
  }
  // Öğrenci girişini göremiyor: komisyona bildir, öğrenciye ne yapacağını söyle.
  db.prepare("INSERT INTO questions (user_id, text) VALUES (?,?)").run(
    req.user.id, "[SGK] Öğrenci e-Devlet'te SGK girişini göremediğini bildirdi. Staj başlangıcı: " + appRow.start_date);
  res.json({ ok: true, reported: true });
});

app.post("/api/obs", auth(), (req, res) => {
  const appRow = currentApp(req.user.id);
  if (!appRow || !appRow.sgk_checked) return res.status(400).json({ error: "Bu adım şu an aktif değil." });
  db.prepare("UPDATE applications SET obs_done=1 WHERE id=?").run(appRow.id);
  res.json({ ok: true });
});

app.post("/api/sicil", auth(), (req, res) => {
  const appRow = currentApp(req.user.id);
  if (!appRow) return res.status(400).json({ error: "Başvuru bulunamadı." });
  db.prepare("UPDATE applications SET sicil_delivered=? WHERE id=?").run(req.body.delivered ? 1 : 0, appRow.id);
  res.json({ ok: true });
});

// ─────────── Yardım ───────────
app.get("/api/faq", auth(), (req, res) => {
  const q = (req.query.q || "").trim();
  const rows = q
    ? db.prepare("SELECT * FROM faq WHERE q LIKE ? OR a LIKE ? LIMIT 5").all(`%${q}%`, `%${q}%`)
    : db.prepare("SELECT * FROM faq ORDER BY category").all();
  res.json(rows);
});

app.post("/api/questions", auth(), (req, res) => {
  const text = (req.body.text || "").trim();
  if (text.length < 10) return res.status(400).json({ error: "Sorunu biraz daha açık yazar mısın?" });
  db.prepare("INSERT INTO questions (user_id, text) VALUES (?,?)").run(req.user.id, text);
  res.json({ ok: true });
});

app.get("/api/questions", auth(), (req, res) => {
  res.json(db.prepare("SELECT * FROM questions WHERE user_id=? ORDER BY id DESC").all(req.user.id));
});

// ─────────── Komisyon paneli ───────────
app.get("/api/admin/queue", auth("admin"), (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, u.name, u.ogrenci_no FROM applications a JOIN users u ON u.id=a.user_id
    WHERE a.status IN ('submitted','evaluating') OR (a.sicil_delivered=1 AND a.sicil_confirmed=0)
    ORDER BY a.start_date`).all();
  for (const a of apps) {
    a.documents = db.prepare("SELECT * FROM documents WHERE application_id=? ORDER BY id DESC").all(a.id);
    a.workdays = a.start_date && a.end_date
      ? countWorkdays(a.start_date, a.end_date, allowedDaysOf(a)) : null;
  }
  const questions = db.prepare(`
    SELECT q.*, u.name, u.ogrenci_no FROM questions q JOIN users u ON u.id=q.user_id
    WHERE q.answer IS NULL ORDER BY q.id`).all();
  // Başlangıcı 14 gün içinde olan onaylı stajlar: SGK/hazırlık takibi için.
  const soon = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const upcoming = db.prepare(`
    SELECT a.id, a.start_date, a.end_date, a.sgk_checked, a.obs_done, a.kurum_adi, u.name, u.ogrenci_no
    FROM applications a JOIN users u ON u.id=a.user_id
    WHERE a.status='approved' AND a.start_date BETWEEN ? AND ? ORDER BY a.start_date`).all(today(), soon);
  // Öğrenciden düzeltme beklenenler: takip listesi (işlem öğrencide).
  const waitingFix = db.prepare(`
    SELECT a.id, a.status, a.fix_note, a.updated_at, u.name, u.ogrenci_no
    FROM applications a JOIN users u ON u.id=a.user_id
    WHERE a.status IN ('fix','fix_defter') ORDER BY a.updated_at`).all();
  const stats = {
    fix: waitingFix.length,
    accepted: db.prepare("SELECT COUNT(*) c FROM applications WHERE status='accepted'").get().c,
  };
  res.json({ apps, questions, upcoming, waitingFix, stats });
});

app.post("/api/admin/app/:id/decision", auth("admin"), (req, res) => {
  const { action, note } = req.body;
  const appRow = db.prepare("SELECT * FROM applications WHERE id=?").get(req.params.id);
  if (!appRow) return res.status(404).json({ error: "Başvuru bulunamadı." });
  const map = {
    approve: ["approved", "Başvurun onaylandı ✓ Staj başlamadan önce SGK kontrolünü unutma."],
    fix: ["fix", null],
    reject: ["rejected", "Başvurun kabul edilmedi. Gerekçe için Stajım sayfana bak."],
    accept_defter: ["accepted", "Tebrikler — stajın kabul edildi 🎉"],
    fix_defter: ["fix_defter", null],
  };
  if (!map[action]) return res.status(400).json({ error: "Bilinmeyen işlem." });
  if ((action === "fix" || action === "fix_defter") && !(note || "").trim())
    return res.status(400).json({ error: "Düzeltme isterken öğrencinin anlayacağı bir açıklama yazmalısın." });
  const [status, msg] = map[action];
  db.prepare("UPDATE applications SET status=?, fix_note=?, updated_at=datetime('now') WHERE id=?")
    .run(status, note || null, appRow.id);
  notify(appRow.user_id, msg || note);
  res.json({ ok: true });
});

app.post("/api/admin/sicil/:id/confirm", auth("admin"), (req, res) => {
  db.prepare("UPDATE applications SET sicil_confirmed=1 WHERE id=?").run(req.params.id);
  const appRow = db.prepare("SELECT * FROM applications WHERE id=?").get(req.params.id);
  notify(appRow.user_id, "Sicil fişin bölüme ulaştı ✓ Bütün belgelerin tamam.");
  res.json({ ok: true });
});

app.post("/api/admin/question/:id/answer", auth("admin"), (req, res) => {
  const { answer, addToFaq, category } = req.body;
  if (!(answer || "").trim()) return res.status(400).json({ error: "Cevap boş olamaz." });
  const q = db.prepare("SELECT * FROM questions WHERE id=?").get(req.params.id);
  if (!q) return res.status(404).json({ error: "Soru bulunamadı." });
  db.prepare("UPDATE questions SET answer=?, answered_at=datetime('now') WHERE id=?").run(answer, q.id);
  notify(q.user_id, "Sorun cevaplandı: Yardım → Sorularım bölümünden görebilirsin.");
  if (addToFaq) db.prepare("INSERT INTO faq (category, q, a) VALUES (?,?,?)")
    .run(category || "Genel", q.text, answer);
  res.json({ ok: true });
});

app.get("/api/admin/file/:id", auth("admin"), (req, res) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id=?").get(req.params.id);
  if (!doc) return res.status(404).end();
  res.download(path.join(UPLOAD_DIR, doc.filename), doc.orig_name || doc.filename);
});

app.listen(PORT, () => console.log(`Staj portalı: http://localhost:${PORT}`));
