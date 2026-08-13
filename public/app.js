/* BAÜN Staj Portalı — öğrenci arayüzü.
   Tek ilke: ekran, sunucunun bildirdiği aşamaya göre çizilir;
   öğrenciye seçenek değil, o anki tek doğru işlem gösterilir. */

let ME = null;          // /api/me cevabı
let wizardApp = null;   // sihirbazdaki taslak

const $ = (id) => document.getElementById(id);
const el = (html) => {
  const m = $("app");
  m.innerHTML = html;
  m.classList.toggle("wide", html.includes('class="cols"')); // iki sütunlu Stajım ekranı
  m.classList.toggle("full", html.includes("data-full"));     // yatay ızgaralı geniş sayfalar
  window.scrollTo(0, 0);
};

// Profil menüsü aç/kapa; dışarı tıklanınca kapanır
function toggleUmenu(e) { e.stopPropagation(); $("umenu").classList.toggle("open"); }
document.addEventListener("click", () => $("umenu")?.classList.remove("open"));

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
  if (ME?.user) {
    $("uname").textContent = ME.user.name;
    $("uava").textContent = ME.user.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  }
}

const STAGES = ["Staj yeri bulma", "Belgeleri hazırlama", "Başvuru", "Komisyon incelemesi", "Onay",
  "SGK kontrolü", "OBS kaydı", "Staj", "Defter hazırlama", "Teslim", "Değerlendirme", "Tamamlandı"];
const STAGE_NO = { noplace: 0, draft: 2, review: 3, fix: 3, rejected: 3, sgk: 5, obs: 6,
  ready: 7, during: 7, deliver: 9, evaluating: 10, fix_defter: 9, accepted: 12 };

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

let selApp = null; // seçili staj başvurusunun id'si (3.-4. sınıfta iki başvuru olabilir)
async function refresh() {
  ME = await api("/me" + (selApp ? "?app=" + selApp : ""));
  selApp = ME.application?.id || null;
}
function switchStaj(id) { selApp = id; go("home"); }

/* ───────── Giriş ─────────
   Sayısal alanlar yalnız rakam kabul eder ve hane sınırını aşamaz —
   harf yazmak veya fazla hane girmek fiziksel olarak imkânsızdır. */
function digitsOnly(elm, max) {
  elm.value = elm.value.replace(/\D/g, "").slice(0, max);
}
function lettersOnly(elm) {
  elm.value = elm.value.replace(/[0-9]/g, "");
}

function loginScreen(msg, first) {
  $("topbar").style.display = "none";
  // İlk açılışta net bir seçim formu; "daha önce giriş yaptım" diyen için
  // bu soru bir daha gösterilmez (tarayıcı hatırlar).
  if (first === undefined && !msg) {
    if (localStorage.getItem("girisModu") === "normal") first = false;
    else {
      el(`
      <div style="max-width:560px;margin:30px auto">
        <h1>BAÜN Staj Portalı</h1>
        <p class="sub">Bilgisayar Mühendisliği staj işlemlerinin tamamı burada.<br>Sana uygun olanı seç:</p>
        <label class="radio" onclick="loginScreen('',true)" style="padding:18px">
          <span><span style="font-weight:700;font-size:17px">İlk kez gireceğim</span><br>
          <span class="muted">Şifrem yok — öğrenci numaram ve TC kimlik numaramla kimliğimi doğrulayacağım</span></span></label>
        <label class="radio" onclick="localStorage.setItem('girisModu','normal');loginScreen('',false)" style="padding:18px">
          <span><span style="font-weight:700;font-size:17px">Daha önce giriş yaptım</span><br>
          <span class="muted">Öğrenci numaram ve şifrem var</span></span></label>
      </div>`);
      return;
    }
  }
  el(`
    <div style="max-width:560px;margin:30px auto">
      <h1>${first ? "İlk giriş" : "Giriş yap"}</h1>
      <p class="sub">${first ? "Kimliğini doğrulayalım — sonra kendi şifreni oluşturacaksın." : "Öğrenci numaran ve şifrenle gir."}</p>
      ${msg ? errBox(msg) : ""}
      <label>Öğrenci numaran</label>
      <input id="no" type="text" inputmode="numeric" maxlength="12" placeholder="Öğrenci numaran (sadece rakam)"
        autocomplete="username" oninput="digitsOnly(this,12);loginCheck(${!!first})">
      ${first ? `
      <label>TC kimlik numaran</label>
      <input id="tc" type="text" inputmode="numeric" maxlength="11" placeholder="11 haneli TC kimlik numaran"
        oninput="digitsOnly(this,11);loginCheck(true)">
      <button class="big" id="loginBtn" disabled onclick="doLogin(true)">Kimliğimi doğrula ve başla</button>
      <p class="why" id="lwhy"></p>
      <p class="center"><button class="link" style="font-size:15px" onclick="localStorage.setItem('girisModu','normal');loginScreen('',false)">Şifrem zaten var — normal giriş</button></p>
      ` : `
      <label>Şifren</label>
      <input id="pw" type="password" maxlength="64" placeholder="Şifreni yaz" autocomplete="current-password">
      <button class="big" id="loginBtn" onclick="doLogin(false)">Giriş yap</button>
      <p class="center" style="margin-top:12px">
        <button class="link" style="font-size:13.5px"
          onclick="alert('Pilot sürümde şifre sıfırlama bölüm sekreterliği üzerinden yapılıyor.')">Şifremi unuttum</button>
        <span class="muted"> · </span>
        <button class="link" style="font-size:13.5px" onclick="loginScreen('',true)">İlk girişini yapacaksan tıkla</button>
      </p>`}
    </div>`);
}

// İlk giriş modunda buton, numara ve 11 haneli TC tamamlanmadan açılmaz.
function loginCheck(first) {
  if (!first) return;
  const noOk = ($("no").value || "").length >= 8;
  const tcOk = ($("tc").value || "").length === 11;
  $("loginBtn").disabled = !(noOk && tcOk);
  $("lwhy").textContent = !noOk ? "Devam etmek için: öğrenci numaranı yaz"
    : !tcOk ? `Devam etmek için: TC'nin 11 hanesini de yaz (${($("tc").value || "").length}/11)` : "";
}

async function doLogin(first) {
  try {
    const pass = first ? $("tc").value : $("pw").value;
    const r = await api("/login", { method: "POST", json: { no: $("no").value, pass } });
    if (r.firstLogin) return setPassScreen(r.name);
    if (r.role === "admin") { location.href = "/admin.html"; return; }
    await refresh(); go("home");
  } catch (e) { loginScreen(e.message, !!first); }
}

function setPassScreen(name, msg) {
  el(`
    <div style="max-width:560px;margin:30px auto">
      <h1>Merhaba ${name.split(" ")[0]} 👋</h1>
      <p class="sub">Kimliğini doğruladık. Artık kendine bir şifre belirle — bundan sonra TC numaranla değil, bu şifreyle gireceksin.</p>
      ${msg ? errBox(msg) : ""}
      <label>Yeni şifren</label>
      <input id="pw1" type="password" maxlength="64" placeholder="En az 8 karakter" autocomplete="new-password">
      <p class="hint">En az 8 karakter. Unutmayacağın ama tahmin edilemeyecek bir şey seç.</p>
      <br><button class="big" onclick="doSetPass()">Şifremi kaydet ve başla</button>
    </div>`);
}

async function doSetPass() {
  try {
    await api("/set-password", { method: "POST", json: { password: $("pw1").value } });
    localStorage.setItem("girisModu", "normal"); // artık normal kullanıcı — ilk giriş sorusu tekrar çıkmaz
    await refresh(); go("home");
  } catch (e) { setPassScreen(ME?.user?.name || "", e.message); }
}

async function logout() { await api("/logout", { method: "POST" }); loginScreen(); }

/* ───────── Stajım (durum odaklı ana ekran) ───────── */
function home() {
  nav("home");
  const s = ME.stage, a = ME.application;
  const notifs = ME.notifications.filter(n => !n.seen).map(n => `<div class="notif">🔔 ${n.text}</div>`).join("");
  const stageNo = STAGE_NO[s] ?? 0;
  let h = "";

  if (s === "noplace") h = `
    <h1>Önce staj yapacağın bir kurum bul.</h1>
    <p class="sub">Kurumda bilgisayar ya da yazılım alanında çalışan bir mühendis olmalı — tek şart bu.</p>
    <div class="box info">Emin değilsen kuruma şunu sor:<br><i>“Staj süresince benden sorumlu olacak mühendisin unvanı nedir?”</i></div>
    <button class="big" onclick="go('accept')">Kurum buldum</button>
    <p class="after">Sonraki adım: kurumun imzalayacağı belgeyi birlikte hazırlayacağız.</p>`;

  if (s === "draft") h = `
    <h1>Başvurun yarım kaldı.</h1>
    <p class="sub">Bilgilerin kaydedildi — kaldığın yerden devam edebilirsin.</p>
    <button class="big" onclick="go('wizard')">Devam et (Adım ${a.wizard_step}/7)</button>`;

  if (s === "review") h = `
    <h1>Başvurun inceleniyor.</h1>
    <p class="sub">Senden bir işlem beklenmiyor. Sonuçlanınca bildirimle haber vereceğiz.</p>
    <div class="box info">Başvurular genellikle <b>5 iş günü</b> içinde incelenir.</div>
    <div class="box info" style="background:#eff6ff"><b>Bu arada yapabileceklerin:</b><br>
      • <button class="link" onclick="go('docs')">Defter sayfası şablonunu şimdiden indir</button><br>
      • <button class="link" onclick="go('guide')">Sürecin devamında seni neler bekliyor, göz at</button><br>
      • 🎬 Vlog için fikir toplamaya başla — stajın ilk gününden çekim yapman gerekecek</div>`;

  if (s === "fix") h = `
    <h1>Bir belgeyi düzeltmen gerekiyor.</h1>
    <p class="sub">Komisyonun notu:</p>
    <div class="box warn"><b>${a.fix_note || "Belgende düzeltme istendi."}</b></div>
    <div class="upload" id="up" onclick="pickFile('kabul')">Belgeyi buraya yükle: <u>dosya seç</u><br>
      <span class="muted">PDF veya fotoğraf · en fazla 10 MB</span></div>
    <p class="after">Yeni belgen doğrudan komisyona gidecek.</p>`;

  if (s === "rejected") h = `
    <h1>Başvurun kabul edilmedi.</h1>
    <div class="box warn">${a.fix_note || "Gerekçe için bölümle iletişime geçebilirsin."}</div>
    <button class="big" onclick="startApplication()">Yeni başvuru yap</button>`;

  if (s === "sgk") {
    const sgkSon = new Date(new Date(a.start_date) - 3 * 86400000).toISOString().slice(0, 10);
    h = `
    <h1>Başvurun onaylandı ✓</h1>
    <p class="sub">Stajın <b>${fmtDate(a.start_date)}</b> tarihinde başlıyor${daysTo(a.start_date) > 0 ? ` (${daysTo(a.start_date)} gün kaldı)` : ""}. Başlamadan önce tek bir işin var:</p>
    <div class="box info"><b>Sigorta (SGK) girişini kontrol et.</b><br>
      Sigortanı üniversite yapar — sen sadece yapılmış mı diye bakacaksın. 2 dakika sürer.</div>
    <button class="big" onclick="go('sgk')">Nasıl bakacağımı göster</button>
    <p class="hint" style="margin-top:14px">📅 Yaklaşan tarihler: <b>${fmtDate(sgkSon)}</b> — SGK kontrolü için son gün · <b>${fmtDate(a.start_date)}</b> — staj başlangıcın${ME.progress ? ` · toplam <b>${ME.progress.total} iş günü</b>` : ""}</p>`;
  }

  if (s === "obs") h = `
    <h1>Sırada tek bir adım var: OBS kaydı.</h1>
    <p class="sub">OBS'de staj dersini seçmen gerekiyor — yoksa stajın nota işlenemez.</p>
    <div class="box info"><b>1.</b> OBS'ye gir<br><b>2.</b> Ders kaydı → <b>“Staj ${a.staj_no === 2 ? "II" : "I"}”</b> dersini seç<br><b>3.</b> Onayla</div>
    <button class="big" onclick="markObs()">OBS kaydımı yaptım ✓</button>
    <p class="after">Bunu işaretleyince staj başlangıcına kadar yapman gereken başka bir şey kalmıyor.</p>`;

  if (s === "ready") h = `
    <h1>Her şey hazır 🎒</h1>
    <p class="sub">Stajın <b>${fmtDate(a.start_date)}</b>'de başlıyor (${daysTo(a.start_date)} gün kaldı). Şu an yapman gereken bir şey yok.</p>
    <div class="box info">İpucu: defter şablonunu şimdiden indirip staj başlar başlamaz doldurmaya başlayabilirsin. → <button class="link" onclick="go('docs')">Belgelerim</button></div>`;

  if (s === "during") {
    const pr = ME.progress || {};
    const kalan = pr.total && pr.done != null ? pr.total - pr.done : null;
    h = `
    <h1>Stajın devam ediyor.</h1>
    <p class="sub"><b>${pr.done ?? "?"}. iş günü / ${pr.total ?? "?"}</b>${kalan != null ? ` · kalan ${kalan} iş günü` : ""} · Bitiş: ${fmtDate(a.end_date)}</p>
    <div class="prog"><div class="bar"><i style="width:${pr.total ? Math.round(pr.done / pr.total * 100) : 0}%"></i></div>
      <div class="txt"><span>Defterinde şu ana kadar <b>${pr.done ?? "?"} sayfa</b> olmalı (her iş günü için 1 sayfa)</span></div></div>
    ${!a.sgk_checked ? `<div class="box warn">⚠ Staj başlamadan önce SGK kontrolünü işaretlememiştin. Sigortanın
      yapıldığından emin ol: e-Devlet → “SGK Tescil ve Hizmet Dökümü”.
      <button class="link" onclick="markSgk(true)">Kontrol ettim, kaydım var ✓</button></div>` : ""}
    <div class="box warn"><b>Her gün defter sayfanı doldur ve imzalat.</b> Son güne bırakma — en çok yapılan hata bu.</div>
    ${pr.done <= 2 ? '<div class="box info">🎬 <b>Vlog çekimine bugün başla:</b> videon stajın <b>ilk</b>, orta ve son günlerinden bölümler içermeli. Son gün birkaç fotoğrafla olmaz.</div>' : ""}
    <button class="big" onclick="go('docs')">Defter sayfasını indir</button>`;
  }

  if (s === "deliver" || s === "fix_defter") h = `
    <h1>${s === "fix_defter" ? "Defterinde düzeltme istendi." : "Stajın bitti 🎉"}</h1>
    ${s === "fix_defter" ? `<div class="box warn"><b>${a.fix_note || ""}</b></div>` :
      `<p class="sub">Son iki işin kaldı:</p>
       <div class="box info"><b>1.</b> Staj defterini buradan yükle<br>
       <b>2.</b> Sicil fişini kapalı zarfla bölüm sekreterliğine elden götür</div>`}
    <button class="big" onclick="go('deliver')">${s === "fix_defter" ? "Defteri yeniden yükle" : "Defteri yüklemeye başla"}</button>`;

  if (s === "evaluating") h = `
    <h1>Defterin değerlendiriliyor.</h1>
    <p class="sub">Senden bir işlem beklenmiyor. Sonuç açıklanınca haber vereceğiz. Sonuçlandığında
    stajın kabul edilir ve notun OBS'ye işlenir; düzeltme istenirse ne yapacağın burada yazar.</p>
    ${a.sicil_confirmed ? '<div class="box ok">✓ Sicil fişin bölüme ulaştı. Her şey tamam.</div>'
      : a.sicil_delivered ? '<div class="box info">Sicil fişini teslim ettiğini işaretledin — komisyon zarfı alınca onaylayacak.</div>'
      : `<div class="box warn">Sicil fişini henüz götürmediysen unutma: işyerinin <b>fotoğraflı</b> doldurduğu fişi kapalı zarfla bölüm sekreterliğine elden götür.<br><br>
         <label class="check" style="border:0"><input type="checkbox" onchange="markSicil(this.checked)"> Zarfı teslim ettim</label></div>`}`;

  if (s === "accepted") h = `
    <div class="center"><div class="icon">🎓</div></div>
    <h1 class="center">${a.staj_no}. stajın kabul edildi!</h1>
    <p class="sub center">${a.staj_no < 2 ? "Notun OBS'ye işlenecek. Hazır olduğunda ikinci stajına başlayabilirsin." : "Her iki stajın da tamamlandı. Yapman gereken başka bir şey yok. 🎉"}</p>
    ${a.staj_no < 2 ? `<div class="center"><button class="big" onclick="go('accept')">2. staj başvurusunu başlat</button></div>
      <p class="after">İkinci staj da aynı adımlardan geçer: kurum bul → kabul belgesi → başvuru.</p>`
      : '<div class="box info center">Staj notların OBS\'ye işlenince orada görünecek.</div>'}`;

  // Bağlamsal yardım: her ekranın altında, bulunduğun aşamayla ilgili SSS'ye götürür.
  const TOPIC = { noplace: "staj yeri", draft: "başvuru", review: "başvuru", fix: "belge",
    sgk: "SGK", obs: "OBS", ready: "staj", during: "staj defteri", deliver: "defter teslim",
    fix_defter: "defter", evaluating: "değerlendirme", rejected: "başvuru" };
  const takildin = TOPIC[s]
    ? `<p class="hint" style="margin-top:26px">Takıldın mı?
       <button class="link" onclick="helpScreen('${TOPIC[s]}')">Bu aşamayla ilgili sık sorulan sorular</button></p>` : "";

  // ── Sağ panel: süreç, başvuru özeti, bildirimler ──
  let side = `<div class="sidecard"><h4>Staj sürecin</h4>
    <p class="hint" style="margin:0 0 8px">Yeşil ✓ tamamlandı, mavi → şu anki adımın.</p>
    <ul class="steps-v">${STAGES.map((st, i) =>
      `<li class="${i < stageNo ? "done" : (i === stageNo ? "now" : "")}">${st}</li>`).join("")}</ul>
  </div>`;

  if (a && !["draft", "noplace"].includes(s)) {
    const gunAd = { 1: "Pzt", 2: "Sal", 3: "Çar", 4: "Per", 5: "Cum" };
    const gunler = (a.calisma_gunleri || "").split(",").filter(Boolean).map(g => gunAd[g]).join("-");
    side += `<div class="sidecard"><h4>${ME.applications.length > 1 ? a.staj_no + ". staj başvurun" : "Başvurun"}</h4>
      <p class="hint" style="margin:0 0 8px">Gönderdiğin bilgilerin özeti — her an buradan bakabilirsin.</p>
      <div style="line-height:1.75">
        ${a.tur === "donem" ? `Dönem içi staj${gunler ? ` (${gunler})` : ""}` : "Yaz stajı"} · ${a.staj_no}. staj<br>
        <b>${a.kurum_adi || "—"}</b>${a.kurum_sehir ? ", " + a.kurum_sehir : ""}<br>
        ${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}${ME.progress ? `<br>${ME.progress.total} iş günü` : ""}<br>
        <span class="muted">Sorumlu: ${a.muh_ad || "—"} (${a.muh_unvan || "—"})<br>
        Ücret: ${a.ucret === "evet" ? "ödenecek" : a.ucret === "hayir" ? "ödenmeyecek" : "belirsiz"}</span>
      </div></div>`;
  }

  // Bildirim geçmişi ana sütunun altında: sol kart kısa kalıp sayfa dengesiz görünmesin.
  const notifHist = ME.notifications.length
    ? `<div style="border-top:1px solid #f3f4f6;margin-top:26px;padding-top:14px">
        <p class="muted" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:8px">Bildirimler</p>
        ${ME.notifications.slice(0, 4).map(n => `<div class="notif" style="opacity:${n.seen ? ".7" : "1"};font-size:13.5px">
          ${n.text} <span class="muted">· ${n.created_at.slice(0, 10)}</span></div>`).join("")}</div>` : "";

  // Birden çok başvuru varsa üstte staj seçici; tek başvuruda görünmez.
  const KISA = { draft: "taslak", review: "incelemede", fix: "düzeltme bekliyor", sgk: "SGK kontrolü",
    obs: "OBS kaydı", ready: "staja hazır", during: "devam ediyor", deliver: "teslim zamanı",
    evaluating: "değerlendirmede", fix_defter: "defter düzeltmesi", accepted: "kabul edildi ✓", rejected: "reddedildi" };
  // Staj sekmeleri en üstte: mevcut başvurular + (3.-4. sınıfsa) "2. stajını da aç".
  const canSecond = (ME.user.sinif ?? 3) >= 3 &&
    ME.applications.filter(x => x.status !== "rejected").length === 1 && a && s !== "noplace";
  const tabs = (ME.applications.length > 1 || canSecond)
    ? `<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
        ${ME.applications.map(x => `<button class="${x.id === a?.id ? "big" : "quiet"}"
          style="width:auto;max-width:none;padding:9px 18px;font-size:15px;margin:0"
          onclick="switchStaj(${x.id})">${x.staj_no}. Staj · ${KISA[x.stage] || x.status}</button>`).join("")}
        ${canSecond ? `<button class="quiet" style="width:auto;max-width:none;padding:9px 18px;font-size:15px;margin:0;border-style:dashed"
          onclick="go('accept')">+ 2. stajını da başlat</button>` : ""}
       </div>
       ${canSecond ? '<p class="hint" style="margin:-12px 0 18px">3. ve 4. sınıflar iki stajı aynı dönemde yapabilir; tarihler çakışmadığı sürece ikisi ayrı ayrı ilerler.</p>' : ""}` : "";

  // Mobilde yan panel alta iner; sürecin özeti üstte ince çubuk olarak kalır.
  const TONE = { fix: "tone-warn", fix_defter: "tone-warn", deliver: "tone-warn",
    accepted: "tone-ok", ready: "tone-ok" };
  el(`<div class="cols">
    <section class="colmain ${TONE[s] || ""}">
      ${tabs}
      <div class="m-only">${prog(stageNo)}</div>
      <p class="eyeb">Güncel durumun${ME.applications.length > 1 ? ` — ${a.staj_no}. staj` : ""}</p>
      ${notifs}${h}${takildin}${notifHist}
    </section>
    <aside class="colside">${side}</aside>
  </div>`);
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
    selApp = wizardApp.id;
    if (tur) wizardApp = await api("/application", { method: "PATCH", json: { tur, wizard_step: 1, app_id: wizardApp.id } });
    go("wizard");
  } catch (e) { alert(e.message); }
}

/* ───────── 7 adımlı sihirbaz ───────── */
const STEP_NAMES = ["Bilgilerin", "Staj türün", "Kurum", "Sorumlu mühendis", "Tarihler", "Belge", "Kontrol"];

async function wizard(msg) {
  nav("home");
  // Sihirbaz her zaman seçili başvuru üzerinde çalışır (iki staj olabilir).
  wizardApp = (wizardApp && wizardApp.id === ME.application?.id) ? wizardApp : ME.application;
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
    <label>Telefon numaran</label>
    <input id="telefon" type="tel" inputmode="numeric" maxlength="11" placeholder="05551234567 (sadece rakam)"
      value="${(a.telefon || "").replace(/\D/g, "")}" oninput="digitsOnly(this,11);stepCheck(1)">
    <p class="hint">Komisyonun sana ulaşması gerekirse kullanılır.</p>
    <button class="big" id="nextBtn" disabled onclick="wPhone()">Devam et</button>
    <p class="why" id="why"></p>${backB}`;

  if (n === 2) body = `
    <h1>Stajını ne zaman yapacaksın?</h1>
    <label class="radio"><input type="radio" name="t" value="yaz" ${a.tur !== "donem" ? "checked" : ""}> Yaz tatilinde</label>
    <label class="radio"><input type="radio" name="t" value="donem" ${a.tur === "donem" ? "checked" : ""}> Dönem içinde <span class="muted">(haftada en az 3 gün)</span></label>
    <div class="box info" style="font-size:14px">📅 <b>Başvuru dönemleri:</b><br>
      • Yaz stajı: <b>1 Haziran – 15 Temmuz</b> arasında<br>
      • Dönem içi: her ayın <b>10. gününe kadar</b> (10 dâhil)</div>
    <button class="big" onclick="wSave(3,{tur:document.querySelector('input[name=t]:checked').value})">Devam et</button>${backB}`;

  if (n === 3) {
    const abroad = !!a.yurtdisi;
    // Kayıtlı değerleri geri doldur: yurt dışıysa "Şehir, Ülke" biçiminde saklanır.
    let savedIl = "", savedUlke = "", savedSehir = "";
    if (abroad && a.kurum_sehir) { const p = a.kurum_sehir.split(", "); savedSehir = p[0] || ""; savedUlke = p[1] || ""; }
    else savedIl = a.kurum_sehir || "";
    const faalStd = FAALIYETLER.includes(a.kurum_faaliyet);
    body = `
    <h1>Staj yapacağın kurum</h1>
    <label>Kurumun adı</label>
    <input id="kadi" maxlength="80" value="${a.kurum_adi || ""}" placeholder="Şirketin tam adını yaz" oninput="stepCheck(3)">
    <label>Kurum nerede?</label>
    <label class="radio"><input type="radio" name="yer" value="tr" ${abroad ? "" : "checked"} onchange="yerToggle()"> Türkiye'de</label>
    <label class="radio"><input type="radio" name="yer" value="yd" ${abroad ? "checked" : ""} onchange="yerToggle()"> Yurt dışında</label>
    <div id="yerTr" style="display:${abroad ? "none" : "block"}">
      <label>İl</label>
      <select id="il" onchange="stepCheck(3)"><option value="">— il seç —</option>
        ${ILLER.map(i => `<option ${savedIl === i ? "selected" : ""}>${i}</option>`).join("")}</select>
    </div>
    <div id="yerYd" style="display:${abroad ? "block" : "none"}">
      <label>Ülke</label>
      <select id="ulke" onchange="stepCheck(3)"><option value="">— ülke seç —</option>
        ${ULKELER.map(u => `<option ${savedUlke === u ? "selected" : ""}>${u}</option>`).join("")}</select>
      <label>Şehir</label>
      <input id="ksehir" maxlength="40" value="${savedSehir}" placeholder="ör. Berlin" oninput="lettersOnly(this);stepCheck(3)">
      <div class="box warn">Yurt dışı stajında sigortanı üniversite yapamaz —
        <b>SGK'yı kendi imkânlarınla yaptırman gerekir.</b> Komisyon başvurunu buna göre değerlendirecek.</div>
    </div>
    <label>Ne üzerine çalışıyor?</label>
    <select id="faal" onchange="$('faalDsat').style.display=this.value==='Diğer'?'block':'none';stepCheck(3)">
      <option value="">— alan seç —</option>
      ${FAALIYETLER.map(f => `<option ${a.kurum_faaliyet === f ? "selected" : ""}>${f}</option>`).join("")}
      <option ${a.kurum_faaliyet && !faalStd ? "selected" : ""}>Diğer</option>
    </select>
    <div id="faalDsat" style="display:${a.kurum_faaliyet && !faalStd ? "block" : "none"}">
      <label>Kısaca yaz</label>
      <input id="faalD" value="${!faalStd ? (a.kurum_faaliyet || "") : ""}" placeholder="ör. tarım makineleri üretiyor" oninput="stepCheck(3)">
    </div>
    <button class="big" id="nextBtn" disabled onclick="wSaveKurum()">Devam et</button>
    <p class="why" id="why"></p>${backB}`;
  }

  if (n === 4) body = `
    <h1>Senden sorumlu mühendis kim?</h1>
    <label>Adı soyadı</label>
    <input id="mad" maxlength="60" value="${a.muh_ad || ""}" placeholder="Mühendisin adı ve soyadı"
      oninput="lettersOnly(this);stepCheck(4)">
    <label>Unvanı</label>
    <select id="munvan" onchange="$('dk').style.display=this.value==='Bilmiyorum'?'block':'none'">
      ${["Bilgisayar Mühendisi", "Yazılım Mühendisi", "İlgili alanda mühendis", "Bilmiyorum"]
        .map(u => `<option ${a.muh_unvan === u ? "selected" : ""}>${u}</option>`).join("")}
    </select>
    <div id="dk" style="display:${a.muh_unvan === "Bilmiyorum" ? "block" : "none"}" class="box info">
      Sorun değil — kuruma şunu sor:<br><i>“Staj süresince benden sorumlu olacak mühendisin adı ve unvanı nedir?”</i><br>
      Cevabı alınca dönüp devam edersin; bilgilerin kaydedildi. <b>Unvan öğrenilmeden başvuru gönderilemez.</b></div>
    <button class="big" id="nextBtn" disabled onclick="wSave(5,{muh_ad:$('mad').value.trim(),muh_unvan:$('munvan').value})">Devam et</button>
    <p class="why" id="why"></p>${backB}`;

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
    <button class="big" id="d5next" disabled onclick="wSaveDates()">Devam et</button>
    <p class="why" id="why">${a.start_date ? "" : "Devam etmek için başlangıç tarihini seç."}</p>${backB}`;
  }

  if (n === 6) {
    const hasKabul = ME.documents.some(d => d.kind === "kabul");
    body = `
    <h1>Kabul belgesini yükle.</h1>
    <p class="sub">Kuruma imzalattığın belge. İmza <b>ve</b> kaşe olduğundan emin ol.</p>
    ${a.ucret === "evet" ? '<div class="box info">Ücret ödeneceği için <b>EK-2 (ücret katkısı) belgesi</b> de gerekiyor — pilot sürümde kabul belgesiyle birlikte tek dosyada yükleyebilirsin.</div>' : ""}
    <div class="upload ${hasKabul ? "done" : ""}" id="up" onclick="pickFile('kabul')">
      ${hasKabul ? "✓ Belgeni aldık · <u>değiştir</u>" : "Belgeyi buraya yükle: <u>dosya seç</u><br><span class='muted'>PDF veya fotoğraf · en fazla 10 MB</span>"}</div>
    <button class="big" id="nextBtn" ${hasKabul ? "" : "disabled"} onclick="wStep(7)">Devam et</button>
    <p class="why" id="why">${hasKabul ? "" : "Devam etmek için imzalı ve kaşeli kabul belgeni yüklemelisin."}</p>${backB}`;
  }

  if (n === 7) {
    // Son adım asla hata vermez: eksikler burada listelenir, buton eksik varken kapalıdır.
    const eksik = [];
    if (!ME.documents.some(d => d.kind === "kabul")) eksik.push([6, "Kabul belgesi yüklenmedi"]);
    if (a.muh_unvan === "Bilmiyorum") eksik.push([4, "Sorumlu mühendisin unvanı seçilmedi"]);
    if (!a.start_date || !a.end_date) eksik.push([5, "Staj tarihleri seçilmedi"]);
    if (!a.kurum_adi) eksik.push([3, "Kurum bilgisi eksik"]);
    body = `
    <h1>Son kontrol.</h1>
    <div class="box info">
      ${a.tur === "donem" ? "Dönem içi staj" : "Yaz stajı"} · ${a.kurum_adi || "—"}<br>
      ${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}${ME.progress ? ` (${ME.progress.total} iş günü ✓)` : ""}<br>
      Sorumlu: ${a.muh_ad || "—"}, ${a.muh_unvan || "—"}<br>
      Kabul belgesi ${ME.documents.some(d => d.kind === "kabul") ? "✓ yüklendi" : "— yüklenmedi"}
      <p style="margin-top:8px"><button class="link" onclick="wStep(1)">Bir şeyi değiştir</button></p>
    </div>
    ${eksik.length ? `<div class="box warn"><b>Göndermeden önce şunlar tamamlanmalı:</b><br>
      ${eksik.map(([st, t]) => `• ${t} — <button class="link" onclick="wStep(${st})">Adım ${st}'e git</button>`).join("<br>")}</div>` : ""}
    <button class="big" ${eksik.length ? "disabled" : ""} onclick="wSubmit()">Başvuruyu gönder</button>
    <p class="after">${eksik.length ? "Eksikler tamamlanınca buton açılır." : "Gönderince komisyon inceleyecek; inceleme başlayana kadar değişiklik yapabilirsin."}</p>${backB}`;
  }

  el(head + body);
  if (STEP_REQ[n]) stepCheck(n);
  if (n === 5 && a.start_date) (a.end_date ? dateCheck() : onDatesInput());
}

/* Adım kilidi: gerekli alanlar dolana kadar "Devam et" kapalıdır ve nedeni
   butonun altında yazar. Böylece öğrenci hatalı/eksik bir adımı geçemez —
   sonda hata mesajı görmesi imkânsızdır. */
const telOk = (v) => { const r = v.replace(/\D/g, ""); return r.length >= 10 && r.length <= 11 && r.startsWith("0"); };

const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin",
  "Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale",
  "Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep",
  "Giresun","Gümüşhane","Hakkâri","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman",
  "Kars","Kastamonu","Kayseri","Kırıkkale","Kırklareli","Kırşehir","Kilis","Kocaeli","Konya","Kütahya","Malatya",
  "Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Siirt",
  "Sinop","Sivas","Şanlıurfa","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];
const ULKELER = ["Almanya","Amerika Birleşik Devletleri","Avusturya","Azerbaycan","Belçika","Birleşik Krallık",
  "Bosna Hersek","Bulgaristan","Çekya","Danimarka","Estonya","Finlandiya","Fransa","Gürcistan","Hollanda","İrlanda",
  "İspanya","İsveç","İsviçre","İtalya","Japonya","Kanada","Kazakistan","KKTC","Kore (Güney)","Litvanya","Macaristan",
  "Malta","Norveç","Özbekistan","Polonya","Portekiz","Romanya","Sırbistan","Slovakya","Yunanistan","Diğer"];
const FAALIYETLER = ["Yazılım geliştirme","Web teknolojileri","Mobil uygulama","Gömülü sistemler / IoT",
  "Siber güvenlik","Veri analitiği / Yapay zekâ","Oyun geliştirme","Ağ / Sistem / Donanım","Ar-Ge / Teknokent",
  "Bilişim danışmanlığı","E-ticaret","Savunma sanayii"];

function yerToggle() {
  const abroad = document.querySelector('input[name="yer"]:checked').value === "yd";
  $("yerTr").style.display = abroad ? "none" : "block";
  $("yerYd").style.display = abroad ? "block" : "none";
  stepCheck(3);
}

const STEP_REQ = {
  1: [["telefon", telOk, "0 ile başlayan 11 haneli telefon numaranı yaz"]],
  3: () => {
    const out = [];
    if (($("kadi").value || "").trim().length < 3) out.push("kurumun adını yaz");
    const abroad = document.querySelector('input[name="yer"]:checked')?.value === "yd";
    if (abroad) {
      if (!$("ulke").value) out.push("ülkeyi seç");
      if (($("ksehir").value || "").trim().length < 2) out.push("şehri yaz");
    } else if (!$("il").value) out.push("ili seç");
    const f = $("faal").value;
    if (!f) out.push("çalışma alanını seç");
    else if (f === "Diğer" && ($("faalD").value || "").trim().length < 3) out.push("ne iş yaptığını kısaca yaz");
    return out;
  },
  4: [["mad", v => v.trim().length >= 5 && v.trim().includes(" "), "mühendisin adını ve soyadını yaz"]],
};
function stepCheck(n) {
  const btn = $("nextBtn"), why = $("why");
  if (!btn) return;
  const req = STEP_REQ[n];
  const eksik = typeof req === "function" ? req()
    : (req || []).filter(([id, ok]) => !ok($(id)?.value || "")).map(([, , msg]) => msg);
  btn.disabled = eksik.length > 0;
  why.textContent = eksik.length ? "Devam etmek için: " + eksik.join(" · ") : "";
}

function wSaveKurum() {
  const abroad = document.querySelector('input[name="yer"]:checked').value === "yd";
  const sehir = abroad ? `${$("ksehir").value.trim()}, ${$("ulke").value}` : $("il").value;
  const faal = $("faal").value === "Diğer" ? $("faalD").value.trim() : $("faal").value;
  wSave(4, { kurum_adi: $("kadi").value.trim(), kurum_sehir: sehir, kurum_faaliyet: faal, yurtdisi: abroad ? 1 : 0 });
}

function wPhone() {
  const raw = $("telefon").value.replace(/\D/g, "");
  wSave(2, { telefon: raw.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4") });
}

async function wSave(nextStep, fields) {
  try {
    wizardApp = await api("/application", { method: "PATCH", json: { ...fields, wizard_step: nextStep, app_id: wizardApp.id } });
    wizard();
  } catch (e) { wizard(e.message); }
}
async function wStep(n) {
  try { wizardApp = await api("/application", { method: "PATCH", json: { wizard_step: n, app_id: wizardApp.id } }); } catch {}
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
  const payload = { start: s, tur: wizardApp.tur, days: pickedDays(), saturday: $("cmt")?.checked, app_id: wizardApp.id };
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
  if ($("why")) $("why").textContent = "";
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
    await api("/application/submit", { method: "POST", json: { app_id: wizardApp.id } });
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
    if (ME.application) fd.append("app_id", ME.application.id);
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
      // Hata ayrı pencerede değil, yükleme kutusunun içinde ve çözüm diliyle gösterilir.
      if (box) {
        box.classList.remove("done");
        box.style.borderColor = "#b45309"; box.style.color = "#92400e"; box.style.background = "#fef9e7";
        box.innerHTML = `⚠ ${e.message}<br><u>Tekrar dene</u>`;
      } else alert(e.message);
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
    <p class="after">“Gördüm” dersen sıradaki adımın OBS kaydı. “Göremiyorum” dersen durumu bölüme biz iletiriz — sana bir iş düşmez.</p>
    <p class="hint" style="text-align:center">Sigorta işlemleriyle ilgili ayrıntılı bilgi için: <b>mfstaj@balikesir.edu.tr</b></p>`);
}
async function markSgk(seen) {
  const r = await api("/sgk", { method: "POST", json: { seen, app_id: ME.application.id } });
  await refresh();
  if (r.reported) {
    el(`<div class="center" style="margin-top:30px"><div class="icon">🙌</div></div>
      <h1 class="center">Sorun değil — bölüme bildirdik.</h1>
      <p class="sub center">Komisyon seninle iletişime geçecek.<br><b>Sigortan görünmeden staja başlama.</b></p>
      <button class="big" onclick="go('home')">Tamam</button>`);
  } else go("home");
}
async function markObs() { await api("/obs", { method: "POST", json: { app_id: ME.application.id } }); await refresh(); go("home"); }
async function markSicil(v) { await api("/sicil", { method: "POST", json: { delivered: v, app_id: ME.application.id } }); await refresh(); go("home"); }

function deliverScreen() {
  nav("home");
  const total = ME.progress?.total || 20;
  const items = [`Her staj günü için ayrı sayfa hazırladım (${total} iş günü = ${total} sayfa)`,
    "Sayfaları mürekkepli kalemle, el yazısıyla doldurdum (bilgisayarda yazılmaz)",
    "Bütün sayfaları işyeri sorumlusu imzaladı", "Gerekli kaşeler sayfalarda var",
    "Kapak sayfasını ekledim", "Vlog (en az 10 dk; ilk-orta-son günlerden bölümler) bağlantısı ve QR kodu son sayfada",
    "PDF net okunuyor (bulanık/karanlık sayfa yok)", "Dosya boyutu 10 MB'ın altında"];
  el(`${back}
    <h1>Defterini yüklemeden önce kontrol et.</h1>
    <p class="sub">Eksik defterler geri döner — bu liste seni ondan kurtarır.</p>
    ${items.map(t => `<label class="check"><input type="checkbox" onchange="chk()"> ${t}</label>`).join("")}
    <button class="big" id="upBtn" disabled onclick="pickFile('defter')">Defteri seç ve gönder (PDF)</button>
    <p class="after" id="upWhy">Listeyi tamamlayınca buton açılır.</p>
    <div class="box warn"><b>Sicil fişi buraya yüklenmez.</b> İşyerinin <b>fotoğraflı</b> doldurduğu fişi kapalı zarfla bölüm sekreterliğine elden götür.<br><br>
      <label class="check" style="border:0"><input type="checkbox" ${ME.application.sicil_delivered ? "checked" : ""}
        onchange="api('/sicil',{method:'POST',json:{delivered:this.checked,app_id:ME.application.id}})"> Zarfı teslim ettim</label></div>`);
}
function chk() {
  const boxes = [...document.querySelectorAll("main .check input")].slice(0, 8);
  const all = boxes.every(b => b.checked);
  $("upBtn").disabled = !all;
  $("upWhy").textContent = all ? "Hazırsın — gönderebilirsin." : "Listeyi tamamlayınca buton açılır.";
}

/* ───────── Belgelerim ─────────
   Sade görünüm: her belge tek satır özet + görünür İndir butonu.
   "Kim doldurur, nereye gider?" ayrıntıları isteyene açılır. */
const belgeKart = (b) => `
  <div class="doc">
    <div class="doc-top">
      <span class="doc-ad">${b.icon} ${b.ad}${b.resmi ? ` <span class="muted">(${b.resmi})</span>` : ""}</span>
      ${b.indir ? `<a class="doc-indir" href="${b.indir}" download>İndir</a>` : ""}
    </div>
    <p class="doc-sum">${b.nedir}</p>
    <details class="doc-det"><summary>Kim doldurur, nereye gider?</summary>
      <table>${[["Neden gerekiyor?", b.neden], ["Kim dolduracak?", b.doldurur],
        ["Kim imzalayacak?", b.imzalar], ["Kaşe gerekiyor mu?", b.kase],
        ["Ne zaman?", b.nezaman], ["Nereye?", b.nereye]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
      </table>
    </details>
  </div>`;

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
    { icon: "📊", ad: "Ücret katkısı başvuru evrakı", resmi: "EK-3",
      nedir: "Staj ücreti alacak öğrenciler için İşsizlik Fonu katkısı başvurusunda kullanılan öğrenci bilgi tablosu (Excel).",
      neden: "EK-2 formuyla birlikte devlet katkısının bağlanması için gerekir. Kamu kurumunda staj yapanlar doldurmaz. Önemli: 1. stajın SGK çıkışı yapılmadan sonraki staj için yeni sigorta girişi yapılamaz.",
      doldurur: "Kendi satırını sen doldurursun (ad, TC, öğrenci no, telefon, doğum tarihi…).",
      nezaman: "Yalnızca 'ücret ödenecek' dediysen; başvuruyla birlikte.", nereye: "Bu sisteme yüklenir.",
      indir: "/belgeler/staj-ucreti-fon-katkisi-basvuru-evraki.xlsx" },
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
      nedir: "Staj deneyimini anlatan, toplam <b>en az 10 dakikalık</b> video. Yaptığın işleri, deneyimlerini ve çalışma ortamını gösteren kısa videolardan oluşur.",
      neden: "Bölüm gereksinimidir; komisyon stajın gerçekliğini ve deneyimini bununla görür.",
      doldurur: "Sen çekersin — işyerinin <b>izin verdiği bölümlerde, izin verdiği şekilde</b>. Online stajda, sen çalışırken ekran görüntüsünün canlı aktığı video parçaları da olur.",
      nezaman: "Staj süresince: <b>ilk, orta ve son günlerden</b> bölümler içermeli. Son gün birkaç fotoğrafla olmaz — baştan planla.",
      nereye: "Video YouTube vb. bir platforma yüklenir; bağlantısı hem <b>normal link</b> hem <b>QR kod</b> olarak defterin <b>son sayfasına</b> eklenir." },
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
  // Yatay ızgara düzeni: her grup bir panel, belgeler yan yana kartlar.
  // Öğrencinin bulunduğu aşamanın grubu en üstte ve işaretli.
  const stageGroup = ["noplace", "draft", "review", "fix", "rejected"].includes(ME.stage)
    ? "Başvurudan önce gerekenler"
    : ["sgk", "obs", "ready", "during"].includes(ME.stage)
      ? "Staj sırasında kullanacakların" : "Teslim ederken gerekenler";
  const mine = ME.documents.length
    ? `<div class="box ok" style="margin-top:0">✅ Yüklediklerin: ${ME.documents.map(d =>
        `${d.kind === "kabul" ? "kabul belgesi" : "staj defteri"} (${d.uploaded_at.slice(0, 10)})`).join(" · ")}</div>` : "";
  const grupPanel = (grup, items, aktif) => `
    <section class="panel">
      <h1 style="font-size:19px;margin-bottom:2px;${aktif ? "color:#1d4ed8" : ""}">${grup}
        ${aktif ? '<span style="font-size:13px;font-weight:600;background:#eef3ff;border-radius:99px;padding:3px 12px;margin-left:8px;vertical-align:2px">şu an bu aşamadasın</span>' : ""}</h1>
      <div class="docgrid">${items.map(belgeKart).join("")}</div>
    </section>`;
  const sirali = [[stageGroup, BELGELER[stageGroup], true],
    ...Object.entries(BELGELER).filter(([g]) => g !== stageGroup).map(([g, i]) => [g, i, false])];
  el(`<div data-full>
    <h1>Belgelerim</h1>
    <p class="sub">Her belgenin ne olduğu yanında yazar, İndir butonuyla alırsın.
    "Kim doldurur, nereye gider?" satırına tıklarsan ayrıntısını görürsün.</p>
    ${mine}
    ${sirali.map(([g, i, a]) => grupPanel(g, i, a)).join("")}
  </div>`);
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
  const now = STAGE_NO[ME.stage] ?? -1;
  el(`<div data-full>
    <h1>Staj süreci, baştan sona</h1>
    <p class="sub">12 adımın tamamı aşağıda. Ezberlemene gerek yok — sisteme her girdiğinde hangi
    adımdaysan onu zaten gösteririz. Yeşil adımları tamamladın, mavi çerçeveli adım şu an bulunduğun yer.</p>
    <div class="rehgrid">
      ${REHBER.map(([ad, ne, gorev], i) => `
        <div class="rehcard ${i < now ? "done" : i === now ? "now" : ""}">
          <span class="rehno">${i < now ? "✓" : i + 1}</span>
          <h3>${ad}${i === now ? ' <span style="color:#1d4ed8;font-size:13px">· buradasın</span>' : ""}</h3>
          <p>${ne}</p>
          <p style="margin-top:6px"><b>Senin görevin:</b> ${gorev}</p>
        </div>`).join("")}
    </div>
    <div class="box info" style="margin-top:20px">Bölümde toplam <b>iki staj</b> yapılır (2 × 20 iş günü = 40 iş günü). İkisi de aynı adımlardan geçer.</div>
  </div>`);
}

/* ───────── Profil ───────── */
async function profilScreen(msg) {
  nav(null);
  const KISA2 = { draft: "taslak", review: "incelemede", fix: "düzeltme bekliyor", sgk: "SGK kontrolü",
    obs: "OBS kaydı", ready: "staja hazır", during: "devam ediyor", deliver: "teslim zamanı",
    evaluating: "değerlendirmede", fix_defter: "defter düzeltmesi", accepted: "kabul edildi ✓", rejected: "reddedildi" };
  el(`<h1>Profilim</h1>
    <p class="sub">Bilgilerin öğrenci kayıtlarından gelir; yanlışlık varsa bölüm sekreterliğine bildir.</p>
    ${msg ? `<div class="box ok">${msg}</div>` : ""}
    <div class="box info" style="max-width:none">
      <b>${ME.user.name}</b><br>
      Öğrenci No: ${ME.user.no} · ${ME.user.sinif}. sınıf · Bilgisayar Mühendisliği
      ${ME.user.email ? `<br>E-posta: ${ME.user.email}` : ""}
    </div>
    <h1 style="font-size:18px;margin-top:24px">Stajlarım</h1>
    ${ME.applications.length ? ME.applications.map(x =>
      `<div class="box ${x.stage === "accepted" ? "ok" : "info"}" style="max-width:none">
        <b>${x.staj_no}. Staj</b> — ${KISA2[x.stage] || x.status}
        <button class="link" style="margin-left:10px" onclick="switchStaj(${x.id})">görüntüle</button></div>`).join("")
      : '<p class="muted">Henüz staj başvurun yok.</p>'}
    <h1 style="font-size:18px;margin-top:24px">Şifremi değiştir</h1>
    <label>Yeni şifren</label>
    <input id="npw" type="password" maxlength="64" placeholder="En az 8 karakter">
    <button class="big" onclick="changePw()">Şifreyi güncelle</button>
    <p class="why" id="pwWhy"></p>`);
}
async function changePw() {
  try {
    await api("/set-password", { method: "POST", json: { password: $("npw").value } });
    profilScreen("✓ Şifren güncellendi. Bir sonraki girişte yeni şifreni kullan.");
  } catch (e) { $("pwWhy").textContent = e.message; }
}

/* ───────── Yardım ───────── */
async function helpScreen(prefill) {
  nav("help");
  const faq = await api("/faq");
  const myQs = await api("/questions");
  const cats = [...new Set(faq.map(f => f.category))];
  el(`<div data-full>
    <h1>Yardım</h1>
    <p class="sub">Sorunu kendi cümlenle yaz — büyük ihtimalle cevabı hazır. Bulamazsan komisyona iletirsin.</p>
    <section class="panel">
      <input id="fq" style="max-width:none;font-size:17px;padding:15px 18px" value="${prefill || ""}"
        placeholder="🔍  Sorunu yaz, ör: staj defterini ne zaman teslim edeceğim?" oninput="faqSearch()">
      <div style="margin-top:12px">${cats.map(c =>
        `<button class="quiet" style="min-width:0;padding:7px 16px;font-size:14px;margin:4px 6px 0 0"
          onclick="$('fq').value='${c}';faqSearch()">${c}</button>`).join("")}</div>
      <div id="fres"></div>
    </section>
    <div class="helpgrid">
      <section class="panel" style="margin-bottom:0">
        <h1 style="font-size:19px">Çok sorulanlar</h1>
        <p class="muted" style="margin-bottom:10px">Soruya tıkla, cevabı altında açılır.</p>
        ${faq.slice(0, 7).map(f => `<div class="qa"><div class="q" onclick="this.parentNode.classList.toggle('open')">${f.q}</div><div class="a">${f.a}</div></div>`).join("")}
      </section>
      <div>
        <section class="panel">
          <h1 style="font-size:19px">Cevabını bulamadın mı?</h1>
          <p class="muted" style="margin-bottom:10px">Sorunu doğrudan staj komisyonuna ilet; cevap gelince bildirim alırsın.</p>
          <button class="big" style="min-width:0;width:100%" onclick="askScreen()">Komisyona soru gönder</button>
        </section>
        ${myQs.length ? `<section class="panel">
          <h1 style="font-size:19px">Sorularım</h1>
          ${myQs.map(q => `<div class="qa ${q.answer ? "open" : ""}"><div class="q">${q.answer ? "✅" : "⏳"} ${q.text}</div>
            <div class="a">${q.answer || "Henüz cevaplanmadı — cevap gelince bildirim alacaksın."}</div></div>`).join("")}
        </section>` : ""}
      </div>
    </div>
  </div>`);
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
      <div class="box info" style="font-size:14px">Makul sürede cevap alamazsan sırasıyla:<br>
        <b>1.</b> huseyingunes@gmail.com adresine yaz<br>
        <b>2.</b> O da olmazsa Teams'ten Hüseyin Güneş veya Hüseyin Ezirmik hocalara ulaş</div>
      <button class="big" onclick="go('home')">Tamam</button>`);
  } catch (e) { alert(e.message); }
}

/* ───────── Yönlendirme ───────── */
const routes = { home, wizard, sgk: sgkScreen, deliver: deliverScreen, docs: docsScreen,
  help: helpScreen, accept: acceptScreen, guide: guideScreen, profil: profilScreen };
async function go(name) {
  try { await refresh(); } catch { return loginScreen(); }
  (routes[name] || home)();
}

(async () => {
  try {
    await refresh();
    // ?sayfa=docs gibi bir adresle doğrudan bir bölüm açılabilir (yer imi desteği)
    go(new URLSearchParams(location.search).get("sayfa") || "home");
  } catch { loginScreen(); }
})();
