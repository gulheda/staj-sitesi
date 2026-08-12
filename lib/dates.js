// İş günü hesabı: hafta sonları ve resmî tatiller sayılmaz.
// Dönem içi stajda ayrıca yalnızca öğrencinin seçtiği günler sayılır.
// Tatil listesi yönetici panelinden güncellenebilir olacak şekilde tabloya
// taşınabilir; pilot sürümde 2026 yılı sabit listedir.
const HOLIDAYS = {
  "2026-01-01": "Yılbaşı",
  "2026-03-20": "Ramazan Bayramı", "2026-03-21": "Ramazan Bayramı", "2026-03-22": "Ramazan Bayramı",
  "2026-04-23": "23 Nisan", "2026-05-01": "1 Mayıs", "2026-05-19": "19 Mayıs",
  "2026-05-27": "Kurban Bayramı", "2026-05-28": "Kurban Bayramı",
  "2026-05-29": "Kurban Bayramı", "2026-05-30": "Kurban Bayramı",
  "2026-07-15": "15 Temmuz", "2026-08-30": "30 Ağustos", "2026-10-29": "29 Ekim",
};

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(s + "T12:00:00Z");

// opts.allowedDays: [1..5] hafta içi günler (dönem içi staj, 1=Pzt).
// opts.saturday: yönerge gereği cumartesi ancak komisyon onayıyla sayılır;
// öğrenci EK-1'deki "Cumartesi çalışılıyor mu?" sorusuna Evet derse hesaba katılır.
// Pazar hiçbir koşulda sayılmaz.
function isCounted(d, opts = {}) {
  const wd = d.getUTCDay();
  if (wd === 0) return false;
  if (wd === 6 && !opts.saturday) return false;
  if (wd !== 6 && opts.allowedDays && !opts.allowedDays.includes(wd)) return false;
  return !HOLIDAYS[iso(d)];
}

// Aralığın dökümü: kaç iş günü sayıldı, neler sayılmadı (öğrenciye açıklamak için).
function analyze(startISO, endISO, opts = {}) {
  const out = { workdays: 0, weekend: 0, offDays: 0, holidays: [] };
  for (let t = parse(startISO).getTime(), end = parse(endISO).getTime(); t <= end; t += DAY) {
    const d = new Date(t), wd = d.getUTCDay(), key = iso(d);
    if (HOLIDAYS[key] && (wd !== 0) && (wd !== 6 || opts.saturday)) {
      out.holidays.push(HOLIDAYS[key] + " (" + key.slice(8) + "." + key.slice(5, 7) + ")"); continue;
    }
    if (isCounted(d, opts)) { out.workdays++; continue; }
    if (wd === 0 || wd === 6) { out.weekend++; continue; }
    out.offDays++;
  }
  return out;
}

const countWorkdays = (s, e, opts) => analyze(s, e, opts).workdays;

// startISO'dan itibaren `needed` iş gününü tamamlayan bitiş tarihini bulur.
function suggestEnd(startISO, needed, opts) {
  let n = 0, t = parse(startISO).getTime();
  for (let guard = 0; guard < 500; guard++, t += DAY) {
    if (isCounted(new Date(t), opts)) n++;
    if (n === needed) return iso(new Date(t));
  }
  return null;
}

// Başvuru tarih doğrulaması: hata değil, çözüm döndürür.
function checkDates(startISO, endISO, opts = {}) {
  const { minDays = 20, allowedDays = null, saturday = false, minStart = null } = opts;
  const o = { allowedDays, saturday };
  const out = { ok: false, workdays: 0, problems: [], suggestion: null, breakdown: null };

  if (allowedDays && allowedDays.length < 3) {
    out.problems.push("Dönem içi stajda haftada en az 3 gün çalışmalısın. Çalışacağın günlerden en az 3'ünü seç.");
    return out;
  }
  if (!startISO) { out.problems.push("Önce başlangıç tarihini seç."); return out; }

  // EK-1 kuralı: kabul formu staj başlangıcından 20 gün önce teslim edilir.
  if (minStart && startISO < minStart) {
    const next = suggestEnd(minStart, 1, o);
    out.problems.push(`Kabul formunun staj başlangıcından en az 20 gün önce teslim edilmesi gerekiyor. Bugünden itibaren en erken başlangıç: ${trDate(next)}.`);
    out.suggestion = { field: "start", value: next };
    return out;
  }

  const s = parse(startISO);
  if (!isCounted(s, o)) {
    const next = suggestEnd(startISO, 1, o);
    const why = HOLIDAYS[startISO] ? `${HOLIDAYS[startISO]} resmî tatili` :
      (s.getUTCDay() === 0 || s.getUTCDay() === 6) ? "hafta sonu" : "çalışma günlerinin dışında";
    out.problems.push(`Staj ${trDate(startISO)} günü başlayamaz (${why}). En yakın uygun gün: ${trDate(next)}.`);
    out.suggestion = { field: "start", value: next };
    return out;
  }

  // Bitiş seçilmemişse: hatalı sayma, hesaplayıp öner — kullanıcı hesap yapmasın.
  if (!endISO) {
    out.suggestion = { field: "end", value: suggestEnd(startISO, minDays, o), auto: true };
    return out;
  }

  if (parse(endISO) < s) { out.problems.push("Bitiş tarihi başlangıçtan önce olamaz."); return out; }

  out.breakdown = analyze(startISO, endISO, o);
  out.workdays = out.breakdown.workdays;
  if (out.workdays < minDays) {
    out.problems.push(`Bu tarihler toplam ${out.workdays} iş günü oluşturuyor. Stajın en az ${minDays} iş günü olmalı.`);
    out.suggestion = { field: "end", value: suggestEnd(startISO, minDays, o) };
    return out;
  }
  out.ok = true;
  return out;
}

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function trDate(s) {
  if (!s) return "";
  return `${+s.slice(8, 10)} ${AYLAR[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
}

module.exports = { checkDates, countWorkdays, suggestEnd, analyze, trDate, HOLIDAYS };
