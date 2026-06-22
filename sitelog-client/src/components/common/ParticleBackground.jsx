import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

const PARTICLE_DENSITY = 0.00012;
const BG_PARTICLE_DENSITY = 0.00004;
const MOUSE_RADIUS = 180;
const RETURN_SPEED = 0.08;
const DAMPING = 0.90;
const REPULSION_STRENGTH = 1.2;

const randomRange = (min, max) => Math.random() * (max - min) + min;

export default function ParticleBackground({ blur = false }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const bgParticlesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000, isActive: false });
  const frameIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const initParticles = useCallback((width, height) => {
    const count = Math.floor(width * height * PARTICLE_DENSITY);
    const particles = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x, y, originX: x, originY: y,
        vx: 0, vy: 0,
        size: randomRange(1, 2.5),
        isAccent: Math.random() > 0.9,
        angle: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    const bgCount = Math.floor(width * height * BG_PARTICLE_DENSITY);
    const bgParticles = [];
    for (let i = 0; i < bgCount; i++) {
      bgParticles.push({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        size: randomRange(0.5, 1.5),
        alpha: randomRange(0.1, 0.4),
        phase: Math.random() * Math.PI * 2,
      });
    }
    bgParticlesRef.current = bgParticles;
  }, []);

  const animate = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    lastTimeRef.current = time;

    const isDark = themeRef.current === 'dark';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background stars/dots
    const bgP = bgParticlesRef.current;
    // In light mode use dark blue dots so they stand out against the light blue background
    const bgDotColor = isDark ? '255,255,255' : '20,40,90';
    for (let i = 0; i < bgP.length; i++) {
      const p = bgP[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      const twinkle = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
      const baseAlpha = isDark ? p.alpha : p.alpha * 1.5; // Boost alpha in light mode
      ctx.globalAlpha = baseAlpha * (0.3 + 0.7 * twinkle);
      ctx.fillStyle = `rgba(${bgDotColor},1)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Main particles — physics
    const particles = particlesRef.current;
    const mouse = mouseRef.current;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (mouse.isActive && dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * REPULSION_STRENGTH;
        p.vx -= (dx / dist) * force * 5;
        p.vy -= (dy / dist) * force * 5;
      }

      p.vx += (p.originX - p.x) * RETURN_SPEED;
      p.vy += (p.originY - p.y) * RETURN_SPEED;
    }

    // Integration & draw
    const accentColor = isDark ? '#4285F4' : '#3273E6';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vx *= DAMPING; p.vy *= DAMPING;
      p.x += p.vx; p.y += p.vy;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

      if (p.isAccent) {
        ctx.fillStyle = accentColor;
      } else if (isDark) {
        const opacity = Math.min(0.3 + vel * 0.1, 1);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      } else {
        // Light mode: dark navy particles
        const opacity = Math.min(0.4 + vel * 0.15, 0.85); // Increased opacity
        ctx.fillStyle = `rgba(30,45,90,${opacity})`;
      }
      ctx.fill();
    }

    frameIdRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = width * dpr;
      canvasRef.current.height = height * dpr;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      initParticles(width, height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initParticles]);

  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [animate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, isActive: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.isActive = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Background color adapts to theme
  const bgColor = theme === 'dark' ? '#0D0F14' : '#EBF0FA';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${blur ? 'backdrop-blur-md' : ''}`}
      style={{ background: bgColor, transition: 'background 0.5s ease' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
