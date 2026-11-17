import "./fx-engine.js";
import "./readability-guard.js";
/**
 * PrimeFactor.app — shared UX layer (every page). Dependency-free.
 *
 *  - scroll progress bar, back-to-top
 *  - scroll-reveal for page sections (IntersectionObserver, opacity + `translate` only)
 *  - cross-page fade transition fallback for browsers without View Transitions
 *  - command palette (Ctrl/Cmd+K, or "/") to jump to any module
 *  - window.UX.toast() for lightweight feedback
 *
 * Everything is skipped or softened for prefers-reduced-motion, and the timed exam arena only
 * gets the passive visual theme (no reveals, no palette, no shortcuts).
 */
(() => {
  const html = document.documentElement;
  const path =
    (location.pathname.split("/").pop() || "index.html").replace(
      /\.html$/,
      "",
    ) || "index";
  html.dataset.uxPage = path;
  const isExam = path === "exam";
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PAGES = [
    ["index", "Home", "Overview, quick sample & live playground"],
    ["ranges", "Range Selection", "Choose a competitive division"],
    ["custom", "Custom Range", "Set your own bounds & rules"],
    ["contest", "Contest Hub", "Sudden-death tournament arena"],
    ["edu", "Training Arena", "Number-theory shortcuts & axioms"],
    ["profile", "Profile", "Rating, streaks & match history"],
    ["profile-settings", "Profile Settings", "Identity & preferences"],
    ["medals", "Medals Vault", "Badges and accolades"],
    ["rating", "Rating Calibrator", "ELO standing & horizon goals"],
    ["cognitive-matrix", "Diagnostics Matrix", "Latency & deficit analytics"],
    ["notifications", "Notifications", "Rating, security & system alerts"],
    ["rules", "Rules & Policies", "Competitive charter"],
    ["contract", "Exam Contract", "Pre-flight briefing"],
    ["services", "Services", "Platform facilities"],
    ["engine", "Engine & Security", "Audio, interlocks & telemetry"],
    ["faq", "FAQ", "Searchable knowledge base"],
  ];

  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    kids.forEach((k) => n.append(k));
    return n;
  };

  // ---- progress bar + back-to-top ---------------------------------------------------------
  const bar = el("div", { id: "ux-progress" });
  bar.setAttribute("aria-hidden", "true");
  const top = el("button", {
    id: "ux-top",
    type: "button",
    title: "Back to top",
  });
  top.setAttribute("aria-label", "Back to top");
  top.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = Math.max(1, html.scrollHeight - window.innerHeight);
      bar.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
      top.classList.toggle("show", window.scrollY > 900);
      ticking = false;
    });
  };
  top.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }),
  );

  // ---- unified top-positioned toast (5s + manual X dismissal) -----------------------------
  const DEFAULT_TOAST_MS = 5000;
  const displayedToastIds =
    window.__pfDisplayedToastIds || (window.__pfDisplayedToastIds = new Set());

  const TYPE_META = {
    elo_gain: { icon: "📈", title: "Rating Gain", cls: "toast-elo-gain" },
    elo_loss: { icon: "📉", title: "Rating Adjustment", cls: "toast-elo-loss" },
    rank_shift: {
      icon: "🏆",
      title: "Rank Tier Shift",
      cls: "toast-rank-shift",
    },
    streak: { icon: "🔥", title: "Streak Milestone", cls: "toast-streak" },
    pr: { icon: "⚡", title: "Personal Record", cls: "toast-pr" },
    refresh_offense: {
      icon: "🚨",
      title: "Integrity Breach",
      cls: "toast-security",
    },
    security_tampering: {
      icon: "🛡️",
      title: "Security Flag",
      cls: "toast-security",
    },
    security_flag: {
      icon: "🛡️",
      title: "Security Flag",
      cls: "toast-security",
    },
    security: { icon: "🛡️", title: "Security Flag", cls: "toast-security" },
    policy_offense: {
      icon: "⚖️",
      title: "Policy Offense",
      cls: "toast-offense",
    },
    penalty: { icon: "⚖️", title: "Policy Offense", cls: "toast-offense" },
    offense: { icon: "⚖️", title: "Policy Offense", cls: "toast-offense" },
    success: { icon: "✅", title: "System Notice", cls: "toast-success" },
    warning: { icon: "⚠️", title: "System Advisory", cls: "toast-warning" },
    error: { icon: "❌", title: "System Error", cls: "toast-error" },
    system: { icon: "🔔", title: "System Notice", cls: "toast-brand" },
    info: { icon: "🔔", title: "System Notice", cls: "toast-brand" },
  };

  function getToastContainer() {
    let container = document.getElementById("primefactor-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "primefactor-toast-container";
      container.className = "primefactor-toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("role", "region");
      container.setAttribute(
        "aria-label",
        "Live System, ELO, Security & Policy Alerts",
      );
      document.body.appendChild(container);
    }
    return container;
  }

  function persistFallbackNotification(entry) {
    try {
      const raw = localStorage.getItem("primefactor_notifications");
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const filtered = list.filter((n) => n && n.id !== entry.id);
      const next = [entry, ...filtered].slice(0, 50);
      localStorage.setItem("primefactor_notifications", JSON.stringify(next));

      const pendingRaw = sessionStorage.getItem("primefactor_pending_toasts");
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      const nextPending = Array.isArray(pending)
        ? [
            ...pending.filter((p) => p && p.id !== entry.id),
            { ...entry, _shownAt: Date.now() },
          ].slice(-10)
        : [{ ...entry, _shownAt: Date.now() }];
      sessionStorage.setItem(
        "primefactor_pending_toasts",
        JSON.stringify(nextPending),
      );

      [
        "overhead-nav-unread-dot",
        "notif-row-unread-dot",
        "dashboard-notif-dot",
      ].forEach((dotId) => {
        const dot = document.getElementById(dotId);
        if (dot) dot.style.display = "inline-block";
      });
    } catch (e) {}
  }

  function renderTopFallbackToast(input, type = "info", ms = DEFAULT_TOAST_MS) {
    if (!document.body) return;
    const isObj = typeof input === "object" && input !== null;
    const resolvedType = (isObj ? input.type : type) || "info";
    const meta = TYPE_META[resolvedType] || TYPE_META.info;
    const shouldPersist = !(isObj && input.persist === false);
    const toastId =
      isObj && input.id
        ? String(input.id)
        : `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (displayedToastIds.has(toastId)) return;
    displayedToastIds.add(toastId);

    const durationMs =
      Number((isObj && input.durationMs) || ms) > 0
        ? Number((isObj && input.durationMs) || ms)
        : DEFAULT_TOAST_MS;

    const titleText = isObj && input.title ? String(input.title) : meta.title;
    const msgText = isObj ? String(input.message || "") : String(input ?? "");
    const timestamp = isObj && input.timestamp ? input.timestamp : Date.now();

    if (shouldPersist) {
      persistFallbackNotification({
        id: toastId,
        type: resolvedType,
        title: titleText,
        message: msgText,
        timestamp,
        read: false,
        isRead: false,
        capturedFromToast: true,
        source: "toast",
        ...(isObj && input.eloTracker ? { eloTracker: input.eloTracker } : {}),
        ...(isObj && input.performance
          ? { performance: input.performance }
          : {}),
        ...(isObj && input.details ? { details: input.details } : {}),
        ...(isObj && input.narrative ? { narrative: input.narrative } : {}),
        ...(isObj && input.icon ? { icon: input.icon } : {}),
      });
    }

    const container = getToastContainer();
    const banner = el("div", {
      className: `primefactor-toast-banner ${meta.cls}`,
    });
    banner.setAttribute("role", "alert");

    const iconNode = el("div", {
      className: "toast-icon-node",
      textContent: isObj && input.icon ? String(input.icon) : meta.icon,
    });
    iconNode.setAttribute("aria-hidden", "true");

    const bodyNode = el("div", { className: "toast-body" });
    const topRow = el(
      "div",
      { className: "toast-top-row" },
      el("span", {
        className: "toast-title font-heading",
        textContent: titleText,
      }),
      el("span", { className: "toast-time-label", textContent: "Just now" }),
    );
    const msgEl = el("p", {
      className: "toast-preview-msg",
      textContent: msgText,
    });
    bodyNode.append(topRow, msgEl);

    const footerKids = [
      el("span", {
        className: "toast-committed-tag",
        textContent: shouldPersist
          ? "✓ Committed to Notifications Ledger"
          : "System Notice · Auto-closes in 5s",
      }),
    ];
    if (!isExam && shouldPersist) {
      footerKids.push(
        el("a", {
          className: "toast-feed-link font-heading",
          href: `./notifications.html?focus=${encodeURIComponent(toastId)}`,
          textContent: "View Feed →",
        }),
      );
    }
    bodyNode.append(
      el("div", { className: "toast-footer-bar" }, ...footerKids),
    );

    const closeBtn = el("button", {
      type: "button",
      className: "toast-dismiss-btn",
      title: "Dismiss notification",
    });
    closeBtn.setAttribute("aria-label", "Dismiss alert");
    closeBtn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    const timerBar = el("div", { className: "toast-timer-bar" });
    timerBar.style.animationDuration = `${durationMs}ms`;
    const timerTrack = el("div", { className: "toast-timer-track" }, timerBar);
    timerTrack.setAttribute("aria-hidden", "true");

    banner.append(iconNode, bodyNode, closeBtn, timerTrack);

    let dismissed = false;
    let remainingMs = durationMs;
    let startedAt = Date.now();
    let autoTimer = null;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(autoTimer);
      try {
        const pendingRaw = sessionStorage.getItem("primefactor_pending_toasts");
        if (pendingRaw) {
          const parsed = JSON.parse(pendingRaw);
          if (Array.isArray(parsed)) {
            sessionStorage.setItem(
              "primefactor_pending_toasts",
              JSON.stringify(parsed.filter((p) => p && p.id !== toastId)),
            );
          }
        }
      } catch (e) {}
      banner.classList.add("toast-dismissing");
      setTimeout(() => banner.remove(), 320);
    };

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismiss();
    });

    autoTimer = setTimeout(dismiss, remainingMs);
    banner.addEventListener("mouseenter", () => {
      clearTimeout(autoTimer);
      remainingMs = Math.max(400, remainingMs - (Date.now() - startedAt));
    });
    banner.addEventListener("mouseleave", () => {
      if (dismissed) return;
      startedAt = Date.now();
      autoTimer = setTimeout(dismiss, remainingMs);
    });

    container.prepend(banner);
    while (container.children.length > 4) {
      const oldest = container.lastElementChild;
      if (oldest) container.removeChild(oldest);
    }
  }

  const toast = (input, type = "info", ms = DEFAULT_TOAST_MS) => {
    if (typeof window.__pfShowUnifiedToast === "function") {
      return window.__pfShowUnifiedToast(input, type, ms);
    }
    return renderTopFallbackToast(input, type, ms);
  };

  if (!window.__pfUxToastEventsBound) {
    window.__pfUxToastEventsBound = true;
    const handleToastEvent = (e) => {
      if (window.__pfNotificationEngineActive) return;
      if (e && e.detail) toast(e.detail);
    };
    window.addEventListener("primefactor:toast", handleToastEvent);
    window.addEventListener("primefactor_toast", handleToastEvent);
    window.addEventListener("primefactor_notification_added", handleToastEvent);
  }

  window.UX = Object.assign(window.UX || {}, { toast });
  window.PrimeFactorToast = Object.assign(window.PrimeFactorToast || {}, {
    show: toast,
  });

  // ---- scroll reveal ----------------------------------------------------------------------
  const managedElsewhere =
    ".custom-launch-capsule-wrap, .custom-launch-capsule-wrap *, .step-card, .rank-card, .mini-challenge-card, .hero-gateway, .hero-gateway *";
  function initReveal() {
    if (reduce || isExam || !("IntersectionObserver" in window)) return;
    const wrapper =
      document.querySelector(".main-wrapper") || document.querySelector("main");
    if (!wrapper) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("ux-in");
          io.unobserve(e.target);
          setTimeout(() => e.target.classList.remove("ux-pre", "ux-in"), 1000);
        });
      },
      { rootMargin: "0px 0px 0px 0px", threshold: 0.01 },
    );

    const seen = new WeakSet();
    const scan = () => {
      const vh = window.innerHeight;
      const cands = [];
      const walk = (node, depth) => {
        if (depth > 4 || cands.length > 400) return;
        const parentIsGrid = getComputedStyle(node).display === "grid";
        [...node.children].forEach((c, i) => {
          // top-level blocks (depth <= 2) and the items of any grid (cards, tiles)
          if (depth <= 2 || parentIsGrid) cands.push([c, parentIsGrid ? i : 0]);
          walk(c, depth + 1);
        });
      };
      walk(wrapper, 1);
      cands.forEach(([n, idx]) => {
        if (
          seen.has(n) ||
          n.matches(managedElsewhere) ||
          n.closest('[data-ux="skip"]')
        )
          return;
        const cs = getComputedStyle(n);
        if (
          cs.position === "fixed" ||
          cs.position === "absolute" ||
          cs.display === "none"
        )
          return;
        const r = n.getBoundingClientRect();
        if (r.height < 48 || r.height > vh * 1.6 || r.top < vh * 0.85) return; // below the fold, not giant
        seen.add(n);
        n.style.setProperty("--ux-delay", `${(idx % 4) * 70}ms`);
        n.classList.add("ux-pre");
        io.observe(n);
      });
    };
    scan();
    setTimeout(scan, 900); // after async-rendered modules fill in
    window.addEventListener("primefactor_auth_changed", () =>
      setTimeout(scan, 300),
    );
    // safety net: never leave anything hidden if the observer stalls
    // reveal anything the observer can't reach (e.g. last block of a page that cannot scroll further)
    const flush = () =>
      document.querySelectorAll(".ux-pre:not(.ux-in)").forEach((n) => {
        if (n.getBoundingClientRect().top < window.innerHeight + 40)
          n.classList.add("ux-in");
      });
    window.addEventListener("scroll", () => requestAnimationFrame(flush), {
      passive: true,
    });
    setTimeout(flush, 1200);
    setTimeout(
      () =>
        document.querySelectorAll(".ux-pre:not(.ux-in)").forEach((n) => {
          const r = n.getBoundingClientRect();
          if (r.top < window.innerHeight) n.classList.add("ux-in");
        }),
      4000,
    );
  }

  // ---- link transition fallback ------------------------------------------------------------
  function initLinkFade() {
    const hasVT =
      window.CSS &&
      CSS.supports &&
      CSS.supports("view-transition-name", "none");
    if (hasVT || reduce) return;
    document.addEventListener("click", (e) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (
        u.origin !== location.origin ||
        (u.pathname === location.pathname && u.hash) ||
        !/\.html$|\/$/.test(u.pathname)
      )
        return;
      e.preventDefault();
      document.body.classList.add("ux-leaving");
      setTimeout(() => {
        location.href = u.href;
      }, 170);
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) document.body.classList.remove("ux-leaving");
    });
  }

  // ---- command palette ----------------------------------------------------------------------
  function initPalette() {
    if (isExam) return;
    const overlay = el("div", { id: "ux-palette" });
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Jump to a module");
    const input = el("input", {
      type: "text",
      placeholder: "Jump to a module…",
      autocomplete: "off",
      spellcheck: false,
    });
    input.setAttribute("aria-label", "Search modules");
    const list = el("ul", { className: "ux-pal-list" });
    list.setAttribute("role", "listbox");
    const foot = el("div", { className: "ux-pal-foot" });
    foot.innerHTML =
      "<span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span>";
    overlay.appendChild(
      el("div", { className: "ux-pal-box" }, input, list, foot),
    );
    document.body.appendChild(overlay);

    let items = [];
    let sel = 0;
    const render = () => {
      const q = input.value.trim().toLowerCase();
      items = PAGES.filter(
        ([id, name, desc]) =>
          !q || `${name} ${desc} ${id}`.toLowerCase().includes(q),
      );
      sel = Math.min(sel, Math.max(0, items.length - 1));
      list.textContent = "";
      items.forEach(([id, name, desc], i) => {
        const li = el("li", { className: "ux-pal-item" });
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(i === sel));
        li.append(
          el("span", { textContent: name }),
          el("small", { textContent: desc }),
        );
        li.addEventListener("mousemove", () => {
          if (sel !== i) {
            sel = i;
            render();
          }
        });
        li.addEventListener("click", () => go(id));
        list.appendChild(li);
      });
      if (!items.length)
        list.appendChild(
          el("li", {
            className: "ux-pal-item",
            innerHTML: "<small>No matching module</small>",
          }),
        );
      const active = list.querySelector('[aria-selected="true"]');
      if (active && active.scrollIntoView)
        active.scrollIntoView({ block: "nearest" });
    };
    const go = (id) => {
      close();
      location.href = `./${id}.html`;
    };
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      overlay.classList.add("open");
      input.value = "";
      sel = 0;
      render();
      input.focus();
    };
    const close = () => {
      overlay.classList.remove("open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) close();
    });
    input.addEventListener("input", () => {
      sel = 0;
      render();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        sel = (sel + 1) % Math.max(1, items.length);
        render();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        sel = (sel - 1 + items.length) % Math.max(1, items.length);
        render();
      } else if (e.key === "Enter" && items[sel]) {
        e.preventDefault();
        go(items[sel][0]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });
    document.addEventListener("keydown", (e) => {
      const typing =
        /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || "") ||
        e.target.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        overlay.classList.contains("open") ? close() : open();
      } else if (
        e.key === "/" &&
        !typing &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        open();
      }
    });
    window.UX.openPalette = open;
  }

  function boot() {
    document.body.append(bar, top);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    if (!isExam) top.style.display = "";
    else top.style.display = "none";
    initReveal();
    initLinkFade();
    initPalette();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
