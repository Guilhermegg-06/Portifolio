const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const compactViewport = window.matchMedia("(max-width: 640px)");
const saveData = Boolean(navigator.connection?.saveData);

root.classList.add("motion-ready");
document.getElementById("year").textContent = String(new Date().getFullYear());

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

const heroStage = document.querySelector(".hero-stage");
const heroPointer = { x: 0, y: 0 };

if (heroStage) {
  heroStage.addEventListener(
    "pointermove",
    (event) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      const rect = heroStage.getBoundingClientRect();
      heroPointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      heroPointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      heroStage.style.setProperty("--stage-rx", heroPointer.y * -5 + "deg");
      heroStage.style.setProperty("--stage-ry", heroPointer.x * 7 + "deg");

      const one = heroStage.querySelector(".float-chip--one");
      const two = heroStage.querySelector(".float-chip--two");
      const three = heroStage.querySelector(".float-chip--three");
      one.style.setProperty("--chip-x", heroPointer.x * -7 + "px");
      one.style.setProperty("--chip-y", heroPointer.y * -5 + "px");
      two.style.setProperty("--chip-x", heroPointer.x * 9 + "px");
      two.style.setProperty("--chip-y", heroPointer.y * 7 + "px");
      three.style.setProperty("--chip-x", heroPointer.x * 5 + "px");
      three.style.setProperty("--chip-y", heroPointer.y * -8 + "px");
    },
    { passive: true },
  );

  heroStage.addEventListener("pointerleave", () => {
    heroPointer.x = 0;
    heroPointer.y = 0;
    heroStage.style.setProperty("--stage-rx", "0deg");
    heroStage.style.setProperty("--stage-ry", "0deg");
    heroStage.querySelectorAll(".float-chip").forEach((chip) => {
      chip.style.setProperty("--chip-x", "0px");
      chip.style.setProperty("--chip-y", "0px");
    });
  });
}

async function initThreeScene() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !heroStage || reduceMotion.matches || compactViewport.matches || saveData) return;

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
    const THREE = await import("three");
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const sculpture = new THREE.Group();
    sculpture.rotation.set(-0.28, 0.18, 0.12);
    scene.add(sculpture);

    const knotGeometry = new THREE.TorusKnotGeometry(1.08, 0.34, 176, 28, 2, 3);
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb8f34a,
      emissive: 0x182a07,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.2,
      transmission: 0.16,
      thickness: 0.8,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
    });
    const knot = new THREE.Mesh(knotGeometry, knotMaterial);
    sculpture.add(knot);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xdfffa0,
      wireframe: true,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    });
    const wire = new THREE.Mesh(knotGeometry, wireMaterial);
    wire.scale.setScalar(1.018);
    sculpture.add(wire);

    const coreGeometry = new THREE.IcosahedronGeometry(0.58, 3);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x65d9ff,
      wireframe: true,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    sculpture.add(core);

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x65d9ff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    const ringGeometry = new THREE.TorusGeometry(1.83, 0.007, 6, 160);
    const ringOne = new THREE.Mesh(ringGeometry, ringMaterial);
    ringOne.rotation.set(1.1, 0.25, 0.35);
    sculpture.add(ringOne);

    const ringTwo = new THREE.Mesh(
      ringGeometry,
      ringMaterial.clone(),
    );
    ringTwo.material.color.setHex(0xb8f34a);
    ringTwo.material.opacity = 0.2;
    ringTwo.rotation.set(-0.65, 0.85, -0.28);
    ringTwo.scale.setScalar(1.14);
    sculpture.add(ringTwo);

    const pointsCount = 170;
    const pointPositions = new Float32Array(pointsCount * 3);
    for (let index = 0; index < pointsCount; index += 1) {
      const radius = 2.05 + Math.random() * 0.85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pointPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pointPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pointPositions[index * 3 + 2] = radius * Math.cos(phi);
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(pointPositions, 3),
    );
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xd9ff92,
      size: 0.026,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    sculpture.add(points);

    scene.add(new THREE.AmbientLight(0xb8d7df, 0.75));

    const limeLight = new THREE.PointLight(0xb8f34a, 24, 12, 2);
    limeLight.position.set(-2.3, 2.5, 3.2);
    scene.add(limeLight);

    const cyanLight = new THREE.PointLight(0x65d9ff, 22, 12, 2);
    cyanLight.position.set(2.7, -1.8, 2.7);
    scene.add(cyanLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(0, 0, 4);
    scene.add(rimLight);

    function resizeScene() {
      const rect = heroStage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(heroStage);
    resizeScene();

    let frameId = 0;
    let isHeroVisible = true;
    let previousFrame = 0;

    function draw(time) {
      if (!isHeroVisible || document.hidden || reduceMotion.matches) {
        frameId = 0;
        return;
      }

      frameId = requestAnimationFrame(draw);
      if (time - previousFrame < 32) return;
      const delta = Math.min((time - previousFrame) / 1000, 0.05);
      previousFrame = time;

      sculpture.rotation.y += delta * 0.19;
      sculpture.rotation.x +=
        (heroPointer.y * -0.15 - sculpture.rotation.x) * 0.035;
      sculpture.rotation.z +=
        (0.12 + heroPointer.x * 0.08 - sculpture.rotation.z) * 0.035;
      sculpture.position.x +=
        (heroPointer.x * 0.12 - sculpture.position.x) * 0.035;
      sculpture.position.y +=
        (heroPointer.y * -0.08 - sculpture.position.y) * 0.035;
      core.rotation.x -= delta * 0.24;
      core.rotation.y += delta * 0.18;
      points.rotation.y -= delta * 0.035;
      ringOne.rotation.z += delta * 0.06;
      ringTwo.rotation.z -= delta * 0.045;
      renderer.render(scene, camera);
    }

    function resume() {
      if (!frameId && isHeroVisible && !document.hidden && !reduceMotion.matches) {
        previousFrame = performance.now() - 34;
        frameId = requestAnimationFrame(draw);
      }
    }

    const heroVisibility = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible) {
          resume();
        } else if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    heroVisibility.observe(heroStage);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        resume();
      }
    });

    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
        renderer.render(scene, camera);
      } else {
        resume();
      }
    });

    renderer.render(scene, camera);
    heroStage.classList.add("is-loaded");
    resume();

    window.addEventListener(
      "pagehide",
      (event) => {
        if (event.persisted) return;
        if (frameId) cancelAnimationFrame(frameId);
        heroVisibility.disconnect();
        resizeObserver.disconnect();
        knotGeometry.dispose();
        knotMaterial.dispose();
        wireMaterial.dispose();
        coreGeometry.dispose();
        coreMaterial.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        ringTwo.material.dispose();
        pointsGeometry.dispose();
        pointsMaterial.dispose();
        renderer.dispose();
      },
    );
  } catch (error) {
    console.warn("A cena 3D não pôde ser carregada; mantendo o fallback visual.", error);
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
