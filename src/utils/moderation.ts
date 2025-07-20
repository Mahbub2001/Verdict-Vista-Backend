// Comprehensive list of banned/inappropriate words for backend validation
const BANNED_WORDS = [
  // Basic inappropriate words
  "stupid",
  "idiot",
  "dumb",
  "moron",
  "imbecile",

  // Profanity
  "damn",
  "hell",
  "crap",
  "shit",
  "fuck",
  "bitch",
  "ass",
  "asshole",

  // Offensive terms
  "retard",
  "retarded",
  "gay",
  "fag",
  "faggot",
  "dyke",

  // Racial slurs and discriminatory terms
  "nigger",
  "nigga",
  "chink",
  "gook",
  "spic",
  "wetback",
  "kike",

  // Hate speech
  "nazi",
  "hitler",
  "terrorist",
  "rapist",
  "pedophile",

  // Body shaming
  "ugly",
  "fat",
  "skinny",
  "disgusting",
  "hideous",

  // Common toxic phrases
  "kill yourself",
  "kys",
  "go die",
  "waste of space",
  "piece of shit",

  // Abbreviations and leetspeak
  "stfu",
  "gtfo",
  "pos",
  "sob",
  "wtf",
  "omfg",
  "fu",
  "fuk",
  "fck",

  // Additional inappropriate terms
  "loser",
  "pathetic",
  "worthless",
  "trash",
  "garbage",
  "scum",
];

// Words that might have legitimate uses but should be flagged in certain contexts
const CONTEXTUAL_WORDS = [
  "hate",
  "kill",
  "die",
  "murder",
  "suicide",
  "rape",
  "abuse",
];

export interface ModerationResult {
  isClean: boolean;
  bannedWords: string[];
  contextualWords: string[];
  severity: "low" | "medium" | "high";
  suggestion?: string;
}


export function moderateText(
  text: string,
  strictMode: boolean = false
): ModerationResult {
  const normalizedText = text.toLowerCase();
  const foundBannedWords: string[] = [];
  const foundContextualWords: string[] = [];

  // Check for banned words
  BANNED_WORDS.forEach((word) => {
    const wordPattern = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    if (wordPattern.test(normalizedText)) {
      foundBannedWords.push(word);
    }
  });

  // Check for contextual words if in strict mode
  if (strictMode) {
    CONTEXTUAL_WORDS.forEach((word) => {
      const wordPattern = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      if (wordPattern.test(normalizedText)) {
        foundContextualWords.push(word);
      }
    });
  }

  // Determine severity
  let severity: "low" | "medium" | "high" = "low";
  if (foundBannedWords.length > 2) {
    severity = "high";
  } else if (foundBannedWords.length > 0) {
    severity = "medium";
  } else if (foundContextualWords.length > 1) {
    severity = "medium";
  }

  const isClean =
    foundBannedWords.length === 0 &&
    (!strictMode || foundContextualWords.length === 0);

  let suggestion = "";
  if (!isClean) {
    if (foundBannedWords.length > 0) {
      suggestion =
        "Please remove inappropriate language and focus on constructive debate.";
    } else if (foundContextualWords.length > 0) {
      suggestion = "Consider rephrasing to maintain a respectful discussion.";
    }
  }

  return {
    isClean,
    bannedWords: foundBannedWords,
    contextualWords: foundContextualWords,
    severity,
    suggestion,
  };
}


export function sanitizeText(text: string): string {
  let sanitizedText = text;

  BANNED_WORDS.forEach((word) => {
    const wordPattern = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    const replacement = "*".repeat(word.length);
    sanitizedText = sanitizedText.replace(wordPattern, replacement);
  });

  return sanitizedText;
}


export function isTextClean(text: string): boolean {
  return moderateText(text).isClean;
}


export function getModerationErrorMessage(result: ModerationResult): string {
  if (result.isClean) return "";

  const { bannedWords, contextualWords, severity, suggestion } = result;

  let message = "";

  if (bannedWords.length > 0) {
    if (severity === "high") {
      message =
        "Your message contains multiple inappropriate words that violate our community guidelines.";
    } else {
      message = `Your message contains inappropriate language: "${bannedWords.join('", "')}"`;
    }
  } else if (contextualWords.length > 0) {
    message = `Your message may contain potentially sensitive content: "${contextualWords.join('", "')}"`;
  }

  if (suggestion) {
    message += ` ${suggestion}`;
  }

  return message;
}
