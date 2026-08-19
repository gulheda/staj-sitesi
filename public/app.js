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

// Profil ve bildirim menüleri; dışarı tıklanınca kapanır
function toggleUmenu(e) { e.stopPropagation(); $("nmenu")?.classList.remove("open"); $("umenu").classList.toggle("open"); }
function toggleNotif(e) {
  e.stopPropagation();
  $("umenu")?.classList.remove("open");
  const m = $("nmenu");
  if (!m.classList.contains("open")) {
    m.innerHTML = ME?.notifications?.length
      ? ME.notifications.map(n => `<div class="nitem ${n.seen ? "" : "new"}">${n.text}<br>
          <span class="muted" style="font-size:12.5px">${n.created_at.slice(0, 10)}</span></div>`).join("")
      : '<div class="nitem" style="color:var(--mut)">Henüz bildirimin yok.</div>';
  }
  m.classList.toggle("open");
  const nc = $("ncount"); if (nc) nc.style.display = "none"; // menü açılınca sayaç söner
}
document.addEventListener("click", () => { $("umenu")?.classList.remove("open"); $("nmenu")?.classList.remove("open"); });

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
  // Yeni bildirim sayacı: varsa zilin üstünde kırmızı rozet yanar
  const yeni = ME?.notifications?.filter(n => !n.seen).length || 0;
  const nc = $("ncount");
  if (nc) { nc.textContent = yeni; nc.style.display = yeni ? "flex" : "none"; }
}

const STAGES = ["Staj yeri bulma", "Belgeleri hazırlama", "Başvuru", "Komisyon incelemesi", "Onay",
  "SGK kontrolü", "OBS kaydı", "Staj", "Defter hazırlama", "Teslim", "Değerlendirme", "Tamamlandı"];
const STAGE_NO = { noplace: 0, draft: 2, review: 3, fix: 3, rejected: 3, sgk: 5, obs: 6,
  ready: 7, during: 7, deliver: 9, evaluating: 10, fix_defter: 9, accepted: 12 };

// Sade ilerleme çubuğu: tek satır. Adımların tam listesi sağdaki
// "Staj sürecin" panelinde zaten var — burada tekrar edilmez.
function prog(now) {
  const pct = Math.round(now / STAGES.length * 100);
  return `<div class="prog">
    <div class="bar"><i style="width:${pct}%"></i></div>
    <div class="txt"><span>Adım ${now}/12 · ${STAGES[now] ?? "Bitti"}</span><span>%${pct}</span></div>
  </div>`;
}

const back = `<div class="backrow"><button class="link" onclick="go('home')">← Stajıma dön</button></div>`;
const errBox = (m) => `<div class="box err">${m}</div>`;
const fmtDate = (s) => s ? new Date(s + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "";
const daysTo = (s) => Math.ceil((new Date(s) - new Date(ME.today)) / 86400000);

let selApp = null; // seçili staj başvurusunun id'si (3.-4. sınıfta iki başvuru olabilir)
async function refresh() {
  ME = await api("/me" + (selApp ? "?app=" + selApp : ""));
  selApp = ME.application?.id || null;
  // İki başvurusu olan öğrencide zemin staja göre değişir:
  // 1. staj beyaz, 2. staj gri — hangi stajda olduğun renkten belli olur.
  document.body.classList.toggle("staj2",
    (ME.applications?.length || 0) > 1 && ME.application?.staj_no === 2);
}
function switchStaj(id) { selApp = id; go("home"); }

// Stajım ekranı açıkken durum canlı tutulur: 30 sn'de bir ve pencereye
// dönüldüğünde tazelenir — komisyonun kararı öğrenciye kendiliğinden düşer.
let curRoute = null;
setInterval(() => {
  const a = document.activeElement;
  if (curRoute !== "home" || document.hidden) return;
  if (a && ["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName)) return;
  go("home");
}, 30000);
window.addEventListener("focus", () => { if (curRoute === "home") go("home"); });

/* ───────── Giriş ─────────
   Sayısal alanlar yalnız rakam kabul eder ve hane sınırını aşamaz —
   harf yazmak veya fazla hane girmek fiziksel olarak imkânsızdır. */
function digitsOnly(elm, max) {
  elm.value = elm.value.replace(/\D/g, "").slice(0, max);
}
function lettersOnly(elm) {
  elm.value = elm.value.replace(/[0-9]/g, "");
}

function loginScreen(msg) {
  $("topbar").style.display = "none";
  document.body.classList.remove("staj2");
  // Tek form, tek yol: ilk kez giren şifre alanına TC'sini yazar,
  // sistem onu tanıyıp şifre oluşturmaya götürür. Ayrı "ilk giriş" ekranı yoktur.
  // Aynı bilgi yalnızca BİR yerde söylenir (tek küçük ipucu satırı) — tekrar yok.
  // Numara tarayıcıda hatırlanır; Enter her iki alandan da çalışır.
  const sonNo = localStorage.getItem("sonNo") || "";
  el(`
    <div style="max-width:460px;margin:40px auto">
      <h1>BAÜN Staj Portalı</h1>
      <p class="sub">Bilgisayar Mühendisliği staj işlemlerinin tamamı burada.</p>
      ${msg ? errBox(msg) : ""}
      <label>Öğrenci numaran</label>
      <input id="no" type="text" inputmode="numeric" maxlength="12" placeholder="Sadece rakam"
        autocomplete="username" value="${sonNo}" oninput="digitsOnly(this,12)"
        onkeydown="if(event.key==='Enter')$('pw').focus()">
      <label>Şifren</label>
      <div style="position:relative;max-width:580px">
        <input id="pw" type="password" maxlength="64" placeholder="Şifren"
          autocomplete="current-password" style="padding-right:52px"
          onkeydown="if(event.key==='Enter')doLogin()">
        <button type="button" onclick="const p=$('pw');p.type=p.type==='password'?'text':'password';this.textContent=p.type==='password'?'👁':'🙈'"
          style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:0;background:none;cursor:pointer;font-size:19px;padding:6px" title="Şifreyi göster/gizle">👁</button>
      </div>
      <p class="hint">İlk kez giriyorsan: şifre yerine <b>TC kimlik numaranı</b> yaz.</p>
      <button class="big" id="loginBtn" onclick="doLogin()" style="width:100%;min-width:0">Giriş yap</button>
      <p class="center" style="margin-top:14px">
        <button class="link" style="font-size:13.5px"
          onclick="alert('Pilot sürümde şifre sıfırlama bölüm sekreterliği üzerinden yapılıyor.')">Şifremi unuttum</button>
      </p>
    </div>`);
  ($("no").value ? $("pw") : $("no")).focus();
}

async function doLogin() {
  const btn = $("loginBtn");
  if (btn.disabled) return; // çift tıklama koruması
  btn.disabled = true; btn.textContent = "Kontrol ediliyor…";
  try {
    const no = $("no").value.trim();
    const r = await api("/login", { method: "POST", json: { no, pass: $("pw").value.trim() } });
    localStorage.setItem("sonNo", no); // bir dahaki girişte numara hazır gelir
    if (r.firstLogin) return setPassScreen(r.name);
    if (r.role === "admin") { location.href = "/admin.html"; return; }
    await refresh(); go("home");
  } catch (e) { loginScreen(e.message); }
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
    await refresh(); go("home");
  } catch (e) { setPassScreen(ME?.user?.name || "", e.message); }
}

async function logout() { await api("/logout", { method: "POST" }); loginScreen(); }

/* ───────── Tanıtım turu ─────────
   İlk kez giren ve henüz başvurusu olmayan öğrenciye kendiliğinden açılır.
   Yazı duvarı değil: her ekranda tek konu, büyük simge, üç kısa satır.
   Rehber sayfasından her zaman yeniden izlenebilir. */
const TOUR = [
  { icon: "👋", title: "Hoş geldin!", sub: "1 dakikada bütün süreci görelim.", items: [
    ["🎯", "Staj işlerinin <b>tamamı</b> bu tek adreste: başvuru, takip, soru, defter teslimi."],
    ["🧭", "Sistem sana her an <b>tek bir şey</b> söyler: sıradaki adımını."],
    ["🔔", "Gelişmeler üstteki zile bildirim olarak düşer — hiçbir şeyi kaçırmazsın."]] },
  { icon: "🏢", title: "1 · Staj yerini bul", sub: "Süreç sistem dışında, kurum aramakla başlar.", items: [
    ["👷", "Tek şart: kurumda senden sorumlu olacak <b>bilgisayar/yazılım mühendisi</b> olmalı."],
    ["❓", "Emin değilsen kuruma sorulacak hazır soruyu sistem sana verir."],
    ["🌍", "Kurum Türkiye'de veya yurt dışında olabilir."]] },
  { icon: "📄", title: "2 · Kabul belgesini imzalat", sub: "Kurum seni kabul ettiğini imzayla gösterir.", items: [
    ["📋", "Doğru formu (EK-1) staj türüne göre <b>sistem verir</b> — sen seçmezsin."],
    ["✒️", "Kurum yetkilisi <b>imzalar ve kaşeler</b> — ikisi de şart."],
    ["⏰", "Staj başlangıcından <b>en az 20 gün önce</b> hazır olmalı."]] },
  { icon: "📝", title: "3 · Başvurunu doldur", sub: "6 kısa adım — hepsi bu sitede.", items: [
    ["🪜", "Her adım kendiliğinden kaydedilir; yarıda bırakıp sonra devam edebilirsin."],
    ["🧮", "İş günü hesabını (20 iş günü) <b>sistem yapar</b>, tatilleri o düşünür."],
    ["🚫", "Eksik varken başvuru <b>gönderilemez</b> — yanlış yapman imkânsız."]] },
  { icon: "🛡️", title: "4 · Onaydan staja", sub: "Bu bölümde işin çoğu bizde.", items: [
    ["🔎", "Komisyon başvurunu inceler (genellikle 5 iş günü) — sonucu bildirimle alırsın."],
    ["🏥", "Sigortanı <b>üniversite yapar</b>; sen e-Devlet'ten sadece kontrol edersin."],
    ["💻", "Son adım: OBS'de staj dersini seçmek."]] },
  { icon: "✍️", title: "5 · Staj günlerin", sub: "Staj boyunca iki alışkanlık edin.", items: [
    ["📄", "Her iş günü için <b>1 defter sayfası</b> — el yazısıyla, o gün doldur."],
    ["✅", "Her sayfayı işyerindeki sorumluna <b>imzalat</b> — son güne bırakma."],
    ["🎬", "Vlog çek: <b>ilk, orta ve son günlerden</b> bölümler, toplam en az 10 dakika."]] },
  { icon: "📗", title: "6 · Teslim ve sonuç", sub: "Staj bitti — iki teslimat kaldı.", items: [
    ["⬆️", "Defterini tek PDF olarak <b>buraya</b> yüklersin — kontrol listesi sana eşlik eder."],
    ["✉️", "Sicil fişini kapalı zarfla bölüm sekreterliğine <b>elden</b> götürürsün."],
    ["🎓", "Komisyon değerlendirir, notun OBS'ye işlenir. Hepsi bu!"]] },
];
function tour(n = 0) {
  nav(null);
  curRoute = "tour";
  const t = TOUR[n], son = n === TOUR.length - 1;
  el(`<div class="tour">
    <div class="ticon">${t.icon}</div>
    <h1>${t.title}</h1>
    <p class="tsub">${t.sub}</p>
    <div class="titems">
      ${t.items.map(([i, x]) => `<div class="titem"><span class="ti">${i}</span><span>${x}</span></div>`).join("")}
    </div>
    <div class="tdots">${TOUR.map((_, i) => `<i class="${i === n ? "on" : ""}"></i>`).join("")}</div>
    <div>
      ${n > 0 ? `<button class="quiet" onclick="tour(${n - 1})">← Geri</button>` : ""}
      <button class="big" onclick="${son ? "go('home')" : `tour(${n + 1})`}">${son ? "Başlayalım 🚀" : "Devam →"}</button>
    </div>
    ${son ? "" : `<p style="margin-top:6px"><button class="link" style="font-size:14px;color:var(--mut)" onclick="go('home')">Turu geç</button></p>`}
  </div>`);
}

/* ───────── Stajım (durum odaklı ana ekran) ───────── */
function home() {
  nav("home");
  const s = ME.stage, a = ME.application;
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
    <button class="big" onclick="go('wizard')">Devam et (Adım ${Math.min(a.wizard_step, 6)}/6)</button>`;

  if (s === "review") h = `
    <h1>Başvurun inceleniyor.</h1>
    <p class="sub">Senden bir işlem beklenmiyor. Genellikle <b>5 iş günü</b> içinde sonuçlanır — bildirimle haber vereceğiz.</p>
    <div class="box info"><b>Bu arada yapabileceklerin:</b><br>
      • <button class="link" onclick="go('docs')">Defter sayfası şablonunu şimdiden indir</button><br>
      • <button class="link" onclick="go('guide')">Sürecin devamında seni neler bekliyor, göz at</button><br>
      • 🎬 Vlog için fikir toplamaya başla — stajın ilk gününden çekim yapman gerekecek</div>`;

  if (s === "fix") {
    const gerekli = a.ucret === "evet"
      ? [BELGE_YUKLE.kabul, BELGE_YUKLE.ek2, BELGE_YUKLE.ek3]
      : [BELGE_YUKLE.kabul, BELGE_YUKLE.ek3];
    h = `
    <h1>Bir belgeyi düzeltmen gerekiyor.</h1>
    <p class="sub">Komisyonun notu:</p>
    <div class="box warn"><b>${a.fix_note || "Belgende düzeltme istendi."}</b></div>
    ${gerekli.length > 1 ? '<p class="hint">Yalnızca komisyonun notta belirttiği belgeyi yeniden yüklemen yeterli.</p>' : ""}
    ${gerekli.map(b => uploadBox(b, false)).join("")}
    <p class="after">Yeni belgen doğrudan komisyona gidecek.</p>`;
  }

  if (s === "rejected") h = `
    <h1>Başvurun kabul edilmedi.</h1>
    <div class="box warn">${a.fix_note || "Gerekçe için bölümle iletişime geçebilirsin."}</div>
    <button class="big" onclick="startApplication()">Yeni başvuru yap</button>`;

  if (s === "sgk") {
    const sgkSon = new Date(new Date(a.start_date) - 3 * 86400000).toISOString().slice(0, 10);
    h = `
    <h1>Başvurun onaylandı ✓</h1>
    <p class="sub">Stajın <b>${fmtDate(a.start_date)}</b>'de başlıyor${daysTo(a.start_date) > 0 ? ` — ${daysTo(a.start_date)} gün kaldı` : ""}. Başlamadan önce tek bir işin var:</p>
    <div class="box info"><b>Sigorta (SGK) girişini kontrol et.</b><br>
      Sigortanı üniversite yapar — sen sadece yapılmış mı diye bakacaksın. 2 dakika sürer.<br>
      <span class="muted">Son kontrol günün: ${fmtDate(sgkSon)}</span></div>
    <button class="big" onclick="go('sgk')">Nasıl bakacağımı göster</button>`;
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
    <div class="box warn"><b>Her gün defter sayfanı doldur ve imzalat.</b> Son güne bırakma — en çok yapılan hata bu.
      ${pr.done <= 2 ? '<br><br>🎬 <b>Vlog çekimine bugün başla:</b> videon stajın <b>ilk</b>, orta ve son günlerinden bölümler içermeli. Son gün birkaç fotoğrafla olmaz.' : ""}</div>
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
    const gunAd = { 1: "Pzt", 2: "Sal", 3: "Çar", 4: "Per", 5: "Cum", 6: "Cts" };
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

  // Bildirimler bu sayfada değil, üst bantta zilin (🔔) altında durur.
  // Birden çok başvuru varsa üstte staj seçici; tek başvuruda görünmez.
  const KISA = { draft: "taslak", review: "incelemede", fix: "düzeltme bekliyor", sgk: "SGK kontrolü",
    obs: "OBS kaydı", ready: "staja hazır", during: "devam ediyor", deliver: "teslim zamanı",
    evaluating: "değerlendirmede", fix_defter: "defter düzeltmesi", accepted: "kabul edildi ✓", rejected: "reddedildi" };
  // Staj sekmeleri en üstte: mevcut başvurular + (3.-4. sınıfsa) "2. stajını da aç".
  const canSecond = (ME.user.sinif ?? 3) >= 3 &&
    ME.applications.filter(x => x.status !== "rejected").length === 1 && a && s !== "noplace";
  // İki staj = iki ayrı ekran: seçili sekme koyu, 2. staja geçince bütün
  // sayfa griye döner (1. staj beyaz kalır). Bakan herkes hangi stajda
  // olduğunu renkten anlar; iki başvuru birbirinden bağımsız ilerler.
  const tabs = (ME.applications.length > 1 || canSecond)
    ? `<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
        ${ME.applications.map(x => `<button class="tab ${x.id === a?.id ? "on" : ""}"
          onclick="switchStaj(${x.id})">${x.id === a?.id ? "▸ " : ""}${x.staj_no}. Staj · ${KISA[x.stage] || x.status}</button>`).join("")}
        ${canSecond ? `<button class="tab add" onclick="go('accept')">+ 2. stajını da başlat</button>` : ""}
       </div>
       ${ME.applications.length > 1 ? `<div class="stajbar">Şu an: ${a.staj_no}. staj${a.staj_no === 2 ? " (mavi)" : ""}</div>` : ""}
       ${canSecond ? '<p class="hint" style="margin:-8px 0 18px">3. ve 4. sınıflar iki stajı aynı dönemde yapabilir; tarihler çakışmadığı sürece ikisi ayrı ayrı ilerler.</p>' : ""}` : "";

  // Mobilde yan panel alta iner; sürecin özeti üstte ince çubuk olarak kalır.
  const TONE = { fix: "tone-warn", fix_defter: "tone-warn", deliver: "tone-warn",
    accepted: "tone-ok", ready: "tone-ok" };
  el(`<div class="cols">
    <section class="colmain ${TONE[s] || ""}">
      ${tabs}
      ${prog(stageNo)}
      ${h}${takildin}
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
const STEP_NAMES = ["Bilgilerin", "Kurum", "Sorumlu mühendis", "Tarihler", "Belge", "Kontrol"];

async function wizard(msg) {
  nav("home");
  // Sihirbaz her zaman seçili başvuru üzerinde çalışır (iki staj olabilir).
  wizardApp = (wizardApp && wizardApp.id === ME.application?.id) ? wizardApp : ME.application;
  const a = wizardApp, n = Math.min(a.wizard_step || 1, 6);
  const head = `<div class="prog"><div class="bar"><i class="blue" style="width:${Math.round(n / 6 * 100)}%"></i></div>
    <div class="txt"><span>Adım ${n}/6 · ${STEP_NAMES[n - 1]}</span></div></div>${msg ? errBox(msg) : ""}`;
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


  if (n === 2) {
    const abroad = !!a.yurtdisi;
    // Kayıtlı değerleri geri doldur: yurt dışıysa "Şehir, Ülke" biçiminde saklanır.
    let savedIl = "", savedUlke = "", savedSehir = "";
    if (abroad && a.kurum_sehir) { const p = a.kurum_sehir.split(", "); savedSehir = p[0] || ""; savedUlke = p[1] || ""; }
    else savedIl = a.kurum_sehir || "";
    const faalStd = FAALIYETLER.includes(a.kurum_faaliyet);
    body = `
    <h1>Staj yapacağın kurum</h1>
    <label>Kurumun adı</label>
    <input id="kadi" maxlength="80" value="${a.kurum_adi || ""}" placeholder="Şirketin tam adını yaz" oninput="stepCheck(2)">
    <label>Kurum nerede?</label>
    <label class="radio"><input type="radio" name="yer" value="tr" ${abroad ? "" : "checked"} onchange="yerToggle()"> Türkiye'de</label>
    <label class="radio"><input type="radio" name="yer" value="yd" ${abroad ? "checked" : ""} onchange="yerToggle()"> Yurt dışında</label>
    <div id="yerTr" style="display:${abroad ? "none" : "block"}">
      <label>İl</label>
      <select id="il" onchange="stepCheck(2)"><option value="">— il seç —</option>
        ${ILLER.map(i => `<option ${savedIl === i ? "selected" : ""}>${i}</option>`).join("")}</select>
    </div>
    <div id="yerYd" style="display:${abroad ? "block" : "none"}">
      <label>Ülke</label>
      <select id="ulke" onchange="stepCheck(2)"><option value="">— ülke seç —</option>
        ${ULKELER.map(u => `<option ${savedUlke === u ? "selected" : ""}>${u}</option>`).join("")}</select>
      <label>Şehir</label>
      <input id="ksehir" maxlength="40" value="${savedSehir}" placeholder="ör. Berlin" oninput="lettersOnly(this);stepCheck(3)">
      <div class="box warn">Yurt dışı stajında sigortanı üniversite yapamaz —
        <b>SGK'yı kendi imkânlarınla yaptırman gerekir.</b> Komisyon başvurunu buna göre değerlendirecek.</div>
    </div>
    <label>Ne üzerine çalışıyor?</label>
    <select id="faal" onchange="$('faalDsat').style.display=this.value==='Diğer'?'block':'none';stepCheck(2)">
      <option value="">— alan seç —</option>
      ${FAALIYETLER.map(f => `<option ${a.kurum_faaliyet === f ? "selected" : ""}>${f}</option>`).join("")}
      <option ${a.kurum_faaliyet && !faalStd ? "selected" : ""}>Diğer</option>
    </select>
    <div id="faalDsat" style="display:${a.kurum_faaliyet && !faalStd ? "block" : "none"}">
      <label>Kısaca yaz</label>
      <input id="faalD" value="${!faalStd ? (a.kurum_faaliyet || "") : ""}" placeholder="ör. tarım makineleri üretiyor" oninput="stepCheck(2)">
    </div>
    <button class="big" id="nextBtn" disabled onclick="wSaveKurum()">Devam et</button>
    <p class="why" id="why"></p>${backB}`;
  }

  if (n === 3) body = `
    <h1>Senden sorumlu mühendis kim?</h1>
    <label>Adı soyadı</label>
    <input id="mad" maxlength="60" value="${a.muh_ad || ""}" placeholder="Mühendisin adı ve soyadı"
      oninput="lettersOnly(this);stepCheck(3)">
    <label>Unvanı</label>
    <select id="munvan" onchange="$('dk').style.display=this.value==='Bilmiyorum'?'block':'none'">
      ${["Bilgisayar Mühendisi", "Yazılım Mühendisi", "Bilmiyorum"]
        .map(u => `<option ${a.muh_unvan === u ? "selected" : ""}>${u}</option>`).join("")}
    </select>
    <div id="dk" style="display:${a.muh_unvan === "Bilmiyorum" ? "block" : "none"}" class="box info">
      Sorun değil — kuruma şunu sor:<br><i>“Staj süresince benden sorumlu olacak mühendisin adı ve unvanı nedir?”</i><br>
      Cevabı alınca dönüp devam edersin; bilgilerin kaydedildi. <b>Unvan öğrenilmeden başvuru gönderilemez.</b></div>
    <button class="big" id="nextBtn" disabled onclick="wSave(4,{muh_ad:$('mad').value.trim(),muh_unvan:$('munvan').value})">Devam et</button>
    <p class="why" id="why"></p>${backB}`;

  if (n === 4) {
    const donem = a.tur === "donem";
    const savedDays = (a.calisma_gunleri || "").split(",").filter(Boolean).map(Number);
    // Cumartesi de seçilebilir bir gündür (komisyon onayına tabi);
    // varsayılan olarak yalnız hafta içi işaretli gelir. Pazar hiç yoktur.
    const DAY_NAMES = [[1, "Pzt"], [2, "Sal"], [3, "Çar"], [4, "Per"], [5, "Cum"], [6, "Cts"]];
    body = `
    <h1>Başlangıç tarihini seç, gerisini biz hesaplayalım.</h1>
    <p class="sub">Sen başlangıcı seç; 20 iş gününü tamamlayan bitiş tarihini sistem bulur.
    Hafta sonları ve resmî tatiller hesaba katılmaz.</p>
    ${donem ? `
    <label>Hangi günler çalışacaksın? <span class="muted">(en az 3 gün)</span></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      ${DAY_NAMES.map(([v, t]) => `<label class="radio" style="margin:0;padding:10px 14px">
        <input type="checkbox" class="wday" value="${v}" ${savedDays.length ? (savedDays.includes(v) ? "checked" : "") : (v <= 5 ? "checked" : "")}
        onchange="onDatesInput(true)"> ${t}</label>`).join("")}
    </div>
    <p class="hint">Ders programınla çakışmayan günleri işaretli bırak — en az 3 gün seçili kalmalı.
    Cumartesi seçersen komisyon onayına tabidir; pazar günleri hiçbir koşulda sayılmaz.</p>` : `
    <label class="check" style="border:0;margin-top:14px"><input type="checkbox" id="cmt" ${a.cumartesi ? "checked" : ""}
      onchange="onDatesInput(true)"> Cumartesileri de çalışacağım
      <span class="muted">(komisyon onayına tabidir; pazar günleri hiçbir koşulda sayılmaz)</span></label>`}
    <label>Başlangıç</label>
    <input id="d1" type="date" value="${a.start_date || ""}" min="${minStartISO()}" onchange="onDatesInput()">
    <p class="hint">Kabul formu staj başlangıcından en az <b>20 gün önce</b> teslim edilmeli — bu yüzden en erken ${fmtDate(minStartISO())} seçebilirsin.</p>
    <label>Bitiş <span class="muted">(boş bırakırsan biz hesaplarız)</span></label>
    <input id="d2" type="date" value="${a.end_date || ""}" onchange="dateCheck()">
    <div id="dateRes"></div>
    <label>İşletme staj ücreti ödeyecek mi?</label>
    <select id="ucret">${[["hayir", "Hayır"], ["evet", "Evet"], ["bilmiyorum", "Bilmiyorum"]]
      .map(([v, t]) => `<option value="${v}" ${a.ucret === v ? "selected" : ""}>${t}</option>`).join("")}</select>
    <p class="hint">EK-3 evrakını ücret olsa da olmasa da herkes yükler. “Evet” dersen sonraki adımda
    ayrıca ücret katkısı formu (EK-2) için bir alan açılır — kamu kurumunda staj yapıyorsan EK-2 gerekmez.</p>
    <button class="big" id="d5next" disabled onclick="wSaveDates()">Devam et</button>
    <p class="why" id="why">${a.start_date ? "" : "Devam etmek için başlangıç tarihini seç."}</p>${backB}`;
  }

  if (n === 5) {
    // Her belgenin kendi yükleme kutusu vardır; komisyon her birini ayrı görür.
    // EK-1 ve EK-3 herkes için zorunlu; EK-2 yalnız ücret ödenecekse eklenir.
    const kinds = new Set(ME.documents.map(d => d.kind));
    const ucretli = a.ucret === "evet";
    const gerekli = ucretli
      ? [BELGE_YUKLE.kabul, BELGE_YUKLE.ek2, BELGE_YUKLE.ek3]
      : [BELGE_YUKLE.kabul, BELGE_YUKLE.ek3];
    const eksikAd = gerekli.filter(b => !kinds.has(b.kind)).map(b => b.ad);
    body = `
    <h1>Belgelerini yükle.</h1>
    <p class="sub">${ucretli
      ? "Ücret ödeneceği için üç belge gerekiyor. Her birini kendi kutusuna yükle — komisyon üçünü de ayrı ayrı kontrol edecek."
      : "İki belge gerekiyor: kuruma imzalattığın kabul belgesi ve doldurduğun EK-3 evrakı. Her birini kendi kutusuna yükle."}</p>
    ${gerekli.map(b => uploadBox(b, kinds.has(b.kind))).join("")}
    <button class="big" id="nextBtn" ${eksikAd.length ? "disabled" : ""} onclick="wStep(6)">Devam et</button>
    <p class="why" id="why">${eksikAd.length ? "Devam etmek için yüklemen gerekenler: " + eksikAd.join(" · ") : ""}</p>${backB}`;
  }

  if (n === 6) {
    // Son adım asla hata vermez: eksikler burada listelenir, buton eksik varken kapalıdır.
    const kinds6 = new Set(ME.documents.map(d => d.kind));
    const eksik = [];
    if (!kinds6.has("kabul")) eksik.push([5, "Kabul belgesi (EK-1) yüklenmedi"]);
    if (!kinds6.has("ek3")) eksik.push([5, "Öğrenci bilgi evrakı (EK-3) yüklenmedi"]);
    if (a.ucret === "evet" && !kinds6.has("ek2")) eksik.push([5, "Ücret katkısı formu (EK-2) yüklenmedi"]);
    if (a.muh_unvan === "Bilmiyorum") eksik.push([3, "Sorumlu mühendisin unvanı seçilmedi"]);
    if (!a.start_date || !a.end_date) eksik.push([4, "Staj tarihleri seçilmedi"]);
    if (!a.kurum_adi) eksik.push([2, "Kurum bilgisi eksik"]);
    body = `
    <h1>Son kontrol.</h1>
    <div class="box info">
      ${a.tur === "donem" ? "Dönem içi staj" : "Yaz stajı"} · ${a.kurum_adi || "—"}<br>
      ${fmtDate(a.start_date)} – ${fmtDate(a.end_date)}${ME.progress ? ` (${ME.progress.total} iş günü ✓)` : ""}<br>
      Sorumlu: ${a.muh_ad || "—"}, ${a.muh_unvan || "—"}<br>
      Kabul belgesi (EK-1) ${kinds6.has("kabul") ? "✓ yüklendi" : "— yüklenmedi"}<br>
      Öğrenci bilgi evrakı (EK-3) ${kinds6.has("ek3") ? "✓ yüklendi" : "— yüklenmedi"}
      ${a.ucret === "evet" ? `<br>Ücret katkısı formu (EK-2) ${kinds6.has("ek2") ? "✓ yüklendi" : "— yüklenmedi"}` : ""}
      <p style="margin-top:8px"><button class="link" onclick="wStep(1)">Bir şeyi değiştir</button></p>
    </div>
    ${eksik.length ? `<div class="box warn"><b>Göndermeden önce şunlar tamamlanmalı:</b><br>
      ${eksik.map(([st, t]) => `• ${t} — <button class="link" onclick="wStep(${st})">Adım ${st}'e git</button>`).join("<br>")}</div>` : ""}
    <button class="big" ${eksik.length ? "disabled" : ""} onclick="wSubmit()">Başvuruyu gönder</button>
    <p class="after">${eksik.length ? "Eksikler tamamlanınca buton açılır." : "Gönderince komisyon inceleyecek; inceleme başlayana kadar değişiklik yapabilirsin."}</p>${backB}`;
  }

  el(head + body);
  if (STEP_REQ[n]) stepCheck(n);
  if (n === 4 && a.start_date) (a.end_date ? dateCheck() : onDatesInput());
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
  stepCheck(2);
}

const STEP_REQ = {
  1: [["telefon", telOk, "0 ile başlayan 11 haneli telefon numaranı yaz"]],
  2: () => {
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
  3: [["mad", v => v.trim().length >= 5 && v.trim().includes(" "), "mühendisin adını ve soyadını yaz"]],
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
  wSave(3, { kurum_adi: $("kadi").value.trim(), kurum_sehir: sehir, kurum_faaliyet: faal, yurtdisi: abroad ? 1 : 0 });
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
  // Dönem içinde cumartesi ayrı kutu değil, gün seçimlerinden gelir.
  const donem = wizardApp.tur === "donem";
  wSave(5, { start_date: $("d1").value, end_date: $("d2").value, ucret: $("ucret").value,
    cumartesi: (donem ? pickedDays().includes(6) : $("cmt")?.checked) ? 1 : 0,
    calisma_gunleri: donem ? pickedDays().join(",") : null });
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

/* ───────── Dosya yükleme ─────────
   Başvuru belgeleri: her tür (EK-1, EK-2, EK-3) kendi kutusuna yüklenir,
   böylece komisyon da öğrenci de hangisinin eksik olduğunu tek bakışta görür. */
const BELGE_YUKLE = {
  kabul: { kind: "kabul", ad: "Kabul belgesi (EK-1)", ikon: "📄",
    info: "Kuruma imzalattığın form — imza <b>ve</b> kaşe olduğundan emin ol." },
  ek2: { kind: "ek2", ad: "Ücret katkısı formu (EK-2)", ikon: "📄",
    info: 'Bilgisayarda doldurulur; sen ve işletme yetkilisi imzalar. <a href="/belgeler/ek2-ucret-issizlik-fonu-formu.pdf" download>Boş formu indir</a>. Kamu kurumunda staj yapıyorsan gerekmez — "ücret ödenecek mi" sorusuna dönüp cevabını değiştirebilirsin.' },
  ek3: { kind: "ek3", ad: "Öğrenci bilgi evrakı (EK-3)", ikon: "📊",
    info: 'Ücret olsa da olmasa da her başvuruda doldurulur — Excel tablosunda kendi satırını doldurursun. <a href="/belgeler/staj-ucreti-fon-katkisi-basvuru-evraki.xlsx" download>Boş evrakı indir</a>.' },
};
// Her belge kartı tek bakışta üç şeyi anlatır: ne olduğu (ikon+ad),
// durumu (yüklendi mi) ve yapılacak işlem (belirgin sağdaki etiket).
// Açıklama metni yalnızca yüklenmemişken görünür — yüklendikten sonra gerekmez.
function uploadBox(b, done) {
  return `<div class="upload ${done ? "done" : ""}" id="up-${b.kind}" onclick="pickFile('${b.kind}')">
    <div class="upload-top">
      <span class="upload-ikon">${done ? "✅" : b.ikon}</span>
      <div class="upload-metin">
        <div class="upload-ad">${b.ad}</div>
        <div class="upload-durum">${done ? "Yüklendi" : "Henüz yüklenmedi"}</div>
      </div>
      <span class="upload-aksiyon">${done ? "Değiştir" : "Dosya seç"}</span>
    </div>
    ${done ? "" : `<div class="upload-aciklama">${b.info}<br><span class="muted">PDF veya fotoğraf · en fazla 10 MB</span></div>`}
  </div>`;
}

function pickFile(kind) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".pdf,.jpg,.jpeg,.png" + (kind === "ek3" ? ",.xlsx,.xls" : "");
  inp.onchange = async () => {
    if (!inp.files[0]) return;
    const fd = new FormData();
    fd.append("file", inp.files[0]);
    if (ME.application) fd.append("app_id", ME.application.id);
    const box = $("up-" + kind) || $("up");
    if (box) box.textContent = "Yükleniyor…";
    try {
      const r = await fetch("/api/upload/" + kind, { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await refresh();
      if (["kabul", "ek2", "ek3"].includes(kind) && ME.stage === "review") {
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
      <span class="doc-ad">${b.icon} ${b.ad}</span>
      ${b.indir ? `<a class="doc-indir" href="${b.indir}" download>İndir</a>` : ""}
    </div>
    <p class="doc-sum">${(b.kisa || b.nedir).split(/(?<=\.)\s/)[0]}</p>
    <details class="doc-det"><summary>Ayrıntılar</summary>
      <table>${[["Resmî adı", b.resmi], ["Nedir?", b.nedir], ["Neden gerekiyor?", b.neden],
        ["Kim dolduracak?", b.doldurur], ["Kim imzalayacak?", b.imzalar],
        ["Kaşe gerekiyor mu?", b.kase], ["Ne zaman?", b.nezaman], ["Nereye?", b.nereye]]
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
    { icon: "📊", ad: "Öğrenci bilgi evrakı", resmi: "EK-3",
      nedir: "Staj bilgilerinin işlendiği öğrenci bilgi tablosu (Excel). Ücret alacaklar için İşsizlik Fonu katkısı başvurusunda da kullanılır.",
      neden: "Her başvuruda gerekir; ücret ödenecekse EK-2 formuyla birlikte devlet katkısının bağlanmasında kullanılır. Önemli: 1. stajın SGK çıkışı yapılmadan sonraki staj için yeni sigorta girişi yapılamaz.",
      doldurur: "Kendi satırını sen doldurursun (ad, TC, öğrenci no, telefon, doğum tarihi…).",
      nezaman: "Ücret olsa da olmasa da her başvuruda; başvuruyla birlikte.", nereye: "Bu sisteme yüklenir.",
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
  // Sadelik: yalnız ŞU AN gereken belgeler görünür. Diğer aşamaların
  // belgeleri, istenirse tek tıkla açılan iki sakin kutuda durur.
  const stageGroup = ["noplace", "draft", "review", "fix", "rejected"].includes(ME.stage)
    ? "Başvurudan önce gerekenler"
    : ["sgk", "obs", "ready", "during"].includes(ME.stage)
      ? "Staj sırasında kullanacakların" : "Teslim ederken gerekenler";
  const AD = { kabul: "kabul belgesi (EK-1)", ek2: "ücret katkısı formu (EK-2)",
    ek3: "öğrenci bilgi evrakı (EK-3)", defter: "staj defteri" };
  const mine = ME.documents.length
    ? `<div class="box ok" style="margin-top:0">✅ Yüklediklerin: ${ME.documents.map(d =>
        `${AD[d.kind] || d.kind} (${d.uploaded_at.slice(0, 10)})`).join(" · ")}</div>` : "";
  const digerleri = Object.entries(BELGELER).filter(([g]) => g !== stageGroup);
  el(`<div data-full>
    <h1>Belgelerim</h1>
    <p class="sub">Bulunduğun aşamada ihtiyacın olan belgeler bunlar. Her birini İndir ile alırsın;
    merak edersen "Ayrıntılar"a tıklarsın.</p>
    ${mine}
    <section class="panel">
      <div class="docgrid">${BELGELER[stageGroup].map(belgeKart).join("")}</div>
    </section>
    <p class="muted" style="margin:4px 0 10px">Diğer aşamaların belgeleri (şu an ihtiyacın yok):</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
      ${digerleri.map(([g, items], i) => `
        <button class="quiet" style="min-width:0" onclick="const p=$('dg${i}');const acik=p.style.display!=='none';p.style.display=acik?'none':'block';this.textContent=(acik?'📁 ':'📂 ')+'${g}'+' (${items.length})'">📁 ${g} (${items.length})</button>`).join("")}
    </div>
    ${digerleri.map(([g, items], i) => `
      <section class="panel" id="dg${i}" style="display:none;margin-top:14px">
        <div class="docgrid">${items.map(belgeKart).join("")}</div>
      </section>`).join("")}
  </div>`);
}

/* ───────── Staj rehberi: bütün sürecin sakin anlatımı ───────── */
// Normalde ihtiyaç yoktur — sistem her adımda yönlendirir. Baştan sona okumak
// isteyen (veya hocasına anlatan) öğrenci için tek sayfa.
const REHBER = [
  ["Staj yeri bulma", "Bilgisayar/yazılım alanında sorumlu mühendisi olan bir kurum bulursun.", "Kurum aramak; emin değilsen kuruma sistemin verdiği hazır soruyu sormak."],
  ["Belgeleri hazırlama", "Sistem staj türüne göre doğru kabul formunu verir; kuruma imzalatıp kaşeletirsin.", "Belgeyi indirip imzalatmak."],
  ["Başvuru", "6 kısa adımda başvuru: bilgiler, kurum, mühendis, tarihler, belge, kontrol. Her adım otomatik kaydedilir.", "Formu doldurmak — iş günü hesabını sistem yapar."],
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
  // Sakin görünüm: 12 adım tek kolonda, her adım tek satır.
  // Yalnız bulunduğun adım açık gelir; merak edilen adıma tıklanınca açılır.
  const now = STAGE_NO[ME.stage] ?? -1;
  el(`<h1>Staj süreci</h1>
    <p class="sub">12 adım, sırasıyla. Ezberlemene gerek yok — sisteme her girdiğinde hangi adımdaysan
    onu zaten gösteririz. Bir adımın ayrıntısını görmek için üzerine tıkla.</p>
    <p style="margin:-8px 0 16px"><button class="link" onclick="tour(0)">🎬 Tanıtım turunu izle</button>
    <span class="muted" style="font-size:14px">— süreci 1 dakikada slaytlarla anlatır</span></p>
    <div class="tl">
      ${REHBER.map(([ad, ne, gorev], i) => `
        <div class="tl-row ${i < now ? "done" : i === now ? "now" : ""} ${i === now ? "open" : ""}"
             onclick="this.classList.toggle('open')">
          <span class="tl-dot">${i < now ? "✓" : i + 1}</span>
          <div class="tl-body">
            <div class="tl-ad">${ad}${i === now ? ' <span class="tl-here">buradasın</span>' : ""}</div>
            <div class="tl-det">${ne}<br><b>Senin görevin:</b> ${gorev}</div>
          </div>
        </div>`).join("")}
    </div>
    <div class="box info" style="margin-top:18px">Bölümde toplam <b>iki staj</b> yapılır (2 × 20 iş günü). İkisi de aynı adımlardan geçer.</div>`);
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
  help: helpScreen, accept: acceptScreen, guide: guideScreen, profil: profilScreen,
  tur: () => tour(0) };
async function go(name) {
  curRoute = routes[name] ? name : "home";
  try { await refresh(); } catch { return loginScreen(); }
  // İlk kez gelen ve hiç başvurusu olmayan öğrenciye önce tanıtım turu açılır
  // (bir kez; hesaba bağlıdır — tarayıcı/cihaz değişse de tekrar çıkmaz).
  // Sonra Rehber sayfasından istediği zaman yeniden izleyebilir.
  if (curRoute === "home" && !ME.applications.length && !ME.user.tur_gorundu) {
    api("/tur-gorundu", { method: "POST" }).catch(() => {});
    ME.user.tur_gorundu = true;
    return tour(0);
  }
  (routes[name] || home)();
}

(async () => {
  try {
    await refresh();
    // ?sayfa=docs bir bölümü, ?staj=2 belirli stajı doğrudan açar (yer imi desteği)
    const p = new URLSearchParams(location.search);
    const stajNo = +p.get("staj");
    if (stajNo) {
      const t = ME.applications.find(x => x.staj_no === stajNo);
      if (t) { selApp = t.id; await refresh(); }
    }
    go(p.get("sayfa") || "home");
  } catch { loginScreen(); }
})();
