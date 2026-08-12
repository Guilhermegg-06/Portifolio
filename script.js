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

const colorBendsConfig = Object.freeze({
  colors: ["#ff5c7a", "#8a5cff", "#00ffd1"],
  rotation: 90,
  speed: 0.2,
  scale: 1,
  frequency: 1,
  warpStrength: 1,
  mouseInfluence: 1,
  noise: 0.15,
  parallax: 0.5,
  iterations: 1,
  intensity: 1.5,
  bandWidth: 6,
  transparent: true,
  autoRotate: 0,
  color: "#A855F7",
});

const colorBendsVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const colorBendsFragmentShader = `
  #define MAX_COLORS 8
  uniform vec2 uCanvas;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec2 uRot;
  uniform int uColorCount;
  uniform vec3 uColors[MAX_COLORS];
  uniform int uTransparent;
  uniform float uScale;
  uniform float uFrequency;
  uniform float uWarpStrength;
  uniform vec2 uPointer;
  uniform float uMouseInfluence;
  uniform float uParallax;
  uniform float uNoise;
  uniform int uIterations;
  uniform float uIntensity;
  uniform float uBandWidth;
  varying vec2 vUv;

  void main() {
    float t = uTime * uSpeed;
    vec2 p = vUv * 2.0 - 1.0;
    p += uPointer * uParallax * 0.1;
    vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
    vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
    q /= max(uScale, 0.0001);
    q /= 0.5 + 0.2 * dot(q, q);
    q += 0.2 * cos(t) - 7.56;
    q += (uPointer - rp) * uMouseInfluence * 0.2;

    for (int j = 0; j < 5; j++) {
      if (j >= uIterations - 1) break;
      vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
      q += (rr - q) * 0.15;
    }

    vec2 s = q;
    vec3 sumColor = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; i++) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float warpBase = clamp(uWarpStrength, 0.0, 1.0);
      float warpMix = pow(warpBase, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 warped = s + (r - s) * warpBase * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, warpMix);
      float width = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumColor += uColors[i] * width;
      cover = max(cover, width);
    }

    vec3 color = clamp(sumColor, 0.0, 1.0) * uIntensity;
    float alpha = uTransparent > 0 ? cover : 1.0;

    if (uNoise > 0.0001) {
      float grain = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      color = clamp(color + (grain - 0.5) * uNoise, 0.0, 1.0);
    }

    vec3 rgb = uTransparent > 0 ? color * alpha : color;
    gl_FragColor = vec4(rgb, alpha);
  }
`;

async function initColorBends() {
  const canvas = document.getElementById("color-bends-canvas");
  if (!canvas || reduceMotion.matches || saveData) return;

  try {
    const THREE = await loadThree();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniformColors = Array.from({ length: 8 }, () => new THREE.Vector3());
    const toVector = (hex) => {
      const value = hex.replace("#", "");
      return new THREE.Vector3(
        Number.parseInt(value.slice(0, 2), 16) / 255,
        Number.parseInt(value.slice(2, 4), 16) / 255,
        Number.parseInt(value.slice(4, 6), 16) / 255,
      );
    };
    colorBendsConfig.colors.forEach((color, index) => uniformColors[index].copy(toVector(color)));

    const material = new THREE.ShaderMaterial({
      vertexShader: colorBendsVertexShader,
      fragmentShader: colorBendsFragmentShader,
      transparent: true,
      premultipliedAlpha: true,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: colorBendsConfig.speed },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColorCount: { value: colorBendsConfig.colors.length },
        uColors: { value: uniformColors },
        uTransparent: { value: colorBendsConfig.transparent ? 1 : 0 },
        uScale: { value: colorBendsConfig.scale },
        uFrequency: { value: colorBendsConfig.frequency },
        uWarpStrength: { value: colorBendsConfig.warpStrength },
        uPointer: { value: new THREE.Vector2() },
        uMouseInfluence: { value: colorBendsConfig.mouseInfluence },
        uParallax: { value: colorBendsConfig.parallax },
        uNoise: { value: colorBendsConfig.noise },
        uIterations: { value: colorBendsConfig.iterations },
        uIntensity: { value: colorBendsConfig.intensity },
        uBandWidth: { value: colorBendsConfig.bandWidth },
      },
    });
    scene.add(new THREE.Mesh(geometry, material));

    const pointerTarget = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    const clock = new THREE.Clock();
    let frameId = 0;
    let previousFrame = 0;
    let cleanedUp = false;
    const frameInterval = compactViewport.matches ? 42 : 32;

    function resizeBackground() {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactViewport.matches ? 1 : 1.2));
      renderer.setSize(width, height, false);
      material.uniforms.uCanvas.value.set(width, height);
    }

    function handlePointerMove(event) {
      if (!finePointer.matches) return;
      pointerTarget.set(
        (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1),
      );
    }

    function drawBackground(time) {
      if (cleanedUp || document.hidden || reduceMotion.matches) {
        frameId = 0;
        return;
      }
      frameId = requestAnimationFrame(drawBackground);
      if (time - previousFrame < frameInterval) return;
      previousFrame = time;
      const delta = Math.min(clock.getDelta(), 0.05);
      material.uniforms.uTime.value = clock.elapsedTime;
      const rotation = (colorBendsConfig.rotation % 360) + colorBendsConfig.autoRotate * clock.elapsedTime;
      const rotationRadians = (rotation * Math.PI) / 180;
      material.uniforms.uRot.value.set(Math.cos(rotationRadians), Math.sin(rotationRadians));
      pointerCurrent.lerp(pointerTarget, Math.min(1, delta * 8));
      material.uniforms.uPointer.value.copy(pointerCurrent);
      renderer.render(scene, camera);
    }

    function resumeBackground() {
      if (!frameId && !document.hidden && !reduceMotion.matches && !cleanedUp) {
        clock.getDelta();
        previousFrame = performance.now() - frameInterval;
        frameId = requestAnimationFrame(drawBackground);
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        resumeBackground();
      }
    };

    resizeBackground();
    renderer.render(scene, camera);
    window.addEventListener("resize", resizeBackground, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resumeBackground();

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) return;
      cleanedUp = true;
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeBackground);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }, { once: true });
  } catch (error) {
    console.warn("O fundo animado não pôde ser carregado; mantendo o gradiente estático.", error);
  }
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

initColorBends();

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
