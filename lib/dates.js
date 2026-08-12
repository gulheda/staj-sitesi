// İş günü hesabı: hafta sonları ve resmî tatiller sayılmaz.
// Tatil listesi yönetici panelinden güncellenebilir olacak şekilde tabloya
// taşınabilir; pilot sürümde 2026 yılı sabit listedir.
const HOLIDAYS = new Set([
  "2026-01-01",                                "2026-03-20", "2026-03-21", "2026-03-22", // Ramazan Bayramı
  "2026-04-23", "2026-05-01", "2026-05-19",
  "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30",                               // Kurban Bayramı
  "2026-07-15", "2026-08-30", "2026-10-29",
]);

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(s + "T12:00:00Z");

function isWorkday(d) {
  const wd = d.getUTCDay();
  return wd !== 0 && wd !== 6 && !HOLIDAYS.has(iso(d));
}

function countWorkdays(startISO, endISO) {
  let n = 0;
  for (let t = parse(startISO).getTime(), end = parse(endISO).getTime(); t <= end; t += DAY) {
    if (isWorkday(new Date(t))) n++;
  }
  return n;
}

// startISO'dan itibaren `needed` iş gününü tamamlayan bitiş tarihini bulur.
function suggestEnd(startISO, needed) {
  let n = 0, t = parse(startISO).getTime();
  for (let guard = 0; guard < 400; guard++, t += DAY) {
    if (isWorkday(new Date(t))) n++;
    if (n === needed) return iso(new Date(t));
  }
  return null;
}

// Başvuru tarih doğrulaması: hata değil, çözüm döndürür.
function checkDates(startISO, endISO, minDays = 20) {
  const out = { ok: false, workdays: 0, problems: [], suggestion: null };
  if (!startISO || !endISO) { out.problems.push("Başlangıç ve bitiş tarihlerini seçmelisin."); return out; }
  const s = parse(startISO), e = parse(endISO);
  if (e < s) { out.problems.push("Bitiş tarihi başlangıçtan önce olamaz."); return out; }
  if (!isWorkday(s)) {
    const next = suggestEnd(startISO, 1);
    out.problems.push(`Staj ${iso(s)} günü başlayamaz (hafta sonu veya resmî tatil). En yakın iş günü: ${next}.`);
    out.suggestion = { field: "start", value: next };
    return out;
  }
  out.workdays = countWorkdays(startISO, endISO);
  if (out.workdays < minDays) {
    const sug = suggestEnd(startISO, minDays);
    out.problems.push(`Bu tarihler toplam ${out.workdays} iş günü oluşturuyor. Stajın en az ${minDays} iş günü olmalı.`);
    out.suggestion = { field: "end", value: sug };
    return out;
  }
  out.ok = true;
  return out;
}

module.exports = { checkDates, countWorkdays, suggestEnd, HOLIDAYS };
