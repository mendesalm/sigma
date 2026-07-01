import React, { useEffect, useRef } from 'react';
import { Box, Button, Typography, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { People, Security, AccountBalance, Extension, AutoAwesome } from '@mui/icons-material';
import sigmaLogo from '@/assets/images/logos/Sigma_Logo_PrataAzul_G.png';
import Footer from '@/shared/layouts/Footer';

// Premium Glassmorphism style for cards
const glassStyle = {
  backgroundColor: 'rgba(19, 27, 41, 0.6)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  borderRadius: 4,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px 0 rgba(0, 176, 255, 0.2)',
    borderColor: 'rgba(0, 176, 255, 0.3)',
  }
};

const SectionContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      minHeight: '100vh',
      width: '100%',
      scrollSnapAlign: 'start',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      px: { xs: 2, md: 8 },
      pt: { xs: '80px', md: '100px' },
      pb: 4
    }}
  >
    {children}
  </Box>
);

const LandingPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const can = canvasRef.current;
    if (!can) return;
    const ctx = can.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const setSize = () => {
      can.width = window.innerWidth;
      can.height = window.innerHeight;
      can.style.background = "black";
    };
    setSize();
    window.addEventListener('resize', setSize);

    let p: any[] = [];

    let particles: any[] = [];

    function initParticles() {
      if (!can) return;
      particles = [];
      const numParticles = Math.min(120, Math.floor(window.innerWidth / 12));
      for (let i = 0; i < numParticles; i++) {
        let rand = Math.random();
        let isGold = false;
        let isPurple = false;
        if (rand > 0.95) {
          isGold = true;
        } else if (rand > 0.90) {
          isPurple = true; // 5% chance to be purple
        }

        particles.push({
          x: Math.random() * can.width,
          y: Math.random() * can.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 1.5 + 0.5,
          isGold,
          isPurple
        });
      }
    }

    function drawNetwork() {
      if (!ctx || !can) return;
      animationFrameId = requestAnimationFrame(drawNetwork);

      // Clear canvas entirely for sharp network lines
      ctx.clearRect(0, 0, can.width, can.height);

      // To prevent the center from shifting visually during scroll snap, we use a static, screen-relative offset.
      // Elevated 95px above the vertical center as requested.
      let focalPoint = { x: can.width / 2, y: (can.height / 2) - 95 };

      const maxDistance = 150;

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Soft Bounce
        if (p.x < 0 || p.x > can.width) p.vx *= -1;
        if (p.y < 0 || p.y > can.height) p.vy *= -1;

        // Draw Particle Node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.isGold) {
          ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
        } else if (p.isPurple) {
          ctx.fillStyle = "rgba(180, 50, 255, 0.8)"; // Neon purple
        } else {
          ctx.fillStyle = "rgba(0, 176, 255, 0.6)";
        }
        ctx.fill();

        // Connect to other particles
        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let dx = p.x - p2.x;
          let dy = p.y - p2.y;
          let dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            let opacity = 1 - (dist / maxDistance);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);

            let isConnectionGold = p.isGold || p2.isGold;
            let isConnectionPurple = p.isPurple || p2.isPurple;

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
        let logoPullDistance = 350; // Reach further to grab nodes

        if (distF < logoPullDistance) {
          let opacityF = 1 - (distF / logoPullDistance);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(focalPoint.x, focalPoint.y);

          // Connection color to logo depends on particle type
          if (p.isGold) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${opacityF * 0.5})`;
            ctx.lineWidth = 1.5;
          } else if (p.isPurple) {
            ctx.strokeStyle = `rgba(180, 50, 255, ${opacityF * 0.5})`;
            ctx.lineWidth = 1.5;
          } else {
            ctx.strokeStyle = `rgba(0, 85, 213, ${opacityF * 0.4})`;
            ctx.lineWidth = 1.2;
          }
          ctx.stroke();

          // Slight gravitational pull towards the logo to create density
          p.vx -= (dxF / distF) * 0.001;
          p.vy -= (dyF / distF) * 0.001;
        }
      }
    }

    initParticles();
    drawNetwork();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        m: 0,
        p: 0,
        bgcolor: '#0b111b'
      }}
      onScroll={(e) => {
        const target = e.target as HTMLElement;
        window.dispatchEvent(new CustomEvent('landing-scroll', { detail: target.scrollTop }));

        // Dynamically adjust canvas opacity based on scroll (dim down to 15% after Section 1)
        if (canvasRef.current) {
          const threshold = window.innerHeight * 0.5;
          canvasRef.current.style.opacity = target.scrollTop > threshold ? '0.15' : '1';
        }
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.5s ease-in-out'
        }}
      />

      <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* SECTION 1: HERO */}
      <SectionContainer>
        <Box sx={{ textAlign: 'center', width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            id="hero-logo"
            src={sigmaLogo}
            alt="Sigma Logo"
            style={{
              maxWidth: '500px',
              width: '100%',
              maxHeight: '35vh',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 30px rgba(0,176,255,0.4))',
              marginTop: '40px'
            }}
          />
          <Box sx={{ mt: 3, mb: 5 }}>
            <Typography
              variant="h1"
              sx={{
                fontFamily: "'Audiowide', cursive",
                fontSize: { xs: '28px', sm: '38px', md: '50px' },
                background: 'linear-gradient(to right, #B4B4B4, #9F9F9F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgba(180, 180, 180, 0.3))',
                lineHeight: 1.2
              }}
            >
              Sistema Integrado de<br />Gerenciamento Maçônico
            </Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ ...glassStyle, mx: 'auto', p: { xs: 3, sm: 4, md: 5 }, width: '100%' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.15rem' }, fontFamily: "'Inter', sans-serif", lineHeight: 1.8 }}>
                O Sigma não é apenas um software, é a evolução digital da gestão maçônica.
                Projetado como um ecossistema multi-tenant de ponta, ele isola e protege os dados
                de cada Loja e Potência através de um sofisticado controle de acesso baseado em atributos (ABAC).
                Com interfaces fluidas e módulos integrados, reduzimos a burocracia para que o foco retorne ao
                verdadeiro trabalho em Loja.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </SectionContainer>

      {/* SECTION 2: MODULES */}
      <SectionContainer>
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Audiowide', cursive",
            mb: { xs: 4, md: 8 },
            fontSize: { xs: '1.8rem', md: '3rem' },
            color: '#fff',
            textShadow: '0 0 10px rgba(0, 176, 255, 0.5)',
            textAlign: 'center'
          }}
        >
          Um sistema moderno e modular
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 1, sm: 2 } }}>
          <Grid
            container
            spacing={{ xs: 3, md: 4 }}
            alignItems="stretch"
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            {/* Secretaria */}
            <Grid item xs={12} sm={6} md={3} sx={{ minWidth: { md: '25%' } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: '#00B0FF', mb: 2 }}>
                  <People sx={{ fontSize: 50 }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Secretaria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão centralizada de membros, prontuários, emissão de certificados, atas e toda a documentação da Loja.
                </Typography>
              </Paper>
            </Grid>

            {/* Chancelaria */}
            <Grid item xs={12} sm={6} md={3} sx={{ minWidth: { md: '25%' } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: '#00B0FF', mb: 2 }}>
                  <Security sx={{ fontSize: 50 }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Chancelaria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Controle rigoroso de presenças, histórico maçônico, gestão de graus e interações entre irmãos.
                </Typography>
              </Paper>
            </Grid>

            {/* Tesouraria */}
            <Grid item xs={12} sm={6} md={3} sx={{ minWidth: { md: '25%' } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: '#00B0FF', mb: 2 }}>
                  <AccountBalance sx={{ fontSize: 50 }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Tesouraria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Módulo financeiro robusto. Controle de mensalidades, balancetes, despesas e relatórios de fluxo de caixa.
                </Typography>
              </Paper>
            </Grid>

            {/* Opcionais */}
            <Grid item xs={12} sm={6} md={3} sx={{ minWidth: { md: '25%' } }}>
              <Paper sx={{
                ...glassStyle,
                border: '1px solid rgba(0, 176, 255, 0.3)',
                background: 'linear-gradient(135deg, rgba(19, 27, 41, 0.8) 0%, rgba(0, 85, 213, 0.2) 100%)',
              }}>
                <Box sx={{ color: '#00B0FF', mb: 2 }}>
                  <AutoAwesome sx={{ fontSize: 50 }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Opcionais
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif", mb: 1 }}>
                  • <strong>Harmonia:</strong> Gestão de acervo.<br />
                  • <strong>Arquitetura:</strong> Patrimônio.<br />
                  • <strong>Biblioteca:</strong> Empréstimos.<br />
                  • <strong>Banquete:</strong> Ágapes.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </SectionContainer>

      {/* SECTION 3: SYSTEM PREVIEW */}
      <SectionContainer>
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Audiowide', cursive",
            mb: 4,
            color: '#fff',
            textShadow: '0 0 10px rgba(0, 176, 255, 0.5)'
          }}
        >
          CONHEÇA O SISTEMA
        </Typography>
        <Box
          sx={{
            width: '100%',
            maxWidth: '1200px',
            height: '500px',
            border: '2px dashed rgba(0, 176, 255, 0.3)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.2)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '1.2rem', textAlign: 'center', px: 2 }}>
            [ Placeholder: Screenshots e Vídeos dos Dashboards (Lojas e Potências) serão inseridos aqui futuramente ]
          </Typography>
        </Box>
      </SectionContainer>

      {/* SECTION 4: FOOTER */}
      <Box sx={{ width: '100%', scrollSnapAlign: 'end', position: 'relative', zIndex: 1 }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default LandingPage;
