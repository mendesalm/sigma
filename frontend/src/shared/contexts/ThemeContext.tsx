import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

type CustomThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const CustomThemeContext = createContext<CustomThemeContextType>({
  mode: 'dark',
  toggleColorMode: () => {},
});

export const useCustomTheme = () => useContext(CustomThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo<Theme>(() => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#D4AF37', // Gold
          light: '#F3C623',
          dark: '#B08D28',
          contrastText: '#000000',
        },
        secondary: {
          main: mode === 'dark' ? '#3b82f6' : '#1E88E5', // Blue for values
          light: '#60a5fa',
          dark: '#2563eb',
          contrastText: '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#090B10' : '#f8fafc',
          paper: mode === 'dark' ? '#151b26' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#ffffff' : '#1e293b',
          secondary: mode === 'dark' ? '#a0a0a0' : '#64748b',
        },
        divider: mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(30, 136, 229, 0.15)', // Gold/Blue divider
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600, color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        h2: { fontWeight: 600, color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        h3: { fontWeight: 600, color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        h4: { fontWeight: 600, color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        h5: { fontWeight: 600, color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        h6: { fontWeight: 600, color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        body1: { color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        body2: { color: mode === 'dark' ? '#a0a0a0' : '#64748b' },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#090B10' : '#ffffff',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(30, 136, 229, 0.15)'}`,
              color: mode === 'dark' ? '#ffffff' : '#1e293b',
              boxShadow: 'none',
              borderRadius: 0,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#090B10' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(30, 136, 229, 0.15)'}`,
              borderRadius: 0,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              textTransform: 'none',
              fontWeight: 600,
            },
            containedPrimary: {
              background: 'linear-gradient(135deg, #F3C623 0%, #D4AF37 100%)',
              color: '#000000',
              border: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #D4AF37 0%, #B08D28 100%)',
              },
            },
            containedSecondary: {
              background: mode === 'dark' ? '#151b26' : '#ffffff',
              color: mode === 'dark' ? '#ffffff' : '#1E88E5',
              border: `1px solid ${mode === 'dark' ? '#D4AF37' : '#1E88E5'}`,
              '&:hover': {
                background: mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(30, 136, 229, 0.1)',
              },
            },
            outlined: {
              borderColor: mode === 'dark' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(30, 136, 229, 0.4)',
              color: mode === 'dark' ? '#D4AF37' : '#1E88E5',
              '&:hover': {
                borderColor: mode === 'dark' ? '#D4AF37' : '#1E88E5',
                backgroundColor: mode === 'dark' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(30, 136, 229, 0.05)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#151b26' : '#ffffff',
              borderRadius: 12,
              border: `1px solid ${mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(30, 136, 229, 0.2)'}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#151b26' : '#ffffff',
              borderRadius: 12,
              border: `1px solid ${mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(30, 136, 229, 0.2)'}`,
              boxShadow: mode === 'dark' ? '0 4px 20px rgba(212, 175, 55, 0.05)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 600,
              color: mode === 'dark' ? '#D4AF37' : '#1E88E5',
              backgroundColor: mode === 'dark' ? '#151b26' : '#f8fafc',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(30, 136, 229, 0.15)'}`,
            },
            body: {
              color: mode === 'dark' ? '#ffffff' : '#1e293b',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(30, 136, 229, 0.15)'}`,
            },
          },
        },
        MuiTextField: {
          defaultProps: {
            size: 'small',
            variant: 'outlined',
            fullWidth: true,
          },
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                backgroundColor: mode === 'dark' ? '#0d1218' : '#ffffff',
                color: mode === 'dark' ? '#ffffff' : '#1e293b',
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(30, 136, 229, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? '#D4AF37' : '#1E88E5',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'dark' ? '#F3C623' : '#1565C0',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? '#a0a0a0' : '#64748b',
                '&.Mui-focused': {
                  color: mode === 'dark' ? '#F3C623' : '#1565C0',
                },
              },
            },
          },
        },
        MuiSelect: {
          defaultProps: {
            size: 'small',
            variant: 'outlined',
            fullWidth: true,
          },
        },
        MuiFormControl: {
          defaultProps: {
            size: 'small',
            variant: 'outlined',
            fullWidth: true,
          },
        },
        MuiInputLabel: {
          defaultProps: {
            size: 'small',
          },
          styleOverrides: {
            root: {
              color: mode === 'dark' ? '#a0a0a0' : '#64748b',
              '&.Mui-focused': {
                color: mode === 'dark' ? '#F3C623' : '#1565C0',
              },
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(30, 136, 229, 0.1)',
                borderLeft: `4px solid ${mode === 'dark' ? '#D4AF37' : '#1E88E5'}`,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(30, 136, 229, 0.15)',
                },
              },
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <CustomThemeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CustomThemeContext.Provider>
  );
};

