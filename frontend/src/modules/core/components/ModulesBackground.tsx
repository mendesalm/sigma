import React, { useRef, useEffect } from 'react';

const ModulesBackground: React.FC = () => {
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

    // Formas: Triângulos e Quadrados representando esquadros e geometria estrutural
    let shapes: any[] = [];

    function initShapes() {
      if (!can) return;
      shapes = [];
      const numShapes = Math.min(15, Math.floor(can.width / 100)); // Menos formas, maiores
      for (let i = 0; i < numShapes; i++) {
        shapes.push({
          x: Math.random() * can.width,
          y: Math.random() * can.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 60 + 40, // 40 a 100px
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          type: Math.random() > 0.5 ? 'triangle' : 'square',
          opacity: Math.random() * 0.15 + 0.05 // 5% a 20%
        });
      }
    }
    initShapes();

    function draw() {
      if (!can || !ctx) return;
      ctx.clearRect(0, 0, can.width, can.height);
      ctx.fillStyle = "#0B0F19"; // Base dark background
      ctx.fillRect(0, 0, can.width, can.height);

      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotationSpeed;

        if (s.x < -s.size) s.x = can.width + s.size;
        if (s.x > can.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = can.height + s.size;
        if (s.y > can.height + s.size) s.y = -s.size;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        
        ctx.strokeStyle = `rgba(0, 176, 255, ${s.opacity})`;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        if (s.type === 'square') {
          ctx.rect(-s.size / 2, -s.size / 2, s.size, s.size);
        } else {
          // Equilateral triangle
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(s.size / 2, s.size / 2);
          ctx.lineTo(-s.size / 2, s.size / 2);
          ctx.closePath();
        }
        ctx.stroke();

        ctx.restore();
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

export default ModulesBackground;
