// src/core/engine.ts
import { RedactionRule, AppSettings } from '../types';

/**
 * Escapes special characters in a string for use in a regular expression.
 * This ensures that literal strings are treated as plain text and not as regex patterns.
 * @param text The string to escape.
 * @returns The escaped string, safe for use in a RegExp constructor.
 */
const escapeRegExp = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * The core redaction engine.
 * Processes a given text through a set of literal and regex rules,
 * applying them in a specific order and handling persistent numbering for PII.
 *
 * @param text The input string to redact.
 * @param rules An array of user-defined RedactionRule objects.
 * @param settings The application settings, including the delimiter style.
 * @returns The final redacted string.
 */
export const performRedaction = (text: string, rules: RedactionRule[], settings: AppSettings): string => {
  let processedText = text;
  const piiMap = new Map<string, string>();
  let piiCounter = 1;

  // 1. Separate rules into literal and regex types.
  // Only enabled rules are considered for redaction.
  const literalRules = rules.filter(r => r.type === 'literal' && r.enabled);
  const regexRules = rules.filter(r => r.type === 'regex' && r.enabled);

  // 2. Process all literal rules first, in the order they are provided.
  // This step handles exact string matches.
  for (const rule of literalRules) {
    // A regex is created from the literal string to replace all occurrences globally ('g' flag).
    const findRegex = new RegExp(escapeRegExp(rule.find), 'g');
    processedText = processedText.replace(findRegex, rule.replace);
  }

  // 3. Process all regex rules on the result of the literal replacements.
  for (const rule of regexRules) {
    try {
      // The user-defined regex pattern is used to find matches.
      const findRegex = new RegExp(rule.find, 'g');
      processedText = processedText.replace(findRegex, (match) => {
        
        // Implement persistent numbering logic for unique PII instances.
        // If the same sensitive string (e.g., a specific phone number) has been seen before,
        // reuse its assigned placeholder.
        if (piiMap.has(match)) {
          return piiMap.get(match)!;
        } else {
          // If this is a new sensitive string, create a new numbered placeholder.
          // The placeholder format is determined by the user's settings.
          const startDelimiter = settings.replaceTextUsing.substring(0, 2);
          const endDelimiter = settings.replaceTextUsing.substring(2, 4);
          const newPlaceholder = `${startDelimiter}${rule.replace} ${piiCounter}${endDelimiter}`;
          
          // Store the new placeholder in the map for future occurrences.
          piiMap.set(match, newPlaceholder);
          piiCounter++;
          return newPlaceholder;
        }
      });
    } catch (e) {
      // Log an error if a user-provided regex is invalid, preventing the extension from crashing.
      console.error(`Invalid regex for rule: "${rule.find}"`, e);
    }
  }

  return processedText;
};