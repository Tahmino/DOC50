import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

// ─── Lenis ───────────────────────────────────────────────────────────────────
const lenis = new Lenis({ smoothWheel: true, syncTouch: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

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

// ─── Event Data ──────────────────────────────────────────────────────────────
const eventData = [
  { artist: "Various Artists", title: "Back2Dock",          date: "14.03.26", location: "Flensburg", category: "Club Night",  hasTicket: true,  ticketUrl: "/anfrage.html", desc: "Eine Nacht voller Energie und Beats – die traditionelle Back2Dock-Nacht kehrt zurück ins Dock50." },
  { artist: "Jerome",          title: "Jerome",             date: "21.03.26", location: "Hamburg",   category: "Live Music",  hasTicket: true,  ticketUrl: "/anfrage.html", desc: "Jerome bringt seinen unverwechselbaren Sound live auf die Dock50-Bühne in Hamburg." },
  { artist: "DJ Collective",   title: "Sixteen Beats",      date: "28.03.26", location: "Flensburg", category: "Club Night",  hasTicket: true,  ticketUrl: "/anfrage.html", desc: "Das DJ Collective bringt sechzehn Beats, die die Nacht zum Leben erwecken." },
  { artist: "Various DJs",     title: "Strictly Oldschool", date: "04.04.26", location: "Kiel",      category: "Club Night",  hasTicket: true,  ticketUrl: "/anfrage.html", desc: "Eine Nacht ganz im Zeichen der klassischen Sounds – Strictly Oldschool im Dock50 Kiel." },
  { artist: "Kuult",           title: "Kuult",              date: "11.04.26", location: "Flensburg", category: "Live Music",  hasTicket: true,  ticketUrl: "/anfrage.html", desc: "Kuult live – emotionale Songs und kraftvolle Bühnenperformance im Dock50 Flensburg." },
  { artist: "TBA",             title: "Live @ Dock50",      date: "18.04.26", location: "Hamburg",   category: "Live Music",  hasTicket: false, ticketUrl: "",              desc: "Details folgen – ein besonderer Abend im Dock50 Hamburg. Stay tuned." },
  { artist: "TBA",             title: "Live @ Dock50",      date: "25.04.26", location: "Kiel",      category: "Live Music",  hasTicket: false, ticketUrl: "",              desc: "Details folgen – ein besonderer Abend im Dock50 Kiel. Stay tuned." },
  { artist: "TBA",             title: "Live @ Dock50",      date: "02.05.26", location: "Flensburg", category: "Live Music",  hasTicket: false, ticketUrl: "",              desc: "Details folgen – ein besonderer Abend im Dock50 Flensburg. Stay tuned." },
  { artist: "TBA",             title: "Live @ Dock50",      date: "09.05.26", location: "Hamburg",   category: "Live Music",  hasTicket: false, ticketUrl: "",              desc: "Details folgen – ein besonderer Abend im Dock50 Hamburg. Stay tuned." },
  { artist: "TBA",             title: "Live @ Dock50",      date: "16.05.26", location: "Kiel",      category: "Live Music",  hasTicket: false, ticketUrl: "",              desc: "Details folgen – ein besonderer Abend im Dock50 Kiel. Stay tuned." },
];

// ─── Module-scope state ───────────────────────────────────────────────────────
let spST        = null;   // spotlight ScrollTrigger instance
let openCardIdx = -1;     // index of currently open side panel (-1 = closed)

// ─── window.load ─────────────────────────────────────────────────────────────
window.addEventListener("load", () => {

  // ─── SplitText ─────────────────────────────────────────────────────────
  const headlineEl = document.querySelector(".headline");
  if (headlineEl) {
    const split = new SplitText(headlineEl, { type: "chars", charsClass: "char" });
    gsap.set(".char", { transformOrigin: "50% 60%" });
    split.chars.forEach((char, i) => {
      char.addEventListener("mouseenter", () => {
        gsap.to(char, { scale: 1.1, duration: 0.25, ease: "power2.out" });
        if (split.chars[i - 1]) gsap.to(split.chars[i - 1], { scale: 1.05, duration: 0.25, ease: "power2.out" });
        if (split.chars[i + 1]) gsap.to(split.chars[i + 1], { scale: 1.05, duration: 0.25, ease: "power2.out" });
      });
      char.addEventListener("mouseleave", () => {
        gsap.to(split.chars, { scale: 1, duration: 0.25, ease: "power2.out" });
      });
    });
  }

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

  if (labelItems.length) {
    function switchLabel(newIndex) {
      if (newIndex === currentSection) return;
      const prevIndex = currentSection;
      currentSection  = newIndex;

      const prevItem = labelItems[prevIndex];
      const nextItem = labelItems[newIndex];

      gsap.set(nextItem, { display: "flex", y: "100%", opacity: 1 });
      gsap.to(prevItem, {
        y: "-100%", opacity: 0, duration: 0.42, ease: "power3.in",
        onComplete: () => gsap.set(prevItem, { display: "none", y: 0 }),
      });
      gsap.to(nextItem, { y: 0, duration: 0.42, ease: "power3.out" });
    }

    gsap.set(labelItems,    { display: "none", opacity: 0, y: 0 });
    gsap.set(labelItems[0], { display: "flex", opacity: 1, y: 0 });

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sec = sections.find(s => s.id === entry.target.id);
          if (sec) switchLabel(sec.index);
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) sectionObserver.observe(el);
    });
  }

  // ─── Spotlight ─────────────────────────────────────────────────────────
  const spotlightSection = document.querySelector(".spotlight");

  if (spotlightSection) {
    const projectIndex           = spotlightSection.querySelector(".project-index h2");
    const projectImgs            = spotlightSection.querySelectorAll(".project-img");
    const projectImagesContainer = spotlightSection.querySelector(".project-images");
    const projectNameItems       = spotlightSection.querySelectorAll(".project-name-item");
    const connector              = spotlightSection.querySelector(".project-connector");
    const totalProjectCount      = projectNameItems.length;

    if (!projectIndex || !projectImagesContainer || totalProjectCount === 0) {
      console.warn("Spotlight: Pflicht-Elemente fehlen");
    } else {

      const VH  = window.innerHeight;
      const mid = VH / 2;

      const imgsH        = projectImagesContainer.offsetHeight;
      const moveDistImages = VH - imgsH;

      const firstImg     = projectImgs[0];
      const firstDivider = spotlightSection.querySelector(".project-divider");
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
      projectIndex.textContent = eventData[0]?.date ?? "01.01.26";
      if (connector) gsap.set(connector, { display: "none", opacity: 0 });

      // ─── Linker Connector (Datum ↔ Bild) ─────────────────────────────────
      const connectorLeft = document.createElement("div");
      connectorLeft.className = "project-connector";
      spotlightSection.appendChild(connectorLeft);
      connectorLeft.innerHTML = `<div class="project-connector-line" style="order:1;"></div><div class="project-connector-dot" style="order:2;"></div>`;
      gsap.set(connectorLeft, { display: "none", opacity: 0 });

      // ─── Divider-Titel ───────────────────────────────────────────────────
      const projectTitles = Array.from(projectNameItems).map(item => {
        const p = item.querySelector("p");
        return p ? p.textContent.trim() : "";
      });

      const projectDividers = spotlightSection.querySelectorAll(".project-divider");
      const dividerTitleEls = [];

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

        // While a card is open: don't start slot animations (would abort slide-out)
        if (openCardIdx !== -1) return;

        if (changed) {
          gsap.to(projectIndex, { opacity: 0, duration: 0.12, ease: "power2.in", onComplete: () => {
            projectIndex.textContent = eventData[displayN]?.date ?? `${String(displayN + 1).padStart(2, "0")}.01.26`;
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

      // ─── ScrollTrigger ───────────────────────────────────────────────────
      spST = ScrollTrigger.create({
        trigger: spotlightSection,
        start: "top top",
        end: `+=${VH * 5}px`,
        pin: true,
        pinSpacing: true,
        onUpdate: (self) => {
          const progress  = self.progress;
          const scrollDir = self.direction;

          gsap.set(projectImagesContainer, { y: progress * moveDistImages });

          const dateOpacity = Math.min(1, progress / 0.04) * Math.min(1, (1 - progress) / 0.02);
          gsap.set(projectIndex, { opacity: dateOpacity });

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
              gsap.set(connector, {
                display: "flex", left: lineX, top: rightY,
                width: lineW, opacity: dateOpacity > 0.15 ? 0.5 : 0,
              });

              const leftLineEnd   = imgR.left - 10;
              const leftLineStart = idxR.right + 10;
              const leftLineW     = Math.max(0, leftLineEnd - leftLineStart);
              const leftY         = idxR.top + idxR.height / 2;
              gsap.set(connectorLeft, {
                display: "flex", left: leftLineStart, top: leftY,
                width: leftLineW, opacity: dateOpacity > 0.15 ? 0.5 : 0,
              });
            } else {
              gsap.set(connector,     { opacity: 0 });
              gsap.set(connectorLeft, { opacity: 0 });
            }
          }
        },
      });

      ScrollTrigger.refresh();

    }
  }

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
    const dateParts  = ev.date.split(".");
    const dateDisplay = dateParts.length === 3
      ? `${dateParts[0]} — ${dateParts[1]} — ${dateParts[2]}`
      : ev.date;
    const ticketBtn = ev.hasTicket
      ? `<a href="${ev.ticketUrl}" class="esp-ticket" target="_blank"><span>Tickets anfragen</span><span class="esp-ticket-arrow">↗</span></a>`
      : "";
    return `
      <img src="${imgSrc}" class="esp-bg-img" alt="" aria-hidden="true" />
      <div class="esp-left">
        <div class="esp-vline" aria-hidden="true"></div>
        <p class="esp-num">${num} — ${ev.category}</p>
        <p class="esp-artist">${ev.artist}</p>
        <h2 class="esp-title">${ev.title}</h2>
        <div class="esp-rule"><span class="esp-rule-dot"></span><span class="esp-rule-line"></span><span class="esp-rule-dot"></span></div>
        <div class="esp-date">${dateDisplay}</div>
        <div class="esp-location">
          <span class="esp-loc-label">Location</span>
          <span class="esp-loc-val">${ev.location}</span>
        </div>
        <p class="esp-desc">${ev.desc}</p>
        <div class="esp-actions">
          ${ticketBtn}
          <a href="/anfrage.html" class="esp-info">↗ weitere Infos</a>
        </div>
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
    setTimeout(() => {
      document.querySelectorAll(".project-connector").forEach(c => gsap.set(c, { clearProps: "opacity" }));
    }, animate ? 260 : 0);
  }

  espClose.addEventListener("click", () => closeCard(true));
  espBdrop.addEventListener("click", () => closeCard(true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openCardIdx !== -1) closeCard(true); });

  // Klick auf Bild öffnet/schließt Panel
  document.querySelectorAll(".project-img").forEach((imgEl) => {
    imgEl.style.cursor = "pointer";
    imgEl.addEventListener("click", () => {
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

  // ─── Info-Button rechts ───────────────────────────────────────────────────
  const infoBtn = document.getElementById("eventInfoBtn");
  let currentActiveIdx = 0;

  if (infoBtn) {
    infoBtn.addEventListener("click", () => {
      if (openCardIdx === currentActiveIdx) closeCard(true);
      else openCard(currentActiveIdx);
    });
  }

  // ─── Filter Bar ───────────────────────────────────────────────────────────
  const filterBar   = document.getElementById("eventFilter");
  const filterItems = filterBar.querySelectorAll(".ef-item");
  const indicator   = filterBar.querySelector(".ef-indicator");

  function moveIndicator(activeEl) {
    if (!indicator || !activeEl) return;
    const trackRect  = filterBar.querySelector(".ef-track").getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    indicator.style.top    = (activeRect.top - trackRect.top) + "px";
    indicator.style.height = activeRect.height + "px";
  }

  moveIndicator(filterBar.querySelector(".ef-item.active"));

  filterItems.forEach((item) => {
    item.addEventListener("click", () => {
      const loc = item.dataset.filter;
      window._activeLocFilter = loc === "all" ? "ALL" : loc;
      filterItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      moveIndicator(item);
      document.querySelectorAll(".project-img[data-location]").forEach((img) => {
        const match = loc === "all" || img.dataset.location === loc;
        gsap.to(img, { opacity: match ? 0.35 : 0.06, duration: 0.35, ease: "power2.out" });
      });
      document.querySelectorAll(".project-name-item[data-location]").forEach((el) => {
        const match  = loc === "all" || el.dataset.location === loc;
        const textEl = el.querySelector("p");
        const numEl  = el.querySelector(".proj-num");
        if (textEl) gsap.to(textEl, { color: match ? null : "rgba(255,255,255,0.07)", duration: 0.35 });
        if (numEl)  gsap.to(numEl,  { color: match ? null : "rgba(255,255,255,0.07)", duration: 0.35 });
      });
    });
  });

  // Filter + Info-Button visibility via ScrollTrigger
  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: `+=${window.innerHeight * 5}px`,
    onEnter:     () => { filterBar.classList.add("visible"); if (infoBtn) infoBtn.classList.add("visible"); },
    onLeave:     () => { filterBar.classList.remove("visible"); if (infoBtn) infoBtn.classList.remove("visible"); },
    onEnterBack: () => { filterBar.classList.add("visible"); if (infoBtn) infoBtn.classList.add("visible"); },
    onLeaveBack: () => { filterBar.classList.remove("visible"); if (infoBtn) infoBtn.classList.remove("visible"); },
  });

  // currentActiveIdx für Info-Button synchron halten
  lenis.on("scroll", () => {
    const vh2 = window.innerHeight / 2;
    document.querySelectorAll(".project-img").forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.top <= vh2 && r.bottom >= vh2) {
        currentActiveIdx = parseInt(img.dataset.index, 10);
      }
    });
  });

  window._activeLocFilter = "ALL";

  // ─── Location Floor Plan ────────────────────────────────────────────────
  {
    const LOC_DATA = {
      _default:   { name: "DOCK50 · Gesamtanlage", area: 1200, height: 8.4, cap: 850  },
      foyer:      { name: "Foyer & Eingang",        area: 180,  height: 4.2, cap: 150  },
      bar:        { name: "Bar & Lounge",            area: 85,   height: 3.8, cap: 70   },
      garderobe:  { name: "Garderobe",               area: 85,   height: 3.4, cap: null },
      haupthalle: { name: "Haupthalle",              area: 580,  height: 6.2, cap: 480  },
      buehne:     { name: "Bühne",                   area: 195,  height: 8.4, cap: null },
      backstage:  { name: "Backstage",               area: 120,  height: 3.6, cap: 40   },
      technik:    { name: "Technik",                 area: 45,   height: 3.2, cap: null },
      vip:        { name: "VIP Lounge",              area: 80,   height: 3.8, cap: 60   },
    };

    const nameEl    = document.getElementById("locRoomName");
    const areaEl    = document.getElementById("locStatArea");
    const heightEl  = document.getElementById("locStatHeight");
    const capEl     = document.getElementById("locStatCap");
    const capUnitEl = document.getElementById("locCapUnit");

    function locCountUp(el, target, duration) {
      if (target === null) { el.textContent = "—"; return; }
      const isFloat = !Number.isInteger(target);
      const startTime = performance.now();
      const key = el._locRafKey = (el._locRafKey || 0) + 1;
      function tick(now) {
        if (el._locRafKey !== key) return;
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        el.textContent = isFloat
          ? val.toFixed(1).replace(".", ",")
          : Math.round(val).toLocaleString("de-DE");
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function setLocData(key, animate = true) {
      const d = LOC_DATA[key];
      if (!d || !nameEl) return;
      nameEl.textContent = d.name;
      const dur = animate ? 650 : 0;
      locCountUp(areaEl,   d.area,   dur);
      locCountUp(heightEl, d.height, dur);
      if (d.cap === null) {
        if (capEl)     { capEl._locRafKey = (capEl._locRafKey || 0) + 1; capEl.textContent = "—"; }
        if (capUnitEl) capUnitEl.textContent = "";
      } else {
        locCountUp(capEl, d.cap, dur);
        if (capUnitEl) capUnitEl.textContent = "Gäste";
      }
    }

    // ── Hover: update data panel ─────────────────────────────────────────
    document.querySelectorAll(".loc-room-group").forEach(g => {
      const room = g.dataset.room;
      g.addEventListener("mouseenter", () => {
        if (!LOC_DATA[room]) return;
        setLocData(room, true);
      });
      g.addEventListener("mouseleave", () => {
        setLocData("_default", true);
      });
    });

    // ── Count-up when section first scrolls into view
    const locSection = document.getElementById("location");
    if (locSection) {
      let locSeen = false;
      const locObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !locSeen) {
          locSeen = true;
          setLocData("_default", true);
          locObs.disconnect();
        }
      }, { threshold: 0.35 });
      locObs.observe(locSection);
    }
  }

  // ─── Rooms Section ────────────────────────────────────────────────────
  {
    const rsSection = document.querySelector(".rooms-section");
    const rsRight   = document.querySelector(".rs-right");
    const rsTitles  = document.querySelectorAll(".rs-title");
    const rsCards   = document.querySelectorAll(".rs-card");

    if (rsSection && rsRight && rsTitles.length) {
      let rsActive = null;

      function rsActivate(key) {
        if (key === rsActive) return;
        const prev = rsActive;
        rsActive = key;
        rsTitles.forEach(t => t.classList.toggle("rs-active", t.dataset.room === key));
        rsCards.forEach(card => {
          if (card.dataset.room === key) {
            gsap.set(card, { visibility: "inherit", pointerEvents: "auto" });
            gsap.to(card, { opacity: 1, duration: 0.45, ease: "power2.inOut", overwrite: true });
          } else if (card.dataset.room === prev) {
            gsap.to(card, {
              opacity: 0, duration: 0.3, ease: "power2.inOut", overwrite: true,
              onComplete() { gsap.set(card, { visibility: "hidden", pointerEvents: "none" }); },
            });
          }
        });
      }

      // Initial state
      rsCards.forEach((c, i) => gsap.set(c, i === 0
        ? { opacity: 1, visibility: "inherit", pointerEvents: "auto" }
        : { opacity: 0, visibility: "hidden", pointerEvents: "none" }
      ));
      rsActive = rsTitles[0].dataset.room;
      rsTitles[0].classList.add("rs-active");

      // Find which title center is closest to viewport center
      function checkActive() {
        const mid = window.innerHeight / 2;
        let closest = null, minDist = Infinity;
        rsTitles.forEach(t => {
          const r = t.getBoundingClientRect();
          const dist = Math.abs((r.top + r.height / 2) - mid);
          if (dist < minDist) { minDist = dist; closest = t; }
        });
        if (closest) rsActivate(closest.dataset.room);
      }

      // Pin section + translate right panel upward
      gsap.to(rsRight, {
        y: () => -(rsRight.offsetHeight - window.innerHeight),
        ease: "none",
        scrollTrigger: {
          trigger: rsSection,
          start: "top top",
          end: () => "+=" + (rsRight.offsetHeight - window.innerHeight),
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: checkActive,
        },
      });
    }
  }

  // ─── Section Snap ────────────────────────────────────────────────────────
  const snapSections = Array.from(document.querySelectorAll(".snap-section"));
  let snapTimer  = null;
  let isSnapping = false;

  lenis.on("scroll", () => {
    if (isSnapping) return;
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const threshold = window.innerHeight * 0.20;
      let snapTarget = null, minDist = Infinity;
      snapSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const dist = Math.abs(rect.top);
        if (dist < threshold && dist < minDist) { minDist = dist; snapTarget = section; }
      });
      if (snapTarget && minDist > 2) {
        isSnapping = true;
        const exactTop = snapTarget.getBoundingClientRect().top + window.scrollY;
        lenis.scrollTo(exactTop, {
          duration: 0.55,
          easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
          onComplete: () => { isSnapping = false; },
        });
      }
    }, 80);
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
        lenis.start();
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

}); // end window.load
