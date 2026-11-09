import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Chip from "@mui/material/Chip";
import { MenuIcon, CloseIcon } from "../common/Icons.js";
import { useAuth } from "../../context/AuthContext.js";

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Navigation links from wireframe
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Scan", path: "/scan" },
    { label: "Quiz", path: "/quizzes" },
    { label: "Articles", path: "/articles" },
    ...(user && user.role === "admin" ? [{ label: "Admin", path: "/admin" }] : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "#000000",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: "64px", display: "flex", justifyContent: "space-between" }}>
          
          {/* Brand Name on the Left */}
          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.3rem",
              textDecoration: "none",
              color: "#FFFFFF",
              letterSpacing: "-0.5px",
            }}
          >
            ScamSense
          </Typography>

          {/* Desktop Links & Button on the Right */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: isActive ? "#E7FE55" : "#FFFFFF",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "0.95rem",
                    px: 1.5,
                    py: 0.5,
                    "&:hover": {
                      color: "#E7FE55",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

            {/* User Auth Controls on Desktop */}
            {!user ? (
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{
                  ml: 1.5,
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.85rem",
                  px: 2,
                  py: 0.5,
                  borderRadius: "6px",
                  "&:hover": {
                    borderColor: "#FFFFFF",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                Login/Register
              </Button>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 1.5 }}>
                <Chip
                  size="small"
                  label={`Hi, ${user.name}`}
                  sx={{
                    backgroundColor: "#1F2937",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => logout()}
                  sx={{
                    color: "#FFFFFF",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    fontSize: "0.8rem",
                    px: 1.5,
                    py: 0.3,
                    borderRadius: "6px",
                    "&:hover": {
                      borderColor: "#EF4444",
                      color: "#EF4444",
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                    },
                  }}
                >
                  Logout
                </Button>
              </Box>
            )}
          </Box>

          {/* Mobile Menu Icon */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ color: "#FFFFFF" }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 250,
            backgroundColor: "#0D0D0D",
            color: "#FFFFFF",
            borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
            p: 2,
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ScamSense
          </Typography>
          <IconButton onClick={handleDrawerToggle} sx={{ color: "#FFFFFF" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List>
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: "6px",
                    color: isActive ? "#E7FE55" : "#FFFFFF",
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: isActive ? 600 : 400 }}>
                        {item.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          <ListItem disablePadding sx={{ mt: 2 }}>
            {!user ? (
              <Button
                fullWidth
                component={Link}
                to="/login"
                onClick={handleDrawerToggle}
                variant="outlined"
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  borderRadius: "6px",
                }}
              >
                Login/Register
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  logout();
                  handleDrawerToggle();
                }}
                sx={{
                  color: "#EF4444",
                  borderColor: "#EF4444",
                  borderRadius: "6px",
                }}
              >
                Logout ({user.name})
              </Button>
            )}
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
};