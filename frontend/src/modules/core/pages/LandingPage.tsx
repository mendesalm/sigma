import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Grid, Paper, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { People, Security, AccountBalance, Extension, AutoAwesome, Restaurant, MenuBook, MusicNote, Storefront, Campaign, ArrowForwardIos, ArrowBackIosNew } from '@mui/icons-material';
import sigmaLogo from '@/assets/images/logos/Sigma_Logo_PrataAzul_G.png';
import SecretariaIcon from '@/assets/icons/Secretaria.png';
import ChancelariaIcon from '@/assets/icons/Chancelaria.png';
import TesourariaIcon from '@/assets/icons/Tesouraria.png';
import seloIcon from '@/assets/icons/selo.png';
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

const SectionContainer: React.FC<{ children: React.ReactNode, id?: string }> = ({ children, id }) => (
  <Box
    id={id}
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
  const [showSelo, setShowSelo] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollCarousel = (direction: 'left' | 'right') => {
    setLastInteraction(Date.now());
    if (carouselRef.current) {
      const isDesktop = window.innerWidth > 900;
      const scrollAmount = isDesktop ? carouselRef.current.clientWidth / 3 : carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Drag and Drop (Swipe) Carousel Logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-scroll loop
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDragging && carouselRef.current) {
        const isDesktop = window.innerWidth > 900;
        const scrollAmount = isDesktop ? carouselRef.current.clientWidth / 3 : carouselRef.current.clientWidth;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setLastInteraction(Date.now());
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastInteraction, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setLastInteraction(Date.now());
    if (!carouselRef.current) return;
    setIsDragging(true);
    carouselRef.current.style.scrollSnapType = 'none';
    carouselRef.current.style.scrollBehavior = 'auto';
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.scrollSnapType = 'x mandatory';
      carouselRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Velocidade do arraste
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollToSection = (id: string) => {
    const container = document.getElementById('landing-container');
    const el = document.getElementById(id);
    if (container && el) {
      container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

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
      id="landing-container"
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
        const currentScroll = target.scrollTop;
        const windowHeight = window.innerHeight;
        
        window.dispatchEvent(new CustomEvent('landing-scroll', { detail: currentScroll }));

        // Dynamically adjust canvas opacity based on scroll (dim down to 15% after Section 1)
        if (canvasRef.current) {
          canvasRef.current.style.opacity = currentScroll > windowHeight * 0.5 ? '0.15' : '1';
        }

        // Floating seal logic: Show only between Hero and Footer
        const isPastHero = currentScroll > windowHeight * 0.3;
        const isBeforeFooter = currentScroll < windowHeight * 3.2;
        const shouldShow = isPastHero && isBeforeFooter;
        
        if (showSelo !== shouldShow) {
          setShowSelo(shouldShow);
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
      <SectionContainer id="hero-section">
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
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#00B0FF', 
                mt: 3, 
                fontFamily: "'Inter', sans-serif", 
                fontWeight: 400,
                fontSize: { xs: '1.1rem', md: '1.3rem' }
              }}
            >
              Uma plataforma integrada, inteligente e descomplicada
            </Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ ...glassStyle, mx: 'auto', p: { xs: 3, sm: 4, md: 5 }, width: '100%', position: 'relative' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.15rem' }, fontFamily: "'Inter', sans-serif", lineHeight: 1.8, position: 'relative', zIndex: 1 }}>
                Desenhado para otimizar a gestão da sua Loja, o SIGMa garante eficiência administrativa, facilita a comunicação, aumenta o engajamento e fortalece a integração de toda a fraternidade.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </SectionContainer>

      {/* SECTION 2: MODULES */}
      <SectionContainer id="modules-section">
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
            <Grid item xs={12} md={4} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: '#00B0FF', mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Box component="img" src={SecretariaIcon} alt="Secretaria" sx={{ width: 50, height: 50, objectFit: 'contain' }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Secretaria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão completa de membros e familiares, planejamento e controle de sessões, além da gestão de documentos e cargos da Loja.
                </Typography>
              </Paper>
            </Grid>

            {/* Chancelaria */}
            <Grid item xs={12} md={4} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: '#00B0FF', mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Box component="img" src={ChancelariaIcon} alt="Chancelaria" sx={{ width: 50, height: 50, objectFit: 'contain' }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Chancelaria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão de presenças nas sessões, controle de visitantes e visitações, além da gestão de comissões e agenda social completa.
                </Typography>
              </Paper>
            </Grid>

            {/* Tesouraria */}
            <Grid item xs={12} md={4} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: '#00B0FF', mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Box component="img" src={TesourariaIcon} alt="Tesouraria" sx={{ width: 50, height: 50, objectFit: 'contain' }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Tesouraria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão contábil precisa das atividades da loja, controle de fluxo de caixa e emissão de balancetes.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Módulos Opcionais Carrossel */}
          <Box sx={{ mt: 6, position: 'relative' }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 3, fontFamily: "'Audiowide', cursive", textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, display: 'inline-block' }}>
              Módulos Opcionais
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <IconButton 
                onClick={() => scrollCarousel('left')} 
                sx={{ 
                  position: 'absolute',
                  left: { xs: 8, md: -24 },
                  zIndex: 10,
                  color: '#fff', 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
                }}
              >
                <ArrowBackIosNew />
              </IconButton>
              
              <Box 
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                sx={{ 
                  display: 'flex', 
                  gap: { xs: 3, md: 4 }, // Mesmos espaçamentos do grid superior
                  width: '100%',
                  overflowX: 'auto', 
                  scrollBehavior: 'smooth',
                  scrollSnapType: 'x mandatory',
                  py: 2,
                  px: 0,
                  // Hide scrollbar
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                {Array(15).fill([
                  { title: 'Arquitetura', desc: 'Gestão de patrimônio.', icon: <AccountBalance sx={{ fontSize: 40, pointerEvents: 'none' }}/> },
                  { title: 'Banquete', desc: 'Gestão dos ágapes.', icon: <Restaurant sx={{ fontSize: 40, pointerEvents: 'none' }}/> },
                  { title: 'Biblioteca', desc: 'Acervo de livros e artigos.', icon: <MenuBook sx={{ fontSize: 40, pointerEvents: 'none' }}/> },
                  { title: 'Harmonia', desc: 'Músicas para as sessões.', icon: <MusicNote sx={{ fontSize: 40, pointerEvents: 'none' }}/> },
                  { title: 'Classificados', desc: 'Anúncios multi-lojas.', icon: <Storefront sx={{ fontSize: 40, pointerEvents: 'none' }}/> },
                  { title: 'Comunicação', desc: 'Avisos e WhatsApp.', icon: <Campaign sx={{ fontSize: 40, pointerEvents: 'none' }}/> }
                ]).flat().map((modulo, idx) => (
                  <Paper 
                    key={idx} 
                    sx={{ 
                      ...glassStyle, 
                      flex: { xs: '0 0 100%', md: '0 0 calc((100% - 64px) / 3)' }, // 3 por vez no desktop (64px = 2 * gap de 32px)
                      scrollSnapAlign: 'start',
                      border: '1px solid rgba(0, 176, 255, 0.2)',
                      background: 'linear-gradient(135deg, rgba(19, 27, 41, 0.6) 0%, rgba(0, 85, 213, 0.1) 100%)'
                    }}
                  >
                    <Box sx={{ color: '#00B0FF', mb: 2 }}>
                      {modulo.icon}
                    </Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1, fontFamily: "'Inter', sans-serif" }}>
                      {modulo.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                      {modulo.desc}
                    </Typography>
                  </Paper>
                ))}
              </Box>
              
              <IconButton 
                onClick={() => scrollCarousel('right')} 
                sx={{ 
                  position: 'absolute',
                  right: { xs: 8, md: -24 },
                  zIndex: 10,
                  color: '#fff', 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
                }}
              >
                <ArrowForwardIos />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </SectionContainer>

      {/* SECTION 3: FUNCIONALIDADES EXTRAS */}
      <SectionContainer id="features-section">
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
          Diversas funcionalidades para a sua Loja
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 1, sm: 2 } }}>
          <Grid 
            container 
            spacing={{ xs: 3, md: 4 }} 
            alignItems="stretch" 
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            <Grid item xs={12} md={6} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 5 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Gestão de Arquivos
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
                  Centralize documentos e relatórios, que podem ser acessados rapidamente sempre que necessário por membros autorizados.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 5 }}>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Controle de Acesso
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
                  Garanta a confidencialidade e assegure-se de que as informações críticas serão acessadas apenas por quem possui o cargo adequado.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </SectionContainer>

      {/* SECTION 4: PLANOS */}
      <SectionContainer id="planos-section">
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Audiowide', cursive",
            mb: { xs: 4, md: 6 },
            fontSize: { xs: '1.8rem', md: '3rem' },
            color: '#fff',
            textShadow: '0 0 10px rgba(0, 176, 255, 0.5)',
            textAlign: 'center'
          }}
        >
          Planos e Assinaturas
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 1, sm: 2 } }}>
          <Grid 
            container 
            spacing={{ xs: 3, md: 4 }} 
            alignItems="stretch" 
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            
            {/* PLANO BÁSICO */}
            <Grid item xs={12} md={4} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 4, textAlign: 'center', border: '1px solid rgba(0, 176, 255, 0.3)' }}>
                <Typography variant="h5" sx={{ color: '#00B0FF', fontWeight: 'bold', mb: 3, fontFamily: "'Audiowide', cursive" }}>
                  BÁSICO
                </Typography>
                <Box sx={{ textAlign: 'left', mb: 4, minHeight: '180px' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Gestão de Membros Básica</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Calendário de Eventos</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Acesso a Documentos</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Suporte por E-mail</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 3 }}>
                  R$ 99<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/mês</Typography>
                </Typography>
                <Button variant="outlined" color="primary" fullWidth sx={{ borderRadius: '20px', py: 1 }} onClick={() => navigate('/login')}>
                  Começar Agora
                </Button>
              </Paper>
            </Grid>

            {/* PLANO INTERMEDIÁRIO */}
            <Grid item xs={12} md={4} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 4, textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Typography variant="h5" sx={{ color: '#E0E0E0', fontWeight: 'bold', mb: 3, fontFamily: "'Audiowide', cursive" }}>
                  INTERMEDIÁRIO
                </Typography>
                <Box sx={{ textAlign: 'left', mb: 4, minHeight: '180px' }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1.5 }}>• Todos os recursos do Básico</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Controle Financeiro</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Biblioteca de Rituais</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Fórum de Discussão</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Suporte Prioritário</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 3 }}>
                  R$ 199<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/mês</Typography>
                </Typography>
                <Button variant="outlined" sx={{ color: '#E0E0E0', borderColor: '#E0E0E0', borderRadius: '20px', py: 1, '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.05)' } }} fullWidth onClick={() => navigate('/login')}>
                  Assinar
                </Button>
              </Paper>
            </Grid>

            {/* PLANO AVANÇADO (DESTAQUE) */}
            <Grid item xs={12} md={4} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ 
                ...glassStyle, 
                p: 4, 
                textAlign: 'center', 
                border: '2px solid rgba(255, 215, 0, 0.5)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.15)',
                transform: { md: 'scale(1.05)' } 
              }}>
                <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 'bold', mb: 3, fontFamily: "'Audiowide', cursive" }}>
                  AVANÇADO
                </Typography>
                <Box sx={{ textAlign: 'left', mb: 4, minHeight: '180px' }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1.5 }}>• Todos os recursos do Intermediário</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Análise de Dados Avançada</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Relatórios Personalizados</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Módulos de Treinamento</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Integrações de API</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Gestão de Graus Superiores</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 'bold', mb: 3 }}>
                  R$ 299<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/mês</Typography>
                </Typography>
                <Button variant="contained" sx={{ bgcolor: '#FFD700', color: '#000', fontWeight: 'bold', borderRadius: '20px', py: 1, '&:hover': { bgcolor: '#F0C800' } }} fullWidth onClick={() => navigate('/login')}>
                  TORNAR-SE AVANÇADO
                </Button>
              </Paper>
            </Grid>
          </Grid>
          
          {/* BOTTOM CTA BANNER */}
          <Paper sx={{ 
            ...glassStyle, 
            mt: 6, 
            p: { xs: 3, md: 4 }, 
            textAlign: 'center',
            background: 'linear-gradient(90deg, rgba(0, 176, 255, 0.1) 0%, rgba(19, 27, 41, 0.8) 50%, rgba(0, 176, 255, 0.1) 100%)',
            border: '1px solid rgba(0, 176, 255, 0.3)'
          }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 3, fontFamily: "'Audiowide', cursive" }}>
              Prepare sua Loja para o Futuro. Comece agora.
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={() => navigate('/login')} sx={{ borderRadius: '30px', px: 5, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0, 176, 255, 0.4)' }}>
              INICIAR TESTE GRATUITO
            </Button>
          </Paper>
        </Box>
      </SectionContainer>

      {/* SECTION 5: FOOTER */}
      <Box sx={{ width: '100%', scrollSnapAlign: 'end', position: 'relative', zIndex: 1 }}>
        <Footer />
      </Box>

      {/* FLOATING SEAL (Visible only on inner sections) */}
      <Box
        component="img"
        src={seloIcon}
        alt="Selo Sigma"
        sx={{
          position: 'fixed',
          bottom: { xs: '20px', md: '40px' },
          right: { xs: '20px', md: '40px' },
          width: '110px',
          height: 'auto',
          transform: `scale(${showSelo ? 1 : 0.5})`,
          opacity: showSelo ? 1 : 0,
          pointerEvents: showSelo ? 'auto' : 'none',
          filter: 'drop-shadow(0 0 15px rgba(0, 176, 255, 0.4)) drop-shadow(0 5px 15px rgba(0,0,0,0.5))',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999,
        }}
      />
    </Box>
  );
};

export default LandingPage;
