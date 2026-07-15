import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  useTheme,
  Container,
  alpha,
  IconButton
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useCustomTheme } from "@/shared/contexts/ThemeContext";
import { SigmaAnimatedLogo } from '@/shared/components/SigmaAnimatedLogo';

const Header: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleColorMode } = useCustomTheme();
  const isLoginPage = location.pathname === "/login";
  
  // State to track scroll position for styling
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    let customScrollY = 0;

    const updateScroll = () => {
      // Determine if we should show the background and logo.
      // Use customScrollY if on home page, otherwise window.scrollY
      const currentScroll = location.pathname === '/' ? customScrollY : window.scrollY;
      setScrolled(currentScroll > 100);
    };

    const handleScroll = () => {
      updateScroll();
    };

    const handleCustomScroll = (e: Event) => {
      if ('detail' in e) {
        customScrollY = (e as CustomEvent).detail;
        updateScroll();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('landing-scroll', handleCustomScroll, { passive: true });
    
    // Initial check
    updateScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('landing-scroll', handleCustomScroll);
    };
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    const container = document.getElementById('landing-container');
    const el = document.getElementById(id);
    if (container && el) {
      container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  // Determine if logo should be hidden (only on home page when NOT scrolled)
  const hideLogo = isHomePage && !scrolled;

  return (
    <AppBar
      position="fixed"
      elevation={scrolled ? 4 : 0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: scrolled 
          ? alpha(theme.palette.background.default, 0.85) 
          : 'transparent',
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
        transition: 'all 0.3s ease-in-out',
        backgroundImage: 'none',
        width: '100%',
      }}
    >
      <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, md: 4 } }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 80 }, transition: 'min-height 0.3s', position: 'relative' }}>
          
          {/* Logo Section */}
          <Box 
            sx={{ 
              position: 'absolute',
              left: 0,
              display: "flex", 
              alignItems: "center", 
              opacity: hideLogo ? 0 : 1,
              pointerEvents: hideLogo ? 'none' : 'auto',
              transition: 'opacity 0.4s ease-in-out',
              zIndex: 2
            }}
          >
            <RouterLink
              to="/"
              viewTransition
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: '12px',
              }}
            >
              <Box
                sx={{
                  height: { xs: 32, md: 45 },
                  width: { xs: 32, md: 45 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: "drop-shadow(0px 0px 8px rgba(0, 176, 255, 0.3))",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    filter: "drop-shadow(0px 0px 12px rgba(0, 176, 255, 0.5))",
                  }
                }}
              >
                <SigmaAnimatedLogo theme="cyber" width="100%" height="100%" showText={false} animated={false} />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontFamily: "'Tektur', sans-serif",
                    textTransform: "uppercase",
                    fontWeight: 700, 
                    lineHeight: 1,
                    background: `linear-gradient(45deg, #B4B4B4, #9F9F9F)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    letterSpacing: '-0.02em',
                    textShadow: '0 0 5px rgba(180, 180, 180, 0.2)'
                  }}
                >
                  SiGMa
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha(theme.palette.text.primary, 0.7),
                    letterSpacing: '0.05em',
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}
                >
                  Sistema Integrado de Gerenciamento Maçônico
                </Typography>
              </Box>
            </RouterLink>
          </Box>

          {/* Middle Space & Hero Nav */}
          <Box sx={{ flexGrow: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{
                display: isHomePage ? 'flex' : 'none',
                gap: { xs: 1, md: 3 },
                position: 'absolute',
                left: hideLogo ? 0 : '100%',
                transform: hideLogo ? 'translateX(0)' : 'translateX(calc(-100% - 24px))',
                transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 3,
                pointerEvents: 'auto'
              }}
            >
              <Button variant="text" onClick={() => scrollToSection('hero-section')} sx={{ color: scrolled ? 'text.primary' : 'rgba(255,255,255,0.7)', '&:hover': { color: scrolled ? 'primary.main' : '#fff' }, fontFamily: "'Tektur', sans-serif", fontWeight: 400, textTransform: 'uppercase' }}>Home</Button>
              <Button variant="text" onClick={() => scrollToSection('modules-section')} sx={{ color: scrolled ? 'text.primary' : 'rgba(255,255,255,0.7)', '&:hover': { color: scrolled ? 'primary.main' : '#fff' }, fontFamily: "'Tektur', sans-serif", fontWeight: 400, textTransform: 'uppercase' }}>Funcionalidades</Button>
              <Button variant="text" onClick={() => scrollToSection('planos-section')} sx={{ color: scrolled ? 'text.primary' : 'rgba(255,255,255,0.7)', '&:hover': { color: scrolled ? 'primary.main' : '#fff' }, fontFamily: "'Tektur', sans-serif", fontWeight: 400, textTransform: 'uppercase' }}>Planos</Button>
            </Box>
          </Box>

          {/* Navigation Section */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Button 
              component={RouterLink} 
              to={isLoginPage ? "/" : "/login"} 
              viewTransition
              variant={isLoginPage ? "outlined" : "contained"} 
              color="primary"
              sx={{
                borderRadius: '4px',
                px: 3,
                py: 1,
                border: '1px solid rgba(56, 189, 248, 0.4)',
                background: 'linear-gradient(135deg, rgba(8, 47, 73, 0.4) 0%, rgba(3, 105, 161, 0.1) 100%)',
                color: '#e0f2fe',
                backdropFilter: 'blur(8px)',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: '-100%', width: '50%', height: '100%',
                  background: 'linear-gradient(to right, transparent, rgba(56, 189, 248, 0.4), transparent)',
                  transform: 'skewX(-20deg)',
                  transition: 'none',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(8, 47, 73, 0.6) 0%, rgba(3, 105, 161, 0.3) 100%)',
                  borderColor: '#38bdf8',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.5), inset 0 0 8px rgba(56, 189, 248, 0.3)',
                  transform: 'translateY(-2px)',
                  color: '#ffffff',
                  '&::after': {
                    left: '200%',
                    transition: 'left 0.7s ease-in-out'
                  }
                },
                transition: 'all 0.3s ease',
                fontFamily: "'Tektur', sans-serif",
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textShadow: '0 0 8px rgba(56, 189, 248, 0.5)'
              }}
            >
              {isLoginPage ? "Voltar ao Início" : "Acessar Sistema"}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
