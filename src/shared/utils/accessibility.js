/**
 * @fileoverview Accessibility helpers for CivicMind AI.
 * Provides focus management, keyboard trap utilities, and
 * screen reader announcement functions.
 */

/**
 * Safely focuses a React ref element.
 * No-ops gracefully if the ref is null or the element has no focus method.
 *
 * @param {React.RefObject} ref - React ref pointing to a DOM element
 * @returns {void}
 *
 * @example
 * const titleRef = useRef(null);
 * useEffect(() => { focusElement(titleRef); }, [currentStep]);
 */
export function focusElement(ref) {
  if (ref && ref.current && typeof ref.current.focus === 'function') {
    // Use setTimeout to ensure the element is rendered and visible
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus({ preventScroll: false });
      }
    }, 50);
  }
}

/**
 * Creates a keyboard focus trap within a container element.
 * Cycles focus between the first and last focusable elements when
 * Tab or Shift+Tab is pressed. Returns a cleanup function.
 *
 * @param {React.RefObject} containerRef - Ref to the modal/dialog container
 * @returns {Function} Cleanup function to remove the event listener
 *
 * @example
 * useEffect(() => {
 *   const cleanup = trapFocus(modalRef);
 *   return cleanup;
 * }, [isOpen]);
 */
export function trapFocus(containerRef) {
  const container = containerRef?.current;
  if (!container) {
    return () => {};
  }

  const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const getFocusableElements = () =>
    Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
      (el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]')
    );

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      return;
    }

    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      }
    } else {
      if (document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus the first focusable element on mount
  const focusable = getFocusableElements();
  if (focusable.length > 0) {
    focusable[0].focus();
  }

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// ── Screen reader live region singleton ──────────────────────────────────────
let liveRegion = null;

/**
 * Announces a message to screen readers via an ARIA live region.
 * Creates the live region element on first call and reuses it thereafter.
 *
 * @param {string} message - Text to announce
 * @param {'polite'|'assertive'} [politeness='polite'] - ARIA live politeness level
 * @returns {void}
 *
 * @example
 * announceToScreenReader('Step 2 of 5 loaded', 'polite');
 * announceToScreenReader('Error: could not send message', 'assertive');
 */
export function announceToScreenReader(message, politeness = 'polite') {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    document.body.appendChild(liveRegion);
  } else {
    liveRegion.setAttribute('aria-live', politeness);
  }

  // Clear and re-set to force re-announcement
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  });
}
