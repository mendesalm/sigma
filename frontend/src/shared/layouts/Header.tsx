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
import logoSigma from "@/assets/images/logos/Sigma_Logo_PrataAzul_P.png";

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
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 80 }, transition: 'min-height 0.3s' }}>
          
          {/* Logo Section */}
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              flexGrow: 1,
              opacity: hideLogo ? 0 : 1,
              pointerEvents: hideLogo ? 'none' : 'auto',
              transition: 'opacity 0.4s ease-in-out',
            }}
          >
            <RouterLink
              to="/"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: '12px',
              }}
            >
              <Box
                component="img"
                src={logoSigma}
                alt="Sigma Logo"
                sx={{
                  height: { xs: 32, md: 45 },
                  width: 'auto',
                  filter: "drop-shadow(0px 0px 8px rgba(0, 176, 255, 0.3))",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    filter: "drop-shadow(0px 0px 12px rgba(0, 176, 255, 0.5))",
                  }
                }}
              />
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontFamily: "'Audiowide', cursive",
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

          {/* Navigation Section */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <Button 
              component={RouterLink} 
              to={isLoginPage ? "/" : "/login"}
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: '20px',
                px: 3,
                borderWidth: '1px',
                backdropFilter: 'blur(4px)',
                backgroundColor: alpha(theme.palette.background.paper, 0.1),
                borderColor: alpha(theme.palette.primary.main, 0.5),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                },
                transition: 'all 0.2s ease-in-out'
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
