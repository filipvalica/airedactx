// src/core/engine.ts
import { RedactionRule, AppSettings } from '../types';

const escapeRegExp = (text: string): string => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const performRedaction = (text: string, rules: RedactionRule[], settings: AppSettings): string => {
  let processedText = text;
  const piiMap = new Map<string, string>();
  // Use a map to track counters for each redaction type (e.g., "SSN", "Email")
  const piiTypeCounters = new Map<string, number>();

  const literalRules = rules.filter(r => r.type === 'literal' && r.enabled);
  const regexRules = rules.filter(r => r.type === 'regex' && r.enabled);

  // Get delimiters from settings
  const startDelimiter = settings.replaceTextUsing.slice(0, 2);
  const endDelimiter = settings.replaceTextUsing.slice(-2);

  // 1. Process Literal Rules
  for (const rule of literalRules) {
    const findRegex = new RegExp(escapeRegExp(rule.find), 'g');
    // Wrap the literal replacement text with the selected delimiters
    const replacement = `${startDelimiter}${rule.replace}${endDelimiter}`;
    processedText = processedText.replace(findRegex, replacement);
  }

  // 2. Process Regex Rules
  for (const rule of regexRules) {
    try {
      const findRegex = new RegExp(rule.find, 'g');
      processedText = processedText.replace(findRegex, (match) => {
        if (piiMap.has(match)) {
          return piiMap.get(match)!;
        } else {
          // Get the current counter for this PII type, defaulting to 1
          const counter = (piiTypeCounters.get(rule.replace) || 0) + 1;
          piiTypeCounters.set(rule.replace, counter);
          
          // Create the new placeholder with the correct numbering
          const newPlaceholder = `${startDelimiter}${rule.replace}-${counter}${endDelimiter}`;
          
          piiMap.set(match, newPlaceholder);
          return newPlaceholder;
        }
      });
    } catch (e) {
      console.error(`Invalid regex for rule: "${rule.find}"`, e);
    }
  }

  return processedText;
};