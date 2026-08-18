import { initSplashCursor } from "./splash-cursor.js";

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const compactViewport = window.matchMedia("(max-width: 640px)");
const saveData = Boolean(navigator.connection?.saveData);
let threeModulePromise;

function loadThree() {
  if (!threeModulePromise) threeModulePromise = import("three");
  return threeModulePromise;
}

root.classList.add("motion-ready");
document.getElementById("year").textContent = String(new Date().getFullYear());

async function mountOfficialColorBends() {
  const host = document.getElementById("color-bends-root");
  if (!host || reduceMotion.matches || saveData) return;

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
        speed: 0.08,
        scale: 1.05,
        frequency: 0.85,
        warpStrength: 0.55,
        mouseInfluence: 0.2,
        noise: 0.035,
        parallax: 0.18,
        iterations: 1,
        intensity: 0.65,
        bandWidth: 4.5,
        transparent: true,
        autoRotate: 0.1,
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
    window.addEventListener("pointermove", forwardPointer, { passive: true });

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

async function initThreeScene() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !heroStage || reduceMotion.matches || saveData) return;

  const testCanvas = document.createElement("canvas");
  if (!testCanvas.getContext("webgl2")) return;

  await new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(resolve, { timeout: 900 });
    } else {
      window.setTimeout(resolve, 80);
    }
  });

  try {
    const THREE = await loadThree();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !compactViewport.matches,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewport.matches ? 1.15 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0, 3.25);

    const particlesGroup = new THREE.Group();
    particlesGroup.rotation.x = -0.12;
    scene.add(particlesGroup);

    const tabletViewport = window.matchMedia("(max-width: 900px)").matches;
    const particlesCount = compactViewport.matches ? 1400 : tabletViewport ? 2600 : 5200;
    const radius = compactViewport.matches ? 0.93 : 1.08;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const basePositions = new Float32Array(particlesCount * 3);
    const positions = new Float32Array(particlesCount * 3);
    const displacements = new Float32Array(particlesCount * 3);
    const scatterVelocities = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const violet = new THREE.Color(0x8b5cf6);
    const lavender = new THREE.Color(0xe9d5ff);
    const mixedColor = new THREE.Color();

    for (let index = 0; index < particlesCount; index += 1) {
      const y = 1 - (index / Math.max(1, particlesCount - 1)) * 2;
      const ringRadius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * index;
      const offset = index * 3;
      const x = Math.cos(theta) * ringRadius * radius;
      const py = y * radius;
      const z = Math.sin(theta) * ringRadius * radius;
      basePositions[offset] = positions[offset] = x;
      basePositions[offset + 1] = positions[offset + 1] = py;
      basePositions[offset + 2] = positions[offset + 2] = z;

      mixedColor.lerpColors(violet, lavender, Math.min(1, Math.max(0, (z / radius + 1) * 0.5)));
      colors[offset] = mixedColor.r;
      colors[offset + 1] = mixedColor.g;
      colors[offset + 2] = mixedColor.b;
    }

    const particleTextureCanvas = document.createElement("canvas");
    particleTextureCanvas.width = particleTextureCanvas.height = 32;
    const particleContext = particleTextureCanvas.getContext("2d");
    const particleGradient = particleContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    particleGradient.addColorStop(0, "rgba(255,255,255,1)");
    particleGradient.addColorStop(0.28, "rgba(255,255,255,.95)");
    particleGradient.addColorStop(1, "rgba(255,255,255,0)");
    particleContext.fillStyle = particleGradient;
    particleContext.fillRect(0, 0, 32, 32);
    const particleTexture = new THREE.CanvasTexture(particleTextureCanvas);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: compactViewport.matches ? 0.036 : 0.03,
      map: particleTexture,
      transparent: true,
      opacity: 0.9,
      alphaTest: 0.02,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geometry, material);
    particlesGroup.add(particles);

    const pointer = { active: false, x: 0, y: 0 };
    const currentRotation = { x: -0.12, y: 0 };
    const targetRotation = { x: -0.12, y: 0 };
    const dragVelocity = { x: 0, y: 0 };
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let isHeroVisible = true;
    let frameId = 0;
    let previousFrame = 0;
    let needsParticleUpdate = false;
    let cleanedUp = false;
    const projected = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();

    function updatePointer(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height;
    }

    function scatterParticles(event) {
      updatePointer(event);
      particlesGroup.updateMatrixWorld(true);
      const rect = canvas.getBoundingClientRect();
      const cursorRadius = compactViewport.matches ? 64 : 92;
      const cursorRadiusSquared = cursorRadius * cursorRadius;

      for (let index = 0; index < particlesCount; index += 1) {
        const offset = index * 3;
        worldPosition.set(positions[offset], positions[offset + 1], positions[offset + 2]);
        worldPosition.applyMatrix4(particlesGroup.matrixWorld);
        projected.copy(worldPosition).project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * rect.width;
        const screenY = (-projected.y * 0.5 + 0.5) * rect.height;
        const dx = pointer.x - screenX;
        const dy = pointer.y - screenY;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > 0 && distanceSquared < cursorRadiusSquared && worldPosition.z > 0) {
          const distance = Math.sqrt(distanceSquared);
          const force = (cursorRadius - distance) / cursorRadius;
          scatterVelocities[offset] -= (dx / distance) * force * 0.055;
          scatterVelocities[offset + 1] += (dy / distance) * force * 0.055;
          scatterVelocities[offset + 2] += force * 0.025;
          needsParticleUpdate = true;
        }
      }
    }

    function handlePointerDown(event) {
      updatePointer(event);
      scatterParticles(event);
      if (event.pointerType !== "mouse") {
        window.setTimeout(() => { pointer.active = false; }, 420);
        return;
      }
      dragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      dragVelocity.x = 0;
      dragVelocity.y = 0;
      canvas.setPointerCapture?.(event.pointerId);
    }

    function handlePointerMove(event) {
      updatePointer(event);
      if (!dragging || event.pointerType !== "mouse") return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      targetRotation.y += dx * 0.006;
      targetRotation.x = Math.max(-1.1, Math.min(1.1, targetRotation.x + dy * 0.005));
      dragVelocity.x = dx * 0.0008;
      dragVelocity.y = dy * 0.0007;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    }

    function handlePointerUp() {
      dragging = false;
    }

    function handlePointerLeave() {
      pointer.active = false;
      dragging = false;
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    function resizeScene() {
      const rect = heroStage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactViewport.matches ? 1.15 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(heroStage);
    resizeScene();

    function updateParticlePhysics(deltaFactor) {
      particlesGroup.updateMatrixWorld(true);
      const rect = canvas.getBoundingClientRect();
      const cursorRadius = compactViewport.matches ? 54 : 80;
      const cursorRadiusSquared = cursorRadius * cursorRadius;
      let stillMoving = false;

      for (let index = 0; index < particlesCount; index += 1) {
        const offset = index * 3;

        if (pointer.active && finePointer.matches) {
          worldPosition.set(positions[offset], positions[offset + 1], positions[offset + 2]);
          worldPosition.applyMatrix4(particlesGroup.matrixWorld);
          projected.copy(worldPosition).project(camera);
          const screenX = (projected.x * 0.5 + 0.5) * rect.width;
          const screenY = (-projected.y * 0.5 + 0.5) * rect.height;
          const dx = pointer.x - screenX;
          const dy = pointer.y - screenY;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared > 0 && distanceSquared < cursorRadiusSquared && worldPosition.z > 0) {
            const distance = Math.sqrt(distanceSquared);
            const force = (cursorRadius - distance) / cursorRadius;
            displacements[offset] -= (dx / distance) * force * 0.0045 * deltaFactor;
            displacements[offset + 1] += (dy / distance) * force * 0.0045 * deltaFactor;
          }
        }

        for (let axis = 0; axis < 3; axis += 1) {
          const target = offset + axis;
          displacements[target] += scatterVelocities[target] * deltaFactor;
          scatterVelocities[target] *= Math.pow(0.9, deltaFactor);
          displacements[target] *= Math.pow(0.92, deltaFactor);
          positions[target] = basePositions[target] + displacements[target];
          if (Math.abs(displacements[target]) > 0.0002 || Math.abs(scatterVelocities[target]) > 0.0002) stillMoving = true;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      needsParticleUpdate = stillMoving || pointer.active;
    }

    function draw(time) {
      if (!isHeroVisible || document.hidden || reduceMotion.matches || cleanedUp) {
        frameId = 0;
        return;
      }

      frameId = requestAnimationFrame(draw);
      const frameInterval = compactViewport.matches ? 40 : 32;
      if (time - previousFrame < frameInterval) return;
      const delta = Math.min((time - previousFrame) / 1000, 0.05);
      const deltaFactor = delta * 60;
      previousFrame = time;

      if (!dragging) {
        targetRotation.y += delta * 0.18 + dragVelocity.x * deltaFactor;
        targetRotation.x += dragVelocity.y * deltaFactor;
        dragVelocity.x *= Math.pow(0.9, deltaFactor);
        dragVelocity.y *= Math.pow(0.9, deltaFactor);
      }

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.075 * deltaFactor;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.075 * deltaFactor;
      particlesGroup.rotation.x = currentRotation.x;
      particlesGroup.rotation.y = currentRotation.y;

      if (pointer.active || needsParticleUpdate) updateParticlePhysics(deltaFactor);
      renderer.render(scene, camera);
    }

    function resume() {
      if (!frameId && isHeroVisible && !document.hidden && !reduceMotion.matches && !cleanedUp) {
        previousFrame = performance.now() - 34;
        frameId = requestAnimationFrame(draw);
      }
    }

    const heroVisibility = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible) resume();
        else if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    heroVisibility.observe(heroStage);

    const handleVisibilityChange = () => {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleMotionChange = () => {
      if (reduceMotion.matches) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
        renderer.render(scene, camera);
      } else {
        resume();
      }
    };
    reduceMotion.addEventListener("change", handleMotionChange);

    renderer.render(scene, camera);
    heroStage.classList.add("is-loaded");
    resume();

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) return;
      cleanedUp = true;
      if (frameId) cancelAnimationFrame(frameId);
      heroVisibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reduceMotion.removeEventListener("change", handleMotionChange);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer.dispose();
    });
  } catch (error) {
    console.warn("A esfera de partículas não pôde ser carregada; mantendo o fallback visual.", error);
  }
}

if (heroStage && "IntersectionObserver" in window) {
  const sceneLoader = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      initThreeScene();
    },
    { rootMargin: "180px 0px", threshold: 0.01 },
  );
  sceneLoader.observe(heroStage);
} else {
  initThreeScene();
}
