import React, { useEffect, useRef } from 'react';
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
  { x: -0.03, y: -0.12, s: 1.00, yaw: 150, pitch: 6,  roll: -4 },
  { x: -0.30, y: -0.04, s: 1.00, yaw: 125, pitch: 10, roll:  6 },
  { x:  0.22, y: -0.30, s: 1.00, yaw:  40, pitch: -6, roll: -8 },
  { x: -0.22, y:  0.02, s: 0.96, yaw: 160, pitch: 8,  roll:  4 },
  { x:  0.02, y: -0.08, s: 0.92, yaw: 105, pitch: 4,  roll:  0 },
];

const K_MOBILE: Keyframe[] = [
  { x: 0.05, y: -0.02, s: 0.75, yaw: 150, pitch:  6, roll: -4 },
  { x: 0.10, y:  0.12, s: 0.80, yaw: 125, pitch: 10, roll:  6 },
  { x: 0.15, y: -0.20, s: 0.75, yaw:  40, pitch: -6, roll: -8 },
  { x: 0.25, y:  0.20, s: 0.72, yaw: 160, pitch:  8, roll:  4 },
  { x: 0.00, y:  0.10, s: 0.70, yaw: 105, pitch:  4, roll:  0 },
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

      // Studio Skincare Lights
      const hemiLight = new THREE.HemisphereLight(0xfff1f4, 0xb96f87, 1.35);
      scene.add(hemiLight);

      const dirLight1 = new THREE.DirectionalLight(0xfff5ee, 2.7);
      dirLight1.position.set(3, 5, 6);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xe8b8cb, 2.2);
      dirLight2.position.set(-5, 2, -4);
      scene.add(dirLight2);

      const pointLight = new THREE.PointLight(0xffffff, 1.2, 10);
      pointLight.position.set(0, 0, 3.5);
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
          renderer.forceContextLoss();
        }
      };
    } catch (err) {
      console.warn('WebGL initialization fallback:', err);
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
      <canvas id="bee" ref={canvasRef} aria-hidden="true" />

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
            src="/assets/skincare/damask-rose.png"
            alt="Hydrating Damask Rose botanical extract"
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
            src="/assets/skincare/cica-sprig.png"
            alt="Centella Asiatica (Cica) soothing botanical leaves"
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
            src="/assets/skincare/rose-petal.png"
            alt="Translucent dewy Damask rose petal"
          />
        </section>

        {/* SECTION 03 */}
        <section className="s3" data-theme="light">
          <img
            className="flower flower--passion"
            data-speed="-0.2"
            data-rot="-10"
            src="/assets/skincare/aloe-chamomile.png"
            alt="Hydrating Aloe Vera and calming Chamomile botanical"
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
