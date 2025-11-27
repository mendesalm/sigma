import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import logoSigma from "../../assets/images/SigmaLogo.png"; // Import the logo

const Header: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.background.default,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <RouterLink
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={logoSigma}
              alt="Sigma Logo"
              style={{
                height: "40px",
                marginRight: "10px",
                filter: "drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.7))",
              }}
            />
            <Typography variant="h6" noWrap component="div">
              Sistema de Gerenciamento de Lojas Maçônicas - SiGMa
            </Typography>
          </RouterLink>
        </Box>
        <Box>
          {isLoginPage ? (
            <Button color="inherit" component={RouterLink} to="/">
              Home
            </Button>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
