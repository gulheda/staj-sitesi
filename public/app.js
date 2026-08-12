/* BAÜN Staj Portalı — öğrenci arayüzü.
   Tek ilke: ekran, sunucunun bildirdiği aşamaya göre çizilir;
   öğrenciye seçenek değil, o anki tek doğru işlem gösterilir. */

let ME = null;          // /api/me cevabı
let wizardApp = null;   // sihirbazdaki taslak

const $ = (id) => document.getElementById(id);
const el = (html) => { $("app").innerHTML = html; window.scrollTo(0, 0); };

async function api(path, opts = {}) {
  if (opts.json) {
    opts.body = JSON.stringify(opts.json);
    opts.headers = { "Content-Type": "application/json" };
    delete opts.json;
  }
  const r = await fetch("/api" + path, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Bir şeyler ters gitti. Birazdan tekrar dene.");
  return data;
}

function nav(active) {
  $("topbar").style.display = "flex";
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("active", a.dataset.nav === active));
}

const STAGES = ["Staj yeri bulma", "Belgeleri hazırlama", "Başvuru", "Komisyon incelemesi", "Onay",
  "SGK kontrolü", "OBS kaydı", "Staj", "Defter hazırlama", "Teslim", "Değerlendirme", "Tamamlandı"];
const STAGE_NO = { noplace: 0, draft: 2, review: 3, fix: 3, rejected: 3, sgk: 5, obs: 6,
  ready: 6, during: 7, deliver: 9, evaluating: 10, fix_defter: 9, accepted: 12 };

function prog(now) {
  const pct = Math.round(now / STAGES.length * 100);
  return `<div class="prog">
    <div class="bar"><i style="width:${pct}%"></i></div>
    <div class="txt"><span>Adım ${now}/12 · ${STAGES[now] ?? "Bitti"}</span><span>%${pct}</span></div>
    <details><summary>Tüm adımları gör</summary><ul>
      ${STAGES.map((s, i) => `<li class="${i < now ? "done" : (i === now ? "now" : "")}">${i < now ? "✓" : (i === now ? "→" : "·")} ${s}</li>`).join("")}
    </ul></details></div>`;
}

const back = `<div class="backrow"><button class="link" onclick="go('home')">← Stajıma dön</button></div>`;
const errBox = (m) => `<div class="box err">${m}</div>`;
const fmtDate = (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
const daysTo = (s) => Math.ceil((new Date(s) - new Date(ME.today)) / 86400000);

async function refresh() { ME = await api("/me"); }

/* ───────── Giriş ───────── */
function loginScreen(msg) {
  $("topbar").style.display = "none";
  el(`
    <div style="margin-top:40px">
      <h1>BAÜN Staj</h1>
      <p class="sub">Stajınla ilgili her şey burada.</p>
      ${msg ? errBox(msg) : ""}
      <label>Öğrenci numaran</label>
      <input id="no" type="text" placeholder="20251001234" autocomplete="username">
      <label>Şifren</label>
      <input id="pw" type="password" autocomplete="current-password">
      <p class="hint">İlk kez mi giriyorsun? Şifre yerine TC kimlik numaranı yaz — sonra kendi şifreni oluşturacaksın.</p>
      <br><button class="big" onclick="doLogin()">Giriş yap</button>
      <p class="center"><button class="link" style="font-size:14px"
        onclick="alert('Pilot sürümde şifre sıfırlama bölüm sekreterliği üzerinden yapılıyor.')">Şifremi unuttum</button></p>
    </div>`);
}

async function doLogin() {
  try {
    const r = await api("/login", { method: "POST", json: { no: $("no").value, pass: $("pw").value } });
    if (r.firstLogin) return setPassScreen(r.name);
    if (r.role === "admin") { location.href = "/admin.html"; return; }
    await refresh(); go("home");
  } catch (e) { loginScreen(e.message); }
}

function setPassScreen(name, msg) {
  el(`
    <div style="margin-top:40px">
      <h1>Merhaba ${name.split(" ")[0]} 👋</h1>
      <p class="sub">Kimliğini doğruladık. Artık kendine bir şifre belirle — bundan sonra TC numaranla değil, bu şifreyle gireceksin.</p>
      ${msg ? errBox(msg) : ""}
      <label>Yeni şifren</label>
      <input id="pw1" type="password" autocomplete="new-password">
      <p class="hint">En az 8 karakter. Unutmayacağın ama tahmin edilemeyecek bir şey seç.</p>
      <br><button class="big" onclick="doSetPass()">Şifremi kaydet ve başla</button>
    </div>`);
}

async function doSetPass() {
  try {
    await api("/set-password", { method: "POST", json: { password: $("pw1").value } });
    await refresh(); go("home");
  } catch (e) { setPassScreen(ME?.user?.name || "", e.message); }
}

async function logout() { await api("/logout", { method: "POST" }); loginScreen(); }

/* ───────── Stajım (durum odaklı ana ekran) ───────── */
function home() {
  nav("home");
  const s = ME.stage, a = ME.application;
  const notifs = ME.notifications.filter(n => !n.seen).map(n => `<div class="notif">🔔 ${n.text}</div>`).join("");
  const P = prog(STAGE_NO[s] ?? 0);
  let h = "";

  if (s === "noplace") h = `${P}
    <h1>Önce staj yapacağın bir kurum bul.</h1>
    <p class="sub">Kurumda bilgisayar ya da yazılım alanında çalışan bir mühendis olmalı — tek şart bu.</p>
    <div class="box info">Emin değilsen kuruma şunu sor:<br><i>“Staj süresince benden sorumlu olacak mühendisin unvanı nedir?”</i></div>
    <button class="big" onclick="go('accept')">Kurum buldum</button>
    <p class="after">Sonraki adım: kurumun imzalayacağı belgeyi birlikte hazırlayacağız.</p>`;

  if (s === "draft") h = `${P}
    <h1>Başvurun yarım kaldı.</h1>
    <p class="sub">Bilgilerin kaydedildi — kaldığın yerden devam edebilirsin.</p>
    <button class="big" onclick="go('wizard')">Devam et (Adım ${a.wizard_step}/7)</button>`;

  if (s === "review") h = `${P}
    <h1>Başvurun inceleniyor.</h1>
    <p class="sub">Senden bir işlem beklenmiyor. Sonuçlanınca bildirimle haber vereceğiz.</p>
    <div class="box info">Başvurular genellikle 5 iş günü içinde incelenir.</div>`;

  if (s === "fix") h = `${P}
    <h1>Bir belgeyi düzeltmen gerekiyor.</h1>
    <p class="sub">Komisyonun notu:</p>
    <div class="box warn"><b>${a.fix_note || "Belgende düzeltme istendi."}</b></div>
    <div class="upload" id="up" onclick="pickFile('kabul')">Belgeyi buraya yükle: <u>dosya seç</u><br>
      <span class="muted">PDF veya fotoğraf · en fazla 10 MB</span></div>
    <p class="after">Yeni belgen doğrudan komisyona gidecek.</p>`;

  if (s === "rejected") h = `${P}
    <h1>Başvurun kabul edilmedi.</h1>
    <div class="box warn">${a.fix_note || "Gerekçe için bölümle iletişime geçebilirsin."}</div>
    <button class="big" onclick="startApplication()">Yeni başvuru yap</button>`;

  if (s === "sgk") {
    const sgkSon = new Date(new Date(a.start_date) - 3 * 86400000).toISOString().slice(0, 10);
    h = `${P}
    <h1>Başvurun onaylandı ✓</h1>
    <p class="sub">Stajın <b>${fmtDate(a.start_date)}</b> tarihinde başlıyor${daysTo(a.start_date) > 0 ? ` (${daysTo(a.start_date)} gün kaldı)` : ""}. Başlamadan önce tek bir işin var:</p>
    <div class="box info"><b>Sigorta (SGK) girişini kontrol et.</b><br>
      Sigortanı üniversite yapar — sen sadece yapılmış mı diye bakacaksın. 2 dakika sürer.</div>
    <button class="big" onclick="go('sgk')">Nasıl bakacağımı göster</button>
    <p class="hint" style="margin-top:14px">📅 Yaklaşan tarihler: <b>${fmtDate(sgkSon)}</b> — SGK kontrolü için son gün · <b>${fmtDate(a.start_date)}</b> — staj başlangıcın${ME.progress ? ` · toplam <b>${ME.progress.total} iş günü</b>` : ""}</p>`;
  }

  if (s === "obs") h = `${P}
    <h1>Sırada tek bir adım var: OBS kaydı.</h1>
    <p class="sub">OBS'de staj dersini seçmen gerekiyor — yoksa stajın nota işlenemez.</p>
    <div class="box info"><b>1.</b> OBS'ye gir<br><b>2.</b> Ders kaydı → <b>“Staj ${a.staj_no === 2 ? "II" : "I"}”</b> dersini seç<br><b>3.</b> Onayla</div>
    <button class="big" onclick="markObs()">OBS kaydımı yaptım ✓</button>
    <p class="after">Bunu işaretleyince staj başlangıcına kadar yapman gereken başka bir şey kalmıyor.</p>`;

  if (s === "ready") h = `${P}
    <h1>Her şey hazır 🎒</h1>
    <p class="sub">Stajın <b>${fmtDate(a.start_date)}</b>'de başlıyor (${daysTo(a.start_date)} gün kaldı). Şu an yapman gereken bir şey yok.</p>
    <div class="box info">İpucu: defter şablonunu şimdiden indirip staj başlar başlamaz doldurmaya başlayabilirsin. → <button class="link" onclick="go('docs')">Belgelerim</button></div>`;

  if (s === "during") {
    const pr = ME.progress || {};
    const kalan = pr.total && pr.done != null ? pr.total - pr.done : null;
    h = `${P}
    <h1>Stajın devam ediyor.</h1>
    <p class="sub"><b>${pr.done ?? "?"}. iş günü / ${pr.total ?? "?"}</b>${kalan != null ? ` · kalan ${kalan} iş günü` : ""} · Bitiş: ${fmtDate(a.end_date)}</p>
    <div class="prog"><div class="bar"><i style="width:${pr.total ? Math.round(pr.done / pr.total * 100) : 0}%"></i></div>
      <div class="txt"><span>Defterinde şu ana kadar <b>${pr.done ?? "?"} sayfa</b> olmalı (her iş günü için 1 sayfa)</span></div></div>
    <div class="box warn"><b>Her gün defter sayfanı doldur ve imzalat.</b> Son güne bırakma — en çok yapılan hata bu.</div>
    <button class="big" onclick="go('docs')">Defter sayfasını indir</button>`;
  }

  if (s === "deliver" || s === "fix_defter") h = `${P}
    <h1>${s === "fix_defter" ? "Defterinde düzeltme istendi." : "Stajın bitti 🎉"}</h1>
    ${s === "fix_defter" ? `<div class="box warn"><b>${a.fix_note || ""}</b></div>` :
      `<p class="sub">Son iki işin kaldı:</p>
       <div class="box info"><b>1.</b> Staj defterini buradan yükle<br>
       <b>2.</b> Sicil fişini kapalı zarfla bölüm sekreterliğine elden götür</div>`}
    <button class="big" onclick="go('deliver')">${s === "fix_defter" ? "Defteri yeniden yükle" : "Defteri yüklemeye başla"}</button>`;

  if (s === "evaluating") h = `${P}
    <h1>Defterin değerlendiriliyor.</h1>
    <p class="sub">Senden bir işlem beklenmiyor. Sonuç açıklanınca haber vereceğiz.</p>
    ${a.sicil_confirmed ? '<div class="box ok">✓ Sicil fişin bölüme ulaştı. Her şey tamam.</div>'
      : a.sicil_delivered ? '<div class="box info">Sicil fişini teslim ettiğini işaretledin — komisyon zarfı alınca onaylayacak.</div>'
      : `<div class="box warn">Sicil fişini henüz götürmediysen unutma: işyerinin <b>fotoğraflı</b> doldurduğu fişi kapalı zarfla bölüm sekreterliğine elden götür.<br><br>
         <label class="check" style="border:0"><input type="checkbox" onchange="markSicil(this.checked)"> Zarfı teslim ettim</label></div>`}`;

  if (s === "accepted") h = `${P}
    <div class="center"><div class="icon">🎓</div></div>
    <h1 class="center">Stajın kabul edildi!</h1>
    <p class="sub center">Her şey tamamlandı. Yapman gereken başka bir şey yok.</p>
    <div class="box info center">Staj notun OBS'ye işlenince orada görünecek.${a.staj_no < 2 ? " İkinci stajın için hazır olduğunda buradan yeni başvuru açabileceksin." : ""}</div>`;

  // Başvuru özeti: gönderimden sonra öğrenci kendi bilgilerini her zaman görebilmeli.
  if (a && !["draft", "noplace"].includes(s)) {
    const gunAd = { 1: "Pzt", 2: "Sal", 3: "Çar", 4: "Per", 5: "Cum" };
    const gunler = (a.calisma_gunleri || "").split(",").filter(Boolean).map(g => gunAd[g]).join("-");
    h += `<details style="margin-top:22px"><summary style="cursor:pointer;color:#1d4ed8;font-size:14.5px">Başvurunun özeti</summary>
      <div class="box info" style="margin-top:10px;font-size:14.5px">
        ${a.tur === "donem" ? `Dönem içi staj${gunler ? ` (${gunler})` : ""}` : "Yaz stajı"} · ${a.staj_no}. staj<br>
        <b>${a.kurum_adi || "—"}</b>${a.kurum_sehir ? ", " + a.kurum_sehir : ""}<br>
        ${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}${ME.progress ? ` · ${ME.progress.total} iş günü` : ""}<br>
        Sorumlu mühendis: ${a.muh_ad || "—"} (${a.muh_unvan || "—"})<br>
        Ücret: ${a.ucret === "evet" ? "ödenecek" : a.ucret === "hayir" ? "ödenmeyecek" : "belirsiz"}
      </div></details>`;
  }

  // Bildirim geçmişi: bildirimler bir kez görünüp kaybolmaz.
  if (ME.notifications.length) {
    h += `<details style="margin-top:10px"><summary style="cursor:pointer;color:#6b7280;font-size:14px">Bildirimler (${ME.notifications.length})</summary>
      ${ME.notifications.map(n => `<div class="notif" style="opacity:${n.seen ? ".65" : "1"}">
        ${n.text} <span class="muted">· ${n.created_at.slice(0, 10)}</span></div>`).join("")}</details>`;
  }

  // Bağlamsal yardım: her ekranın altında, bulunduğun aşamayla ilgili SSS'ye götürür.
  const TOPIC = { noplace: "staj yeri", draft: "başvuru", review: "başvuru", fix: "belge",
    sgk: "SGK", obs: "OBS", ready: "staj", during: "staj defteri", deliver: "defter teslim",
    fix_defter: "defter", evaluating: "değerlendirme", rejected: "başvuru" };
  const takildin = TOPIC[s]
    ? `<p class="hint" style="margin-top:26px;text-align:center">Takıldın mı?
       <button class="link" onclick="helpScreen('${TOPIC[s]}')">Bu aşamayla ilgili sık sorulan sorular</button></p>` : "";

  el(notifs + h + takildin);
}


/* ───────── Kurum bulma → kabul belgesi ───────── */
function acceptScreen() {
  nav("home");
  el(`${back}
    <h1>Stajını ne zaman yapacaksın?</h1>
    <p class="sub">Cevabına göre doğru kabul formunu senin için seçeceğiz.</p>
    <label class="radio"><input type="radio" name="t" value="yaz" checked> Yaz tatilinde</label>
    <label class="radio"><input type="radio" name="t" value="donem"> Dönem içinde <span class="muted">(haftada en az 3 gün)</span></label>
    <button class="big" onclick="acceptDoc()">Devam et</button>`);
}

function acceptDoc() {
  const tur = document.querySelector("input[name=t]:checked").value;
  el(`${back}
    <h1>Kuruma bu belgeyi imzalat.</h1>
    <p class="sub">${tur === "yaz" ? "Yaz stajı" : "Dönem içi staj"} yapacağın için doğru formu senin yerine seçtik.</p>
    <div class="box info"><b>Staj kabul belgesi</b> <span class="muted">(resmî adı: ${tur === "yaz" ? "EK-1" : "EK-1A"})</span><br><br>
      • Üst kısmını sen dolduracaksın<br>
      • Kurum yetkilisi <b>imzalayacak</b> ve <b>kaşeleyecek</b><br>
      • İkisi de yoksa komisyon belgeyi geri gönderir</div>
    <a class="quiet" style="display:block;text-align:center;text-decoration:none"
       href="/belgeler/${tur === "donem" ? "ek1a-zorunlu-staj-kabul-formu-donem-ici.pdf" : "ek1-zorunlu-staj-kabul-formu-yaz.pdf"}" download>Belgeyi indir (PDF)</a>
    <div class="box warn">⏰ <b>Önemli:</b> İmzalı formun staj başlangıcından en az <b>20 gün önce</b> teslim edilmesi gerekiyor — tarih seçerken sistem bunu senin için kontrol edecek.</div>
    <button class="big" onclick="startApplication('${tur}')">İmzalattım, başvuruya geç →</button>`);
}

async function startApplication(tur) {
  try {
    wizardApp = await api("/application", { method: "POST" });
    if (tur) wizardApp = await api("/application", { method: "PATCH", json: { tur, wizard_step: 1 } });
    go("wizard");
  } catch (e) { alert(e.message); }
}

/* ───────── 7 adımlı sihirbaz ───────── */
const STEP_NAMES = ["Bilgilerin", "Staj türün", "Kurum", "Sorumlu mühendis", "Tarihler", "Belge", "Kontrol"];

async function wizard(msg) {
  nav("home");
  wizardApp = wizardApp || ME.application;
  const a = wizardApp, n = a.wizard_step || 1;
  const head = `<div class="prog"><div class="bar"><i class="blue" style="width:${Math.round(n / 7 * 100)}%"></i></div>
    <div class="txt"><span>Adım ${n}/7 · ${STEP_NAMES[n - 1]}</span></div></div>${msg ? errBox(msg) : ""}`;
  const backB = n > 1 ? `<button class="quiet" onclick="wStep(${n - 1})">← Geri</button>`
    : `<button class="quiet" onclick="go('home')">← Çık (bilgilerin kaydedilir)</button>`;
  let body = "";

  if (n === 1) body = `
    <h1>Bilgilerini kontrol et.</h1>
    <p class="sub">Bunlar öğrenci kayıtlarından geldi — yazmana gerek yok.</p>
    <div class="box info">${ME.user.name} · ${ME.user.no}<br>Bilgisayar Mühendisliği · ${a.staj_no}. staj</div>
    <label>Telefon numaran</label><input id="telefon" type="tel" inputmode="numeric" placeholder="05xx xxx xx xx" value="${a.telefon || ""}">
    <p class="hint" id="telHint">Komisyonun sana ulaşması gerekirse kullanılır.</p>
    <button class="big" onclick="wPhone()">Devam et</button>${backB}`;

  if (n === 2) body = `
    <h1>Stajını ne zaman yapacaksın?</h1>
    <label class="radio"><input type="radio" name="t" value="yaz" ${a.tur !== "donem" ? "checked" : ""}> Yaz tatilinde</label>
    <label class="radio"><input type="radio" name="t" value="donem" ${a.tur === "donem" ? "checked" : ""}> Dönem içinde <span class="muted">(haftada en az 3 gün)</span></label>
    <button class="big" onclick="wSave(3,{tur:document.querySelector('input[name=t]:checked').value})">Devam et</button>${backB}`;

  if (n === 3) body = `
    <h1>Staj yapacağın kurum</h1>
    <label>Kurumun adı</label><input id="kadi" value="${a.kurum_adi || ""}" placeholder="Örnek Yazılım A.Ş.">
    <label>Şehir</label><input id="ksehir" value="${a.kurum_sehir || ""}" placeholder="Balıkesir">
    <label>Ne iş yapıyor?</label><input id="kfaal" value="${a.kurum_faaliyet || ""}" placeholder="Yazılım geliştirme">
    <label class="check" style="border:0;margin-top:14px"><input type="checkbox" id="kyurt" ${a.yurtdisi ? "checked" : ""}
      onchange="$('yurtInfo').style.display=this.checked?'block':'none'"> Kurum yurt dışında</label>
    <div id="yurtInfo" class="box warn" style="display:${a.yurtdisi ? "block" : "none"}">
      Yurt dışı stajında sigortanı üniversite yapamaz — <b>SGK'yı kendi imkânlarınla yaptırman gerekir.</b>
      Komisyon başvurunu buna göre değerlendirecek.</div>
    <button class="big" onclick="wSave(4,{kurum_adi:$('kadi').value,kurum_sehir:$('ksehir').value,kurum_faaliyet:$('kfaal').value,yurtdisi:$('kyurt').checked?1:0})">Devam et</button>${backB}`;

  if (n === 4) body = `
    <h1>Senden sorumlu mühendis kim?</h1>
    <label>Adı soyadı</label><input id="mad" value="${a.muh_ad || ""}">
    <label>Unvanı</label>
    <select id="munvan" onchange="$('dk').style.display=this.value==='Bilmiyorum'?'block':'none'">
      ${["Bilgisayar Mühendisi", "Yazılım Mühendisi", "İlgili alanda mühendis", "Bilmiyorum"]
        .map(u => `<option ${a.muh_unvan === u ? "selected" : ""}>${u}</option>`).join("")}
    </select>
    <div id="dk" style="display:${a.muh_unvan === "Bilmiyorum" ? "block" : "none"}" class="box info">
      Sorun değil — kuruma şunu sor:<br><i>“Staj süresince benden sorumlu olacak mühendisin adı ve unvanı nedir?”</i><br>
      Cevabı alınca dönüp devam edersin; bilgilerin kaydedildi.</div>
    <button class="big" onclick="wSave(5,{muh_ad:$('mad').value,muh_unvan:$('munvan').value})">Devam et</button>${backB}`;

  if (n === 5) {
    const donem = a.tur === "donem";
    const savedDays = (a.calisma_gunleri || "").split(",").filter(Boolean).map(Number);
    const DAY_NAMES = [[1, "Pzt"], [2, "Sal"], [3, "Çar"], [4, "Per"], [5, "Cum"]];
    body = `
    <h1>Başlangıç tarihini seç, gerisini biz hesaplayalım.</h1>
    <p class="sub">Sen başlangıcı seç; 20 iş gününü tamamlayan bitiş tarihini sistem bulur.
    Hafta sonları ve resmî tatiller hesaba katılmaz.</p>
    ${donem ? `
    <label>Hangi günler çalışacaksın? <span class="muted">(en az 3 gün)</span></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      ${DAY_NAMES.map(([v, t]) => `<label class="radio" style="margin:0;padding:10px 14px">
        <input type="checkbox" class="wday" value="${v}" ${savedDays.length ? (savedDays.includes(v) ? "checked" : "") : "checked"}
        onchange="onDatesInput()"> ${t}</label>`).join("")}
    </div>
    <p class="hint">Ders programınla çakışmayan günleri işaretli bırak.</p>` : ""}
    <label class="check" style="border:0;margin-top:14px"><input type="checkbox" id="cmt" ${a.cumartesi ? "checked" : ""}
      onchange="onDatesInput(true)"> Cumartesileri de çalışacağım
      <span class="muted">(komisyon onayına tabidir; pazar günleri hiçbir koşulda sayılmaz)</span></label>
    <label>Başlangıç</label>
    <input id="d1" type="date" value="${a.start_date || ""}" min="${minStartISO()}" onchange="onDatesInput()">
    <p class="hint">Kabul formu staj başlangıcından en az <b>20 gün önce</b> teslim edilmeli — bu yüzden en erken ${fmtDate(minStartISO())} seçebilirsin.</p>
    <label>Bitiş <span class="muted">(boş bırakırsan biz hesaplarız)</span></label>
    <input id="d2" type="date" value="${a.end_date || ""}" onchange="dateCheck()">
    <div id="dateRes"></div>
    <label>İşletme staj ücreti ödeyecek mi?</label>
    <select id="ucret">${[["hayir", "Hayır"], ["evet", "Evet"], ["bilmiyorum", "Bilmiyorum"]]
      .map(([v, t]) => `<option value="${v}" ${a.ucret === v ? "selected" : ""}>${t}</option>`).join("")}</select>
    <p class="hint">“Evet” dersen ücret katkısı formu (EK-2) sonraki adımda listene eklenir.
    Kamu kurumunda staj yapıyorsan EK-2 gerekmez.</p>
    <button class="big" id="d5next" onclick="wSaveDates()">Devam et</button>${backB}`;
  }

  if (n === 6) {
    const hasKabul = ME.documents.some(d => d.kind === "kabul");
    body = `
    <h1>Kabul belgesini yükle.</h1>
    <p class="sub">Kuruma imzalattığın belge. İmza <b>ve</b> kaşe olduğundan emin ol.</p>
    ${a.ucret === "evet" ? '<div class="box info">Ücret ödeneceği için <b>EK-2 (ücret katkısı) belgesi</b> de gerekiyor — pilot sürümde kabul belgesiyle birlikte tek dosyada yükleyebilirsin.</div>' : ""}
    <div class="upload ${hasKabul ? "done" : ""}" id="up" onclick="pickFile('kabul')">
      ${hasKabul ? "✓ Belgeni aldık · <u>değiştir</u>" : "Belgeyi buraya yükle: <u>dosya seç</u><br><span class='muted'>PDF veya fotoğraf · en fazla 10 MB</span>"}</div>
    <button class="big" onclick="wStep(7)">Devam et</button>${backB}`;
  }

  if (n === 7) body = `
    <h1>Son kontrol.</h1>
    <div class="box info">
      ${a.tur === "donem" ? "Dönem içi staj" : "Yaz stajı"} · ${a.kurum_adi || "—"}<br>
      ${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}<br>
      Sorumlu: ${a.muh_ad || "—"}, ${a.muh_unvan === "Bilmiyorum" ? '⚠ unvanı öğrenip <button class="link" onclick="wStep(4)">Adım 4\'te güncelle</button>' : (a.muh_unvan || "—")}<br>
      Kabul belgesi ${ME.documents.some(d => d.kind === "kabul") ? "✓ yüklendi" : "⚠ yüklenmedi"}
      <p style="margin-top:8px"><button class="link" onclick="wStep(1)">Bir şeyi değiştir</button></p>
    </div>
    <button class="big" onclick="wSubmit()">Başvuruyu gönder</button>
    <p class="after">Gönderince komisyon inceleyecek; inceleme başlayana kadar değişiklik yapabilirsin.</p>${backB}`;

  el(head + body);
  if (n === 5 && a.start_date) (a.end_date ? dateCheck() : onDatesInput());
}

// Telefon: sert hata yerine yumuşak doğrulama — rakam dışını temizle, uzunluğa bak.
function wPhone() {
  const raw = $("telefon").value.replace(/\D/g, "");
  if (raw.length < 10 || raw.length > 11 || !raw.startsWith("0")) {
    $("telHint").innerHTML = '<span style="color:#b45309">Numara eksik görünüyor — 0 ile başlayan 11 haneli numaranı yaz (ör. 0555 123 45 67).</span>';
    return;
  }
  wSave(2, { telefon: raw.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4") });
}

async function wSave(nextStep, fields) {
  try {
    wizardApp = await api("/application", { method: "PATCH", json: { ...fields, wizard_step: nextStep } });
    wizard();
  } catch (e) { wizard(e.message); }
}
async function wStep(n) {
  try { wizardApp = await api("/application", { method: "PATCH", json: { wizard_step: n } }); } catch {}
  wizard();
}

let lastDateCheck = null;
const pickedDays = () => [...document.querySelectorAll(".wday:checked")].map(i => +i.value);
const minStartISO = () => new Date(new Date(ME.today).getTime() + 20 * 86400000).toISOString().slice(0, 10);

// Başlangıç, çalışma günleri veya cumartesi tercihi değişti:
// bitiş boşsa (veya yeniden hesap istendiyse) sistem hesaplayıp doldurur.
async function onDatesInput(recalc) {
  const s = $("d1").value;
  if (!s) return;
  if (recalc) $("d2").value = "";
  const payload = { start: s, tur: wizardApp.tur, days: pickedDays(), saturday: $("cmt")?.checked };
  if (!$("d2").value) {
    const r = await api("/application/check-dates", { method: "POST", json: payload });
    if (r.suggestion?.auto && r.suggestion.value) {
      $("d2").value = r.suggestion.value;
      await dateCheck(true);
      return;
    }
    if (r.problems.length) {
      lastDateCheck = r;
      $("dateRes").innerHTML = `<div class="box warn">${r.problems.join("<br>")}${r.suggestion?.value ? `<br><br>
        <button class="big" style="background:#b45309" onclick="applySuggestion()">Başlangıcı ${fmtDate(r.suggestion.value)} yap (önerilen)</button>` : ""}</div>`;
      $("d5next").disabled = true;
      return;
    }
  }
  dateCheck();
}

async function dateCheck(autoFilled) {
  const s = $("d1").value, e = $("d2").value;
  if (!s || !e) return;
  lastDateCheck = await api("/application/check-dates",
    { method: "POST", json: { start: s, end: e, tur: wizardApp.tur, days: pickedDays(), saturday: $("cmt")?.checked } });
  const r = lastDateCheck;
  if (r.ok) {
    const b = r.breakdown || {};
    const skipped = [];
    if (b.weekend) skipped.push(`${b.weekend} hafta sonu günü`);
    if (b.offDays) skipped.push(`${b.offDays} çalışmadığın gün`);
    if (b.holidays?.length) skipped.push(b.holidays.join(", "));
    $("dateRes").innerHTML = `<div class="box ok">
      ${autoFilled ? `✓ <b>Bitişi senin için hesapladık: ${fmtDate(e)}.</b> İstersen değiştirebilirsin.<br>` : "✓ "}
      <b>${r.workdays} iş günü</b> — kurala uygun.
      ${skipped.length ? `<br><span class="muted">Sayılmayanlar: ${skipped.join(" · ")}.</span>` : ""}</div>`;
  } else {
    $("dateRes").innerHTML = `<div class="box warn">${r.problems.join("<br>")}${r.suggestion?.value ? `<br><br>
      <button class="big" style="background:#b45309" onclick="applySuggestion()">${r.suggestion.field === "end"
        ? "Bitişi " + fmtDate(r.suggestion.value) + " yap (önerilen)"
        : "Başlangıcı " + fmtDate(r.suggestion.value) + " yap (önerilen)"}</button>` : ""}</div>`;
  }
  $("d5next").disabled = !r.ok;
}
function applySuggestion() {
  const su = lastDateCheck.suggestion;
  $(su.field === "end" ? "d2" : "d1").value = su.value;
  dateCheck();
}
async function wSaveDates() {
  if (!lastDateCheck || !lastDateCheck.ok) { onDatesInput(); return; }
  wSave(6, { start_date: $("d1").value, end_date: $("d2").value, ucret: $("ucret").value,
    cumartesi: $("cmt")?.checked ? 1 : 0,
    calisma_gunleri: wizardApp.tur === "donem" ? pickedDays().join(",") : null });
}

async function wSubmit() {
  try {
    await api("/application/submit", { method: "POST" });
    await refresh();
    el(`<div class="center" style="margin-top:30px"><div class="icon">✅</div></div>
      <h1 class="center">Başvurun gönderildi.</h1>
      <p class="sub center">Komisyon inceleyecek, sonucu bildirimle haber vereceğiz.<br><b>Şu an yapman gereken bir şey yok.</b></p>
      <button class="big" onclick="go('home')">Tamam</button>`);
  } catch (e) { wizard(e.message); }
}

/* ───────── Dosya yükleme ───────── */
function pickFile(kind) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".pdf,.jpg,.jpeg,.png";
  inp.onchange = async () => {
    if (!inp.files[0]) return;
    const fd = new FormData();
    fd.append("file", inp.files[0]);
    const box = $("up");
    if (box) box.textContent = "Yükleniyor…";
    try {
      const r = await fetch("/api/upload/" + kind, { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await refresh();
      if (kind === "kabul" && ME.stage === "review") {
        el(`<div class="center" style="margin-top:30px"><div class="icon">✅</div></div>
          <h1 class="center">Belgen komisyona gitti.</h1>
          <p class="sub center">Sonuçlanınca haber vereceğiz. Şu an yapman gereken bir şey yok.</p>
          <button class="big" onclick="go('home')">Tamam</button>`);
      } else if (kind === "defter") {
        el(`<div class="center" style="margin-top:30px"><div class="icon">📗</div></div>
          <h1 class="center">Defterini aldık.</h1>
          <p class="sub center">Unutma: sicil fişini kapalı zarfla bölüm sekreterliğine elden götürmen gerekiyor.</p>
          <button class="big" onclick="go('home')">Tamam</button>`);
      } else go(ME.stage === "draft" ? "wizard" : "home");
    } catch (e) {
      if (box) { box.innerHTML = "Belgeyi buraya yükle: <u>dosya seç</u>"; }
      alert(e.message);
    }
  };
  inp.click();
}

/* ───────── SGK / OBS / teslim ───────── */
function sgkScreen() {
  nav("home");
  el(`${back}
    <h1>Sigorta girişine böyle bakılır:</h1>
    <div class="box info">
      <b>1.</b> turkiye.gov.tr'ye gir (e-Devlet)<br>
      <b>2.</b> Ara: <b>“SGK Tescil ve Hizmet Dökümü”</b><br>
      <b>3.</b> Listede staj başlangıç tarihinle bir kayıt olmalı</div>
    <button class="big" onclick="markSgk(true)">Kaydımı gördüm ✓</button>
    <button class="quiet" onclick="markSgk(false)">Kaydımı göremiyorum</button>
    <p class="after">“Gördüm” dersen sıradaki adımın OBS kaydı. “Göremiyorum” dersen durumu bölüme biz iletiriz — sana bir iş düşmez.</p>`);
}
async function markSgk(seen) {
  const r = await api("/sgk", { method: "POST", json: { seen } });
  await refresh();
  if (r.reported) {
    el(`<div class="center" style="margin-top:30px"><div class="icon">🙌</div></div>
      <h1 class="center">Sorun değil — bölüme bildirdik.</h1>
      <p class="sub center">Komisyon seninle iletişime geçecek.<br><b>Sigortan görünmeden staja başlama.</b></p>
      <button class="big" onclick="go('home')">Tamam</button>`);
  } else go("home");
}
async function markObs() { await api("/obs", { method: "POST" }); await refresh(); go("home"); }
async function markSicil(v) { await api("/sicil", { method: "POST", json: { delivered: v } }); await refresh(); go("home"); }

function deliverScreen() {
  nav("home");
  const total = ME.progress?.total || 20;
  const items = [`Her staj günü için ayrı sayfa hazırladım (${total} iş günü = ${total} sayfa)`,
    "Sayfaları mürekkepli kalemle, el yazısıyla doldurdum (bilgisayarda yazılmaz)",
    "Bütün sayfaları işyeri sorumlusu imzaladı", "Gerekli kaşeler sayfalarda var",
    "Kapak sayfasını ekledim", "Vlog bağlantısı ve QR kodu son sayfada",
    "PDF net okunuyor (bulanık/karanlık sayfa yok)", "Dosya boyutu 10 MB'ın altında"];
  el(`${back}
    <h1>Defterini yüklemeden önce kontrol et.</h1>
    <p class="sub">Eksik defterler geri döner — bu liste seni ondan kurtarır.</p>
    ${items.map(t => `<label class="check"><input type="checkbox" onchange="chk()"> ${t}</label>`).join("")}
    <button class="big" id="upBtn" disabled onclick="pickFile('defter')">Defteri seç ve gönder (PDF)</button>
    <p class="after" id="upWhy">Listeyi tamamlayınca buton açılır.</p>
    <div class="box warn"><b>Sicil fişi buraya yüklenmez.</b> İşyerinin <b>fotoğraflı</b> doldurduğu fişi kapalı zarfla bölüm sekreterliğine elden götür.<br><br>
      <label class="check" style="border:0"><input type="checkbox" ${ME.application.sicil_delivered ? "checked" : ""}
        onchange="api('/sicil',{method:'POST',json:{delivered:this.checked}})"> Zarfı teslim ettim</label></div>`);
}
function chk() {
  const boxes = [...document.querySelectorAll("main .check input")].slice(0, 8);
  const all = boxes.every(b => b.checked);
  $("upBtn").disabled = !all;
  $("upWhy").textContent = all ? "Hazırsın — gönderebilirsin." : "Listeyi tamamlayınca buton açılır.";
}

/* ───────── Belgelerim: her belge 8 sorusuyla ───────── */
// Belge kartı standardı: öğrenci hiçbir belge için "bu ne, kim imzalar?" diye sormak zorunda kalmaz.
const belgeKart = (b) => `
  <div class="qa"><div class="q" onclick="this.parentNode.classList.toggle('open')">${b.icon} ${b.ad}
    ${b.resmi ? `<span class="muted" style="font-weight:400">· ${b.resmi}</span>` : ""}</div>
  <div class="a"><table style="width:100%;border-collapse:collapse;font-size:14.5px">
    ${[["Bu belge nedir?", b.nedir], ["Neden gerekiyor?", b.neden], ["Kim dolduracak?", b.doldurur],
       ["Kim imzalayacak?", b.imzalar], ["Kaşe gerekiyor mu?", b.kase], ["Ne zaman hazırlanmalı?", b.nezaman],
       ["Nereye teslim edilecek?", b.nereye]]
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:5px 10px 5px 0;font-weight:600;white-space:nowrap;vertical-align:top">${k}</td>
        <td style="padding:5px 0">${v}</td></tr>`).join("")}
  </table>
  ${b.indir ? `<a class="link" style="font-size:14px" href="${b.indir}" download>Belgeyi indir</a>` : ""}
  </div></div>`;

const BELGELER = {
  "Başvurudan önce gerekenler": [
    { icon: "📄", ad: "Staj kabul belgesi", resmi: "EK-1 (yaz) / EK-1A (dönem içi)",
      nedir: "Staj yapacağın işletmenin seni stajyer olarak kabul ettiğini gösteren belge.",
      neden: "Komisyon staj yerinin uygunluğunu bununla değerlendirir; sigorta girişin buna göre yapılır.",
      doldurur: "Üst kısmı sen, işletme bilgilerini kurum.", imzalar: "İşletme yetkilisi.",
      kase: "<b>Evet</b> — işletme kaşesi zorunlu.",
      nezaman: "Staj başlangıcından <b>en az 20 gün önce</b> (başvuruda yükleyeceksin).",
      nereye: "Bu sisteme yüklenir; elden teslim gerekmez. Yaz stajı için EK-1, dönem içi için EK-1A kullanılır — sistem staj türüne göre doğrusunu verir.",
      indir: "/belgeler/ek1-zorunlu-staj-kabul-formu-yaz.pdf" },
    { icon: "📄", ad: "Kabul belgesi — dönem içi sürüm", resmi: "EK-1A",
      nedir: "Dönem içinde staj yapacaklar için kabul formu; içeriği EK-1 ile aynıdır.",
      doldurur: "Üst kısmı sen, işletme bilgilerini kurum.", imzalar: "İşletme yetkilisi.",
      kase: "<b>Evet</b> — işletme kaşesi zorunlu.",
      nezaman: "Staj başlangıcından <b>en az 20 gün önce</b>.",
      nereye: "Bu sisteme yüklenir.",
      indir: "/belgeler/ek1a-zorunlu-staj-kabul-formu-donem-ici.pdf" },
    { icon: "📊", ad: "Ücret katkısı başvuru listesi",
      nedir: "Staj ücreti alacak öğrenciler için İşsizlik Fonu katkısı başvurusunda kullanılan bilgi tablosu (Excel).",
      neden: "EK-2 formuyla birlikte, devlet katkısının bağlanması için gerekir. Kamu kurumunda staj yapanlar doldurmaz.",
      doldurur: "Kendi satırını sen doldurursun.",
      nezaman: "Yalnızca 'ücret ödenecek' dediysen; başvuruyla birlikte.", nereye: "Bu sisteme yüklenir.",
      indir: "/belgeler/staj-ucreti-fon-katkisi-basvuru-evraki.xlsx" },
    { icon: "📊", ad: "Öğrenci bilgi listesi", resmi: "EK-3",
      nedir: "Fakültenin SGK girişlerinde kullandığı öğrenci bilgi tablosu (Excel).",
      neden: "Sigorta girişinin doğru bilgilerle yapılması için gerekir. Önemli: 1. stajın SGK çıkışı yapılmadan sonraki staj için yeni giriş yapılamaz.",
      doldurur: "Kendi satırını sen doldurursun (ad, TC, öğrenci no, telefon, doğum tarihi…).",
      nezaman: "Başvuru sırasında.", nereye: "Bu sisteme yüklenir (bölüm toplu listeye ekler).",
      indir: "/belgeler/ek3-ogrenci-bilgi-listesi.xlsx" },
    { icon: "📄", ad: "Ücret katkısı bilgi formu", resmi: "EK-2",
      nedir: "İşletme sana staj ücreti ödeyecekse devlet katkısı için gereken form. <b>Kamu kurumlarında staj yapanlar için gerekmez.</b>",
      neden: "Ödenen ücretin bir kısmı İşsizlik Fonu'ndan devlet katkısı olarak karşılanır (20'den az personelli işletmede 2/3'ü, 20 ve üzerinde 1/3'ü).",
      doldurur: "Öğrenci bilgilerini sen, işletme bilgilerini kurum — <b>bilgisayar ortamında</b> doldurulur.", imzalar: "Sen ve işletme yetkilisi.", kase: "Evet.",
      nezaman: "Yalnızca 'ücret ödenecek' dediysen; başvuruyla birlikte.",
      nereye: "Bu sisteme yüklenir.", indir: "/belgeler/ek2-ucret-issizlik-fonu-formu.pdf" },
    { icon: "📄", ad: "Staj zorunluluk belgesi",
      nedir: "Stajın mezuniyet için zorunlu olduğunu ve SGK primlerinin Fakültece yatırılacağını kuruma bildiren resmî yazı.",
      neden: "Bazı işletmeler stajyer kabul etmek için ister.",
      doldurur: "Hazırdır — doldurmana gerek yok, indirip kuruma verirsin.",
      nereye: "Staj yapacağın kuruma.", indir: "/belgeler/staj-zorunluluk-belgesi.pdf" },
    { icon: "📘", ad: "Staj yönergesi",
      nedir: "Stajın bütün resmî kuralları. Sistemi kullanıyorsan çoğunu okumana gerek kalmaz — kurallar senin yerine uygulanır.",
      nezaman: "Merak edersen her zaman; zorunlu adım değildir.", indir: "/belgeler/staj-yonergesi.pdf" },
  ],
  "Staj sırasında kullanacakların": [
    { icon: "📄", ad: "Günlük staj defteri sayfası",
      nedir: "Her staj günü için o gün ne yaptığını anlattığın sayfa.",
      neden: "Komisyon stajını bu sayfalar üzerinden değerlendirir.",
      doldurur: "Sen — her iş günü için bir sayfa, <b>mürekkepli kalemle el yazısıyla</b> (bilgisayarda yazılmaz).",
      imzalar: "Her sayfayı işyeri yetkilisi onaylar.",
      kase: "Evet, sayfalarda işyeri kaşesi gerekir.",
      nezaman: "Staj süresince <b>her gün</b>. Son güne bırakma — en çok yapılan hata bu.",
      nereye: "Staj bitince hepsi tek PDF olarak bu sisteme yüklenir.",
      indir: "/belgeler/staj-defteri-sayfalari.docx" },
    { icon: "📄", ad: "Staj defteri kapağı",
      nedir: "Ad-soyad, kurum, teslim tarihi ve imza alanlarını taşıyan ilk sayfa.",
      doldurur: "Sen.", imzalar: "Sen (öğrenci imzası alanı vardır).",
      nezaman: "Defteri birleştirirken en başa eklenir.", nereye: "Defter PDF'inin ilk sayfası olur.",
      indir: "/belgeler/staj-defteri-kapak.docx" },
    { icon: "🎬", ad: "Vlog",
      nedir: "Staj boyunca çektiğin kısa videolar.",
      neden: "Staj deneyimini belgelemek için bölüm gereksinimidir.",
      doldurur: "Sen çekersin.", nezaman: "Staj süresince; son güne bırakma.",
      nereye: "Video bağlantısı ve QR kodu defterin <b>son sayfasına</b> eklenir." },
  ],
  "Teslim ederken gerekenler": [
    { icon: "📗", ad: "Staj defteri (tamamlanmış)",
      nedir: "Kapak + her iş günü için imzalı-kaşeli sayfalar + son sayfada vlog bağlantısı ve QR kod.",
      doldurur: "Sen.", imzalar: "Bütün sayfalar işyeri sorumlusu tarafından imzalanmış olmalı.",
      kase: "Evet.", nezaman: "Staj bittikten sonra, ilan edilen son tarihe kadar.",
      nereye: "Bu sisteme PDF olarak yüklenir — teslim ekranı seni kontrol listesiyle yönlendirir." },
    { icon: "✉️", ad: "Staj sicil fişi",
      nedir: "İşyerindeki amirinin seni değerlendirdiği <b>gizli</b> form. Beş konuda A(Pekiyi)–D(Başarısız) notu verir: devam durumu, sorumluluk duygusu, işi vaktinde ve tam yapma, grup çalışmasına yatkınlık, kendini geliştirme isteği.",
      neden: "Komisyon staj gününün kabul/red kararında bu değerlendirmeyi kullanır.",
      doldurur: "Üst bilgileri sen, değerlendirmeyi işyeri amirin — <b>fotoğraflı</b> olmalı.",
      imzalar: "Amirin (kaşe ve imza).", kase: "Evet, zarf da kaşeli olmalı.",
      nezaman: "Stajın son günlerinde işyerine hatırlat; boş formu sen götürürsün.",
      nereye: "<b>Bu sisteme yüklenmez.</b> Kapalı ve kaşeli zarf içinde bölüm sekreterliğine <b>elden</b> teslim edilir.",
      indir: "/belgeler/staj-sicil-fisi.docx" },
  ],
};

function docsScreen() {
  nav("docs");
  // Öğrencinin aşamasına uygun belge grubu açık gelir; diğerleri bir tık uzakta.
  const stageGroup = ["noplace", "draft", "review", "fix", "rejected"].includes(ME.stage)
    ? "Başvurudan önce gerekenler"
    : ["sgk", "obs", "ready", "during"].includes(ME.stage)
      ? "Staj sırasında kullanacakların" : "Teslim ederken gerekenler";
  const mine = ME.documents.map(d =>
    `<div class="qa open"><div class="q">✅ ${d.kind === "kabul" ? "Kabul belgen" : "Staj defterin"} — yüklendi</div>
     <div class="a">${d.orig_name} · ${d.uploaded_at.slice(0, 10)}</div></div>`).join("");
  el(`<h1>Belgelerim</h1>
    <p class="sub">Bulunduğun aşamada gerekenler açık geldi. Her belgenin yanında kimin dolduracağı, kimin imzalayacağı ve nereye gideceği yazar.</p>
    ${mine}
    ${Object.entries(BELGELER).map(([grup, items]) => `
      <h1 style="font-size:17px;margin-top:22px;color:${grup === stageGroup ? "#1e40af" : "#374151"}">${grup}${grup === stageGroup ? " · şu an buradasın" : ""}</h1>
      ${items.map(b => belgeKart(b)).join("")}`).join("")}
    <p class="hint" style="margin-top:14px">Form dosyaları (EK-1, EK-1A, EK-2) pilot sürümde bölüm sayfasından indirilir; canlı sürümde buradan inecek.</p>`);
}

/* ───────── Staj rehberi: bütün sürecin sakin anlatımı ───────── */
// Normalde ihtiyaç yoktur — sistem her adımda yönlendirir. Baştan sona okumak
// isteyen (veya hocasına anlatan) öğrenci için tek sayfa.
const REHBER = [
  ["Staj yeri bulma", "Bilgisayar/yazılım alanında sorumlu mühendisi olan bir kurum bulursun.", "Kurum aramak; emin değilsen kuruma sistemin verdiği hazır soruyu sormak."],
  ["Belgeleri hazırlama", "Sistem staj türüne göre doğru kabul formunu verir; kuruma imzalatıp kaşeletirsin.", "Belgeyi indirip imzalatmak."],
  ["Başvuru", "7 kısa adımda başvuru: bilgiler, tür, kurum, mühendis, tarihler, belge, kontrol. Her adım otomatik kaydedilir.", "Formu doldurmak — iş günü hesabını sistem yapar."],
  ["Komisyon incelemesi", "Komisyon başvurunu ve belgeni inceler; genellikle 5 iş günü sürer.", "Hiçbir şey — sonucu bildirimle alırsın."],
  ["Onay", "Başvurun onaylanır (veya düzeltme istenir; ne yapacağın açıkça yazar).", "Varsa düzeltmeyi yapmak."],
  ["SGK kontrolü", "Sigortanı üniversite yapar; sen e-Devlet'ten görünüp görünmediğine bakarsın.", "Staj başlamadan 3 gün önce 2 dakikalık kontrol."],
  ["OBS kaydı", "OBS'de staj dersini seçersin — not buraya işlenir.", "Ders kaydında stajı seçmek."],
  ["Staj", "Staj süresince her iş günü için defter sayfası doldurur, imzalatır, vlog çekersin.", "Her gün 1 sayfa + imza. Son güne bırakmamak."],
  ["Defter hazırlama", "Kapak + sayfalar + son sayfada vlog bağlantısı ve QR kod; hepsi tek PDF.", "Defteri birleştirmek; sistem kontrol listesiyle yardım eder."],
  ["Teslim", "Defter sisteme yüklenir. Sicil fişi ise kapalı-kaşeli zarfla bölüme elden verilir.", "PDF yüklemek + zarfı sekreterliğe götürmek."],
  ["Değerlendirme", "Komisyon defterini değerlendirir.", "Hiçbir şey — sonucu bildirimle alırsın."],
  ["Tamamlandı", "Stajın kabul edilir, notun OBS'ye işlenir. 2. stajın için aynı süreç tekrar eder.", "🎉"],
];
function guideScreen() {
  nav("guide");
  el(`<h1>Staj süreci, baştan sona.</h1>
    <p class="sub">Bunu ezberlemene gerek yok — sisteme her girdiğinde hangi adımdaysan onu gösteririz.
    Bu sayfa, bütünü merak edenler için.</p>
    ${REHBER.map(([ad, ne, gorev], i) => `
      <div class="qa ${STAGE_NO[ME.stage] === i ? "open" : ""}" ${STAGE_NO[ME.stage] === i ? 'style="border-color:#1d4ed8"' : ""}>
        <div class="q" onclick="this.parentNode.classList.toggle('open')">
          ${i + 1}. ${ad} ${STAGE_NO[ME.stage] === i ? '<span style="color:#1d4ed8">· şu an buradasın</span>' : ""}</div>
        <div class="a">${ne}<br><b>Senin görevin:</b> ${gorev}</div>
      </div>`).join("")}
    <div class="box info" style="margin-top:20px">Bölümde toplam <b>iki staj</b> yapılır (2 × 20 iş günü = 40 iş günü).
    İkisi de aynı süreçten geçer.</div>`);
}

/* ───────── Yardım ───────── */
async function helpScreen(prefill) {
  nav("help");
  const faq = await api("/faq");
  const myQs = await api("/questions");
  const cats = [...new Set(faq.map(f => f.category))];
  el(`<h1>Yardım</h1>
    <input id="fq" placeholder="Sorunu yaz, ör: kaç gün staj yapmam gerekiyor?" value="${prefill || ""}" oninput="faqSearch()">
    <div id="fres"></div>
    <div style="margin-top:10px">${cats.map(c =>
      `<button class="link" style="font-size:13.5px;margin-right:12px" onclick="$('fq').value='${c}';faqSearch()">${c}</button>`).join("")}</div>
    <h1 style="font-size:18px;margin-top:24px">Çok sorulanlar</h1>
    ${faq.slice(0, 6).map(f => `<div class="qa"><div class="q" onclick="this.parentNode.classList.toggle('open')">${f.q}</div><div class="a">${f.a}</div></div>`).join("")}
    <div class="box info">Cevabını bulamadın mı? <button class="link" onclick="askScreen()">Komisyona sor</button></div>
    ${myQs.length ? `<h1 style="font-size:18px;margin-top:24px">Sorularım</h1>` +
      myQs.map(q => `<div class="qa ${q.answer ? "open" : ""}"><div class="q">${q.answer ? "✅" : "⏳"} ${q.text}</div>
        <div class="a">${q.answer || "Henüz cevaplanmadı — cevap gelince bildirim alacaksın."}</div></div>`).join("") : ""}`);
  if (prefill) faqSearch();
}
async function faqSearch() {
  const q = $("fq").value.trim();
  if (q.length < 4) { $("fres").innerHTML = ""; return; }
  const rows = await api("/faq?q=" + encodeURIComponent(q));
  $("fres").innerHTML = rows.length
    ? rows.map(f => `<div class="qa open"><div class="q">${f.q}</div><div class="a">${f.a}</div></div>`).join("")
    : `<div class="box info">Buna uygun hazır cevap bulamadık. <button class="link" onclick="askScreen()">Soruyu komisyona gönder</button></div>`;
}
function askScreen() {
  el(`${back}
    <h1>Komisyona sor</h1>
    <textarea id="qt" rows="3" placeholder="Sorunu buraya yaz…" oninput="askSim()"></textarea>
    <div id="sim"></div>
    <button class="big" id="send" disabled onclick="sendQ()">Soruyu gönder</button>`);
}
let simTimer = null;
function askSim() {
  const v = $("qt").value.trim();
  $("send").disabled = v.length < 10;
  clearTimeout(simTimer);
  if (v.length < 6) { $("sim").innerHTML = ""; return; }
  simTimer = setTimeout(async () => {
    const rows = await api("/faq?q=" + encodeURIComponent(v.split(" ").slice(-3).join(" ")));
    if (rows.length) $("sim").innerHTML = `<div class="box info"><b>Benzer sorular daha önce cevaplanmış:</b><br>
      ${rows.slice(0, 3).map(f => `• ${f.q}`).join("<br>")}<br><span class="muted">Cevaplar “Çok sorulanlar” bölümünde.</span></div>`;
    else $("sim").innerHTML = "";
  }, 400);
}
async function sendQ() {
  try {
    await api("/questions", { method: "POST", json: { text: $("qt").value } });
    el(`<div class="center" style="margin-top:30px"><div class="icon">📨</div></div>
      <h1 class="center">Sorun komisyona iletildi.</h1>
      <p class="sub center">Cevap gelince bildirim alacaksın.</p>
      <button class="big" onclick="go('home')">Tamam</button>`);
  } catch (e) { alert(e.message); }
}

/* ───────── Yönlendirme ───────── */
const routes = { home, wizard, sgk: sgkScreen, deliver: deliverScreen, docs: docsScreen,
  help: helpScreen, accept: acceptScreen, guide: guideScreen };
async function go(name) {
  try { await refresh(); } catch { return loginScreen(); }
  (routes[name] || home)();
}

(async () => {
  try { await refresh(); go("home"); } catch { loginScreen(); }
})();
