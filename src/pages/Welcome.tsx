import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useStore } from '../store/useStore';
import { createSerumBottle } from '../components/skincare/SerumBottle3D';
import '../styles/melli.css';

// Exact Flight Keyframes from Melli Specification
interface Keyframe {
  x: number;
  y: number;
  s: number;
  yaw: number;
  pitch: number;
  roll: number;
}

const K_DESKTOP: Keyframe[] = [
  // 1. Hero: Centered harmonic sweet spot, gracefully integrated with cream swirl & right-side copy
  { x: -0.01, y: -0.40, s: 0.44, yaw: 135, pitch: 8,  roll: -3 },
  // 2. Step 01 (Tell us about your skin): Left-side anchor, aligned symmetrically with right card
  { x: -0.28, y:  0.00, s: 0.60, yaw: 125, pitch: 7,  roll:  4 },
  // 3. Step 02 (Discover your recommendations): Right-side anchor, connected symmetrically with left card
  { x:  0.28, y:  0.00, s: 0.60, yaw:  45, pitch: -4, roll: -5 },
  // 4. Step 03 (Get your daily routine): Left-side anchor, aligned symmetrically with right card
  { x: -0.28, y:  0.00, s: 0.60, yaw: 145, pitch: 6,  roll:  4 },
  // 5. The Science: Refined scale centered in the widened central avenue, clear of card boundaries
  { x:  0.00, y: -0.02, s: 0.165, yaw: 125, pitch: 5,  roll: -3 },
  // 6. Final CTA: Refined closing scale framed on the right over the studio pedestal (-20% scale)
  { x:  0.38, y:  0.34, s: 0.24, yaw: 115, pitch: 6,  roll: -2 },
];

const K_TABLET: Keyframe[] = [
  // 1. Hero: Centered sweet spot, comfortably spaced between top headline and bottom CTA
  { x: 0.00, y: -0.10, s: 0.30, yaw: 140, pitch: 6,  roll: -4 },
  // 2. Step 01 (Skin Profiling): Scaled to 0 on tablet portrait so centered card & navigation pill have 100% clean clearance
  { x: 0.00, y: -0.68, s: 0.00, yaw: 125, pitch: 8,  roll:  5 },
  // 3. Step 02 (Active Compatibility): Scaled to 0
  { x: 0.00, y: -0.68, s: 0.00, yaw: 40,  pitch: -4, roll: -6 },
  // 4. Step 03 (Daily Rituals): Scaled to 0
  { x: 0.00, y: -0.68, s: 0.00, yaw: 150, pitch: 6,  roll:  4 },
  // 5. The Science: Scaled to 0 so 2-column cards are 100% unobstructed on tablet
  { x: 0.00, y:  0.00, s: 0.00, yaw: 120, pitch: 5,  roll: -2 },
  // 6. Final CTA: Scaled to 0 on tablet so centered closing CTA copy has 100% clean legibility
  { x: 0.00, y:  0.34, s: 0.00, yaw: 110, pitch: 4,  roll:  0 },
];

const K_MOBILE: Keyframe[] = [
  // 1. Hero: Centered in sweet spot between top headline and bottom CTA
  { x: 0.00, y:  0.10, s: 0.22, yaw: 140, pitch: 6,  roll: -4 },
  // 2. Step 01 (Skin Profiling): Scaled to 0 on phone screens so interactive card & checklist are 100% clean
  { x: 0.00, y: -0.90, s: 0.00, yaw: 125, pitch: 8,  roll:  5 },
  // 3. Step 02 (Active Compatibility): Scaled to 0
  { x: 0.00, y: -0.90, s: 0.00, yaw: 40,  pitch: -4, roll: -6 },
  // 4. Step 03 (Daily Rituals): Scaled to 0
  { x: 0.00, y: -0.90, s: 0.00, yaw: 150, pitch: 6,  roll:  4 },
  // 5. The Science: Scaled to 0 so single-column cards are 100% unobstructed on mobile
  { x: 0.00, y:  0.00, s: 0.00, yaw: 120, pitch: 5,  roll: -2 },
  // 6. Final CTA: Positioned elegantly above the closing title
  { x: 0.00, y:  0.36, s: 0.16, yaw: 110, pitch: 4,  roll:  0 },
];

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function targetAt(p: number, width: number) {
  const K = width >= 821 ? K_DESKTOP : width >= 581 ? K_TABLET : K_MOBILE;
  if (!Number.isFinite(p)) p = 0;
  const clampedP = clamp(p, 0, K.length - 1);
  const i = Math.min(K.length - 2, Math.floor(clampedP));
  const f = clampedP - i;

  // holds still at each section, flies in between
  const t = ease(clamp((f - 0.12) / 0.76, 0, 1));
  const dive = Math.sin(t * Math.PI) * -0.22;
  const k0 = K[i];
  const k1 = K[i + 1];

  return {
    x: lerp(k0.x, k1.x, t),
    y: lerp(k0.y, k1.y, t) + dive,
    s: lerp(k0.s, k1.s, t) * (1 + Math.sin(t * Math.PI) * 0.12),
    yaw: lerpAngle(k0.yaw, k1.yaw, t),
    pitch: lerp(k0.pitch, k1.pitch, t),
    roll: lerp(k0.roll, k1.roll, t),
    moving: Math.sin(t * Math.PI),
  };
}

const SECTION_IDS = ['top', 'how-it-works', 'access', 'steps', 'science', 'contact'];

function computeScrollProgress(vh: number): number {
  if (typeof document === 'undefined') return 0;

  const sections = SECTION_IDS.map((id) => document.getElementById(id));
  if (!sections[0] || !sections[sections.length - 1]) {
    return window.scrollY / vh;
  }

  for (let i = 0; i < sections.length - 1; i++) {
    const cur = sections[i];
    const nxt = sections[i + 1];
    if (!cur || !nxt) continue;

    const rCur = cur.getBoundingClientRect();
    const rNxt = nxt.getBoundingClientRect();

    if (rNxt.top > 0) {
      if (i === 4) {
        // Between science (i=4) and footer (i=5):
        // Science is a tall multi-row section. Hold at 4 while science content is in view,
        // and only transition to 5 as the footer approaches the viewport midpoint.
        const distToFoot = rNxt.top - vh * 0.15;
        if (distToFoot <= 0) return 5;
        const footTravel = vh * 0.85;
        const transProgress = clamp(1 - distToFoot / footTravel, 0, 1);
        return 4 + transProgress;
      }

      const span = rNxt.top - rCur.top;
      if (span <= 0) return i;
      const frac = clamp(-rCur.top / span, 0, 1);
      return i + frac;
    }
  }

  return sections.length - 1;
}

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const isOnboarded = useStore((state) => state.profile.isOnboarded);
  const user = useStore((state) => state.user);

  const [webGlFailed, setWebGlFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const handleStart = () => {
    // If not signed in or not onboarded, always navigate to the quiz
    if (user && isOnboarded) {
      navigate('/today');
    } else {
      navigate('/quiz');
    }
  };

  useEffect(() => {
    // 1. Initial Loader Setup & Reveal
    const loaderTimer = setTimeout(() => {
      if (loaderRef.current) {
        loaderRef.current.classList.add('done');
      }
      document.body.classList.add('loaded');
    }, 450);

    // 2. Parallax and Section Reveal Observers
    const sections = mainRef.current?.querySelectorAll<HTMLElement>('section, footer');
    const speedElements = mainRef.current?.querySelectorAll<HTMLElement>('[data-speed]');

    const updateParallax = () => {
      const vh = window.innerHeight;

      // Parallax on [data-speed] elements
      speedElements?.forEach((el) => {
        const sec = el.closest('section');
        if (!sec) return;
        const rect = sec.getBoundingClientRect();
        const p = -rect.top / vh;
        const speed = parseFloat(el.getAttribute('data-speed') || '0');
        const rot = parseFloat(el.getAttribute('data-rot') || '0');
        el.style.transform = `translate3d(0, ${p * speed * vh}px, 0) rotate(${p * rot}deg)`;
      });

      // to avoid headings passing underneath the navbar or clipping against boundaries.
      // The final CTA and footer sections are excluded so their headlines and content remain stable.
      sections?.forEach((sec) => {
        if (sec.classList.contains('foot') || sec.classList.contains('final-cta')) return;
        const rect = sec.getBoundingClientRect();
        const textBlock = sec.querySelector<HTMLElement>('.text, .hero__side');
        const heading = sec.querySelector<HTMLElement>('h1');
        const numBlock = sec.querySelector<HTMLElement>('.num');

        if (rect.top < 0 && rect.bottom > 0) {
          const exitProgress = Math.min(1, Math.max(0, -rect.top / (vh * 0.55)));
          const opacity = `${Math.max(0, 1 - exitProgress)}`;
          if (textBlock) textBlock.style.opacity = opacity;
          if (heading) heading.style.opacity = opacity;
          if (numBlock) numBlock.style.opacity = opacity;
        } else if (rect.top >= 0) {
          if (textBlock && textBlock.style.opacity !== '') textBlock.style.opacity = '';
          if (heading && heading.style.opacity !== '') heading.style.opacity = '';
          if (numBlock && numBlock.style.opacity !== '') numBlock.style.opacity = '';
        }
      });

      // Nav Theme & Active Section: check section crossing viewport midpoint
      let activeTheme = 'light';
      let activeSectionId = 'top';
      sections?.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= vh * 0.45 && rect.bottom > vh * 0.45) {
          activeSectionId = sec.id;
          activeTheme = sec.getAttribute('data-theme') || 'light';
        }
      });
      document.body.dataset.activeSection = activeSectionId;
      document.body.classList.toggle('on-dark', activeTheme === 'dark');
      document.body.classList.toggle('scrolled', window.scrollY > 20);

      // Active Nav Link: highlight link corresponding to the section in view
      const navLinks = mainRef.current?.ownerDocument.querySelectorAll<HTMLAnchorElement>('.melli-page .nav__links a');
      navLinks?.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        let inView = false;
        if (href === '#how-it-works') {
          const s1 = document.getElementById('how-it-works')?.getBoundingClientRect();
          const s3 = document.getElementById('steps')?.getBoundingClientRect();
          if (s1 && s3) {
            inView = s1.top <= vh * 0.45 && s3.bottom >= vh * 0.25;
          }
        } else {
          const target = document.querySelector<HTMLElement>(href);
          if (target) {
            const rect = target.getBoundingClientRect();
            inView = rect.top <= vh * 0.45 && rect.bottom > vh * 0.2;
          }
        }
        link.classList.toggle('active', inView);
      });

      // Foot section active state: triggers as footer approaches the viewport
      const footSec = document.querySelector<HTMLElement>('.melli-page .foot');
      if (footSec) {
        const footRect = footSec.getBoundingClientRect();
        document.body.classList.toggle('at-foot', footRect.top <= vh * 0.92);
      }
    };

    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();

    // Section reveal observer
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
            }
          });
        },
        { threshold: 0.12 }
      );
      sections?.forEach((sec) => observer?.observe(sec));
    } else {
      sections?.forEach((sec) => sec.classList.add('in'));
    }

    // 3. Three.js 3D Serum Bottle Scene Setup
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animId = 0;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      const scene = new THREE.Scene();

      // Environment lighting
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();

      const camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 10);

      // Studio Skincare Lights - Balanced for crystal glass & crisp label
      const hemiLight = new THREE.HemisphereLight(0xfff1f4, 0xb96f87, 1.0);
      scene.add(hemiLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.6);
      dirLight1.position.set(3, 5, 6);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xffdbe5, 1.2);
      dirLight2.position.set(-5, 2, -4);
      scene.add(dirLight2);

      const frontKey = new THREE.DirectionalLight(0xfff8fa, 1.0);
      frontKey.position.set(0, 1, 8);
      scene.add(frontKey);

      const pointLight = new THREE.PointLight(0xffffff, 0.8, 12);
      pointLight.position.set(0, 0, 4);
      scene.add(pointLight);

      // Group Hierarchy: scene > flight (position, scale, yaw) > objectRoot (roll/pitch) > serumBottle
      const flight = new THREE.Group();
      scene.add(flight);

      const objectRoot = new THREE.Group();
      flight.add(objectRoot);

      const bottleModel = createSerumBottle();
      objectRoot.add(bottleModel);

      // Mouse tracking in NDC (-1..1)
      const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
      const onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove, { passive: true });

      // Resize handler
      const onResize = () => {
        if (!renderer) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      window.addEventListener('resize', onResize);

      // State tracking
      const initialTarget = targetAt(0, window.innerWidth);
      const cur = {
        x: initialTarget.x,
        y: initialTarget.y,
        s: initialTarget.s,
        yaw: initialTarget.yaw,
        pitch: initialTarget.pitch,
        roll: initialTarget.roll,
      };

      let prevX = cur.x;
      let prevY = cur.y;
      let curScienceTurn = 0;
      let curSciencePitch = 0;
      const clock = new THREE.Clock();

      canvas.classList.add('ready');
      canvas.style.opacity = '1';

      // Immediate Initial Frame Render
      const vFOVInit = (camera.fov * Math.PI) / 180;
      const halfHInit = Math.tan(vFOVInit / 2) * camera.position.z;
      const halfWInit = halfHInit * camera.aspect;
      flight.position.set(cur.x * halfWInit, cur.y * halfHInit, 0);
      flight.scale.setScalar(halfHInit * 2 * 0.30 * cur.s);
      flight.rotation.set(0, -(cur.yaw * Math.PI) / 180, 0);
      objectRoot.rotation.set(
        (cur.roll * Math.PI) / 180,
        0,
        (cur.pitch * Math.PI) / 180,
        'YZX'
      );
      renderer.render(scene, camera);

      // Animation Loop
      const renderLoop = () => {
        animId = requestAnimationFrame(renderLoop);

        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();

        const vh = window.innerHeight || 1;
        const p = computeScrollProgress(vh);
        const target = targetAt(p, window.innerWidth);

        // Dynamic Science section turn:
        // Perform a smooth 3D showcase turn as user scrolls through the cards,
        // plus an elegant continuous turntable drift when paused so the bottle is never "plainly lying there"
        const scienceEl = document.getElementById('science');
        let targetScienceTurn = 0;
        let targetSciencePitch = 0;
        if (scienceEl) {
          const rSci = scienceEl.getBoundingClientRect();
          if (rSci.top <= vh * 0.90 && rSci.bottom >= vh * 0.10) {
            const sciHeight = Math.max(rSci.height - vh * 0.4, 1);
            const sciProgress = clamp((vh * 0.75 - rSci.top) / sciHeight, 0, 1);
            // 360-degree rotation across the 6 cards as you scroll down
            const scrollTurn = sciProgress * 360;
            // Gentle continuous studio showcase rotation when paused
            const liveIdleTurn = Math.sin(t * 1.5) * 26;
            targetScienceTurn = scrollTurn + liveIdleTurn;
            targetSciencePitch = Math.sin(sciProgress * Math.PI * 2) * 8 + Math.cos(t * 1.8) * 4;
          }
        }
        curScienceTurn = lerp(curScienceTurn, targetScienceTurn, 1 - Math.exp(-dt * 3.5));
        curSciencePitch = lerp(curSciencePitch, targetSciencePitch, 1 - Math.exp(-dt * 3.5));

        // Smooth follow
        cur.x = lerp(cur.x, target.x, 1 - Math.exp(-dt * 3.2));
        cur.y = lerp(cur.y, target.y, 1 - Math.exp(-dt * 3.2));
        cur.s = lerp(cur.s, target.s, 1 - Math.exp(-dt * 3.2));
        cur.pitch = lerp(cur.pitch, target.pitch, 1 - Math.exp(-dt * 3.2));
        cur.roll = lerp(cur.roll, target.roll, 1 - Math.exp(-dt * 3.2));
        cur.yaw = lerpAngle(cur.yaw, target.yaw, 1 - Math.exp(-dt * 2.6));

        // Velocity tracking
        const vx = (cur.x - prevX) / (dt || 0.016);
        const vy = (cur.y - prevY) / (dt || 0.016);
        prevX = cur.x;
        prevY = cur.y;

        // Smooth mouse
        mouse.sx = lerp(mouse.sx, mouse.x, 1 - Math.exp(-dt * 2.0));
        mouse.sy = lerp(mouse.sy, mouse.y, 1 - Math.exp(-dt * 2.0));

        // Viewport camera mapping
        const vFOV = (camera.fov * Math.PI) / 180;
        const halfH = Math.tan(vFOV / 2) * camera.position.z;
        const halfW = halfH * camera.aspect;

        // Floating bottle: gentle 4–6s harmonic cycle with ease-in-out drift
        const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // 5.0s fundamental cycle: (2 * PI / 5.0) rad/s
        const bottleCycle = prefersReduced ? 0 : (t * Math.PI * 2) / 5.0;
        const hover = prefersReduced ? 0 : Math.sin(bottleCycle) * 0.038 + Math.sin(bottleCycle * 0.5 + 1.2) * 0.012;

        // Flight group transformation
        flight.position.set(
          cur.x * halfW + (prefersReduced ? 0 : Math.sin(bottleCycle * 0.6) * 0.025) + mouse.sx * 0.10,
          cur.y * halfH + hover * halfH * 0.5 + mouse.sy * 0.06,
          prefersReduced ? 0 : Math.sin(bottleCycle * 0.4) * 0.06
        );
        flight.scale.setScalar(halfH * 2 * 0.30 * cur.s);
        flight.rotation.set(
          0,
          -((cur.yaw + curScienceTurn + mouse.sx * 10) * Math.PI) / 180,
          0
        );

        // Banking into turns & pitch when diving, plus dynamic science section turn
        const pitch =
          cur.pitch +
          curSciencePitch -
          clamp(vy * 22, -28, 28) +
          (prefersReduced ? 0 : Math.sin(bottleCycle + 1) * 1.8) +
          mouse.sy * 5;
        const roll =
          cur.roll +
          Math.sin(curScienceTurn * (Math.PI / 180)) * 5 +
          clamp(vx * 18, -30, 30) +
          (prefersReduced ? 0 : Math.sin(bottleCycle * 0.8) * 2.2);

        objectRoot.rotation.set(
          (roll * Math.PI) / 180,
          0,
          (pitch * Math.PI) / 180,
          'YZX'
        );

        renderer?.render(scene, camera);
      };

      animId = requestAnimationFrame(renderLoop);

      return () => {
        clearTimeout(loaderTimer);
        cancelAnimationFrame(animId);
        window.removeEventListener('scroll', updateParallax);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        observer?.disconnect();
        document.body.classList.remove('loaded', 'on-dark', 'scrolled', 'at-foot');
        if (renderer) {
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn('WebGL initialization fallback:', err);
      setWebGlFailed(true);
      if (loaderRef.current) loaderRef.current.classList.add('done');
      document.body.classList.add('loaded');
      return () => {
        clearTimeout(loaderTimer);
        window.removeEventListener('scroll', updateParallax);
        observer?.disconnect();
        document.body.classList.remove('loaded', 'on-dark', 'scrolled', 'at-foot');
      };
    }
  }, []);

  return (
    <div className="melli-page">
      {/* 4-Point Star Loader */}
      <div className="loader" id="loader" ref={loaderRef}>
        <svg viewBox="0 0 40 40" fill="#3D2630" aria-label="Loading Skincare Routine">
          <path d="M20 0c1.2 11.5 8.5 18.8 20 20-11.5 1.2-18.8 8.5-20 20-1.2-11.5-8.5-18.8-20-20C11.5 18.8 18.8 11.5 20 0z" />
        </svg>
      </div>

      {/* Fixed Navigation */}
      <nav className="nav">
        <a className="logo" href="#top" aria-label="Skincare Ritual">
          <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
            <path d="M20 0c1.2 11.5 8.5 18.8 20 20-11.5 1.2-18.8 8.5-20 20-1.2-11.5-8.5-18.8-20-20C11.5 18.8 18.8 11.5 20 0z" />
          </svg>
          <span className="logo__wordmark">Skincare Ritual</span>
        </a>
        <div className="nav__links">
          <a href="#how-it-works">How It Works</a>
          <a href="#science">The Science</a>
          <a href="#contact">Get in Touch</a>
        </div>
        <button onClick={handleStart} className="nav__cta" aria-label="Build My Routine">
          Build My Routine
        </button>
      </nav>

      {/* Fixed 3D Canvas */}
      <canvas id="bee" ref={canvasRef} aria-hidden="true" style={{ opacity: 1 }} />

      {/* Fallback Serum Bottle for environments without WebGL */}
      {webGlFailed && (
        <div
          className="fixed inset-0 pointer-events-none flex items-center justify-center fallback-bottle-container"
        >
          <div className="w-[220px] md:w-[260px] filter drop-shadow-2xl">
            <svg viewBox="0 0 200 400" className="w-full h-auto" fill="none">
              {/* Dropper bulb */}
              <path d="M75 55 C75 25, 125 25, 125 55 L120 70 L80 70 Z" fill="#FFF5F7" stroke="#E8B8C2" strokeWidth="2" />
              {/* Collar */}
              <rect x="68" y="70" width="64" height="28" rx="4" fill="#E8B8C2" stroke="#D88FA6" strokeWidth="2" />
              <rect x="65" y="94" width="70" height="8" rx="2" fill="#D88FA6" />
              {/* Glass Bottle Body */}
              <rect x="40" y="102" width="120" height="240" rx="28" fill="#FFF8FA" fillOpacity="0.28" stroke="#E8B8C2" strokeWidth="2.5" />
              {/* Serum Liquid inside */}
              <rect x="46" y="160" width="108" height="174" rx="22" fill="#FA8EA8" fillOpacity="0.72" />
              {/* Glass Pipette */}
              <rect x="94" y="98" width="12" height="210" rx="3" fill="#FFFFFF" fillOpacity="0.60" />
              <rect x="96" y="170" width="8" height="130" rx="2" fill="#E8587D" fillOpacity="0.78" />
              {/* Luxury Label */}
              <rect x="44" y="175" width="112" height="110" rx="6" fill="#FFF8F9" fillOpacity="0.90" stroke="#E8B8C2" strokeWidth="1.5" />
              <text x="100" y="195" textAnchor="middle" fill="#886875" fontSize="7" fontWeight="600" letterSpacing="2">RITUAL</text>
              <text x="100" y="210" textAnchor="middle" fill="#B96F87" fontSize="11" fontWeight="700">N° 01</text>
              <line x1="75" y1="216" x2="125" y2="216" stroke="#D88FA6" strokeWidth="1" />
              <text x="100" y="234" textAnchor="middle" fill="#3D2630" fontSize="10" fontWeight="800">HYDRA-GLOW</text>
              <text x="100" y="246" textAnchor="middle" fill="#B96F87" fontSize="8" fontWeight="600">ACTIVE SERUM</text>
              <text x="100" y="260" textAnchor="middle" fill="#5A3D49" fontSize="6">5% Niacinamide + Multi-Peptides</text>
              <text x="100" y="274" textAnchor="middle" fill="#5A3D49" fontSize="6" fontWeight="600">30 ML / 1.0 FL. OZ.</text>
            </svg>
          </div>
        </div>
      )}

      {/* Main Full-Viewport Scroll Story */}
      <main ref={mainRef}>
        {/* HERO SECTION */}
        <section className="hero" id="top" data-theme="light">
          <h1 data-speed="0.55">
            <span className="line">
              <span>Your skin, your ritual.</span>
            </span>
            <span className="line">
              <span>Built just like this.</span>
            </span>
          </h1>

          {/* Subtle Floating Pearl Decorations (Inspired by editorial skincare textures) */}
          <div className="pearl-decor pearl--1" aria-hidden="true" />
          <div className="pearl-decor pearl--2" aria-hidden="true" />
          <div className="pearl-decor pearl--3" aria-hidden="true" />
          <div className="pearl-decor pearl--4" aria-hidden="true" />

          <div
            className="flower-wrap flower-wrap--cosmos"
            data-speed="-0.25"
            data-rot="8"
          >
            <img
              className="flower flower--cosmos"
              src="/assets/skincare/cream-swirl.png"
              alt="Silky whipped moisturizing cream swirl with dewy hydration"
            />
          </div>

          <div className="hero__side">
            <p className="hero__tagline">Your skin is unique. Your routine should be too.</p>
            <p className="hero__desc">
              Discover your skin type, understand your skincare needs and build a personalised daily routine with products suited to you.
            </p>
            <div className="hero__cta-group">
              <button
                onClick={handleStart}
                className="hero__cta-btn"
                aria-label="Build My Skincare Routine"
              >
                <span>Build My Skincare Routine</span>
                <svg
                  className="cta-arrow"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
                <span className="sr-only">Start My Skin Journey</span>
              </button>
              <p className="hero__cta-sub">Personalised skincare starts here.</p>
            </div>
          </div>
        </section>

        {/* SECTION 01 - STEP 1 */}
        <section className="s1" id="how-it-works" data-theme="light">
          <div
            className="flower-wrap flower-wrap--hang"
            data-speed="0.35"
            data-rot="-6"
          >
            <img
              className="flower flower--hang"
              src="/assets/skincare/moisture-drops.png"
              alt="Crystalline hydrating essence droplets cascading with moisture"
            />
          </div>
          <div className="text">
            {/* Step Sequence Header with Progress Bar */}
            <div className="step-header-lockup reveal">
              <div className="step-progress-row">
                <span className="step-progress-pill is-active">01 • Profiling</span>
                <span className="step-progress-connector"></span>
                <span className="step-progress-pill">02 • Formulation</span>
                <span className="step-progress-connector"></span>
                <span className="step-progress-pill">03 • Ritual</span>
              </div>
              <div className="step-title-pair">
                <span className="step-large-num" aria-hidden="true">01</span>
                <div className="step-title-content">
                  <span className="step-eyebrow">Phase One</span>
                  <h2 className="section-heading">Tell us about your skin</h2>
                  <p className="section-explanation">
                    Share your skin type, barrier concerns, and preferences to build your personal baseline profile.
                  </p>
                </div>
              </div>
            </div>

            <ul className="section-benefits reveal d2">
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Skin type identification (oily, dry, combination, sensitive)</span>
              </li>
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Targeted analysis of your skin concerns and barrier sensitivities</span>
              </li>
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>A personalised skin profile built to guide your routine</span>
              </li>
            </ul>
            <div className="section-preview s1-preview reveal d3">
              <div className="preview-header">
                <span className="preview-title">Skin Profile Analysis</span>
                <span className="preview-badge-status">Tailored</span>
              </div>
              <div className="preview-chips">
                <span className="preview-chip">Type: Combination</span>
                <span className="preview-chip">Focus: Barrier Repair</span>
                <span className="preview-chip">Sensitivity: Moderate</span>
                <span className="preview-chip">Actives: Niacinamide & Peptides</span>
              </div>
            </div>

            <a href="#access" className="step-sequence-connector reveal d3" aria-label="Proceed to Step 02">
              <span>Next: Step 02 • Active Compatibility</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M4 9l4 4 4-4" />
              </svg>
            </a>
          </div>
        </section>

        {/* SECTION 02 - STEP 2 */}
        <section className="s2" id="access" data-theme="light">
          <div className="text" id="about">
            {/* Step Sequence Header with Progress Bar */}
            <div className="step-header-lockup reveal">
              <div className="step-progress-row">
                <span className="step-progress-pill is-done">01 • Profiling</span>
                <span className="step-progress-connector is-done"></span>
                <span className="step-progress-pill is-active">02 • Formulation</span>
                <span className="step-progress-connector"></span>
                <span className="step-progress-pill">03 • Ritual</span>
              </div>
              <div className="step-title-pair">
                <span className="step-large-num" aria-hidden="true">02</span>
                <div className="step-title-content">
                  <span className="step-eyebrow">Phase Two</span>
                  <h2 className="section-heading">Discover your recommendations</h2>
                  <p className="section-explanation">
                    Explore clinically vetted active ingredients and targeted formulas verified for complete compatibility.
                  </p>
                </div>
              </div>
            </div>

            <ul className="section-benefits reveal d2">
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Morning (AM) and evening (PM) routines matched to your day</span>
              </li>
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Personalised product and active ingredient suggestions</span>
              </li>
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Automated ingredient conflict checks to prevent irritation</span>
              </li>
            </ul>
            <div className="section-preview s2-preview reveal d3">
              <div className="preview-header">
                <span className="preview-title">Daily Ritual Architecture</span>
                <span className="preview-badge-status">AM / PM</span>
              </div>
              <div className="preview-routine-grid">
                <div className="preview-routine-row">
                  <span className="routine-tag">AM</span>
                  <div className="routine-flow">
                    <span>Gentle Cleanser</span>
                    <span className="routine-arrow">→</span>
                    <span>Niacinamide Serum</span>
                    <span className="routine-arrow">→</span>
                    <span>SPF 50+</span>
                  </div>
                </div>
                <div className="preview-routine-row">
                  <span className="routine-tag">PM</span>
                  <div className="routine-flow">
                    <span>Double Cleanse</span>
                    <span className="routine-arrow">→</span>
                    <span>Peptide Complex</span>
                    <span className="routine-arrow">→</span>
                    <span>Barrier Seal</span>
                  </div>
                </div>
              </div>
            </div>

            <a href="#steps" className="step-sequence-connector reveal d3" aria-label="Proceed to Step 03">
              <span>Next: Step 03 • Daily Routine</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M4 9l4 4 4-4" />
              </svg>
            </a>
          </div>

          <div
            className="flower-wrap flower-wrap--iris"
            data-speed="-0.3"
            data-rot="10"
          >
            <img
              className="flower flower--iris"
              src="/assets/skincare/peptide-swatch.png"
              alt="Luminous translucent rose peptide gel-cream swatch"
            />
          </div>
        </section>

        {/* SECTION 03 - STEP 3 */}
        <section className="s3" id="steps" data-theme="light">
          <div
            className="flower-wrap flower-wrap--passion"
            data-speed="-0.2"
            data-rot="-10"
          >
            <img
              className="flower flower--passion"
              src="/assets/skincare/hydration-spheres.png"
              alt="Sculptural hydrating water spheres and hyaluronic acid gel cluster"
            />
          </div>
          <div className="text">
            {/* Step Sequence Header with Progress Bar */}
            <div className="step-header-lockup reveal">
              <div className="step-progress-row">
                <span className="step-progress-pill is-done">01 • Profiling</span>
                <span className="step-progress-connector is-done"></span>
                <span className="step-progress-pill is-done">02 • Formulation</span>
                <span className="step-progress-connector is-done"></span>
                <span className="step-progress-pill is-active">03 • Ritual</span>
              </div>
              <div className="step-title-pair">
                <span className="step-large-num" aria-hidden="true">03</span>
                <div className="step-title-content">
                  <span className="step-eyebrow">Phase Three</span>
                  <h2 className="section-heading">Get your daily routine</h2>
                  <p className="section-explanation">
                    Receive your tailored AM and PM ritual with step-by-step application order and weekly skin cycling.
                  </p>
                </div>
              </div>
            </div>

            <ul className="section-benefits reveal d2">
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Guidance on product application order from thinnest to richest</span>
              </li>
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Weekly frequency schedules for active exfoliants and retinoids</span>
              </li>
              <li className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                </span>
                <span>Daily routine logging with streak tracking to build habits</span>
              </li>
            </ul>
            <div className="section-preview s3-preview reveal d3">
              <div className="preview-header">
                <span className="preview-title">Application Order & Guidance</span>
                <span className="preview-badge-status">Step-by-Step</span>
              </div>
              <div className="step-order-grid">
                <div className="step-order-card">
                  <span className="step-order-badge">Step 1</span>
                  <span className="step-order-name">Hydrating Cleanse</span>
                  <span className="step-order-meta">Daily • AM & PM</span>
                </div>
                <div className="step-order-card">
                  <span className="step-order-badge">Step 2</span>
                  <span className="step-order-name">Target Treatment</span>
                  <span className="step-order-meta">3× / wk • Pre-oil</span>
                </div>
                <div className="step-order-card">
                  <span className="step-order-badge">Step 3</span>
                  <span className="step-order-name">Barrier Seal</span>
                  <span className="step-order-meta">Daily • Lock-in step</span>
                </div>
              </div>
            </div>

            <a href="#science" className="step-sequence-connector reveal d3" aria-label="Explore Dermatological Science">
              <span>Next: The Science Behind Every Ritual</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M4 9l4 4 4-4" />
              </svg>
            </a>
          </div>
        </section>

        {/* SKINCARE SCIENCE & CREDIBILITY */}
        <section className="science-section" id="science" data-theme="light">
          <div className="science-container">
            <header className="science-header reveal">
              <span className="science-eyebrow">Dermatological Methodology</span>
              <h2 className="science-title">The Science Behind Every Ritual</h2>
              <p className="science-subtitle">
                Skin recommendations should be guided by cellular biology and clinical pharmacology, never guesswork. Our matching engine analyzes barrier physiology, molecule compatibility, and verified clinical literature.
              </p>
            </header>

            <div className="science-grid">
              {/* 01: Skin Type Identification */}
              <div className="science-card">
                <h3 className="science-card__title">Skin Type Identification</h3>
                <p className="science-card__desc">
                  Every skin barrier is unique. We evaluate sebum secretion rates, moisture retention, and sensitivity thresholds to determine your true baseline profile.
                </p>
              </div>

              {/* 02: Concern-Driven Advice */}
              <div className="science-card">
                <h3 className="science-card__title">Concern-Driven Advice</h3>
                <p className="science-card__desc">
                  Target persistent concerns with evidence-guided actives. Whether addressing breakouts, tone, or texture, recommendations follow verified cellular pathways.
                </p>
              </div>

              {/* 03: Ingredient Selection */}
              <div className="science-card">
                <h3 className="science-card__title">Ingredient Selection</h3>
                <p className="science-card__desc">
                  Formulations are vetted against randomized clinical trials. We select ingredients with clinically proven therapeutic concentration windows and high barrier tolerance.
                </p>
              </div>

              {/* 04: Ingredient Compatibility */}
              <div className="science-card">
                <h3 className="science-card__title">Ingredient Compatibility</h3>
                <p className="science-card__desc">
                  Active compatibility is essential. Our logic evaluates formulation pH and chemical synergy to protect your acid mantle from destabilization and irritation.
                </p>
              </div>

              {/* 05: Personalised Recommendations */}
              <div className="science-card">
                <h3 className="science-card__title">Personalised Recommendations</h3>
                <p className="science-card__desc">
                  Build custom AM and PM rituals tailored to your skin and lifestyle. Receive optimal product application sequences and personalized usage cadences.
                </p>
              </div>

              {/* 06: Product Safety */}
              <div className="science-card" id="ingredient-safety">
                <h3 className="science-card__title">Product Safety</h3>
                <p className="science-card__desc">
                  Calibrated to dermatological safety boundaries. Conflicting actives are separated across alternating evenings with dedicated barrier recovery nights built in.
                </p>
              </div>
            </div>

            {/* Dermatological Authority & Substantiation Banner */}
            <div className="science-credibility" id="clinical-guidelines">
              <div className="science-credibility__icon" aria-hidden="true">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="science-credibility__body">
                <h4 className="science-credibility__title">Substantiated by Published Clinical Practice Guidelines</h4>
                <p className="science-credibility__text">
                  Safety boundaries and compatibility logic are calibrated to clinical literature published by the <strong>American Academy of Dermatology (AAD)</strong> and the <strong>American Academy of Family Physicians (AAFP)</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER & FINAL CTA (Closing Section) */}
        <footer className="foot" id="contact" data-theme="light">
          {/* Top CTA Block */}
          <div className="foot__hero">
            <div className="cta">
              <h2 className="title reveal">Your skin deserves a routine of its own.</h2>
              <p className="cta__sub reveal d1">
                Start understanding your skin and build a routine that works with it.
              </p>
              <button
                onClick={handleStart}
                className="foot__cta-btn reveal d2"
                aria-label="Build My Routine"
              >
                <span>Build My Routine</span>
                <svg
                  className="foot__cta-arrow"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            </div>
          </div>

          {/* 4-Column Structured Footer */}
          <div className="foot__nav">
            <div className="foot__grid">
              {/* Column 1: Skincare Ritual */}
              <div className="foot__col foot__col--brand">
                <h4 className="foot__col-title">About</h4>
                <div className="brand">
                  <strong className="brand__name">Skincare Ritual</strong>
                  <p className="brand__desc">
                    Evidence-backed routines crafted around your unique skin barrier. Understand your skin type, eliminate active ingredient conflicts, and master your daily ritual.
                  </p>
                </div>
              </div>

              {/* Column 2: Explore */}
              <div className="foot__col">
                <h4 className="foot__col-title">Explore</h4>
                <ul className="foot__links">
                  <li><a href="#how-it-works">How It Works</a></li>
                  <li><a href="#science">The Science</a></li>
                  <li><Link to="/quiz">Skin Profiling</Link></li>
                </ul>
              </div>

              {/* Column 3: Resources */}
              <div className="foot__col">
                <h4 className="foot__col-title">Resources</h4>
                <ul className="foot__links">
                  <li><a href="#clinical-guidelines">Clinical Guidelines</a></li>
                  <li><a href="#ingredient-safety">Ingredient Safety</a></li>
                  <li><Link to="/compatibility">Active Compatibility</Link></li>
                  <li>
                    <button onClick={handleStart} className="foot__link-cta">
                      Build My Routine →
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 4: Connect */}
              <div className="foot__col">
                <h4 className="foot__col-title">Connect</h4>
                <ul className="foot__links">
                  <li><a href="mailto:support@skincareritual.app">Contact Support</a></li>
                  <li><a href="#top">Back to Top</a></li>
                  <li>
                    <a
                      href="https://github.com/vrushti-gates/Skincare-routine-builder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="foot__github-link"
                      aria-label="GitHub Repository"
                    >
                      <svg className="foot__github-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                      <svg className="foot__external-arrow" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3.5 8.5l5-5M4 3.5h4.5V8" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Safety Disclaimer & Clear Copyright Line */}
            <div className="foot__bottom">
              <p className="foot__disclaimer">
                Skincare recommendations are provided for informational purposes and are not a substitute for professional medical advice. Patch-test new products and consult a dermatologist for persistent or severe skin concerns.
              </p>
              <p className="foot__copyright">
                © {new Date().getFullYear()} Skincare Ritual. All rights reserved. • Formulated for barrier health.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
