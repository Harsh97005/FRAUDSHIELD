/**
 * SafeText AI — Fraud Detection Engine
 * JavaScript-based NLP + Rule-based system
 */

// ─────────────────────────────────────────────
// KEYWORD DICTIONARIES WITH WEIGHTS
// ─────────────────────────────────────────────

const FRAUD_KEYWORDS = {
  // High-weight fraud indicators (score: 15–20)
  critical: {
    weight: 20,
    words: [
      'otp', 'one time password', 'one-time password',
      'click here', 'click link', 'verify now',
      'your account has been', 'account suspended',
      'account blocked', 'account compromised',
      'won a prize', 'you have won', 'congratulations you won',
      'lottery winner', 'lottery prize',
      'send money', 'transfer money', 'wire transfer',
      'nigerian prince', 'inheritance fund',
      'urgent action required', 'immediate action',
      'confirm your identity', 'verify your identity',
    ],
  },
  // High fraud indicators (score: 12)
  high: {
    weight: 12,
    words: [
      'free money', 'cash prize', 'prize money',
      'bank account', 'bank details', 'bank transfer',
      'credit card', 'debit card', 'card number',
      'password', 'pin number', 'cvv',
      'social security', 'ssn', 'aadhar',
      'kyc update', 'kyc verification', 'complete kyc',
      'reactivate account', 'unlock account',
      'suspicious activity', 'unauthorized access',
      'phishing', 'malware', 'virus',
      'gift card', 'amazon gift', 'google play card',
      'bitcoin', 'crypto payment', 'cryptocurrency',
    ],
  },
  // Medium fraud indicators (score: 8)
  medium: {
    weight: 8,
    words: [
      'urgent', 'urgently', 'immediately', 'asap',
      'limited time', 'expires soon', 'act now',
      'last chance', 'final notice', 'warning',
      'claim now', 'claim your', 'redeem now',
      'free offer', 'free gift', 'free trial',
      'no cost', 'risk free', 'guaranteed',
      'double your money', 'investment opportunity',
      'earn from home', 'work from home offer',
      'loan approved', 'pre-approved loan',
      'emi waiver', 'debt relief',
      'lottery', 'jackpot', 'sweepstake',
      'selected', 'chosen', 'lucky winner',
    ],
  },
  // Low-weight fraud indicators (score: 4)
  low: {
    weight: 4,
    words: [
      'verify', 'verification', 'validate',
      'update', 'upgrade', 'confirm',
      'click', 'login', 'sign in',
      'reward', 'bonus', 'cashback offer',
      'refund', 'reimbursement',
      'call us', 'call now', 'contact us immediately',
      'customer care', 'helpline',
      'do not share', 'never share',
      'government', 'official notice', 'legal action',
      'arrest warrant', 'court notice',
    ],
  },
};

// Safe/legitimate indicators that REDUCE fraud score
const SAFE_INDICATORS = {
  weight: -6,
  words: [
    'unsubscribe', 'terms and conditions', 'privacy policy',
    'opt out', 'manage preferences',
    'your order', 'tracking number', 'shipment',
    'appointment', 'reminder',
    'receipt', 'invoice', 'payment confirmed',
    'thank you for your purchase',
    'hello', 'dear customer',
  ],
};

// Suspicious URL patterns
const URL_PATTERNS = [
  /https?:\/\/(?!(?:www\.)?(?:google|microsoft|apple|amazon|paypal|bank)\.com)[^\s]+\.[a-z]{2,}\/[^\s]*/gi,
  /bit\.ly\/[^\s]+/gi,
  /tinyurl\.com\/[^\s]+/gi,
  /t\.co\/[^\s]+/gi,
  /goo\.gl\/[^\s]+/gi,
  /ow\.ly\/[^\s]+/gi,
  /short\.link\/[^\s]+/gi,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, // IP address as URL
  /[a-z0-9\-]+\.(xyz|top|click|tk|ml|ga|cf|gq|pw|online|site|website|info)\b/gi,
];

// Urgency patterns (regex)
const URGENCY_PATTERNS = [
  /\b(within|in)\s+\d+\s+(minute|hour|day|hour)s?\b/gi,
  /\bexpire[sd]?\s+in\s+\d+/gi,
  /\b(last|final|only)\s+(chance|opportunity|warning|notice)\b/gi,
  /\bact\s+(now|immediately|today)\b/gi,
  /\bdo\s+not\s+(ignore|delay|miss)\b/gi,
];

// Monetary patterns
const MONEY_PATTERNS = [
  /\$\s*[\d,]+(?:\.\d{2})?/g,
  /₹\s*[\d,]+(?:\.\d{2})?/g,
  /£\s*[\d,]+(?:\.\d{2})?/g,
  /€\s*[\d,]+(?:\.\d{2})?/g,
  /\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|rupees?|pounds?|euros?)\b/gi,
  /\bINR\s*[\d,]+/gi,
  /\bUSD\s*[\d,]+/gi,
];

// Phone number patterns (suspicious context)
const PHONE_PATTERNS = [
  /(?:call|contact|reach|whatsapp)\s+(?:us|now|at|on)?\s*[:\-]?\s*[\+]?[\d\s\-\(\)]{10,}/gi,
];

// All-caps abuse (>40% caps suggests scam)
const checkCapsAbuse = (text) => {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 10) return false;
  const caps = text.replace(/[^A-Z]/g, '').length;
  return (caps / letters.length) > 0.4;
};

// Excessive punctuation (!!!, ???)
const checkExcessivePunctuation = (text) => {
  const matches = text.match(/[!?]{2,}/g);
  return matches ? matches.length : 0;
};

// ─────────────────────────────────────────────
// MAIN ANALYSIS FUNCTION
// ─────────────────────────────────────────────

function analyzeMessage(message) {
  const text = message.trim();
  const lowerText = text.toLowerCase();

  let score = 0;
  const flaggedKeywords = [];
  const reasons = [];
  const suspiciousWords = [];

  // ── Keyword Scoring ──────────────────────────
  for (const [level, config] of Object.entries(FRAUD_KEYWORDS)) {
    for (const keyword of config.words) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += config.weight;
        flaggedKeywords.push({ keyword, level, weight: config.weight });
        suspiciousWords.push(keyword);
      }
    }
  }

  // ── Safe Indicator Reduction ─────────────────
  let safeCount = 0;
  for (const word of SAFE_INDICATORS.words) {
    if (lowerText.includes(word.toLowerCase())) {
      score += SAFE_INDICATORS.weight;
      safeCount++;
    }
  }

  // ── URL Detection ────────────────────────────
  let urlScore = 0;
  let urlCount = 0;
  for (const pattern of URL_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      urlCount += matches.length;
      urlScore += matches.length * 14;
    }
  }
  if (urlCount > 0) {
    score += urlScore;
    reasons.push(`Contains ${urlCount} suspicious URL(s)`);
    suspiciousWords.push('suspicious link');
  }

  // ── Urgency Pattern Detection ────────────────
  let urgencyCount = 0;
  for (const pattern of URGENCY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) urgencyCount += matches.length;
  }
  if (urgencyCount > 0) {
    score += urgencyCount * 8;
    reasons.push('Uses urgent language to pressure the recipient');
    suspiciousWords.push('urgency tactics');
  }

  // ── Money Pattern Detection ───────────────────
  let moneyCount = 0;
  for (const pattern of MONEY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) moneyCount += matches.length;
  }
  if (moneyCount > 0) {
    score += moneyCount * 6;
    reasons.push('Contains monetary amounts or financial promises');
  }

  // ── Phone Number in Suspicious Context ────────
  let phoneCount = 0;
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) phoneCount += matches.length;
  }
  if (phoneCount > 0) {
    score += phoneCount * 5;
    reasons.push('Asks you to call or contact a phone number');
  }

  // ── All-Caps Abuse ────────────────────────────
  if (checkCapsAbuse(text)) {
    score += 8;
    reasons.push('Excessive use of capital letters');
  }

  // ── Excessive Punctuation ─────────────────────
  const exclamCount = checkExcessivePunctuation(text);
  if (exclamCount > 0) {
    score += exclamCount * 3;
    reasons.push('Excessive use of exclamation/question marks');
  }

  // ── Message Length Check (very short = suspicious) ──
  if (text.length < 30 && urlCount > 0) {
    score += 10;
    reasons.push('Very short message with a link — common phishing pattern');
  }

  // ── OTP Sharing Request ───────────────────────
  if (/share\s+(your\s+)?otp|enter\s+(your\s+)?otp|provide\s+(your\s+)?otp/i.test(text)) {
    score += 25;
    reasons.push('CRITICAL: Asks you to share your OTP — legitimate services NEVER do this');
    suspiciousWords.push('share otp');
  }

  // ── Clamp score to 0–100 ──────────────────────
  score = Math.min(100, Math.max(0, score));

  // ── Risk Classification ───────────────────────
  let risk, result;
  if (score >= 65) {
    risk = 'high';
    result = 'FRAUD';
  } else if (score >= 35) {
    risk = 'medium';
    result = score >= 50 ? 'FRAUD' : 'SAFE';
  } else {
    risk = 'low';
    result = 'SAFE';
  }

  // ── Build Explanation ─────────────────────────
  const topKeywords = flaggedKeywords
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((k) => `"${k.keyword}"`);

  const explanationParts = [];

  if (result === 'FRAUD') {
    explanationParts.push(
      `This message shows ${risk} risk fraud indicators (confidence: ${score}%).`
    );
    if (topKeywords.length > 0) {
      explanationParts.push(
        `Detected suspicious phrases: ${topKeywords.join(', ')}.`
      );
    }
    explanationParts.push(...reasons);
    explanationParts.push(
      'Do NOT click any links, share personal information, or respond to this message.'
    );
  } else {
    if (score > 15) {
      explanationParts.push(
        `This message appears mostly safe (score: ${score}%) but contains some cautionary elements.`
      );
      if (reasons.length > 0) {
        explanationParts.push(`Minor concerns: ${reasons.join('; ')}.`);
      }
    } else {
      explanationParts.push(
        `This message appears to be safe (fraud score: ${score}%).`
      );
      explanationParts.push(
        'No significant fraud indicators were detected. Always remain cautious with unsolicited messages.'
      );
    }
  }

  // Deduplicate suspicious words
  const uniqueSuspiciousWords = [...new Set(suspiciousWords)];

  return {
    result,
    score,
    risk,
    explanation: explanationParts.join(' '),
    flaggedKeywords: flaggedKeywords.slice(0, 10),
    suspiciousWords: uniqueSuspiciousWords,
    detectionDetails: {
      keywordMatches: flaggedKeywords.length,
      urlsDetected: urlCount,
      urgencyPhrases: urgencyCount,
      moneyMentions: moneyCount,
      capsAbuse: checkCapsAbuse(text),
    },
  };
}

module.exports = { analyzeMessage };
