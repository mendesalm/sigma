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
          main: '#00B0FF',
          light: '#33BFFF',
          dark: '#007BB2',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#f50057',
          light: '#ff4081',
          dark: '#c51162',
          contrastText: '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#0b111b' : '#f5f7fa',
          paper: mode === 'dark' ? '#131b29' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#e0e0e0' : '#1e293b',
          secondary: mode === 'dark' ? '#a0a0a0' : '#64748b',
        },
        divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)',
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600, color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        h2: { fontWeight: 600, color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        h3: { fontWeight: 600, color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        h4: { fontWeight: 600, color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        h5: { fontWeight: 600, color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        h6: { fontWeight: 600, color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        body1: { color: mode === 'dark' ? '#e0e0e0' : '#1e293b' },
        body2: { color: mode === 'dark' ? '#a0a0a0' : '#64748b' },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#0b111b' : '#ffffff',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)'}`,
              color: mode === 'dark' ? '#ffffff' : '#1e293b',
              boxShadow: 'none',
              borderRadius: 0,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#0b111b' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)'}`,
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
              background: mode === 'dark' ? '#1e293b' : '#00B0FF',
              color: '#ffffff',
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}`,
              '&:hover': {
                background: mode === 'dark' ? '#334155' : '#007BB2',
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              },
            },
            containedSecondary: {
              background: mode === 'dark' ? '#334155' : '#f50057',
              color: '#ffffff',
              '&:hover': {
                background: mode === 'dark' ? '#475569' : '#c51162',
              },
            },
            outlined: {
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
              color: mode === 'dark' ? '#e0e0e0' : '#1e293b',
              '&:hover': {
                borderColor: mode === 'dark' ? '#e0e0e0' : '#1e293b',
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#131b29' : '#ffffff',
              borderRadius: 12,
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)'}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#131b29' : '#ffffff',
              borderRadius: 12,
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)'}`,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 600,
              color: mode === 'dark' ? '#a0a0a0' : '#64748b',
              backgroundColor: mode === 'dark' ? '#131b29' : '#f8fafc',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)'}`,
            },
            body: {
              color: mode === 'dark' ? '#e0e0e0' : '#1e293b',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.12)'}`,
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
                color: mode === 'dark' ? '#e0e0e0' : '#1e293b',
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#1e293b',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00B0FF',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? '#a0a0a0' : '#64748b',
                '&.Mui-focused': {
                  color: '#00B0FF',
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
                color: '#00B0FF',
              },
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                borderLeft: `4px solid ${mode === 'dark' ? '#e0e0e0' : '#1e293b'}`,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
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
