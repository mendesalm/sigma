import React, { useRef, useEffect } from 'react';

const HeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const can = canvasRef.current;
    if (!can) return;
    const ctx = can.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const setSize = () => {
      if (!can.parentElement) return;
      can.width = can.parentElement.offsetWidth;
      can.height = can.parentElement.offsetHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    let particles: any[] = [];

    function initParticles() {
      if (!can) return;
      particles = [];
      const numParticles = Math.min(100, Math.floor(can.width / 15));
      for (let i = 0; i < numParticles; i++) {
        let rand = Math.random();
        let isGold = false;
        let isBlue = false;
        if (rand > 0.95) isGold = true;
        else if (rand > 0.75) isBlue = true;

        particles.push({
          x: Math.random() * can.width,
          y: Math.random() * can.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: isGold ? Math.random() * 2 + 1 : (isBlue ? Math.random() * 1.5 + 0.5 : Math.random() * 1 + 0.5),
          isGold,
          isBlue
        });
      }
    }
    initParticles();

    function draw() {
      if (!can || !ctx) return;
      ctx.clearRect(0, 0, can.width, can.height);
      ctx.fillStyle = "#0B0F19"; // Base dark background
      ctx.fillRect(0, 0, can.width, can.height);

      let focalPoint = { x: can.width / 2, y: (can.height / 2) - 120 };
      const logoElement = document.getElementById('hero-logo');
      if (logoElement) {
        const rect = logoElement.getBoundingClientRect();
        const canvasRect = can.getBoundingClientRect();
        focalPoint = {
          x: rect.left - canvasRect.left + rect.width / 2,
          y: (rect.top - canvasRect.top + rect.height / 2) + 25
        };
      }

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > can.width) p.vx *= -1;
        if (p.y < 0 || p.y > can.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.isGold) {
          ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
        } else if (p.isBlue) {
          ctx.fillStyle = "rgba(0, 176, 255, 0.6)";
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        }
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let dx = p.x - p2.x;
          let dy = p.y - p2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            let opacity = 1 - (dist / 150);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);

            let isConnectionGold = p.isGold || p2.isGold;
            let isConnectionPurple = p.isBlue || p2.isBlue; // Using isBlue flag for purple now

            if (isConnectionGold) {
              ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.3})`;
            } else if (isConnectionPurple) {
              ctx.strokeStyle = `rgba(180, 50, 255, ${opacity * 0.3})`;
            } else {
              ctx.strokeStyle = `rgba(100, 200, 255, ${opacity * 0.25})`;
            }
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect to focal point (Logo Center)
        let dxF = p.x - focalPoint.x;
        let dyF = p.y - focalPoint.y;
        let distF = Math.sqrt(dxF * dxF + dyF * dyF);
        let logoPullDistance = 350;

        if (distF < logoPullDistance) {
          let opacityF = 1 - (distF / logoPullDistance);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(focalPoint.x, focalPoint.y);

          if (p.isGold) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacityF * 0.5})`;
            ctx.lineWidth = 1.5;
          } else if (p.isBlue) { // isBlue acts as purple here
            ctx.strokeStyle = `rgba(180, 50, 255, ${opacityF * 0.5})`;
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = `rgba(0, 85, 213, ${opacityF * 0.4})`;
            ctx.lineWidth = 1.2;
          }
          ctx.stroke();

          // Gravitational pull
          p.vx -= (dxF / distF) * 0.001;
          p.vy -= (dyF / distF) * 0.001;
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    }

    // Performance: only animate if visible (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!animationFrameId) draw();
      } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    }, { threshold: 0 });

    observer.observe(can);

    return () => {
      window.removeEventListener('resize', setSize);
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default HeroBackground;
