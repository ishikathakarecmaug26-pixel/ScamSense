// ============================================================
// googleSafeBrowsing.ts — Google Safe Browsing API v5 Integration
// ============================================================
// Extracts URLs from message text and queries Google Safe Browsing
// API v5 (urls.search endpoint) to detect known phishing/malware.
//
// ⚠️ Protocol Details:
// Google Safe Browsing API v5 returns binary Protocol Buffers
// (Content-Type: application/x-protobuf). Requesting alt=json is not
// supported on this endpoint (returns HTTP 400).
//
// We decode the binary protobuf payload directly using Google's
// official SearchUrlsResponse schema without heavy external libraries.
// ============================================================

import { env } from "../config/env.js"; // validated environment variables

// Maximum number of URLs to check per message to prevent abuse/rate-limit starvation
const MAX_URLS_TO_CHECK = 10;

// Request timeout in milliseconds (5 seconds)
const GOOGLE_REQUEST_TIMEOUT_MS = 5000;

// ---- Result structure for a single URL check ----
export interface UrlCheckResult {
  url: string;
  isThreat: boolean | null; // true = unsafe, false = clean, null = unchecked / unverified
  threatDetails?: string;
}

// ---- Complete Google check response structure ----
export interface GoogleSafeBrowsingReport {
  status:
    | "NOT_CONFIGURED"
    | "NOT_APPLICABLE"
    | "CHECK_COMPLETED"
    | "UNAVAILABLE";
  hasUnsafeUrl: boolean;
  urlsChecked: UrlCheckResult[];
  message: string;
}

// ============================================================
// Protocol Buffer Schema Definitions & Decoder for Safe Browsing v5
// ============================================================
// Schema:
//   message SearchUrlsResponse {
//     repeated ThreatUrl threats = 1;
//     google.protobuf.Duration cache_duration = 2;
//   }
//   message ThreatUrl {
//     string url = 1;
//     repeated ThreatType threat_types = 2;
//   }
//   enum ThreatType {
//     THREAT_TYPE_UNSPECIFIED = 0;
//     MALWARE = 1;
//     SOCIAL_ENGINEERING = 2;
//     UNWANTED_SOFTWARE = 3;
//     POTENTIALLY_HARMFUL_APPLICATION = 4;
//   }
// ============================================================

// Map known enum integers to human-readable threat names
const THREAT_TYPE_NAMES: Record<number, string> = {
  0: "THREAT_TYPE_UNSPECIFIED",
  1: "MALWARE",
  2: "SOCIAL_ENGINEERING",
  3: "UNWANTED_SOFTWARE",
  4: "POTENTIALLY_HARMFUL_APPLICATION",
};

interface DecodedThreatUrl {
  url: string;
  threatTypes: string[];
}

interface DecodedSearchUrlsResponse {
  threats: DecodedThreatUrl[];
}

// Helper: Read a variable-length integer (Varint) from a Buffer
// Rejects incomplete, oversized (>10 bytes for 64-bit), or out-of-bounds varints
export function readVarint(
  buf: Buffer,
  startPos: number
): { val: number; nextPos: number } {
  let val = 0;
  let shift = 0;
  let pos = startPos;
  let bytesRead = 0;

  while (pos < buf.length) {
    const byte = buf[pos++];
    bytesRead++;
    val |= (byte & 0x7f) << shift;

    if ((byte & 0x80) === 0) {
      return { val, nextPos: pos };
    }

    shift += 7;
    // Varint encoding allows at most 10 bytes for a 64-bit integer
    if (bytesRead > 10) {
      throw new Error(
        "Invalid protobuf: Oversized varint payload exceeds 10 bytes."
      );
    }
  }

  // If buffer ended without the continuation bit turning 0, varint is truncated
  throw new Error(
    "Invalid protobuf: Truncated varint reached end of buffer unexpectedly."
  );
}

// Helper: Decode a single ThreatUrl message (Field 1 of SearchUrlsResponse)
function decodeThreatUrl(buf: Buffer): DecodedThreatUrl {
  let pos = 0;
  let url = "";
  const threatTypes: string[] = [];

  while (pos < buf.length) {
    const { val: key, nextPos: keyPos } = readVarint(buf, pos);
    pos = keyPos;
    const fieldNum = key >> 3;
    const wireType = key & 7;

    if (fieldNum === 1 && wireType === 2) {
      // Field 1 (string url): Length-delimited UTF-8 string
      const { val: len, nextPos } = readVarint(buf, pos);
      pos = nextPos;
      if (len < 0 || pos + len > buf.length) {
        throw new Error(
          `Invalid protobuf: ThreatUrl url string length ${len} exceeds buffer bounds.`
        );
      }
      url = buf.subarray(pos, pos + len).toString("utf8");
      pos += len;
    } else if (fieldNum === 2) {
      // Field 2 (repeated ThreatType): Can be unpacked varint (wireType 0) or packed repeated (wireType 2)
      if (wireType === 0) {
        const { val: enumVal, nextPos } = readVarint(buf, pos);
        pos = nextPos;
        // Preserve unknown threat enum values explicitly without mislabeling as MALWARE
        threatTypes.push(
          THREAT_TYPE_NAMES[enumVal] || `UNKNOWN_THREAT_TYPE_${enumVal}`
        );
      } else if (wireType === 2) {
        const { val: packLen, nextPos } = readVarint(buf, pos);
        pos = nextPos;
        if (packLen < 0 || pos + packLen > buf.length) {
          throw new Error(
            `Invalid protobuf: Packed threat types length ${packLen} exceeds buffer bounds.`
          );
        }
        const end = pos + packLen;
        while (pos < end) {
          const { val: enumVal, nextPos: np } = readVarint(buf, pos);
          pos = np;
          threatTypes.push(
            THREAT_TYPE_NAMES[enumVal] || `UNKNOWN_THREAT_TYPE_${enumVal}`
          );
        }
      } else {
        throw new Error(
          `Invalid protobuf: Unexpected wire type ${wireType} for field 2 (threat_types).`
        );
      }
    } else {
      // Skip unknown or unsupported fields safely with bounds verification
      if (wireType === 0) {
        const { nextPos } = readVarint(buf, pos);
        pos = nextPos;
      } else if (wireType === 2) {
        const { val: len, nextPos } = readVarint(buf, pos);
        pos = nextPos;
        if (len < 0 || pos + len > buf.length) {
          throw new Error(
            `Invalid protobuf: Skipped field length ${len} exceeds buffer bounds.`
          );
        }
        pos += len;
      } else if (wireType === 1) {
        if (pos + 8 > buf.length)
          throw new Error(
            "Invalid protobuf: 64-bit field exceeds buffer bounds."
          );
        pos += 8;
      } else if (wireType === 5) {
        if (pos + 4 > buf.length)
          throw new Error(
            "Invalid protobuf: 32-bit field exceeds buffer bounds."
          );
        pos += 4;
      } else {
        throw new Error(
          `Invalid protobuf: Unsupported wire type ${wireType} in ThreatUrl.`
        );
      }
    }
  }

  return { url, threatTypes };
}

// Helper: Decode the root SearchUrlsResponse protobuf
export function decodeSearchUrlsResponse(
  buf: Buffer
): DecodedSearchUrlsResponse {
  let pos = 0;
  const threats: DecodedThreatUrl[] = [];

  while (pos < buf.length) {
    const { val: key, nextPos: keyPos } = readVarint(buf, pos);
    pos = keyPos;
    const fieldNum = key >> 3;
    const wireType = key & 7;

    if (fieldNum === 1 && wireType === 2) {
      // Field 1 (repeated ThreatUrl threats = 1): Length-delimited message
      const { val: len, nextPos } = readVarint(buf, pos);
      pos = nextPos;
      if (len < 0 || pos + len > buf.length) {
        throw new Error(
          `Invalid protobuf: ThreatUrl message length ${len} exceeds buffer bounds.`
        );
      }
      const threatBuf = buf.subarray(pos, pos + len);
      pos += len;
      threats.push(decodeThreatUrl(threatBuf));
    } else {
      // Field 2 (cache_duration) or other metadata: skip safely
      if (wireType === 0) {
        const { nextPos } = readVarint(buf, pos);
        pos = nextPos;
      } else if (wireType === 2) {
        const { val: len, nextPos } = readVarint(buf, pos);
        pos = nextPos;
        if (len < 0 || pos + len > buf.length) {
          throw new Error(
            `Invalid protobuf: Skipped metadata length ${len} exceeds buffer bounds.`
          );
        }
        pos += len;
      } else if (wireType === 1) {
        if (pos + 8 > buf.length)
          throw new Error(
            "Invalid protobuf: 64-bit field exceeds buffer bounds."
          );
        pos += 8;
      } else if (wireType === 5) {
        if (pos + 4 > buf.length)
          throw new Error(
            "Invalid protobuf: 32-bit field exceeds buffer bounds."
          );
        pos += 4;
      } else {
        throw new Error(
          `Invalid protobuf: Unsupported wire type ${wireType} in SearchUrlsResponse.`
        );
      }
    }
  }

  return { threats };
}

// ============================================================
// 1. extractUrls — Pulls URLs out of freeform text
// ============================================================
export const extractUrls = (text: string): string[] => {
  const urlPattern =
    /(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlPattern) || [];

  const cleanUrls = Array.from(new Set(matches)).map((u) => {
    let clean = u.replace(/[.,!?;]+$/, ""); // remove trailing punctuation
    if (!/^https?:\/\//i.test(clean)) {
      clean = `http://${clean}`;
    }
    return clean;
  });

  return cleanUrls;
};

// ============================================================
// 2. checkUrlsWithGoogleSafeBrowsing — Calls Google Safe Browsing API v5
// ============================================================
// Endpoint: GET https://safebrowsing.googleapis.com/v5/urls:search?key=KEY&urls=URL
// ============================================================
export const checkUrlsWithGoogleSafeBrowsing = async (
  urls: string[]
): Promise<GoogleSafeBrowsingReport> => {
  // If no URLs exist in the message, Google check is not applicable
  if (!urls || urls.length === 0) {
    return {
      status: "NOT_APPLICABLE",
      hasUnsafeUrl: false,
      urlsChecked: [],
      message: "No URLs found in the message.",
    };
  }

  // Read API key from environment (.env)
  const apiKey = env.GOOGLE_SAFE_BROWSING_API_KEY;

  // If no API key configured, inform user clearly (isThreat is null = unchecked)
  if (!apiKey || apiKey.trim() === "") {
    return {
      status: "NOT_CONFIGURED",
      hasUnsafeUrl: false,
      urlsChecked: urls.map((u) => ({ url: u, isThreat: null })),
      message: "Google Safe Browsing API key is not configured in server/.env.",
    };
  }

  // Limit number of URLs checked to prevent resource exhaustion / rate-limiting
  const urlsToCheck = urls.slice(0, MAX_URLS_TO_CHECK);
  const excessUrls = urls.slice(MAX_URLS_TO_CHECK);

  const results: UrlCheckResult[] = [];
  let foundAnyThreat = false;
  let failedChecksCount = 0;

  for (const url of urlsToCheck) {
    try {
      const apiUrl = `https://safebrowsing.googleapis.com/v5/urls:search?key=${apiKey}&urls=${encodeURIComponent(
        url
      )}`;

      // Use AbortSignal to enforce an explicit timeout
      const response = await fetch(apiUrl, {
        method: "GET",
        signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS),
      });

      // 1. Check HTTP response status
      if (!response.ok) {
        console.warn(
          `⚠️ Google Safe Browsing HTTP ${response.status} for URL: ${url}`
        );
        failedChecksCount++;
        results.push({
          url,
          isThreat: null, // Keep null — never mark unchecked URL as safe
          threatDetails: `Service unavailable (HTTP ${response.status})`,
        });
        continue;
      }

      // 2. Read raw binary response buffer
      const arrayBuf = await response.arrayBuffer();
      const rawBuffer = Buffer.from(arrayBuf);

      // 3. Decode Protocol Buffers payload
      let decoded: DecodedSearchUrlsResponse;
      try {
        decoded = decodeSearchUrlsResponse(rawBuffer);
      } catch (decodeErr) {
        console.error(
          "🔥 Google Safe Browsing protobuf decoding error:",
          decodeErr
        );
        failedChecksCount++;
        results.push({
          url,
          isThreat: null, // Decoding failed — keep null, never assume clean
          threatDetails:
            "Could not decode Google Safe Browsing response payload",
        });
        continue;
      }

      // 4. Inspect threats found in the response
      if (decoded.threats && decoded.threats.length > 0) {
        foundAnyThreat = true;

        const strippedQueryUrl = url.replace(/^https?:\/\//i, "");
        const threatMatch =
          decoded.threats.find(
            (t) =>
              t.url === url ||
              t.url === strippedQueryUrl ||
              url.includes(t.url) ||
              strippedQueryUrl.includes(t.url)
          ) || decoded.threats[0];

        results.push({
          url,
          isThreat: true,
          threatDetails:
            threatMatch.threatTypes.join(", ") || "Known Unsafe URL",
        });
      } else {
        // Successfully decoded and no threats listed — Google confirmed clean
        results.push({
          url,
          isThreat: false,
        });
      }
    } catch (networkOrTimeoutErr) {
      // 5. Network errors or timeouts: handle gracefully without discarding confirmed threats
      console.error(
        `🔥 Google Safe Browsing network/timeout error for ${url}:`,
        networkOrTimeoutErr instanceof Error
          ? networkOrTimeoutErr.message
          : networkOrTimeoutErr
      );
      failedChecksCount++;
      results.push({
        url,
        isThreat: null,
        threatDetails: "Network timeout or connection error",
      });
    }
  }

  // Any excess URLs beyond MAX_URLS_TO_CHECK are marked unchecked
  for (const excessUrl of excessUrls) {
    results.push({
      url: excessUrl,
      isThreat: null,
      threatDetails: `Check skipped: maximum limit of ${MAX_URLS_TO_CHECK} URLs per message exceeded`,
    });
    failedChecksCount++;
  }

  // Determine overall status
  // If every single URL check failed, report UNAVAILABLE
  // If at least one check completed, report CHECK_COMPLETED (preserving any found threats)
  const allFailed =
    results.length > 0 && results.every((r) => r.isThreat === null);

  let message = "";
  if (foundAnyThreat) {
    message = "Google Safe Browsing identified one or more URLs as unsafe!";
  } else if (allFailed) {
    message =
      "Could not verify URLs. Google Safe Browsing service was unavailable.";
  } else if (failedChecksCount > 0) {
    message = `Checked ${
      urlsToCheck.length - failedChecksCount
    } URLs cleanly, but ${failedChecksCount} could not be verified.`;
  } else {
    message = "No known unsafe URLs reported by Google Safe Browsing.";
  }

  return {
    status: allFailed ? "UNAVAILABLE" : "CHECK_COMPLETED",
    hasUnsafeUrl: foundAnyThreat,
    urlsChecked: results,
    message,
  };
};
