/**
 * @module Sanitizer
 * @description XSS-safe renderer for untrusted AI-generated content in the Atmos frontend.
 *
 * AI responses from Gemini (and the local fallback engine) must never be injected as
 * raw HTML — doing so would expose users to Cross-Site Scripting (XSS) attacks if the
 * AI generates malicious output. This module provides a React-native renderer that:
 * - Converts markdown bold syntax (`**text**`) to `<strong>` elements.
 * - Converts markdown bullet lists (`* item`) to bullet-prefixed text lines.
 * - Renders line breaks as `<br />` elements.
 * - Never uses `dangerouslySetInnerHTML`.
 */

import React from "react";

/**
 * Renders untrusted AI-generated markdown text as safe React elements.
 *
 * Parses the input string line by line, applying minimal markdown transformations
 * (bold, bullets, newlines) without using `dangerouslySetInnerHTML`. This prevents
 * XSS injection from AI-generated content while preserving basic formatting.
 *
 * Supported markdown:
 * - `**bold text**` → `<strong>bold text</strong>`
 * - `* bullet item` → `• bullet item` (text prefix, no `<ul>`)
 * - `\n` → `<br />`
 *
 * @param {string} text - The raw AI-generated text string to render safely.
 * @returns {React.ReactElement} A `<span>` containing the sanitized, formatted content.
 *
 * @example
 * ```tsx
 * <div>{renderSafeAIContent(coachData.insight)}</div>
 * ```
 */
export const renderSafeAIContent = (text: string): React.ReactElement => {
  const lines = text.split("\n");

  return (
    <span className="text-sm leading-relaxed">
      {lines.map((line, lineIdx) => {
        // Convert bullet markdown to unicode bullet prefix
        let processedLine = line;
        const bulletMatch = line.match(/^\s*\*\s+(.*)$/);
        if (bulletMatch) {
          processedLine = `• ${bulletMatch[1]}`;
        }

        // Split line into bold and non-bold segments using the **text** pattern
        const segments = processedLine.split(/(\*\*.*?\*\*)/g);

        return (
          <React.Fragment key={`line-${lineIdx}`}>
            {lineIdx > 0 && <br />}
            {segments.map((segment, segIdx) => {
              if (segment.startsWith("**") && segment.endsWith("**")) {
                return (
                  <strong key={`seg-${segIdx}`}>
                    {segment.slice(2, -2)}
                  </strong>
                );
              }
              return segment;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
};
