export interface ModerationResult {
    isClean: boolean;
    bannedWords: string[];
    contextualWords: string[];
    severity: "low" | "medium" | "high";
    suggestion?: string;
}
export declare function moderateText(text: string, strictMode?: boolean): ModerationResult;
export declare function sanitizeText(text: string): string;
export declare function isTextClean(text: string): boolean;
export declare function getModerationErrorMessage(result: ModerationResult): string;
//# sourceMappingURL=moderation.d.ts.map