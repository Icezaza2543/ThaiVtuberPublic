// Site-wide stage motion (GSAP + ScrollTrigger). Decoration only: it never changes layout or content.
// - Cards and section headings rise in with a soft blur as they scroll into view (new cards too, e.g. a re-roll).
// - [data-hero-item] elements play an entrance on load; [data-parallax="<px>"] drift with scroll.
// - [data-countup] numbers count up once in view (the text node is reused, so React keeps owning it).
// - .tilt cards lean toward the pointer, and .card-hover gets a pointer spotlight (--mx/--my).
// Everything sits behind prefers-reduced-motion: no-preference; with reduced motion the page is static.
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const REVEAL = 'main .card:not(.card .card):not([data-no-reveal]), main [data-reveal]';
const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const FINE_POINTER = '(pointer: fine) and (hover: hover)';

function revealAll(root, seen) {
  const fresh = [...root.querySelectorAll(REVEAL)].filter((el) => !seen.has(el));
  if (!fresh.length) return;
  fresh.forEach((el) => seen.add(el));
  gsap.set(fresh, { autoAlpha: 0, y: 36, scale: 0.97, filter: 'blur(8px)' });
  ScrollTrigger.batch(fresh, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)',
      duration: 0.9, ease: 'expo.out', stagger: 0.09, overwrite: true,
      clearProps: 'filter,transform,visibility,opacity',
    }),
  });
}

function countUp(seen) {
  document.querySelectorAll('[data-countup]').forEach((el) => {
    const node = el.firstChild;
    if (seen.has(el) || node?.nodeType !== Node.TEXT_NODE) return;
    const text = node.nodeValue;
    const match = /^([\d,]+)(%?)$/.exec(text.trim());
    if (!match) return;
    seen.add(el);
    const target = Number(match[1].replace(/,/g, ''));
    const format = new Intl.NumberFormat('th-TH');
    const state = { v: 0 };
    node.nodeValue = `0${match[2]}`;
    gsap.to(state, {
      v: target, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { node.nodeValue = `${format.format(Math.round(state.v))}${match[2]}`; },
      onComplete: () => { node.nodeValue = text; },
    });
  });
}

/** Pointer spotlight + 3D tilt, delegated from the document so cards rendered later work too. */
function usePointerEffects() {
  useEffect(() => {
    const mq = window.matchMedia(`${MOTION_OK} and ${FINE_POINTER}`);
    let active = null;
    const leave = () => {
      if (!active) return;
      gsap.to(active, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)', clearProps: 'transform' });
      active = null;
    };
    const move = (e) => {
      const card = e.target.closest?.('.card-hover, .tilt, .glow-follow');
      if (card !== active) leave();
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      if (!mq.matches || !card.classList.contains('tilt')) return;
      active = card;
      gsap.to(card, { rotateY: (x - 0.5) * 9, rotateX: (0.5 - y) * 9, y: -4, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); };
  }, []);
}

export default function StageMotion() {
  usePointerEffects();
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const seen = new WeakSet();
      const counted = new WeakSet();

      // Hero entrance: a staggered rise with blur, then the title glow settles.
      const hero = gsap.utils.toArray('[data-hero-item]');
      if (hero.length) {
        gsap.from(hero, { autoAlpha: 0, y: 40, filter: 'blur(12px)', duration: 1.1, ease: 'expo.out', stagger: 0.12, delay: 0.15, clearProps: 'filter,transform' });
      }
      // The hero copy drifts up and fades as the visitor scrolls past the universe.
      gsap.utils.toArray('[data-hero-copy]').forEach((el) => {
        gsap.to(el, { y: -120, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: 0.6 } });
      });
      // Parallax layers: data-parallax holds the travel in px over one screen of scroll.
      gsap.utils.toArray('[data-parallax]').forEach((el) => {
        const travel = Number(el.dataset.parallax) || 80;
        gsap.to(el, { y: travel, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: () => `+=${window.innerHeight * 1.5}`, scrub: 1 } });
      });

      const scan = () => { revealAll(document, seen); countUp(counted); };
      scan();
      // Cards fetched after the first paint (spotlight, directory pages, analytics) reveal too.
      let queued = 0;
      const observer = new MutationObserver(() => {
        cancelAnimationFrame(queued);
        queued = requestAnimationFrame(() => { scan(); ScrollTrigger.refresh(); });
      });
      const main = document.getElementById('main');
      if (main) observer.observe(main, { childList: true, subtree: true });
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => { observer.disconnect(); cancelAnimationFrame(queued); };
    });
    return () => mm.revert();
  });
  return null;
}
