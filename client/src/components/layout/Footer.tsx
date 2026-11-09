import React from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#000000",
        borderTop: "1px solid rgba(255, 255, 255, 0.15)",
        mt: "auto",
        py: { xs: 6, sm: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 5, sm: 6 }}
        >
          {/* Prominent ScamSense Brand Title on the Left */}
          <Typography
            variant="h3"
            component={Link}
            to="/"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3rem" },
              color: "#FFFFFF",
              textDecoration: "none",
              letterSpacing: "-1px",
              "&:hover": {
                color: "#E7FE55",
              },
            }}
          >
            ScamSense
          </Typography>

          {/* Navigation Links in 2 Balanced Columns on the Right */}
          <Stack
            direction="row"
            spacing={{ xs: 8, sm: 12, md: 16 }}
            sx={{ pt: { xs: 1, sm: 0 } }}
          >
            {/* Column 1: Home, About, Contact */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Link
                to="/"
                className="text-white hover:text-[#E7FE55] transition-colors font-semibold text-xl sm:text-2xl no-underline"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-white hover:text-[#E7FE55] transition-colors font-semibold text-xl sm:text-2xl no-underline"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-white hover:text-[#E7FE55] transition-colors font-semibold text-xl sm:text-2xl no-underline"
              >
                Contact
              </Link>
            </Box>

            {/* Column 2: Scan, Quiz, Articles */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Link
                to="/scan"
                className="text-white hover:text-[#E7FE55] transition-colors font-semibold text-xl sm:text-2xl no-underline"
              >
                Scan
              </Link>
              <Link
                to="/quizzes"
                className="text-white hover:text-[#E7FE55] transition-colors font-semibold text-xl sm:text-2xl no-underline"
              >
                Quiz
              </Link>
              <Link
                to="/articles"
                className="text-white hover:text-[#E7FE55] transition-colors font-semibold text-xl sm:text-2xl no-underline"
              >
                Articles
              </Link>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
