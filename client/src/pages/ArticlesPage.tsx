// ============================================================
// ArticlesPage.tsx — Cybersecurity Awareness Articles
// ============================================================
// Layout from Excalidraw Wireframe:
//   Top:    Navbar (Home About Contact Scan Quiz Articles [Login/Register])
//   Center: "ARTICLES" Heading
//   Grid:   2-Column Article Cards (Article 1, Article 2, etc.)
//           Card background: Pearl White (#F2F4FE)
//           Uniform Card height: 440px (guarantees perfect row alignment)
//           Card body: Scrollable if long, clean plain text without AI asterisks
//   Bottom: "MORE" Action Button
//   Footer: Shared ScamSense Footer
// ============================================================

import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  author_name?: string;
  created_at: string;
}

// Fallback articles in case backend is offline
const FALLBACK_ARTICLES: Article[] = [
  {
    id: 1,
    title: "How to Spot Phishing Emails and Malicious Links",
    category: "phishing",
    created_at: new Date().toISOString(),
    content: `Phishing is one of the most common cyber threats today. Attackers disguise themselves as trusted institutions like banks, courier services, or government bodies.

Key Red Flags to Watch For:
1. Suspicious Sender Domains: Look closely at the email sender address. For example, support@paypaI.com may use an uppercase I instead of lowercase l.
2. Urgent or Threatening Language: Messages saying "Account suspended within 24 hours" are designed to create panic so you act before thinking.
3. Mismatched Links: Hover over links without clicking. The actual URL may point to a completely different, unverified web server.
4. Requests for Sensitive Info: Genuine banks will NEVER ask for your password, PIN, or OTP over email.

Golden Safety Tip:
Always verify directly with official customer care numbers from verified websites, never from links inside unverified messages.`,
  },
  {
    id: 2,
    title: "Understanding UPI Scams: QR Codes and Money Requests",
    category: "upi",
    created_at: new Date().toISOString(),
    content: `Unified Payments Interface (UPI) has revolutionized digital payments in India, but fraudsters exploit common misconceptions about how it functions.

The Golden Rule of UPI:
Entering your UPI PIN always DEBITS money from your account. You NEVER need to enter a UPI PIN to RECEIVE money.

Common UPI Scams:
1. OLX / Marketplace QR Code Scam: A fake buyer claims they will pay you by sending a QR code. They ask you to scan it and enter your PIN. Doing so immediately deducts money.
2. Collect Request Fraud: Scammers send a "Collect Money" request with a description like "Refund Approved" or "Lottery Prize". Clicking approve transfers funds to the fraudster.
3. Screen Sharing Apps: Never install remote access applications like AnyDesk, TeamViewer, or RustDesk on the advice of an unknown caller.

Defense Strategy:
If anyone sends a QR code claiming it is to send you money, immediately disconnect and block the number.`,
  },
  {
    id: 3,
    title: "Social Engineering: How Scammers Manipulate Trust",
    category: "social_media",
    created_at: new Date().toISOString(),
    content: `Social engineering relies on human psychology rather than technical hacking tricks. Cybercriminals exploit fear, greed, urgency, and helpfulness to extract sensitive data.

Common Tactics:
1. Digital Arrest Scams: Fraudsters impersonate police or CBI officials over video calls, claiming your Aadhaar is linked to illegal parcels, and threaten arrest unless verification funds are transferred.
2. Fake Job Offers: Telegram and WhatsApp messages promising Rs 3,000 daily for liking YouTube videos or rating hotels.
3. Investment & Crypto Frauds: Telegram groups showing falsified profit screenshots tempting victims into depositing money into unauthorized apps.

Defense Strategy:
Take a pause, verify independently, and report cyber incidents at cybercrime.gov.in or toll-free helpline 1930.`,
  },
];

export const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(2); // Show 2 articles initially to match wireframe (Article 1, Article 2)

  // Fetch articles from backend API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/articles");
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setArticles(json.data);
          } else {
            setArticles(FALLBACK_ARTICLES);
          }
        } else {
          setArticles(FALLBACK_ARTICLES);
        }
      } catch (err) {
        console.warn("Could not reach backend, displaying sample awareness articles:", err);
        setArticles(FALLBACK_ARTICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Helper to format article content into structured, clean, plain text without AI asterisks
  const renderFormattedArticle = (content: string) => {
    // 1. Strip raw markdown asterisks, backticks, and ### symbols
    const cleanContent = content
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/#{1,6}\s*/g, "");

    // 2. Break content into paragraphs/blocks
    const blocks = cleanContent
      .split(/\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    return blocks.map((block, idx) => {
      // Check if line is a subheading (ends with colon or matches common header phrases)
      const isHeader =
        block.endsWith(":") ||
        block.toLowerCase().startsWith("key red flags") ||
        block.toLowerCase().startsWith("the golden rule") ||
        block.toLowerCase().startsWith("golden rule") ||
        block.toLowerCase().startsWith("common upi scams") ||
        block.toLowerCase().startsWith("common tactics") ||
        block.toLowerCase().startsWith("defense strategy") ||
        block.toLowerCase().startsWith("golden safety tip");

      if (isHeader) {
        return (
          <Typography
            key={idx}
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: "#000000",
              mt: idx === 0 ? 0 : 2,
              mb: 0.8,
              fontSize: "1rem",
              borderBottom: "2px solid #E5E7EB",
              pb: 0.5,
            }}
          >
            {block}
          </Typography>
        );
      }

      // Check if block has multiple numbered points compressed together (e.g. "1. Point 2. Point")
      if (/\b\d+\.\s+/.test(block) && (block.includes("1.") || block.includes("2."))) {
        const parts = block.split(/(?=\b\d+\.\s+)/);
        return (
          <Box key={idx} sx={{ my: 0.8 }}>
            {parts.map((p, pIdx) => {
              const trimmed = p.trim();
              if (!trimmed) return null;
              const textOnly = trimmed.replace(/^\d+\.\s*/, "");
              return (
                <Box
                  key={pIdx}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.2,
                    my: 0.6,
                    pl: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#000000",
                      mt: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#1F2937",
                      fontSize: "0.92rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {textOnly}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      }

      // Check if line is a single numbered or bullet item
      if (/^(\d+\.|•|-)\s*/.test(block)) {
        const cleanLine = block.replace(/^(\d+\.|•|-)\s*/, "");
        return (
          <Box
            key={idx}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.2,
              my: 0.6,
              pl: 0.5,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#000000",
                mt: 1,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#1F2937",
                fontSize: "0.92rem",
                lineHeight: 1.6,
              }}
            >
              {cleanLine}
            </Typography>
          </Box>
        );
      }

      // Regular body paragraph
      return (
        <Typography
          key={idx}
          variant="body2"
          sx={{
            color: "#374151",
            fontSize: "0.92rem",
            lineHeight: 1.65,
            my: 1,
          }}
        >
          {block}
        </Typography>
      );
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "phishing":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "upi":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "social_media":
        return { bg: "#E0E7FF", text: "#3730A3" };
      default:
        return { bg: "#E5E7EB", text: "#1F2937" };
    }
  };

  const handleShowMore = () => {
    if (visibleCount >= articles.length) {
      setVisibleCount(2); // Toggle back to initial 2
    } else {
      setVisibleCount((prev) => prev + 2);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#000000",
        color: "#FFFFFF",
        py: { xs: 6, md: 9 },
        minHeight: "calc(100vh - 64px - 180px)",
      }}
    >
      <Container maxWidth="lg">
        {/* Wireframe Centered Title: ARTICLES */}
        <Box sx={{ textAlign: "center", mb: { xs: 5, md: 7 } }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2.5rem", sm: "3.2rem", md: "4rem" },
              letterSpacing: "1px",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            ARTICLES
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#9CA3AF",
              mt: 1.5,
              fontSize: { xs: "1rem", sm: "1.1rem" },
            }}
          >
            Essential cybersecurity knowledge, fraud trends, and practical defense tips.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: "#E7FE55" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4, borderRadius: "10px" }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* CSS Grid 2-Column Layout: Perfectly aligns each row */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: { xs: 4, md: 5 },
                alignItems: "stretch",
              }}
            >
              {articles.slice(0, visibleCount).map((article, index) => {
                const catStyle = getCategoryColor(article.category);
                return (
                  <Box
                    key={article.id}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {/* Header Label: ARTICLE 1 / ARTICLE 2 / ARTICLE 3 / ARTICLE 4 */}
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: "#FFFFFF",
                        mb: 1.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontSize: { xs: "1.2rem", md: "1.35rem" },
                      }}
                    >
                      ARTICLE {index + 1}
                    </Typography>

                    {/* Card Body with uniform height (440px) to guarantee clean alignment */}
                    <Card
                      sx={{
                        backgroundColor: "#F2F4FE",
                        color: "#000000",
                        borderRadius: "20px",
                        height: "440px",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-3px)",
                          boxShadow: "0 14px 35px rgba(231, 254, 85, 0.15)",
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 3, sm: 3.5 },
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {/* Meta Tags: Category Chip & Date */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          <Chip
                            label={article.category.toUpperCase()}
                            size="small"
                            sx={{
                              backgroundColor: catStyle.bg,
                              color: catStyle.text,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600 }}>
                            {new Date(article.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>

                        {/* Article Title */}
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            color: "#000000",
                            fontSize: { xs: "1.15rem", sm: "1.3rem" },
                            lineHeight: 1.3,
                            mb: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          {article.title}
                        </Typography>

                        {/* Scrollable Structured Body if Content Exceeds Card Height */}
                        <Box
                          sx={{
                            flexGrow: 1,
                            overflowY: "auto",
                            pr: 1,
                            /* Clean custom scrollbar */
                            "&::-webkit-scrollbar": {
                              width: "6px",
                            },
                            "&::-webkit-scrollbar-track": {
                              background: "#E5E7EB",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              background: "#9CA3AF",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                              background: "#6B7280",
                            },
                          }}
                        >
                          {renderFormattedArticle(article.content)}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>

            {/* Wireframe Bottom Action: MORE */}
            <Box sx={{ textAlign: "center", mt: { xs: 6, md: 8 } }}>
              <Button
                variant="contained"
                onClick={handleShowMore}
                sx={{
                  backgroundColor: "#E7FE55",
                  color: "#000000",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  px: 6,
                  py: 1.5,
                  borderRadius: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  "&:hover": {
                    backgroundColor: "#D6ED40",
                  },
                }}
              >
                {visibleCount >= articles.length ? "SHOW LESS" : "MORE"}
              </Button>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};