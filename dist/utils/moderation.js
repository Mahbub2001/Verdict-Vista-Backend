"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateText = moderateText;
exports.sanitizeText = sanitizeText;
exports.isTextClean = isTextClean;
exports.getModerationErrorMessage = getModerationErrorMessage;
const BANNED_WORDS = [
    "stupid",
    "idiot",
    "dumb",
    "moron",
    "imbecile",
    "damn",
    "hell",
    "crap",
    "shit",
    "fuck",
    "bitch",
    "ass",
    "asshole",
    "retard",
    "retarded",
    "gay",
    "fag",
    "faggot",
    "dyke",
    "nigger",
    "nigga",
    "chink",
    "gook",
    "spic",
    "wetback",
    "kike",
    "nazi",
    "hitler",
    "terrorist",
    "rapist",
    "pedophile",
    "ugly",
    "fat",
    "skinny",
    "disgusting",
    "hideous",
    "kill yourself",
    "kys",
    "go die",
    "waste of space",
    "piece of shit",
    "stfu",
    "gtfo",
    "pos",
    "sob",
    "wtf",
    "omfg",
    "fu",
    "fuk",
    "fck",
    "loser",
    "pathetic",
    "worthless",
    "trash",
    "garbage",
    "scum",
];
const CONTEXTUAL_WORDS = [
    "hate",
    "kill",
    "die",
    "murder",
    "suicide",
    "rape",
    "abuse",
];
function moderateText(text, strictMode = false) {
    const normalizedText = text.toLowerCase();
    const foundBannedWords = [];
    const foundContextualWords = [];
    BANNED_WORDS.forEach((word) => {
        const wordPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        if (wordPattern.test(normalizedText)) {
            foundBannedWords.push(word);
        }
    });
    if (strictMode) {
        CONTEXTUAL_WORDS.forEach((word) => {
            const wordPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
            if (wordPattern.test(normalizedText)) {
                foundContextualWords.push(word);
            }
        });
    }
    let severity = "low";
    if (foundBannedWords.length > 2) {
        severity = "high";
    }
    else if (foundBannedWords.length > 0) {
        severity = "medium";
    }
    else if (foundContextualWords.length > 1) {
        severity = "medium";
    }
    const isClean = foundBannedWords.length === 0 &&
        (!strictMode || foundContextualWords.length === 0);
    let suggestion = "";
    if (!isClean) {
        if (foundBannedWords.length > 0) {
            suggestion =
                "Please remove inappropriate language and focus on constructive debate.";
        }
        else if (foundContextualWords.length > 0) {
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
function sanitizeText(text) {
    let sanitizedText = text;
    BANNED_WORDS.forEach((word) => {
        const wordPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        const replacement = "*".repeat(word.length);
        sanitizedText = sanitizedText.replace(wordPattern, replacement);
    });
    return sanitizedText;
}
function isTextClean(text) {
    return moderateText(text).isClean;
}
function getModerationErrorMessage(result) {
    if (result.isClean)
        return "";
    const { bannedWords, contextualWords, severity, suggestion } = result;
    let message = "";
    if (bannedWords.length > 0) {
        if (severity === "high") {
            message =
                "Your message contains multiple inappropriate words that violate our community guidelines.";
        }
        else {
            message = `Your message contains inappropriate language: "${bannedWords.join('", "')}"`;
        }
    }
    else if (contextualWords.length > 0) {
        message = `Your message may contain potentially sensitive content: "${contextualWords.join('", "')}"`;
    }
    if (suggestion) {
        message += ` ${suggestion}`;
    }
    return message;
}
//# sourceMappingURL=moderation.js.map