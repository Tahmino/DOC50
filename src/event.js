const { findEvent, parseEventDate } = await import(/* @vite-ignore */ "/events.js");

const MONTHS_LONG = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DAYS_LONG   = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

const params = new URLSearchParams(window.location.search);
const loc    = params.get("loc");
const date   = params.get("date");

const notFound = document.getElementById("evNotFound");
const main     = document.getElementById("evMain");

const ev = findEvent(loc, date);

if (!ev) {
  notFound.style.display = "";
  main.style.display = "none";
  document.getElementById("evHeroImg").style.display = "none";
} else {
  // Location logo
  const logoImg = document.querySelector(".ev-topbar-logo img");
  if (ev.raum === "D50 Skylounge") {
    logoImg.src = "/logo-skylounge.png";
    logoImg.alt = "Skylounge";
    logoImg.style.height = "clamp(28px, 4.5vh, 44px)";
    logoImg.style.filter = "";
  } else if (ev.raum === "D50 Deck 1") {
    logoImg.src = "/logo-deck1.png";
    logoImg.alt = "Deck1";
  }

  // Hero image
  const heroImg = document.getElementById("evHeroImg");
  heroImg.src = ev.bildGross;
  heroImg.alt = ev.titel;

  // Format date
  const d = parseEventDate(ev.datum);
  const dateStr = `${DAYS_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS_LONG[d.getMonth()]} 20${ev.datum.slice(-2)}`;

  // Meta
  document.getElementById("evCategory").textContent    = ev.rubrik;
  document.getElementById("evLocationTag").textContent  = ev.raum;

  // Main info
  document.getElementById("evTitle").textContent          = ev.titel;
  document.getElementById("evArtist").textContent         = ev.untertitel;
  document.getElementById("evDate").textContent           = dateStr;
  document.getElementById("evLocation").textContent       = ev.raum;
  document.getElementById("evCategoryDetail").textContent = ev.rubrik;
  document.getElementById("evDesc").textContent           = ev.beschreibung;

  // Page title + meta tags
  document.title = `${ev.titel} — DOCK50`;
  const desc = `${ev.titel} – ${ev.untertitel} | ${dateStr} im DOCK50 Flensburg`;
  document.querySelector('meta[name="description"]').setAttribute("content", desc);
  document.querySelector('meta[property="og:title"]').setAttribute("content", `${ev.titel} — DOCK50`);
  document.querySelector('meta[property="og:description"]').setAttribute("content", desc);
  document.querySelector('meta[property="og:image"]').setAttribute("content", ev.bildGross);

  // CTA
  const ctaColor = ev.raum === "D50 Skylounge" ? "rgb(212,170,40)" : "#E63289";
  const ctaWrapper = document.getElementById("evCtaWrapper");
  if (ev.hasTicket && ev.ticketUrl) {
    ctaWrapper.innerHTML = `<a href="${ev.ticketUrl}" class="ev-cta" target="_blank" rel="noopener" style="background:${ctaColor};color:#0e0e0e;">Tickets anfragen <span class="ev-cta-arrow">↗</span></a>`;
  }
}
