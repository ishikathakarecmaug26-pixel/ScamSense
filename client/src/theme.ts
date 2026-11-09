// ============================================================
// theme.ts — Material UI Theme Configuration for ScamSense
// ============================================================
// Simple, clean theme matching docs/DESIGN_SYSTEM.md:
//   - Background: #000000 (Black)
//   - Text: #FFFFFF (White)
//   - Primary: #E7FE55 (Electric Lime)
//   - Secondary: #F8D4FE (Lavender Pink)
//   - Pearl White for light surfaces/cards: #F2F4FE
//   - Font: Geist Sans
// ============================================================

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#E7FE55", // Electric Lime for primary buttons
      contrastText: "#000000",
    },
    secondary: {
      main: "#F8D4FE", // Lavender Pink
      contrastText: "#000000",
    },
    background: {
      default: "#000000", // Main black background
      paper: "#F2F4FE", // Pearl White for content cards
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#A1A1AA",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  typography: {
    fontFamily: [
      "Geist Sans",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ].join(","),
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF !important",
          color: "#000000 !important",
          borderRadius: 16,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: "#000000 !important",
          fontWeight: 800,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF !important",
          color: "#000000 !important",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "#000000 !important",
          fontSize: "0.95rem",
          "&.Mui-selected": {
            backgroundColor: "#E7FE55 !important",
            color: "#000000 !important",
            fontWeight: 700,
          },
          "&:hover": {
            backgroundColor: "#F3F4F6 !important",
            color: "#000000 !important",
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "#374151 !important",
          "&.Mui-focused": {
            color: "#000000 !important",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#4B5563 !important",
          "&.Mui-focused": {
            color: "#000000 !important",
          },
        },
      },
    },
  },
});
