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

  const literalRules = rules.filter(r => r.type === 'literal' && r.enabled);
  const regexRules = rules.filter(r => r.type === 'regex' && r.enabled);

  for (const rule of literalRules) {
    const findRegex = new RegExp(escapeRegExp(rule.find), 'g');
    processedText = processedText.replace(findRegex, rule.replace);
  }

  for (const rule of regexRules) {
    try {
      const findRegex = new RegExp(rule.find, 'g');
      processedText = processedText.replace(findRegex, (match) => {
        if (piiMap.has(match)) {
          return piiMap.get(match)!;
        } else {
          // CORRECTED LOGIC: Use slice(-2) to get the last two characters for the end delimiter.
          const startDelimiter = settings.replaceTextUsing.slice(0, 2);
          const endDelimiter = settings.replaceTextUsing.slice(-2);
          const newPlaceholder = `${startDelimiter}${rule.replace} ${piiCounter}${endDelimiter}`;
          
          piiMap.set(match, newPlaceholder);
          piiCounter++;
          return newPlaceholder;
        }
      });
    } catch (e) {
      console.error(`Invalid regex for rule: "${rule.find}"`, e);
    }
  }

  return processedText;
};