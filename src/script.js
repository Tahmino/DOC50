import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Lenis from "lenis";
const { parseEventDate, getNearestN, eventLibrary } = await import(/* @vite-ignore */ "/events.js");

gsap.registerPlugin(ScrollTrigger);

// ─── Scroll-Lock (muss VOR Lenis registriert werden, damit capture-Phase zuerst feuert) ──
window.addEventListener("wheel", (e) => {
  if (openCardIdx === -1) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (e.target.closest("#eventSidePanel")) {
    const scrollTarget = document.getElementById("espContent")?.querySelector(".esp-left");
    if (scrollTarget) {
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      scrollTarget.scrollTop += dy;
    }
  }
}, { passive: false, capture: true });

window.addEventListener("touchmove", (e) => {
  if (openCardIdx === -1) return;
  if (e.target.closest(".esp-left")) return;
  e.preventDefault();
  e.stopImmediatePropagation();
}, { passive: false, capture: true });

window.addEventListener("keydown", (e) => {
  if (openCardIdx === -1) return;
  const scrollKeys = ["Space","ArrowDown","ArrowUp","PageDown","PageUp","Home","End"];
  if (scrollKeys.includes(e.code)) e.preventDefault();
});

// ─── Lenis ───────────────────────────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenis = new Lenis({ smoothWheel: !prefersReducedMotion, syncTouch: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// ─── Exact mobile viewport height ────────────────────────────────────────────
// Set once on load — do NOT update on resize.
// On iOS Safari, window.innerHeight grows as chrome hides; updating would make
// snap sections taller than the visible area.
document.documentElement.style.setProperty('--mvh', window.innerHeight + 'px');

ScrollTrigger.scrollerProxy(document.documentElement, {
  scrollTop(value) {
    if (arguments.length) lenis.scrollTo(value, { immediate: true });
    return lenis.scroll;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  },
  pinType: document.documentElement.style.transform ? "transform" : "fixed",
});

let eventData = [];

let dividerTitleEls = [];

function renderEvents(events) {
  eventData = events;
  const imgEls  = document.querySelectorAll(".project-img");
  const nameEls = document.querySelectorAll(".project-name-item");
  const divNums = document.querySelectorAll(".project-divider-num");

  events.forEach((ev, i) => {
    if (imgEls[i]) {
      const img = imgEls[i].querySelector("img");
      if (img) { img.src = ev.bildGross; img.alt = ev.titel; }
      imgEls[i].dataset.location = ev.raum;
      let badge = imgEls[i].querySelector(".proj-ticket-badge");
      if (ev.hasTicket) {
        if (!badge) {
          badge = document.createElement("a");
          badge.className = "proj-ticket-badge";
          imgEls[i].appendChild(badge);
        }
        badge.href = ev.ticketUrl || "/anfrage.html";
        badge.target = "_blank";
        badge.rel = "noopener";
        badge.textContent = "Tickets ↗";
      } else {
        if (badge) badge.remove();
      }
    }
    if (nameEls[i]) {
      const p = nameEls[i].querySelector("p");
      if (p) p.textContent = ev.titel;
      const numEl = nameEls[i].querySelector(".proj-num");
      if (numEl) numEl.textContent = String(i + 1).padStart(2, "0");
      nameEls[i].dataset.location = ev.raum;
    }
    if (divNums[i]) {
      const venue = ev.raum || ev.veranstaltort || "";
      const parts = [venue, ev.rubrik, ev.beginn].filter(Boolean);
      divNums[i].textContent = parts.join(" · ");
    }
    if (dividerTitleEls[i]) {
      dividerTitleEls[i].textContent = ev.titel;
    }
  });

  // Leere Slots komplett ausblenden (display:none → nehmen keinen Platz)
  const allDividers = document.querySelectorAll(".project-divider");
  imgEls.forEach((imgEl, i) => {
    if (i >= events.length) {
      const img = imgEl.querySelector("img");
      if (img) img.src = "";
      imgEl.classList.add("event-hidden");
    } else {
      imgEl.classList.remove("event-hidden");
    }
  });
  allDividers.forEach((div, i) => {
    if (i >= events.length) div.classList.add("event-hidden");
    else                    div.classList.remove("event-hidden");
  });
  nameEls.forEach((nameEl, i) => {
    if (i >= events.length) nameEl.classList.add("event-hidden");
    else                    nameEl.classList.remove("event-hidden");
  });

  const pidxEl = document.querySelector(".project-index h2");
  if (pidxEl) pidxEl.textContent = events[0]?.datum ?? "";
}

// ─── Module-scope state ───────────────────────────────────────────────────────
let spST          = null;   // spotlight ScrollTrigger instance
let openCardIdx   = -1;     // index of currently open side panel (-1 = closed)
let currentCount  = 8;      // how many events are currently shown (8 or 16)
let visibleCount  = 8;      // tatsächlich sichtbare Events (≤ currentCount, abhängig vom Pool)
let currentFilter = "all";  // active filter key

// ─── Mobile Event List ───────────────────────────────────────────────────────
function renderMobileEvents(events) {
  const list = document.getElementById("mobileEventList");
  if (!list) return;
  list.dataset.filter = currentFilter;
  const MONTHS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const DAYS   = ["So","Mo","Di","Mi","Do","Fr","Sa"];
  list.onclick = (e) => {
    const ticket = e.target.closest(".mec-ticket");
    if (ticket) {
      e.preventDefault();
      e.stopPropagation();
      window.open(ticket.dataset.ticketUrl, "_blank", "noopener");
    }
  };
  list.innerHTML = events.map((ev, i) => {
    const d       = parseEventDate(ev.datum);
    const dayNum  = ev.datum.split(".")[0];
    const dayName = DAYS[d.getDay()];
    const month   = MONTHS[d.getMonth()];
    const ticket  = ev.hasTicket
      ? `<span class="mec-ticket" data-ticket-url="${ev.ticketUrl}" data-location="${ev.raum}">Tickets <span class="mec-arrow">↗</span></span>`
      : ``;
    const locSlug = ev.raum.toLowerCase();
    return `<a href="/event.html?loc=${encodeURIComponent(locSlug)}&date=${encodeURIComponent(ev.datum)}" class="mobile-event-card" data-index="${i}">
      <div class="mec-date">
        <span class="mec-day-name">${dayName}</span>
        <span class="mec-day-num">${dayNum}</span>
        <span class="mec-month">${month}</span>
      </div>
      <div class="mec-img"><img src="${ev.bildGross}" alt="${ev.titel}" /></div>
      <div class="mec-info">
        <span class="mec-category">${ev.rubrik}</span>
        <span class="mec-title">${ev.titel}</span>
        <span class="mec-meta">${ev.raum}</span>
      </div>
      <div class="mec-right">${ticket}</div>
    </a>`;
  }).join("");
}

// ─── Spotlight Init (aufrufbar bei Expansion + Filter-Wechsel) ───────────────
function initSpotlight() {
  if (window.innerWidth <= 1000) {
    renderMobileEvents(getNearestN(currentFilter, 8));
    return;
  }
  // Cleanup vorheriger Instanz
  if (spST) { spST.kill(); spST = null; }
  const oldConnLeft = document.getElementById("connectorLeftDyn");
  if (oldConnLeft) oldConnLeft.remove();
  document.querySelectorAll(".divider-title-wrapper").forEach(el => el.remove());
  dividerTitleEls = [];

  const spotlightSection = document.querySelector(".spotlight");
  if (!spotlightSection) return;

  const projectIndex           = spotlightSection.querySelector(".project-index h2");
  const projectImgs            = spotlightSection.querySelectorAll(".project-img:not(.spotlight-extra):not(.event-hidden)");
  const projectImagesContainer = spotlightSection.querySelector(".project-images");
  const projectNameItems       = spotlightSection.querySelectorAll(".project-name-item:not(.spotlight-extra):not(.event-hidden)");
  const connector              = spotlightSection.querySelector(".project-connector");
  const totalProjectCount      = projectNameItems.length;
  visibleCount                 = totalProjectCount;

  if (!projectIndex || !projectImagesContainer || totalProjectCount === 0) {
    console.warn("Spotlight: Pflicht-Elemente fehlen");
    return;
  }

  const VH  = window.innerHeight;
  const mid = VH / 2;

  const imgsH          = projectImagesContainer.offsetHeight;
  const moveDistImages = VH - imgsH;

  const firstImg     = projectImgs[0];
  const firstDivider = spotlightSection.querySelector(".project-divider:not(.spotlight-extra):not(.event-hidden)");
  const imgH         = firstImg     ? firstImg.offsetHeight     : VH * 0.197;
  const divH         = firstDivider ? firstDivider.offsetHeight : VH * 0.10;
  const halfSpan     = (imgH + 2 * divH) / 2;
  const ITEM_GAP     = Math.max(VH * 0.025, imgH * 0.18);

  const SLOTS = {
    TOP_1:  mid - halfSpan - ITEM_GAP,
    TOP_2:  mid - halfSpan,
    CENTER: mid,
    BOT_1:  mid + halfSpan,
    BOT_2:  mid + halfSpan + ITEM_GAP,
    EXIT:   -100,
    PARK:   VH + 100,
  };

  const SLOT_OPACITY = {
    TOP_1: 0.32, TOP_2: 0.45, CENTER: 1,
    BOT_1: 0.45, BOT_2: 0.32, EXIT: 0, PARK: 0,
  };
  const SLOT_COLOR = {
    TOP_1:  "rgba(255,255,255,0.32)", TOP_2:  "rgba(255,255,255,0.45)",
    CENTER: "rgba(255,255,255,0.95)",
    BOT_1:  "rgba(255,255,255,0.45)", BOT_2:  "rgba(255,255,255,0.32)",
    EXIT:   "rgba(255,255,255,0)",    PARK:   "rgba(255,255,255,0)",
  };

  function getSlot(i, N) {
    const d = i - N;
    if (d === -2) return "TOP_1";
    if (d === -1) return "TOP_2";
    if (d ===  0) return "CENTER";
    if (d === +1) return "BOT_1";
    if (d === +2) return "BOT_2";
    if (d  <  -2) return "EXIT";
    return "PARK";
  }

  gsap.set(projectNameItems, { top: SLOTS.PARK, opacity: 0, yPercent: -50 });
  gsap.set(projectIndex,     { opacity: 0 });
  projectIndex.textContent = eventData[0]?.datum ?? "";
  if (connector) gsap.set(connector, { display: "none", opacity: 0 });

  // ─── Linker Connector (Datum ↔ Bild) ─────────────────────────────────
  const connectorLeft = document.createElement("div");
  connectorLeft.className = "project-connector";
  connectorLeft.id = "connectorLeftDyn";
  spotlightSection.appendChild(connectorLeft);
  connectorLeft.innerHTML = `<div class="project-connector-line" style="order:1;"></div><div class="project-connector-dot" style="order:2;"></div>`;
  gsap.set(connectorLeft, { display: "none", opacity: 0 });

  // ─── Divider-Titel ───────────────────────────────────────────────────
  const projectTitles = Array.from(projectNameItems).map(item => {
    const p = item.querySelector("p");
    return p ? p.textContent.trim() : "";
  });

  const projectDividers = spotlightSection.querySelectorAll(".project-divider:not(.spotlight-extra):not(.event-hidden)");

  projectDividers.forEach((div, di) => {
    const wrapper = document.createElement("div");
    wrapper.className = "divider-title-wrapper";
    const titleEl = document.createElement("span");
    titleEl.className = "divider-title-text";
    titleEl.textContent = projectTitles[di] || "";
    wrapper.appendChild(titleEl);
    const numSpan = div.querySelector(".project-divider-num");
    div.insertBefore(wrapper, numSpan ? numSpan.nextSibling : null);
    dividerTitleEls.push(titleEl);
    gsap.set(titleEl, { clipPath: "inset(0 0 100% 0)", opacity: 0 });
  });

  let lastDividerN = -99;

  function updateDividerTitles(N, scrollDir) {
    if (N === lastDividerN) return;
    const prevN  = lastDividerN;
    lastDividerN = N;

    dividerTitleEls.forEach((titleEl, di) => {
      const isActive  = (di === N);
      const wasActive = (di === prevN);

      if (isActive && !wasActive) {
        gsap.killTweensOf(titleEl);
        gsap.fromTo(titleEl,
          { clipPath: scrollDir > 0 ? "inset(0 0 100% 0)" : "inset(100% 0 0% 0)", opacity: 0, y: scrollDir > 0 ? 6 : -6 },
          { clipPath: "inset(0 0 0% 0)", opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      } else if (!isActive && wasActive) {
        gsap.killTweensOf(titleEl);
        gsap.to(titleEl, {
          clipPath: scrollDir > 0 ? "inset(100% 0 0% 0)" : "inset(0 0 100% 0)",
          opacity: 0, y: scrollDir > 0 ? -6 : 6,
          duration: 0.25, ease: "power2.in",
        });
      }
    });
  }

  let lastValidN   = 0;
  let lastDisplayN = -99;

  function applySlots(N) {
    const displayN = (N >= 0 && N < totalProjectCount) ? N : lastValidN;
    if (N >= 0 && N < totalProjectCount) lastValidN = N;
    const changed  = (displayN !== lastDisplayN);
    lastDisplayN   = displayN;

    if (openCardIdx !== -1) return;

    if (changed) {
      gsap.to(projectIndex, { opacity: 0, duration: 0.12, ease: "power2.in", onComplete: () => {
        const evN = eventData[displayN];
        projectIndex.textContent = evN?.datum ?? "";
        gsap.to(projectIndex, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }});
    }

    projectNameItems.forEach((item, i) => {
      const slot        = getSlot(i, displayN);
      const dest        = SLOTS[slot];
      const filteredOut = window._activeLocFilter && window._activeLocFilter !== "ALL" && item.dataset.location !== window._activeLocFilter;
      const alpha       = filteredOut ? 0.05 : SLOT_OPACITY[slot];
      const color       = filteredOut ? "rgba(255,255,255,0.07)" : SLOT_COLOR[slot];
      const numColor    = (slot === "CENTER" && !filteredOut) ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.08)";

      gsap.killTweensOf(item);
      if (changed) {
        gsap.to(item, { top: dest, opacity: alpha, yPercent: -50, x: 0, duration: 0.22, ease: "power4.inOut" });
      } else {
        gsap.set(item, { top: dest, opacity: alpha, yPercent: -50, x: 0 });
      }

      const textEl = item.querySelector("p");
      const numEl  = item.querySelector(".proj-num");
      if (textEl) {
        gsap.killTweensOf(textEl);
        if (changed) gsap.to(textEl, { color, duration: 0.22, ease: "power4.inOut" });
        else         gsap.set(textEl, { color });
      }
      if (numEl) {
        gsap.killTweensOf(numEl);
        if (changed) gsap.to(numEl, { color: numColor, duration: 0.22, ease: "power4.inOut" });
        else         gsap.set(numEl, { color: numColor });
      }
    });
  }

  // ─── quickSetters für onUpdate Performance ──────────────────────────
  const qsImgsY        = gsap.quickSetter(projectImagesContainer, "y", "px");
  const qsIdxOpacity   = gsap.quickSetter(projectIndex, "opacity");
  const qsConnDisplay  = connector     ? gsap.quickSetter(connector, "display")     : null;
  const qsConnLeft     = connector     ? gsap.quickSetter(connector, "left", "px")  : null;
  const qsConnTop      = connector     ? gsap.quickSetter(connector, "top", "px")   : null;
  const qsConnWidth    = connector     ? gsap.quickSetter(connector, "width", "px") : null;
  const qsConnOpacity  = connector     ? gsap.quickSetter(connector, "opacity")     : null;
  const qsConnLDisplay = connectorLeft ? gsap.quickSetter(connectorLeft, "display")     : null;
  const qsConnLLeft    = connectorLeft ? gsap.quickSetter(connectorLeft, "left", "px")  : null;
  const qsConnLTop     = connectorLeft ? gsap.quickSetter(connectorLeft, "top", "px")   : null;
  const qsConnLWidth   = connectorLeft ? gsap.quickSetter(connectorLeft, "width", "px") : null;
  const qsConnLOpacity = connectorLeft ? gsap.quickSetter(connectorLeft, "opacity")     : null;

  // ─── ScrollTrigger ───────────────────────────────────────────────────
  spST = ScrollTrigger.create({
    trigger: spotlightSection,
    start: "top top",
    end: `+=${VH * totalProjectCount * 5 / 8}px`,
    pin: true,
    pinSpacing: true,
    onUpdate: (self) => {
      const progress  = self.progress;
      const scrollDir = self.direction;

      qsImgsY(progress * moveDistImages);
      const moreBtn = document.getElementById("eventMoreBtn");
      if (moreBtn) gsap.set(moreBtn, { y: progress * moveDistImages, xPercent: -50 });

      const dateOpacity = Math.min(1, progress / 0.04) * Math.min(1, (1 - progress) / 0.02);
      qsIdxOpacity(dateOpacity);

      let N = 0;
      for (let i = totalProjectCount - 1; i >= 0; i--) {
        const r = projectImgs[i].getBoundingClientRect();
        if (r.top <= mid) { N = i; break; }
      }

      projectImgs.forEach((img) => {
        const r = img.getBoundingClientRect();
        const filteredOut = window._activeLocFilter && window._activeLocFilter !== "ALL" && img.dataset.location !== window._activeLocFilter;
        const zone = VH * 0.28;
        const isCenter = r.top <= mid + zone && r.bottom >= mid - zone;
        gsap.set(img, { opacity: filteredOut ? 0.06 : (isCenter ? 1 : 0.35) });
      });

      applySlots(N);
      updateDividerTitles(N, scrollDir);

      if (connector && openCardIdx === -1) {
        const activeImg = Array.from(projectImgs).find(img => {
          const r = img.getBoundingClientRect();
          return r.top <= mid && r.bottom >= mid;
        });
        const cItem = projectNameItems[Math.max(0, Math.min(N, totalProjectCount - 1))];

        if (activeImg && cItem && N >= 0 && N < totalProjectCount) {
          const imgR  = activeImg.getBoundingClientRect();
          const itemR = cItem.getBoundingClientRect();
          const idxR  = projectIndex.getBoundingClientRect();

          const lineX  = imgR.right + 10;
          const lineW  = Math.max(0, itemR.left - lineX - 10);
          const rightY = itemR.top + itemR.height / 2;
          const connOpacity = dateOpacity > 0.15 ? 0.5 : 0;
          qsConnDisplay("flex"); qsConnLeft(lineX); qsConnTop(rightY);
          qsConnWidth(lineW); qsConnOpacity(connOpacity);

          const leftLineEnd   = imgR.left - 10;
          const leftLineStart = idxR.right + 10;
          const leftLineW     = Math.max(0, leftLineEnd - leftLineStart);
          const leftY         = idxR.top + idxR.height / 2;
          qsConnLDisplay("flex"); qsConnLLeft(leftLineStart); qsConnLTop(leftY);
          qsConnLWidth(leftLineW); qsConnLOpacity(connOpacity);
        } else {
          qsConnOpacity(0);
          qsConnLOpacity(0);
        }
      }

    },
  });

  // Button initial unter dem letzten sichtbaren Divider positionieren
  const moreBtnEl  = document.getElementById("eventMoreBtn");
  const lastImg    = projectImgs[projectImgs.length - 1];
  if (moreBtnEl && lastImg) {
    const trailingDivider = lastImg.nextElementSibling?.classList.contains("project-divider")
      ? lastImg.nextElementSibling
      : null;
    const refEl = trailingDivider || lastImg;
    const btnInitialTop = refEl.offsetTop + refEl.offsetHeight + 24;
    gsap.set(moreBtnEl, { top: btnInitialTop, y: 0, xPercent: -50 });
  }

  ScrollTrigger.refresh();
}

// ─── window.load ─────────────────────────────────────────────────────────────
window.addEventListener("load", () => {

  // ─── --vh für andere Elemente
  if (window.innerWidth <= 1024) {
    const setVh = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--vh", (h / 100) + "px");
    };
    setVh();
    (window.visualViewport ?? window).addEventListener("resize", setVh);
  }

  // ─── Initial render ────────────────────────────────────────────────────
  renderEvents(getNearestN("all"));


  // ─── Hero Badge ────────────────────────────────────────────────────────
  const heroBadgeRing = document.querySelector(".hero-badge-ring");
  if (heroBadgeRing) gsap.to(heroBadgeRing, { rotation: 360, duration: 20, ease: "none", repeat: -1 });

  const heroBadge = document.querySelector(".hero-badge");
  if (heroBadge) {
    heroBadge.addEventListener("click", () => {
      const locationEl = document.getElementById("location");
      if (locationEl) lenis.scrollTo(locationEl, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  }

  // ─── Hero Scroll-Line ──────────────────────────────────────────────────
  const scrollLineInner = document.querySelector(".hero-scroll-line-inner");
  const introEl         = document.querySelector(".intro");
  if (scrollLineInner && introEl) {
    gsap.to(scrollLineInner, {
      scaleY: 0, transformOrigin: "top center",
      scrollTrigger: { trigger: introEl, start: "top top", end: "bottom top", scrub: true },
    });
  }

  // ─── Page Counter — Track-Animation ────────────────────────────────────
  const sections   = [
    { id: "intro",     index: 0 },
    { id: "spotlight", index: 1 },
    { id: "location",  index: 2 },
    { id: "contact",   index: 3 },
    { id: "footer",    index: 4 },
  ];
  const labelItems   = document.querySelectorAll(".page-label-item");
  const pageLabel    = document.getElementById("pageLabel");
  let currentSection = 0;

  const progressFill = document.getElementById("pageLabelBarFill");
  const SPOTLIGHT_I  = 1;
  const SEC_IDS      = sections.map(s => s.id);

  // Label-Wechsel Animation
  function switchLabel(newIndex) {
    if (newIndex === currentSection) return;
    const prevIndex = currentSection;
    currentSection  = newIndex;
    if (!labelItems.length) return;
    const prevItem = labelItems[prevIndex];
    const nextItem = labelItems[newIndex];
    if (!prevItem || !nextItem) return;
    gsap.set(nextItem, { display: "flex", y: "100%", opacity: 1 });
    gsap.to(prevItem, {
      y: "-100%", duration: 0.52, ease: "power2.inOut",
      onComplete: () => gsap.set(prevItem, { display: "none", y: 0 }),
    });
    gsap.to(nextItem, { y: 0, duration: 0.52, ease: "power2.inOut" });
  }

  if (labelItems.length) {
    gsap.set(labelItems,    { display: "none", opacity: 0, y: 0 });
    gsap.set(labelItems[0], { display: "flex", opacity: 1, y: 0 });
  }

  // Flag: während Filter-Reinit keine Label/Progress-Updates
  let spotlightReiniting = false;

  // Einziger synchroner Handler für Label + Progress Bar
  if (progressFill) {
    const setFillWidth = gsap.quickSetter(progressFill, "width", "%");
    let lastPct = 0;
    let resetTimer = null;

    lenis.on("scroll", () => {
      if (spotlightReiniting) return;
      const vh = window.innerHeight;

      // Aktive Sektion: spST.isActive für Spotlight (zuverlässiger als DOM-Position),
      // sonst letzte Sektion deren top ≤ 2px
      let idx = 0;
      if (spST && spST.isActive) {
        idx = SPOTLIGHT_I;
      } else {
        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(SEC_IDS[i]);
          if (el && el.getBoundingClientRect().top <= 2) { idx = i; break; }
        }
      }

      // Label synchron mit Progress wechseln
      if (idx !== currentSection) switchLabel(idx);

      // Progress berechnen
      let pct;
      if (idx === SPOTLIGHT_I) {
        pct = spST ? spST.progress * 100 : 0;
      } else if (idx >= SEC_IDS.length - 1) {
        pct = 100;
      } else {
        const nextEl = document.getElementById(SEC_IDS[idx + 1]);
        if (!nextEl) return;
        pct = Math.max(0, Math.min(100, (1 - nextEl.getBoundingClientRect().top / vh) * 100));
      }

      // Sanfte Transition nur beim Zurückspringen (Sektionswechsel)
      if (pct < lastPct - 10) {
        progressFill.style.transition = "width 0.45s cubic-bezier(0.4,0,0.2,1)";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { progressFill.style.transition = "none"; }, 460);
      }
      lastPct = pct;

      setFillWidth(pct);
    });
  }

  // ─── Spotlight ─────────────────────────────────────────────────────────
  initSpotlight();

  // ─── Side Panel ──────────────────────────────────────────────────────────
  const espPanel   = document.getElementById("eventSidePanel");
  const espContent = document.getElementById("espContent");
  const espClose   = document.getElementById("espClose");
  const espBdrop   = document.getElementById("espBackdrop");

  function buildPanelContent(idx) {
    const ev = eventData[idx];
    if (!ev) return "";
    const num        = String(idx + 1).padStart(2, "0");
    const imgSrc     = document.querySelector(`.project-img[data-index="${idx}"] img`)?.src || "";
    const dateParts  = ev.datum.split(".");
    const dateDisplay = dateParts.length === 3 ? `${dateParts[0]} — ${dateParts[1]} — ${dateParts[2]}`
      : ev.datum;
    const ticketBtn = ev.hasTicket
      ? `<a href="${ev.ticketUrl}" class="esp-ticket" target="_blank" rel="noopener"><span>Tickets</span><span class="esp-ticket-arrow">↗</span></a>`
      : "";
    return `
      <img src="${imgSrc}" class="esp-bg-img" alt="" aria-hidden="true" />
      <div class="esp-left">
        <div class="esp-vline" aria-hidden="true"></div>
        <p class="esp-num">${num} — ${ev.rubrik}</p>
        <p class="esp-artist">${ev.untertitel}</p>
        <h2 class="esp-title">${ev.titel}</h2>
        <div class="esp-rule"><span class="esp-rule-dot"></span><span class="esp-rule-line"></span><span class="esp-rule-dot"></span></div>
        <div class="esp-date">${dateDisplay}</div>
        <div class="esp-location">
          <span class="esp-loc-label">Location</span>
          <span class="esp-loc-val">${ev.raum}</span>
        </div>
        ${ticketBtn ? `<div class="esp-actions">${ticketBtn}</div>` : ""}
        <p class="esp-desc">${ev.beschreibung}</p>
      </div>`;
  }

  function openCard(idx) {
    if (openCardIdx === idx) return;
    openCardIdx = idx;
    espContent.innerHTML = buildPanelContent(idx);
    espPanel.setAttribute("aria-hidden", "false");
    gsap.set(espPanel, { x: "100%" });
    gsap.to(espPanel, { x: "0%", duration: 0.38, ease: "expo.out" });
    gsap.to(espBdrop, { opacity: 1, duration: 0.25, ease: "power2.out", pointerEvents: "all" });
    gsap.fromTo(espContent.querySelector(".esp-bg-img"),
      { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.05 }
    );
    const els = espContent.querySelectorAll(".esp-num, .esp-artist, .esp-title, .esp-rule, .esp-date, .esp-location, .esp-desc, .esp-actions");
    gsap.fromTo(els,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.26, stagger: 0.045, ease: "power2.out", delay: 0.18 }
    );
    document.querySelectorAll(".project-name-item").forEach(item =>
      gsap.to(item, { opacity: 0, x: 28, duration: 0.22, ease: "power2.in" })
    );
    const projectIndexEl = document.querySelector(".project-index");
    if (projectIndexEl) gsap.to(projectIndexEl, { opacity: 0, x: -28, duration: 0.22, ease: "power2.in" });
    document.querySelectorAll(".project-connector").forEach(c => gsap.to(c, { opacity: 0, duration: 0.15 }));
    lenis.stop();
  }

  function closeCard(animate = true) {
    if (openCardIdx === -1) return;
    openCardIdx = -1;
    espPanel.setAttribute("aria-hidden", "true");
    if (animate) {
      gsap.to(espPanel, { x: "100%", duration: 0.28, ease: "expo.in" });
      gsap.to(espBdrop, { opacity: 0, duration: 0.2, ease: "power2.in", pointerEvents: "none" });
    } else {
      gsap.set(espPanel, { x: "100%" });
      gsap.set(espBdrop, { opacity: 0, pointerEvents: "none" });
    }
    document.querySelectorAll(".project-name-item").forEach(item =>
      gsap.to(item, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", delay: animate ? 0.1 : 0 })
    );
    const projectIndexEl2 = document.querySelector(".project-index");
    if (projectIndexEl2) gsap.to(projectIndexEl2, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", delay: animate ? 0.1 : 0 });
    requestAnimationFrame(() => applySlots(lastValidN));
    setTimeout(() => {
      document.querySelectorAll(".project-connector").forEach(c => gsap.set(c, { clearProps: "opacity" }));
    }, animate ? 260 : 0);
    if (!document.getElementById("Navbar")?.classList.contains("nav-open")) lenis.start();
  }


  espClose.addEventListener("click", () => closeCard(true));
  espBdrop.addEventListener("click", () => closeCard(true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openCardIdx !== -1) closeCard(true); });

  // Klick auf Bild öffnet/schließt Panel
  document.querySelectorAll(".project-img").forEach((imgEl) => {
    imgEl.style.cursor = "pointer";
    imgEl.addEventListener("click", (e) => {
      if (e.target.closest(".proj-ticket-badge")) return;
      const idx = parseInt(imgEl.dataset.index, 10);
      if (openCardIdx === idx) closeCard(true);
      else openCard(idx);
    });
  });

  // Klick auf Titel-Item öffnet Panel
  document.querySelectorAll(".project-name-item").forEach((item) => {
    item.style.cursor = "pointer";
    item.addEventListener("click", () => {
      const idx = parseInt(item.dataset.index, 10);
      if (openCardIdx === idx) closeCard(true);
      else openCard(idx);
    });
  });

  // ─── Filter Bar ───────────────────────────────────────────────────────────
  const filterBar   = document.getElementById("eventFilter");
  const filterItems = filterBar.querySelectorAll(".ef-item");
  const indicator   = filterBar.querySelector(".ef-indicator");
  const moreBtn     = document.getElementById("eventMoreBtn");
  const emptyState  = document.getElementById("eventEmptyState");
  const emptyBtn    = document.getElementById("eventEmptyBtn");

  const EMPTY_BTN_COLORS = {
    "D50 Deck 1":    "#E63289",
    "D50 Skylounge": "rgb(212,170,40)",
  };

  function updateEmptyState(filter) {
    const pool = getNearestN(filter, 100).length;
    const spotlightEl = document.querySelector(".spotlight");
    if (pool === 0 && filter !== "all") {
      if (emptyState) emptyState.style.display = "";
      if (emptyBtn) {
        const c = EMPTY_BTN_COLORS[filter] || "#fff";
        emptyBtn.style.borderColor = c;
        emptyBtn.style.color = c;
      }
      if (spotlightEl) spotlightEl.classList.add("spotlight-empty");
      if (moreBtn) moreBtn.style.display = "none";
    } else {
      if (emptyState) emptyState.style.display = "none";
      if (spotlightEl) spotlightEl.classList.remove("spotlight-empty");
    }
  }

  if (emptyBtn) {
    emptyBtn.addEventListener("click", () => {
      resetFilter();
      renderEvents(getNearestN("all", currentCount));
      initSpotlight();
      updateEmptyState("all");
      if (moreBtn) {
        const poolSize = getNearestN("all", 100).length;
        moreBtn.style.display = poolSize > currentCount ? "" : "none";
      }
      ScrollTrigger.refresh();
    });
  }
  let moreBtnFadeTimer = null;

  function moveIndicator(activeEl) {
    if (!indicator || !activeEl) return;
    const trackRect  = filterBar.querySelector(".ef-track").getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    indicator.style.top    = (activeRect.top - trackRect.top) + "px";
    indicator.style.height = activeRect.height + "px";
  }

  function resetFilter() {
    document.querySelectorAll(".hero-loc-btn").forEach(b => b.classList.remove("is-active"));
    currentFilter = "all";
    window._activeLocFilter = "ALL";
    filterItems.forEach(i => i.classList.remove("active"));
    const efAll = filterBar.querySelector('.ef-item[data-filter="all"]');
    if (efAll) { efAll.classList.add("active"); moveIndicator(efAll); }
    document.querySelectorAll(".mec-filter-item").forEach(i =>
      i.classList.toggle("active", i.dataset.filter === "all")
    );
    renderMobileEvents(getNearestN("all", 8));
    setSpotlightGlow("all");
    updateEmptyState("all");
  }

  moveIndicator(filterBar.querySelector(".ef-item.active"));

  filterItems.forEach((item) => {
    item.addEventListener("click", () => {
      const loc = item.dataset.filter;
      if (item.classList.contains("active")) return; // kein Toggle
      window._activeLocFilter = loc === "all" ? "ALL" : loc;
      currentFilter = loc;
      filterItems.forEach(i => i.classList.remove("active"));
      const activeItem = loc === "all" ? filterBar.querySelector('.ef-item[data-filter="all"]') : item;
      if (activeItem) activeItem.classList.add("active");
      moveIndicator(activeItem);
      if (openCardIdx !== -1) closeCard(false);
      // Kollabiere Extra-Slots bei Filter-Wechsel
      if (currentCount === 16) {
        currentCount = 8;
        document.querySelectorAll("[data-extra='true']").forEach(el => el.classList.add("spotlight-extra"));
        if (moreBtn) {
          moreBtn.querySelector(".emb-label").textContent = "Mehr";
          moreBtn.querySelector(".emb-arrow").textContent = "↓";
        }
      }
      // Wenn im gepinnten Spotlight: erst zum Anfang scrollen, dann erst kill/recreate.
      // So ändert sich die Pin-Spacer-Höhe bei scroll=0 der Section → kein Sprung.
      if (spST && spST.isActive) {
        lenis.scrollTo(spST.start, { immediate: true });
      }

      spotlightReiniting = true;
      renderEvents(getNearestN(loc, currentCount));
      initSpotlight();
      setSpotlightGlow(loc);
      updateEmptyState(loc);
      if (moreBtn) {
        const poolSize = getNearestN(loc, 100).length;
        moreBtn.style.display = poolSize > currentCount ? "" : "none";
      }
      ScrollTrigger.refresh();
      requestAnimationFrame(() => { spotlightReiniting = false; });
    });
  });

  // Mobile mehr/weniger Button (0 = 5 sichtbar, 1 = 8, 2 = 16)
  const mecMoreBtn = document.getElementById("mecMoreBtn");
  const mobileList = document.getElementById("mobileEventList");
  let mobileExpandState = 0;

  function updateMecMoreBtn() {
    if (!mecMoreBtn) return;
    const poolSize = getNearestN(currentFilter, 100).length;
    if (poolSize <= 5) { mecMoreBtn.style.display = "none"; return; }
    mecMoreBtn.style.display = "";
    if (mobileExpandState === 2) {
      mecMoreBtn.textContent = "Weniger anzeigen";
    } else {
      mecMoreBtn.textContent = "Mehr anzeigen";
    }
  }

  function resetMobileExpand() {
    mobileExpandState = 0;
    if (mobileList) mobileList.classList.remove("mec-expanded");
    renderMobileEvents(getNearestN(currentFilter, 8));
    updateMecMoreBtn();
    // Nach dem Collapse zum Ende der sichtbaren 5 Cards scrollen
    requestAnimationFrame(() => {
      const fifthCard = mobileList?.querySelectorAll(".mobile-event-card")[4];
      const target = fifthCard ?? mecMoreBtn;
      if (target) target.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }

  if (mecMoreBtn && mobileList) {
    mecMoreBtn.addEventListener("click", () => {
      if (mobileExpandState === 0) {
        // 5 → 16
        mobileExpandState = 2;
        renderMobileEvents(getNearestN(currentFilter, 16));
        mobileList.classList.add("mec-expanded");
      } else {
        // 16 → 5
        resetMobileExpand();
      }
      updateMecMoreBtn();
    });
    updateMecMoreBtn();
  }

  // Mobile Filter Buttons
  document.querySelectorAll(".mec-filter-item").forEach(mItem => {
    mItem.addEventListener("click", () => {
      const isActive = mItem.classList.contains("active") && mItem.dataset.filter !== "all";
      const newFilter = isActive ? "all" : mItem.dataset.filter;
      if (newFilter === currentFilter && mobileExpandState === 0) return;

      mobileExpandState = 0;
      if (mobileList) mobileList.classList.remove("mec-expanded");

      if (newFilter === "all") {
        resetFilter();
        updateMecMoreBtn();
        return;
      }

      currentFilter = newFilter;
      window._activeLocFilter = newFilter;

      filterItems.forEach(i => i.classList.remove("active"));
      const efActive = filterBar.querySelector(`.ef-item[data-filter="${newFilter}"]`);
      if (efActive) { efActive.classList.add("active"); moveIndicator(efActive); }

      document.querySelectorAll(".mec-filter-item").forEach(i =>
        i.classList.toggle("active", i.dataset.filter === newFilter)
      );

      renderMobileEvents(getNearestN(newFilter, 8));
      updateMecMoreBtn();
      setSpotlightGlow(newFilter);
      updateEmptyState(newFilter);
    });
  });

  // ─── Mobile Event-Liste: Swipe links/rechts → Filter wechseln ────────────
  if (mobileList) {
    const FILTER_ORDER = ["all", "D50 Deck 1", "D50 Skylounge"];
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeLocked = false;

    mobileList.addEventListener("touchstart", (e) => {
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      swipeLocked = false;
    }, { passive: true });

    mobileList.addEventListener("touchmove", (e) => {
      if (swipeLocked) return;
      const dx = e.touches[0].clientX - swipeStartX;
      const dy = e.touches[0].clientY - swipeStartY;
      // Erst nach 8px entscheiden ob horizontal oder vertikal
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { swipeLocked = true; } // vertikal → ignorieren
    }, { passive: true });

    mobileList.addEventListener("touchend", (e) => {
      if (swipeLocked) return;
      const dx = e.changedTouches[0].clientX - swipeStartX;
      const dy = e.changedTouches[0].clientY - swipeStartY;
      if (Math.abs(dx) < 52 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
      const currentIdx = FILTER_ORDER.indexOf(currentFilter);
      const nextIdx = dx < 0
        ? Math.min(currentIdx + 1, FILTER_ORDER.length - 1)
        : Math.max(currentIdx - 1, 0);
      if (nextIdx === currentIdx) return;
      mobileList.classList.add("is-swiping");
      setTimeout(() => mobileList.classList.remove("is-swiping"), 200);
      const targetFilter = FILTER_ORDER[nextIdx];
      const mecItem = document.querySelector(`.mec-filter-item[data-filter="${targetFilter}"]`);
      if (mecItem) mecItem.click();
    }, { passive: true });
  }

  // Filter + Info + More-Button visibility via ScrollTrigger
  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: () => `+=${window.innerHeight * visibleCount * 5 / 8}px`,
    onEnter:     () => { filterBar.classList.add("visible"); },
    onLeave:     () => { filterBar.classList.remove("visible"); },
    onEnterBack: () => { filterBar.classList.add("visible"); },
    onLeaveBack: () => { filterBar.classList.remove("visible"); },
  });

  // More-Button: Initial-Sichtbarkeit prüfen
  if (moreBtn) {
    const initPool = getNearestN(currentFilter, 100).length;
    if (initPool <= 8) moreBtn.style.display = "none";
    moreBtn.addEventListener("click", () => {
      gsap.to(moreBtn, { opacity: 0, duration: 0.18, ease: "power2.in",
        onComplete: () => {
          if (currentCount === 8) {
            if (spST && spST.isActive) lenis.scrollTo(spST.start, { immediate: true });
            spotlightReiniting = true;
            currentCount = 16;
            document.querySelectorAll("[data-extra='true']").forEach(el => el.classList.remove("spotlight-extra"));
            renderEvents(getNearestN(currentFilter, 16));
            initSpotlight();
            ScrollTrigger.refresh();
            requestAnimationFrame(() => { spotlightReiniting = false; });
            moreBtn.querySelector(".emb-label").textContent = "Weniger";
            moreBtn.querySelector(".emb-arrow").textContent = "↑";
          } else {
            const target = document.querySelector(".spotlight").offsetTop + window.innerHeight * 5;
            lenis.scrollTo(target, {
              duration: 1.4,
              easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
              onComplete: () => {
                currentCount = 8;
                document.querySelectorAll("[data-extra='true']").forEach(el => el.classList.add("spotlight-extra"));
                renderEvents(getNearestN(currentFilter, 8));
                initSpotlight();
                ScrollTrigger.refresh();
                moreBtn.querySelector(".emb-label").textContent = "Mehr";
                moreBtn.querySelector(".emb-arrow").textContent = "↓";
                gsap.to(moreBtn, { opacity: 1, duration: 0.25, ease: "power2.out" });
              }
            });
            return;
          }
          gsap.to(moreBtn, { opacity: 1, duration: 0.25, ease: "power2.out" });
        }
      });
    });
  }

  window._activeLocFilter = "ALL";
  ScrollTrigger.refresh();

  // ─── Spotlight Location-Glow ──────────────────────────────────────────
  const spotlightGlow = document.querySelector(".spotlight-loc-glow");
  const GLOW_COLORS = {
    all:              "rgba(230,50,137,0.28)",
    "D50 Deck 1":     "rgba(87,191,196,0.35)",
    "D50 Skylounge":  "rgba(212,170,40,0.32)",
  };
  function setSpotlightGlow(filter, animate = true) {
    if (!spotlightGlow) return;
    const color = GLOW_COLORS[filter] ?? GLOW_COLORS.all;
    const newBg = `radial-gradient(ellipse 90% 100% at 50% 0%, ${color} 0%, transparent 100%)`;
    if (!animate) { spotlightGlow.style.background = newBg; return; }
    gsap.to(spotlightGlow, {
      opacity: 0, duration: 0.18, ease: "power2.in",
      onComplete() {
        spotlightGlow.style.background = newBg;
        gsap.to(spotlightGlow, { opacity: 1, duration: 0.5, ease: "power2.out" });
      },
    });
  }
  setSpotlightGlow("all", false); // initialer Zustand ohne Animation

  // ─── Location: Tab Switch (Skylounge ↔ Deck1) ─────────────────────────
  {
    function switchLocation(to) {
      document.querySelectorAll(".lt-tab").forEach((tab) => {
        const active = tab.dataset.to === to;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      const panel = document.querySelector(".lt-panel");
      if (panel) {
        panel.classList.toggle("is-sky",   to === "sky");
        panel.classList.toggle("is-deck1", to === "deck1");
      }
      const tabsEl = document.querySelector(".lt-tabs");
      if (tabsEl) {
        tabsEl.classList.toggle("active-sky",   to === "sky");
        tabsEl.classList.toggle("active-deck1", to === "deck1");
      }

      // Photo: scale-crossfade
      document.querySelectorAll(".lt-photo-img").forEach((p) => {
        const active = p.classList.contains("lt-photo-img--" + to);
        if (active) {
          p.style.pointerEvents = "auto";
          gsap.fromTo(p,
            { opacity: 0, scale: 1.05 },
            { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out" }
          );
        } else {
          gsap.to(p, { opacity: 0, scale: 1.02, duration: 0.45, ease: "power2.in",
            onComplete() { p.style.pointerEvents = "none"; }
          });
        }
      });

      // View: slide + fade
      document.querySelectorAll(".lt-view").forEach((v) => {
        const active = v.classList.contains("lt-view--" + to);
        if (active) {
          gsap.fromTo(v,
            { opacity: 0, x: 28 },
            { opacity: 1, x: 0, duration: 0.52, ease: "power2.out",
              onStart() { gsap.set(v, { pointerEvents: "auto" }); } }
          );
          // Stagger stats
          const stats = v.querySelectorAll(".lt-stat");
          gsap.fromTo(stats,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.38, stagger: 0.07, delay: 0.18, ease: "power2.out" }
          );
        } else {
          gsap.to(v, { opacity: 0, x: -16, duration: 0.28, ease: "power2.in",
            onComplete() { gsap.set(v, { pointerEvents: "none", x: 0 }); } });
        }
      });
    }
    document.querySelectorAll(".lt-tab").forEach((tab) => {
      tab.addEventListener("click", () => switchLocation(tab.dataset.to));
    });
    const panel = document.querySelector(".lt-panel");
    if (panel) panel.classList.add("is-deck1");

    // ─── Hero Location Buttons ────────────────────────────────────────────
    function activateLocation(locTo, filterName) {
      switchLocation(locTo);

      // State direkt setzen – kein Click auf Desktop-Filter (kein Toggle-Risiko)
      currentFilter = filterName;
      window._activeLocFilter = filterName === "all" ? "ALL" : filterName;

      // Desktop ef-items
      filterItems.forEach(i => i.classList.remove("active"));
      const efActive = filterBar.querySelector(`.ef-item[data-filter="${filterName}"]`);
      if (efActive) { efActive.classList.add("active"); moveIndicator(efActive); }

      // Mobile Filter-Buttons
      document.querySelectorAll(".mec-filter-item").forEach(i =>
        i.classList.toggle("active", i.dataset.filter === filterName)
      );

      // Mobile Event-Liste neu rendern
      renderMobileEvents(getNearestN(filterName, 8));
      setSpotlightGlow(filterName);
      updateEmptyState(filterName);
    }
    const heroLocBtns = document.querySelectorAll(".hero-loc-btn");
    function setHeroActive(btn) {
      heroLocBtns.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    }
    document.querySelector(".hero-loc-btn--deck1")
      ?.addEventListener("click", (e) => {
        if (e.currentTarget.classList.contains("is-active")) {
          resetFilter();
        } else {
          activateLocation("deck1", "D50 Deck 1");
          setHeroActive(e.currentTarget);
        }
      });
    document.querySelector(".hero-loc-btn--sky")
      ?.addEventListener("click", (e) => {
        if (e.currentTarget.classList.contains("is-active")) {
          resetFilter();
        } else {
          activateLocation("sky", "D50 Skylounge");
          setHeroActive(e.currentTarget);
        }
      });
    document.getElementById("intro")
      ?.addEventListener("click", (e) => {
        if (e.target.closest(".hero-loc-btn")) return;
        if ([...heroLocBtns].some(b => b.classList.contains("is-active"))) resetFilter();
      });
  }

  // ─── Location: Entrance Animation ────────────────────────────────────────
  {
    const locSection = document.querySelector(".location");
    const isMobileDevice = navigator.maxTouchPoints > 0 && window.innerWidth <= 1000;
    if (locSection) {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: locSection, start: "top 82%", once: true },
      });
      if (!isMobileDevice) {
        tl.fromTo(".lt-tabs",
          { y: -24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
        );
      }
      tl.fromTo(".lt-photo",
        { x: -48, opacity: 0, scale: 1.04 },
        { x: 0, opacity: 1, scale: 1, duration: 0.75, ease: "power2.out" },
        isMobileDevice ? "0" : "-=0.35"
      )
      .fromTo(".lt-panel",
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.65, ease: "power2.out" },
        "-=0.55"
      )
      .fromTo(".lt-view--deck1 .lt-stat",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" },
        "-=0.3"
      );
    }
  }

  // ─── Section Snap ────────────────────────────────────────────────────────
  const snapSections = Array.from(document.querySelectorAll(".snap-section"));
  let snapTimer    = null;
  let isSnapping   = false;
  let snapSafetyTimer = null;
  const isTouch    = navigator.maxTouchPoints > 0;

  lenis.on("scroll", () => {
    // Wenn ein Snap lief aber Lenis am Ziel angekommen ist (oder vom User abgebrochen wurde), sofort freigeben
    if (isSnapping) {
      if (Math.abs(lenis.animatedScroll - lenis.targetScroll) < 1) {
        isSnapping = false;
        clearTimeout(snapSafetyTimer);
      }
      return;
    }
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const isMobile = isTouch && window.innerWidth <= 1000;
      const threshold = window.innerHeight * (isMobile ? 0.13 : 0.20);
      let snapTarget = null, minDist = Infinity;
      snapSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const dist = Math.abs(rect.top);
        if (dist < threshold && dist < minDist) { minDist = dist; snapTarget = section; }
      });
      if (snapTarget && minDist > 2) {
        isSnapping = true;
        clearTimeout(snapSafetyTimer);
        snapSafetyTimer = setTimeout(() => { isSnapping = false; }, 600);
        const exactTop = snapTarget.getBoundingClientRect().top + window.scrollY;
        lenis.scrollTo(exactTop, {
          duration: isMobile ? 0.45 : 0.55,
          easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        });
      }
    }, isTouch ? 220 : 80);
  });

  // ─── Navbar (overlay – tablet / mobile) ────────────────────────────────
  const menuBtn = document.getElementById("menu04");
  const navbar  = document.getElementById("Navbar");

  if (menuBtn && navbar) {
    const navItems = document.querySelectorAll(".navH");
    const navTexts = document.querySelectorAll(".nav-item-text");
    const navNums  = document.querySelectorAll(".nav-item-num");
    const navLines = document.querySelectorAll(".nav-line");

    gsap.set(navLines, { scaleX: 0 });
    gsap.set(navTexts, { y: 60, opacity: 0 });
    gsap.set(navNums,  { opacity: 0 });

    function openNav() {
      navbar.classList.add("nav-open");
      menuBtn.classList.add("active");
      menuBtn.setAttribute("aria-expanded", "true");
      lenis.stop();
      if (pageLabel) gsap.to(pageLabel, { opacity: 0, duration: 0.2 });
      gsap.to(navTexts, { y: 0, opacity: 1, duration: 0.65, ease: "power3.out", stagger: 0.08, delay: 0.25 });
      gsap.to(navNums,  { opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.35 });
    }

    function closeNav() {
      gsap.to(navTexts, { y: -40, opacity: 0, duration: 0.3, ease: "power2.in", stagger: 0.04 });
      gsap.to(navNums,  { opacity: 0, duration: 0.2 });
      document.querySelectorAll(".navImgWrapper").forEach(w => gsap.to(w, { opacity: 0, duration: 0.2 }));
      if (pageLabel) gsap.to(pageLabel, { opacity: 1, duration: 0.35, delay: 0.25 });
      setTimeout(() => {
        navbar.classList.remove("nav-open");
        menuBtn.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        if (openCardIdx === -1) lenis.start();
      }, 200);
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navbar.classList.contains("nav-open") ? closeNav() : openNav();
    });

    navItems.forEach((item) => {
      const clip = item.querySelector(".navImgWrapper");
      const line = item.querySelector(".nav-line");
      if (!clip) return;
      const rots = [3, -2, 1.5];
      const idx  = Array.from(navItems).indexOf(item);
      gsap.set(clip, { rotation: rots[idx] || 2, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.85 });
      item.addEventListener("mouseenter", () => {
        gsap.to(clip, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
        if (line) gsap.to(line, { scaleX: 1, duration: 0.45, ease: "power3.out" });
      });
      item.addEventListener("mouseleave", () => {
        gsap.to(clip, { opacity: 0, scale: 0.85, duration: 0.35, ease: "power3.in" });
        if (line) gsap.to(line, { scaleX: 0, duration: 0.3, ease: "power2.in" });
      });
      item.addEventListener("mousemove", (e) => {
        gsap.to(clip, { x: e.clientX, y: e.clientY, duration: 0.55, ease: "power2.out" });
      });
    });

    const clockEl = document.getElementById("navClock");
    if (clockEl) {
      const tick = () => { clockEl.textContent = new Date().toLocaleTimeString("de-DE"); };
      tick(); setInterval(tick, 1000);
    }

    // Overlay nav link clicks
    document.querySelectorAll("#Navbar .nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const href   = link.getAttribute("href");
        const target = document.querySelector(href);
        if (!target) return;
        closeNav();
        setTimeout(() => {
          const dest = (href === "#spotlight" && spST) ? spST.start : target;
          lenis.scrollTo(dest, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
        }, 650);
      });
    });
  }

  // ─── Custom Cursor ────────────────────────────────────────────────────────
  const cursor = document.createElement("div");
  cursor.id = "cursor";
  document.body.appendChild(cursor);

  window.addEventListener("mousemove", (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
  });

  document.querySelectorAll("a, button, .navH, .project-name-item, .project-divider, .hero-badge, .project-index").forEach((el) => {
    el.addEventListener("mouseenter", () => gsap.to(cursor, { scale: 3.5, duration: 0.3, ease: "power2.out" }));
    el.addEventListener("mouseleave", () => gsap.to(cursor, { scale: 1,   duration: 0.3, ease: "power2.out" }));
  });

  // ─── Location Slider ──────────────────────────────────────────────────────
  function initSlider(sliderEl) {
    if (!sliderEl) return;
    const slides = Array.from(sliderEl.querySelectorAll(".lt-slide"));
    const dots   = Array.from(sliderEl.querySelectorAll(".lt-dot"));
    const btnPrev = sliderEl.querySelector(".lt-arrow--prev");
    const btnNext = sliderEl.querySelector(".lt-arrow--next");
    const DURATION = 0.6, AUTO_MS = 4000;
    let current = 0, animating = false, timer;
    slides.forEach((s, i) => {
      gsap.set(s, { x: i === 0 ? "0%" : "100%", opacity: i === 0 ? 1 : 0 });
      if (i === 0) s.classList.add("is-active");
    });
    function goTo(next, dir) {
      if (animating || next === current) return;
      animating = true;
      const prev = current; current = next;
      dots[prev]?.classList.remove("is-active");
      dots[current]?.classList.add("is-active");
      gsap.set(slides[current], { x: dir > 0 ? "100%" : "-100%", opacity: 1 });
      slides[current].classList.add("is-active");
      gsap.to(slides[prev], { x: dir > 0 ? "-100%" : "100%", duration: DURATION, ease: "power3.inOut",
        onComplete: () => { slides[prev].classList.remove("is-active"); gsap.set(slides[prev], { opacity: 0 }); }
      });
      gsap.to(slides[current], { x: "0%", duration: DURATION, ease: "power3.inOut",
        onComplete: () => { animating = false; }
      });
    }
    function next() { clearInterval(timer); goTo((current + 1) % slides.length, 1); startAuto(); }
    function prev() { clearInterval(timer); goTo((current - 1 + slides.length) % slides.length, -1); startAuto(); }
    function startAuto() { timer = setInterval(() => goTo((current + 1) % slides.length, 1), AUTO_MS); }
    btnNext?.addEventListener("click", next);
    btnPrev?.addEventListener("click", prev);
    // Touch/swipe support
    const SWIPE_MIN = 48;
    let touchStartX = 0;
    sliderEl.addEventListener("touchstart", e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    sliderEl.addEventListener("touchend",   e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) >= SWIPE_MIN) dx < 0 ? next() : prev();
    }, { passive: true });
    startAuto();
  }
  // Slider-Slides mit Event-Bildern aus der Datenbank befüllen
  function fillSliderWithEvents(sliderEl, raum, startSlide) {
    if (!sliderEl) return;
    const imgs    = sliderEl.querySelectorAll(".lt-slide img");
    const usedSrcs = new Set(Array.from(imgs).slice(0, startSlide).map(img => img.src));
    const events  = eventLibrary.filter(ev => {
      if (ev.raum !== raum || !ev.bildGross) return false;
      if (usedSrcs.has(ev.bildGross)) return false;
      usedSrcs.add(ev.bildGross);
      return true;
    });
    for (let i = startSlide; i < imgs.length; i++) {
      const ev = events[i - startSlide];
      if (ev) { imgs[i].src = ev.bildGross; imgs[i].alt = ev.titel; }
    }
  }

  fillSliderWithEvents(document.getElementById("sliderSky"),   "D50 Skylounge", 1);
  fillSliderWithEvents(document.getElementById("sliderDeck1"), "D50 Deck 1",    2);

  initSlider(document.getElementById("sliderSky"));
  initSlider(document.getElementById("sliderDeck1"));

  // ─── Resize: ScrollTrigger neu berechnen ─────────────────────────────────
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });

}); // end window.load
