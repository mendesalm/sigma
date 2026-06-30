import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { AuthProvider } from '@/modules/access_control/context/AuthContext';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { CustomThemeProvider } from '@/shared/contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </AuthProvider>
    </CustomThemeProvider>
  </StrictMode>,
)
