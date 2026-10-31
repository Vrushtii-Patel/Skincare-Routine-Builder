import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Fingerprint, Sparkles, FlaskConical, Layers, Heart, ShieldCheck } from 'lucide-react';
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
  // 1. Hero: Centered lower sweet spot, completely clear of both headline and right description
  { x: 0.04, y: -0.72, s: 0.63, yaw: 140, pitch: 6,  roll: -4 },
  // 2. Step 01 (Tell us about your skin): Left-centre behind/alongside moisture drops, clear of right-hand text
  { x: -0.42, y: -0.06, s: 0.78, yaw: 125, pitch: 8,  roll:  5 },
  // 3. Step 02 (Discover your recommendations): Dramatic visual towards the right on dark background, text on left
  { x: 0.38, y: -0.16, s: 0.86, yaw: 40,  pitch: -4, roll: -6 },
  // 4. Step 03 (Get your daily routine): Towards left with hydration spheres, clear text area on right
  { x: -0.40, y: -0.10, s: 0.78, yaw: 150, pitch: 6,  roll:  4 },
  // 5. The Science: Refined small scale in the central avenue so it never hides text behind
  { x: 0.00, y: -0.04, s: 0.28, yaw: 125, pitch: 5,  roll: -3 },
  // 6. Final CTA: Lifted well clear above the footer line and reduced by a cm
  { x: 0.40, y:  0.38, s: 0.35, yaw: 115, pitch: 6,  roll: -2 },
];

const K_MOBILE: Keyframe[] = [
  { x: 0.18, y: -0.46, s: 0.50, yaw: 140, pitch: 6,  roll: -4 },
  { x: -0.24, y: 0.10, s: 0.59, yaw: 125, pitch: 8,  roll:  5 },
  { x: 0.24, y: -0.12, s: 0.63, yaw: 40,  pitch: -4, roll: -6 },
  { x: -0.24, y: 0.10, s: 0.58, yaw: 150, pitch: 6,  roll:  4 },
  { x: 0.00, y:  0.02, s: 0.20, yaw: 120, pitch: 5,  roll: -2 },
  { x: 0.00, y:  0.28, s: 0.28, yaw: 110, pitch: 4,  roll:  0 },
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

function targetAt(p: number, isMobile: boolean) {
  const K = isMobile ? K_MOBILE : K_DESKTOP;
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

  const [webGlFailed, setWebGlFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const handleStart = () => {
    if (isOnboarded) {
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

      // Smooth exit fade: as section content scrolls past the top, fade it out gracefully
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
        const target = document.querySelector<HTMLElement>(href);
        if (target) {
          const rect = target.getBoundingClientRect();
          const inView = rect.top <= vh * 0.45 && rect.bottom > vh * 0.2;
          link.classList.toggle('active', inView);
        }
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
      const isMobile = window.innerWidth < 760;
      const initialTarget = targetAt(0, isMobile);
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
        const mobile = window.innerWidth < 760;
        const target = targetAt(p, mobile);

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
        const hover = Math.sin(t * 2.1) * 0.045 + Math.sin(t * 3.7) * 0.015;

        // Flight group transformation
        flight.position.set(
          cur.x * halfW + Math.sin(t * 1.3) * 0.04 + mouse.sx * 0.12,
          cur.y * halfH + hover * halfH * 0.5 + mouse.sy * 0.08,
          Math.sin(t * 0.9) * 0.15
        );
        flight.scale.setScalar(halfH * 2 * 0.30 * cur.s);
        flight.rotation.set(
          0,
          -((cur.yaw + curScienceTurn + mouse.sx * 12) * Math.PI) / 180,
          0
        );

        // Banking into turns & pitch when diving, plus dynamic science section turn
        const pitch =
          cur.pitch +
          curSciencePitch -
          clamp(vy * 22, -28, 28) +
          Math.sin(t * 2.1 + 1) * 3 +
          mouse.sy * 6;
        const roll =
          cur.roll +
          Math.sin(curScienceTurn * (Math.PI / 180)) * 5 +
          clamp(vx * 18, -30, 30) +
          Math.sin(t * 1.7) * 4;

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
        <a className="logo" href="#top" aria-label="Home">
          <svg viewBox="0 0 40 40" fill="currentColor">
            <path d="M20 0c1.2 11.5 8.5 18.8 20 20-11.5 1.2-18.8 8.5-20 20-1.2-11.5-8.5-18.8-20-20C11.5 18.8 18.8 11.5 20 0z" />
          </svg>
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

          <img
            className="flower flower--cosmos"
            data-speed="-0.25"
            data-rot="8"
            src="/assets/skincare/cream-swirl.png"
            alt="Silky whipped moisturizing cream swirl with dewy hydration"
          />

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
          <img
            className="flower flower--hang"
            data-speed="0.35"
            data-rot="-6"
            src="/assets/skincare/moisture-drops.png"
            alt="Crystalline hydrating essence droplets cascading with moisture"
          />
          <div className="text">
            <div className="num reveal">01</div>
            <h2 className="section-heading reveal d1">
              Tell us about your skin
            </h2>
            <p className="section-explanation reveal d2">
              Share your skin type, concerns and preferences.
            </p>
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
          </div>
        </section>

        {/* SECTION 02 - STEP 2 */}
        <section className="s2" id="access" data-theme="dark">
          <div className="text" id="about">
            <div className="num reveal">02</div>
            <h2 className="section-heading reveal d1">
              Discover your recommendations
            </h2>
            <p className="section-explanation reveal d2">
              Explore suitable products and skincare ingredients.
            </p>
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
          </div>
          <img
            className="flower flower--iris"
            data-speed="-0.3"
            data-rot="10"
            src="/assets/skincare/peptide-swatch.png"
            alt="Luminous translucent rose peptide gel-cream swatch"
          />
        </section>

        {/* SECTION 03 - STEP 3 */}
        <section className="s3" id="steps" data-theme="light">
          <img
            className="flower flower--passion"
            data-speed="-0.2"
            data-rot="-10"
            src="/assets/skincare/hydration-spheres.png"
            alt="Sculptural hydrating water spheres and hyaluronic acid gel cluster"
          />
          <div className="text">
            <div className="num reveal">03</div>
            <h2 className="section-heading reveal d1">
              Get your daily routine
            </h2>
            <p className="section-explanation reveal d2">
              Follow your personalised AM and PM skincare plan.
            </p>
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
          </div>
        </section>

        {/* SKINCARE SCIENCE & CREDIBILITY */}
        <section className="science-section" id="science" data-theme="light">
          <div className="science-container">
            <header className="science-header">
              <span className="science-eyebrow">Dermatological Methodology</span>
              <h2 className="science-title">The Science Behind Every Ritual</h2>
              <p className="science-subtitle">
                Skin recommendations should be guided by cellular biology and clinical pharmacology, never guesswork. Our matching engine analyzes barrier physiology, molecule compatibility, and verified clinical literature.
              </p>
            </header>

            <div className="science-grid">
              {/* 01: Skin Type Identification */}
              <div className="science-card">
                <div className="science-card__top">
                  <div className="science-card__icon-wrap" aria-hidden="true">
                    <Fingerprint className="science-card__icon" />
                  </div>
                  <span className="science-card__num">01</span>
                </div>
                <h3 className="science-card__title">Skin Type Identification</h3>
                <p className="science-card__desc">
                  Every skin barrier is unique. We evaluate sebum secretion rates, moisture retention, and sensitivity thresholds to determine your true baseline profile.
                </p>
                <div className="science-card__footer">
                  <span className="science-card__pill">Hydration & Sebum Balance</span>
                </div>
              </div>

              {/* 02: Concern-Driven Advice */}
              <div className="science-card">
                <div className="science-card__top">
                  <div className="science-card__icon-wrap" aria-hidden="true">
                    <Sparkles className="science-card__icon" />
                  </div>
                  <span className="science-card__num">02</span>
                </div>
                <h3 className="science-card__title">Concern-Driven Advice</h3>
                <p className="science-card__desc">
                  Target persistent concerns with evidence-guided actives. Whether addressing breakouts, tone, or texture, recommendations follow verified cellular pathways.
                </p>
                <div className="science-card__footer">
                  <span className="science-card__pill">Targeted Cellular Pathways</span>
                </div>
              </div>

              {/* 03: Ingredient Selection */}
              <div className="science-card">
                <div className="science-card__top">
                  <div className="science-card__icon-wrap" aria-hidden="true">
                    <FlaskConical className="science-card__icon" />
                  </div>
                  <span className="science-card__num">03</span>
                </div>
                <h3 className="science-card__title">Ingredient Selection</h3>
                <p className="science-card__desc">
                  Formulations are vetted against randomized clinical trials. We select ingredients with clinically proven therapeutic concentration windows and high barrier tolerance.
                </p>
                <div className="science-card__footer">
                  <span className="science-card__pill">Peer-Reviewed Efficacy</span>
                </div>
              </div>

              {/* 04: Ingredient Compatibility */}
              <div className="science-card">
                <div className="science-card__top">
                  <div className="science-card__icon-wrap" aria-hidden="true">
                    <Layers className="science-card__icon" />
                  </div>
                  <span className="science-card__num">04</span>
                </div>
                <h3 className="science-card__title">Ingredient Compatibility</h3>
                <p className="science-card__desc">
                  Active compatibility is essential. Our logic evaluates formulation pH and chemical synergy to protect your acid mantle from destabilization and irritation.
                </p>
                <div className="science-card__footer">
                  <span className="science-card__pill">pH & Chemical Synergy</span>
                </div>
              </div>

              {/* 05: Personalised Recommendations */}
              <div className="science-card">
                <div className="science-card__top">
                  <div className="science-card__icon-wrap" aria-hidden="true">
                    <Heart className="science-card__icon" />
                  </div>
                  <span className="science-card__num">05</span>
                </div>
                <h3 className="science-card__title">Personalised Recommendations</h3>
                <p className="science-card__desc">
                  Build custom AM and PM rituals tailored to your skin and lifestyle. Receive optimal product application sequences and personalized usage cadences.
                </p>
                <div className="science-card__footer">
                  <span className="science-card__pill">Tailored AM / PM Cadence</span>
                </div>
              </div>

              {/* 06: Product Safety */}
              <div className="science-card" id="ingredient-safety">
                <div className="science-card__top">
                  <div className="science-card__icon-wrap" aria-hidden="true">
                    <ShieldCheck className="science-card__icon" />
                  </div>
                  <span className="science-card__num">06</span>
                </div>
                <h3 className="science-card__title">Product Safety</h3>
                <p className="science-card__desc">
                  Calibrated to dermatological safety boundaries. Conflicting actives are separated across alternating evenings with dedicated barrier recovery nights built in.
                </p>
                <div className="science-card__footer">
                  <span className="science-card__pill">Barrier-First Protection</span>
                </div>
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
                <div className="brand">
                  <strong>Skincare Ritual</strong>
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
                    >
                      GitHub
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

      {/* Floating Badge */}
      <div className="badge">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="6" cy="6" r="4.2" />
          <circle cx="14" cy="6" r="4.2" opacity="0.75" />
          <circle cx="6" cy="14" r="4.2" opacity="0.75" />
          <circle cx="14" cy="14" r="4.2" />
        </svg>
        <span>
          Made for <b>Skincare Routine</b>
        </span>
      </div>
    </div>
  );
};
