import { initSplashCursor } from "./splash-cursor.js";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const compactViewport = window.matchMedia("(max-width: 640px)");
const saveData = Boolean(navigator.connection?.saveData);

root.classList.add("motion-ready");
document.getElementById("year").textContent = String(new Date().getFullYear());

async function mountOfficialColorBends() {
  const host = document.getElementById("color-bends-root");
  if (!host || saveData) return;

  const shouldAnimate = !reduceMotion.matches;

  try {
    const [{ createElement }, { createRoot }, { default: ColorBends }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("./components/ColorBends/ColorBends.jsx"),
    ]);
    if (!host.isConnected) return;

    const colorBendsRoot = createRoot(host);
    colorBendsRoot.render(
      createElement(ColorBends, {
        className: "color-bends__canvas",
        colors: ["#2E1065", "#4C1D95", "#6D28D9", "#7C3AED", "#8B5CF6"],
        rotation: 90,
        speed: shouldAnimate ? 0.1 : 0,
        scale: 1.05,
        frequency: 0.85,
        warpStrength: 1,
        mouseInfluence: shouldAnimate ? 0.15 : 0,
        noise: 0.03,
        parallax: shouldAnimate ? 0.1 : 0,
        iterations: 1,
        intensity: 1.35,
        bandWidth: 6,
        transparent: true,
        autoRotate: shouldAnimate ? 0.1 : 0,
      }),
    );

    const forwardPointer = (event) => {
      const container = host.querySelector(".color-bends-container");
      if (!container) return;
      container.dispatchEvent(new PointerEvent("pointermove", {
        clientX: event.clientX,
        clientY: event.clientY,
      }));
    };
    if (shouldAnimate) {
      window.addEventListener("pointermove", forwardPointer, { passive: true });
    }

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) return;
      window.removeEventListener("pointermove", forwardPointer);
      colorBendsRoot.unmount();
    }, { once: true });
  } catch (error) {
    console.warn("O Color Bends oficial não pôde ser carregado.", error);
  }
}

mountOfficialColorBends();

function mountOfficialLanyard() {
  const host = document.getElementById("lanyard-root");
  if (!host) return;

  if (reduceMotion.matches || saveData) {
    host.closest(".bento-card--lanyard")?.classList.add("is-motion-disabled");
    return;
  }

  let lanyardRoot;
  let hasMounted = false;

  const renderLanyard = async () => {
    if (hasMounted || !host.isConnected) return;
    hasMounted = true;

    try {
      const [{ createElement }, { createRoot }, { default: Lanyard }] = await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("./components/Lanyard/Lanyard.jsx"),
      ]);
      if (!host.isConnected) return;

      lanyardRoot = createRoot(host);
      lanyardRoot.render(createElement(Lanyard, { transparent: true }));
      host.closest(".bento-card--lanyard")?.classList.add("is-loaded");
    } catch (error) {
      hasMounted = false;
      host.closest(".bento-card--lanyard")?.classList.add("has-load-error");
      console.warn("O Lanyard oficial não pôde ser carregado.", error);
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        renderLanyard();
      },
      { rootMargin: "420px 0px", threshold: 0.01 },
    );
    observer.observe(host);

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) return;
      observer.disconnect();
      lanyardRoot?.unmount();
    }, { once: true });
  } else {
    renderLanyard();
  }
}

mountOfficialLanyard();

function mountSplashCursor() {
  const canvas = document.getElementById("splash-cursor-canvas");
  if (!canvas || reduceMotion.matches || saveData) return;

  const compactSplash = compactViewport.matches || !finePointer.matches;

  const start = () => {
    try {
      const cleanup = initSplashCursor(canvas, {
        SIM_RESOLUTION: compactSplash ? 64 : 128,
        DYE_RESOLUTION: compactSplash ? 384 : 1440,
        DENSITY_DISSIPATION: 3.5,
        VELOCITY_DISSIPATION: 2,
        PRESSURE: 0.1,
        PRESSURE_ITERATIONS: compactSplash ? 12 : 20,
        CURL: 3,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 6000,
        COLOR_UPDATE_SPEED: 10,
        SHADING: true,
        RAINBOW_MODE: false,
        COLOR: "#A855F7",
      });

      window.addEventListener("pagehide", (event) => {
        if (!event.persisted) cleanup();
      }, { once: true });
    } catch (error) {
      console.warn("O efeito fluido do cursor não pôde ser carregado.", error);
    }
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 700 });
  } else {
    window.setTimeout(start, 120);
  }
}

mountSplashCursor();

const intro = document.querySelector(".intro-screen");
if (intro) {
  const removeIntro = () => intro.remove();
  intro.addEventListener("animationend", (event) => {
    if (event.target !== intro || event.animationName !== "intro-out") return;
    removeIntro();
  });
  window.setTimeout(removeIntro, 1900);
}

const revealItems = document.querySelectorAll("[data-reveal]");
if (reduceMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
  );

  requestAnimationFrame(() => {
    revealItems.forEach((item) => revealObserver.observe(item));
  });
}

const progressBar = document.querySelector(".scroll-progress span");
let scrollTicking = false;

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  progressBar.style.transform = "scaleX(" + progress + ")";
  scrollTicking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollProgress);
  },
  { passive: true },
);
updateScrollProgress();

const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const navBySection = new Map(
  navLinks.map((link) => [link.getAttribute("href").slice(1), link]),
);

function setActiveNavLink(activeLink) {
  navLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

setActiveNavLink(navBySection.get("inicio"));

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeLink = navBySection.get(entry.target.id);
        if (activeLink) setActiveNavLink(activeLink);
      });
    },
    { rootMargin: "-40% 0px -48% 0px", threshold: 0 },
  );

  document.querySelectorAll("main section[id]").forEach((section) => {
    sectionObserver.observe(section);
  });
}

document.querySelectorAll(".spotlight").forEach((card) => {
  card.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", event.clientX - rect.left + "px");
      card.style.setProperty("--spot-y", event.clientY - rect.top + "px");
    },
    { passive: true },
  );
});

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--ry", x * 3.6 + "deg");
      card.style.setProperty("--rx", y * -3 + "deg");
    },
    { passive: true },
  );

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });
});

document.querySelectorAll(".magnetic").forEach((item) => {
  item.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = "translate(" + x * 0.08 + "px, " + y * 0.08 + "px)";
    },
    { passive: true },
  );

  item.addEventListener("pointerleave", () => {
    item.style.transform = "";
  });
});

const copyButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector(".copy-status");

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  let didCopy = false;

  try {
    field.select();
    didCopy = document.execCommand("copy");
  } finally {
    field.remove();
  }

  if (!didCopy) throw new Error("Copy failed");
}

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const email = copyButton.dataset.copyEmail;
    try {
      await copyText(email);
      copyStatus.textContent = "E-mail copiado.";
      copyButton.querySelector("b").textContent = "Copiado";
    } catch {
      copyStatus.textContent = "Use: " + email;
    }

    window.setTimeout(() => {
      copyStatus.textContent = "";
      copyButton.querySelector("b").textContent = "Copiar";
    }, 2400);
  });
}

const heroTitle = document.getElementById("hero-title");

if (heroTitle) {
  const updateNameGlow = (event) => {
    const rect = heroTitle.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    heroTitle.style.setProperty("--name-x", x + "%");
    heroTitle.style.setProperty("--name-y", y + "%");
  };

  heroTitle.addEventListener("pointermove", updateNameGlow, { passive: true });
  heroTitle.addEventListener("pointerdown", (event) => {
    updateNameGlow(event);
    heroTitle.classList.add("is-glowing");
    window.setTimeout(() => heroTitle.classList.remove("is-glowing"), 850);
  });
}

const heroStage = document.querySelector(".hero-stage");
const heroPointer = { x: 0, y: 0 };

if (heroStage) {
  const chips = Array.from(heroStage.querySelectorAll(".float-chip"));

  heroStage.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      const rect = heroStage.getBoundingClientRect();
      heroPointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      heroPointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      heroStage.style.setProperty("--stage-rx", heroPointer.y * -5 + "deg");
      heroStage.style.setProperty("--stage-ry", heroPointer.x * 7 + "deg");

      chips.forEach((chip, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        const intensity = 4 + index * 1.4;
        chip.style.setProperty("--chip-x", heroPointer.x * intensity * direction + "px");
        chip.style.setProperty("--chip-y", heroPointer.y * intensity * -direction + "px");
      });
    },
    { passive: true },
  );

  heroStage.addEventListener("pointerleave", () => {
    heroPointer.x = 0;
    heroPointer.y = 0;
    heroStage.style.setProperty("--stage-rx", "0deg");
    heroStage.style.setProperty("--stage-ry", "0deg");
    chips.forEach((chip) => {
      chip.style.setProperty("--chip-x", "0px");
      chip.style.setProperty("--chip-y", "0px");
    });
  });
}

async function mountOfficialParticleSphere() {
  const host = document.getElementById("particle-sphere-root");
  if (!host || !heroStage) return;

  try {
    const [{ createElement }, { createRoot }, { default: ParticleSphere }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("./components/ParticleSphere/ParticleSphere.tsx"),
    ]);
    if (!host.isConnected) return;

    const particleSphereRoot = createRoot(host);
    const canvasObserver = new MutationObserver(() => {
      const canvas = host.querySelector("canvas");
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
      heroStage.classList.add("is-loaded");
      canvasObserver.disconnect();
    });

    canvasObserver.observe(host, { childList: true, subtree: true });
    particleSphereRoot.render(
      createElement(ParticleSphere, {
        particlesCount: 10000,
        particleScale: 8,
        rotationDirection: "clockwise",
        speed: 20,
        scale: 10,
        drag: true,
        smoothing: 7,
        dragSpeed: 5,
        stopOnHover: false,
        cursorOn: true,
        cursorRadiusUI: 75,
        cursorStrengthUI: 10,
        clickForce: 5,
        sphereColor: "#C4B5FD",
      }),
    );

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) return;
      canvasObserver.disconnect();
      particleSphereRoot.unmount();
    }, { once: true });
  } catch (error) {
    console.warn("O ParticleSphere oficial do OriginKit nao pode ser carregado.", error);
  }
}

mountOfficialParticleSphere();
