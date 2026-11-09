export interface PatternFinding {
  patternName: string; // which scam category was detected
  matchedText: string; // the actual phrase from the message
  explanation: string; // simple reason why this is suspicious
}

// struc of single regex rule
interface SimpleScamRule {
  name: string;
  pattern: RegExp;
  explanation: string;
  exceptionPattern?: RegExp;
}

const SCAM_RULES: SimpleScamRule[] = [
  // Rule OTP, UPI PIN, CVV, or pwd
  {
    name: "Credential / OTP Request",
    pattern:
      /\b(?:share|send|enter|give|verify|provide)\s+(?:your\s+|this\s+)?(?:otp|one[-\s]time[-\s]password|upi\s*pin|cvv|atm\s*pin|password)\b/i,
    explanation:
      "Legitimate organizations and banks will NEVER ask you to share your OTP, UPI PIN, or passwords.",
    exceptionPattern:
      /\b(?:never|do\s+not|don't)\s+(?:share|give|disclose)\s+(?:your\s+|this\s+)?(?:otp|pin|password|cvv)\b/i,
  },

  // Rule threating users
  {
    name: "Urgent Account / Service Threat",
    pattern:
      /\b(?:account|service|electricity|power|sim|card)\s+(?:is|will\s+be)?\s*(?:blocked|suspended|deactivated|disconnected|terminated|closed)\b|\b(?:update\s+kyc\s+immediately|action\s+required\s+within\s+\d+\s+hours?)\b/i,
    explanation:
      "Scammers create artificial urgency or panic so you click links or call numbers without thinking.",
  },

  // Rule rewards or tempting user
  {
    name: "Fake Lottery / Prize Claim",
    pattern:
      /\b(?:won|winner|lottery|lucky\s*draw|kbc|cash\s*prize|claim\s*(?:rs\.?|inr|₹)?\s*\d+)\b/i,
    explanation:
      "Unsolicited lottery and prize messages are designed to lure victims into paying advance fees or sharing personal data.",
  },

  // Rule job offers
  {
    name: "Job Offer / Upfront Fee Scam",
    pattern:
      /\b(?:earn\s*(?:rs\.?|inr|₹)?\s*\d+\s*(?:daily|per\s*day)|part[-\s]*time\s*job\s*(?:liking|rating)|registration\s*fee|security\s*deposit\s*required)\b/i,
    explanation:
      "Genuine employers never demand an upfront registration fee or security deposit to start working.",
  },

  //Rule upi scan or enter pin to earn money
  {
    name: "UPI QR / PIN Misconception",
    pattern:
      /\b(?:scan\s*(?:this)?\s*qr(?:\s*code)?\s*to\s*(?:receive|get)|enter\s*(?:upi)?\s*pin\s*to\s*(?:receive|get)\s*(?:money|payment))\b/i,
    explanation:
      "Entering your UPI PIN always DEBITS money from your account. You NEVER need to enter a PIN or scan a QR to receive funds.",
  },
];

//pattern matching
export const checkRegexPatterns = (text: string): PatternFinding[] => {
  const findings: PatternFinding[] = [];

  for (const rule of SCAM_RULES) {
    const match = text.match(rule.pattern);

    // If pattern matched
    if (match) {
      // Check if this message has a legitimate safety exception
      if (rule.exceptionPattern && rule.exceptionPattern.test(text)) {
        // Skip flagging because the message is actually warning NOT to share OTP
        continue;
      }

      // Add to findings
      findings.push({
        patternName: rule.name,
        matchedText: match[0],
        explanation: rule.explanation,
      });
    }
  }

  return findings;
};
