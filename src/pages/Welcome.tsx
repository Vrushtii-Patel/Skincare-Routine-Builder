import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  // 1. Hero: Repositioned to the right and lowered so headline is 100% legible and completely un-obscured
  { x: 0.28, y: -0.68, s: 0.74, yaw: 140, pitch: 6,  roll: -4 },
  // 2. Section 01 (Needs): Left-centre behind/alongside cica leaves, clear of right-hand text
  { x: -0.42, y: -0.06, s: 0.90, yaw: 125, pitch: 8,  roll:  5 },
  // 3. Section 02 (Ritual): Dramatic visual towards the right on dark background, text on left
  { x: 0.38, y: -0.16, s: 1.00, yaw: 40,  pitch: -4, roll: -6 },
  // 4. Section 03 (Step Count): Towards left with aloe & chamomile, clear text area on right
  { x: -0.40, y: -0.10, s: 0.90, yaw: 150, pitch: 6,  roll:  4 },
  // 5. Final CTA: Scaled down, positioned beside closing headline and CTA button
  { x: 0.44, y:  0.02, s: 0.40, yaw: 110, pitch: 4,  roll:  0 },
];

const K_MOBILE: Keyframe[] = [
  { x: 0.18, y: -0.46, s: 0.58, yaw: 140, pitch: 6,  roll: -4 },
  { x: -0.24, y: 0.10, s: 0.68, yaw: 125, pitch: 8,  roll:  5 },
  { x: 0.24, y: -0.12, s: 0.72, yaw: 40,  pitch: -4, roll: -6 },
  { x: -0.24, y: 0.10, s: 0.66, yaw: 150, pitch: 6,  roll:  4 },
  { x: 0.26, y:  0.18, s: 0.42, yaw: 110, pitch: 4,  roll:  0 },
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

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const isOnboarded = useStore((state) => state.profile.isOnboarded);
  const loadSampleData = useStore((state) => state.loadSampleData);

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

  const handleDemo = () => {
    loadSampleData();
    navigate('/today');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1' || params.get('demo') === 'true') {
      loadSampleData();
      navigate('/today');
      return;
    }

    // 1. Initial Loader Setup & Reveal
    const loaderTimer = setTimeout(() => {
      if (loaderRef.current) {
        loaderRef.current.classList.add('done');
      }
      document.body.classList.add('loaded');
    }, 450);

    // 2. Parallax and Section Reveal Observers
    const sections = mainRef.current?.querySelectorAll<HTMLElement>('section');
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

      // Nav Theme: check section crossing top 6% of viewport
      let activeTheme = 'light';
      sections?.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= vh * 0.06 && rect.bottom > vh * 0.06) {
          activeTheme = sec.getAttribute('data-theme') || 'light';
        }
      });
      document.body.classList.toggle('on-dark', activeTheme === 'dark');
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
        { threshold: 0.28 }
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
        const p = window.scrollY / vh;
        const mobile = window.innerWidth < 760;
        const target = targetAt(p, mobile);

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
        flight.rotation.set(0, -((cur.yaw + mouse.sx * 12) * Math.PI) / 180, 0);

        // Banking into turns & pitch when diving
        const pitch = cur.pitch - clamp(vy * 22, -28, 28) + Math.sin(t * 2.1 + 1) * 3 + mouse.sy * 6;
        const roll = cur.roll + clamp(vx * 18, -30, 30) + Math.sin(t * 1.7) * 4;

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
        document.body.classList.remove('loaded', 'on-dark');
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
        document.body.classList.remove('loaded', 'on-dark');
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
          <a href="#about">The Science</a>
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
          className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center"
          style={{ transform: 'translate(18vw, 15vh)' }}
        >
          <div className="w-[220px] md:w-[260px] filter drop-shadow-2xl">
            <svg viewBox="0 0 200 400" className="w-full h-auto" fill="none">
              {/* Dropper bulb */}
              <path d="M75 55 C75 25, 125 25, 125 55 L120 70 L80 70 Z" fill="#FFF5F7" stroke="#E8B8C2" strokeWidth="2" />
              {/* Collar */}
              <rect x="68" y="70" width="64" height="28" rx="4" fill="#E8B8C2" stroke="#D88FA6" strokeWidth="2" />
              <rect x="65" y="94" width="70" height="8" rx="2" fill="#D88FA6" />
              {/* Glass Bottle Body */}
              <rect x="40" y="102" width="120" height="240" rx="28" fill="#FFF8FA" fillOpacity="0.45" stroke="#E8B8C2" strokeWidth="3" />
              {/* Serum Liquid inside */}
              <rect x="46" y="160" width="108" height="174" rx="22" fill="#FA8EA8" fillOpacity="0.92" />
              {/* Glass Pipette */}
              <rect x="94" y="98" width="12" height="210" rx="3" fill="#FFFFFF" fillOpacity="0.75" />
              <rect x="96" y="170" width="8" height="130" rx="2" fill="#E8587D" fillOpacity="0.95" />
              {/* Luxury Label */}
              <rect x="44" y="175" width="112" height="110" rx="6" fill="#FFF8F9" stroke="#E8B8C2" strokeWidth="1.5" />
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
            <p>Master your personal daily glow with evidence-backed routines crafted for your skin.</p>
            <button onClick={handleStart} className="join" aria-label="Build My Routine">
              <i>
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 1l4 4-4 4" />
                </svg>
              </i>
              Build My Routine
              <span className="sr-only">Start My Skin Journey</span>
            </button>
            <div>
              <button
                onClick={handleDemo}
                className="melli-sample-btn"
                title="Load sample skincare routine"
              >
                Explore with Sample Shelf
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 01 */}
        <section className="s1" id="about" data-theme="light">
          <img
            className="flower flower--hang"
            data-speed="0.35"
            data-rot="-6"
            src="/assets/skincare/moisture-drops.png"
            alt="Crystalline hydrating essence droplets cascading with moisture"
          />
          <div className="num reveal">01</div>
          <div className="text">
            <h2 className="title reveal d1">
              Understand Your
              <br />
              Skin's True
              <br />
              Needs
            </h2>
            <p className="copy reveal d2">
              Every formula is crafted with dermatologist-approved active pairings to target your concerns without irritation. Whether you're balancing breakouts or restoring your moisture barrier, your ritual adapts to you.
            </p>
          </div>
        </section>

        {/* SECTION 02 (Dark / Dusty Rose) */}
        <section className="s2" id="access" data-theme="dark">
          <div className="text">
            <div className="num reveal">02</div>
            <h2 className="title reveal d1">
              Build Your Daily
              <br />
              Ritual
            </h2>
            <p className="copy reveal d2">
              Get personalized day and night routines designed around your skin barrier. Unlock seamless ingredient compatibility checks, frequency schedules, and habit tracking.
            </p>
          </div>
          <img
            className="flower flower--iris"
            data-speed="-0.3"
            data-rot="10"
            src="/assets/skincare/peptide-swatch.png"
            alt="Luminous translucent rose peptide gel-cream swatch"
          />
        </section>

        {/* SECTION 03 */}
        <section className="s3" data-theme="light">
          <img
            className="flower flower--passion"
            data-speed="-0.2"
            data-rot="-10"
            src="/assets/skincare/hydration-spheres.png"
            alt="Sculptural hydrating water spheres and hyaluronic acid gel cluster"
          />
          <div className="text">
            <div className="num reveal">03</div>
            <h2 className="title reveal d1">
              Make Every
              <br />
              Step Count!
            </h2>
            <p className="copy reveal d2">
              Become part of a mindful community of skincare lovers. Track real progress, get notes from dermatology references, and see your natural glow flourish in vivid harmony.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <section className="foot" id="contact" data-theme="light">
          <div className="cta">
            <h2 className="title reveal">Ready to make skincare yours?</h2>
            <button onClick={handleStart} className="join reveal d1" aria-label="Build My Routine">
              <i>
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 1l4 4-4 4" />
                </svg>
              </i>
              Build My Routine
            </button>
          </div>

          <div className="brand reveal">
            <strong>Skincare Ritual</strong>
            <span>A mindful routine companion</span>
          </div>

          <div className="cols reveal d1">
            <div>
              <Link to="/routine">Routine Planner</Link>
              <Link to="/shelf">Product Shelf</Link>
              <Link to="/compatibility">Compatibility</Link>
            </div>
            <div>
              <Link to="/today">Today's Log</Link>
              <Link to="/week">Weekly View</Link>
              <Link to="/settings">Settings</Link>
            </div>
          </div>
        </section>
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
