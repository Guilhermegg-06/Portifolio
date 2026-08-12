import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function splitIntoWords(element) {
  const text = element.textContent.trim().replace(/\s+/g, " ");
  const accessibleCopy = document.createElement("span");
  accessibleCopy.className = "sr-only";
  accessibleCopy.textContent = text;

  const visualCopy = document.createElement("span");
  visualCopy.className = "scroll-reveal-text";
  visualCopy.setAttribute("aria-hidden", "true");

  text.split(" ").forEach((word, index, words) => {
    const wordElement = document.createElement("span");
    wordElement.className = "word";
    wordElement.textContent = word;
    visualCopy.appendChild(wordElement);
    if (index < words.length - 1) visualCopy.appendChild(document.createTextNode(" "));
  });

  element.replaceChildren(accessibleCopy, visualCopy);
  return Array.from(visualCopy.querySelectorAll(".word"));
}

export function initScrollReveal({
  selector = "[data-scroll-reveal]",
  baseOpacity = 0.1,
  enableBlur = true,
  baseRotation = 3,
  blurStrength = 4,
  rotationEnd = "bottom bottom",
  wordAnimationEnd = "bottom bottom",
} = {}) {
  const elements = Array.from(document.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const contexts = [];

  elements.forEach((element) => {
    const words = splitIntoWords(element);
    if (reducedMotion) {
      element.classList.add("is-static");
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { transformOrigin: "0% 50%", rotate: baseRotation },
        {
          ease: "none",
          rotate: 0,
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: rotationEnd,
            scrub: true,
          },
        },
      );

      gsap.fromTo(
        words,
        {
          opacity: baseOpacity,
          filter: enableBlur ? `blur(${blurStrength}px)` : "none",
          willChange: "opacity, filter",
        },
        {
          ease: "none",
          opacity: 1,
          filter: "blur(0px)",
          stagger: 0.05,
          scrollTrigger: {
            trigger: element,
            start: "top bottom-=20%",
            end: wordAnimationEnd,
            scrub: true,
          },
          onComplete: () => words.forEach((word) => { word.style.willChange = "auto"; }),
        },
      );
    }, element);

    contexts.push(context);
  });

  return () => contexts.forEach((context) => context.revert());
}
