// ============================================================
// App.tsx — ScamSense Application Root & Routing Configuration
// ============================================================
// Configures:
//   - Material UI ThemeProvider with our custom ScamSense theme
//   - React Router DOM routing (Home and About Us pages)
//   - Persistent Navbar at the top and Footer at the bottom
// ============================================================

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

import { theme } from "./theme.js";
import { AuthProvider } from "./context/AuthContext.js";
import { Navbar } from "./components/layout/Navbar.js";
import { Footer } from "./components/layout/Footer.js";
import { HomePage } from "./pages/HomePage.js";
import { AboutPage } from "./pages/AboutPage.js";
import { ContactPage } from "./pages/ContactPage.js";
import { ScanPage } from "./pages/ScanPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { AdminDashboard } from "./pages/admin/AdminDashboard.js";
import { QuizzesPage } from "./pages/QuizzesPage.js";
import { ArticlesPage } from "./pages/ArticlesPage.js";

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline provides consistent dark background and reset styles */}
      <CssBaseline />

      <BrowserRouter>
        <AuthProvider>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              backgroundColor: "#000000",
              color: "#FFFFFF",
            }}
          >
            {/* Top Navigation Bar */}
            <Navbar />

            {/* Main Content Area (grows to push footer down) */}
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/quizzes" element={<QuizzesPage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/register"
                  element={<LoginPage initialTab={1} />}
                />
                <Route path="/admin" element={<AdminDashboard />} />
                {/* Fallback route redirects unknown URLs back to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>

            {/* Footer */}
            <Footer />
          </Box>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
