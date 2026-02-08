/**
 * Enhanced accessibility hooks and utilities
 * Provides comprehensive accessibility support for React applications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/services/logger';

// ARIA live region types
type AriaLivePoliteness = 'off' | 'polite' | 'assertive';

// Focus management interfaces
interface FocusTrapOptions {
  initialFocus?: HTMLElement | string;
  allowOutsideClick?: boolean;
  clickOutsideDeactivates?: boolean;
  escapeDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
}

// Screen reader announcement interface
interface ScreenReaderAnnouncement {
  id: string;
  message: string;
  politeness: AriaLivePoliteness;
  timestamp: number;
}

// Custom hook for screen reader announcements
export function useScreenReader() {
  const [announcements, setAnnouncements] = useState<ScreenReaderAnnouncement[]>([]);
  const announcementId = useRef(0);

  const announce = useCallback((
    message: string, 
    politeness: AriaLivePoliteness = 'polite'
  ) => {
    const id = `sr-${++announcementId.current}`;
    const announcement: ScreenReaderAnnouncement = {
      id,
      message,
      politeness,
      timestamp: Date.now()
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Remove announcement after it's been read (approximately 500ms delay)
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  const announceError = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announcements,
    announce,
    announceError,
    announceSuccess
  };
}

// Custom hook for focus trapping
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: FocusTrapOptions = {}
) {
  const {
    initialFocus,
    allowOutsideClick = false,
    clickOutsideDeactivates = false,
    escapeDeactivates = true,
    returnFocusOnDeactivate = true
  } = options;

  const previousFocusedElement = useRef<HTMLElement | null>(null);
  const isActive = useRef(false);

  const activate = useCallback(() => {
    if (!containerRef.current || isActive.current) return;

    isActive.current = true;
    previousFocusedElement.current = document.activeElement as HTMLElement | null;

    // Set initial focus
    let focusElement: HTMLElement | null = null;
    
    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        focusElement = containerRef.current.querySelector(initialFocus);
      } else {
        focusElement = initialFocus;
      }
    }

    if (!focusElement) {
      // Find first focusable element
      focusElement = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
    }

    if (focusElement) {
      focusElement.focus();
    }
  }, [containerRef, initialFocus]);

  const deactivate = useCallback(() => {
    if (!isActive.current) return;

    isActive.current = false;

    if (returnFocusOnDeactivate && previousFocusedElement.current) {
      previousFocusedElement.current.focus();
      previousFocusedElement.current = null;
    }
  }, [returnFocusOnDeactivate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive.current) return;

      // Handle Escape key
      if (e.key === 'Escape' && escapeDeactivates) {
        e.preventDefault();
        deactivate();
        return;
      }

      // Handle Tab key for focus trapping
      if (e.key === 'Tab') {
        const focusableElements = containerRef.current!.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (e.shiftKey) {
          // Shift + Tab - move to previous element
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab - move to next element
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (!isActive.current || allowOutsideClick) return;
      
      if (clickOutsideDeactivates && !containerRef.current!.contains(e.target as Node)) {
        deactivate();
      }
    };

    // Activate trap
    activate();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      deactivate();
    };
  }, [containerRef, activate, deactivate, allowOutsideClick, clickOutsideDeactivates, escapeDeactivates]);

  return { activate, deactivate };
}

// Custom hook for keyboard navigation
export function useKeyboardNavigation<T extends HTMLElement = HTMLElement>() {
  const containerRef = useRef<T>(null);

  const setupNavigation = useCallback((
    direction: 'vertical' | 'horizontal' | 'grid' = 'vertical'
  ) => {
    if (!containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      if (!containerRef.current!.contains(activeElement)) return;

      const focusableElements = Array.from(
        containerRef.current!.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(activeElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (direction === 'vertical' || direction === 'grid') {
            nextIndex = (currentIndex + 1) % focusableElements.length;
          }
          break;
          
        case 'ArrowUp':
          if (direction === 'vertical' || direction === 'grid') {
            nextIndex = currentIndex === 0 
              ? focusableElements.length - 1 
              : currentIndex - 1;
          }
          break;
          
        case 'ArrowRight':
          if (direction === 'horizontal' || direction === 'grid') {
            nextIndex = (currentIndex + 1) % focusableElements.length;
          }
          break;
          
        case 'ArrowLeft':
          if (direction === 'horizontal' || direction === 'grid') {
            nextIndex = currentIndex === 0 
              ? focusableElements.length - 1 
              : currentIndex - 1;
          }
          break;
          
        case 'Home':
          nextIndex = 0;
          break;
          
        case 'End':
          nextIndex = focusableElements.length - 1;
          break;
          
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        e.preventDefault();
        focusableElements[nextIndex].focus();
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  return { containerRef, setupNavigation };
}

// Custom hook for skip links
export function useSkipLink(targetId: string) {
  useEffect(() => {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = 'Skip to main content';
    link.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:p-2 focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    // Screen reader only styles
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .sr-only.focus:not(.sr-only) {
        position: static;
        width: auto;
        height: auto;
        padding: 0;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `;
    
    document.head.appendChild(style);
    document.body.insertBefore(link, document.body.firstChild);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [targetId]);
}

// Custom hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

// Custom hook for high contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const detectHighContrast = () => {
      const testElement = document.createElement('div');
      testElement.style.borderTop = '1px solid transparent';
      testElement.style.borderBottom = '1px solid black';
      document.body.appendChild(testElement);
      
      const rect = testElement.getBoundingClientRect();
      const isHighContrastMode = rect.top === rect.bottom;
      
      document.body.removeChild(testElement);
      return isHighContrastMode;
    };

    setIsHighContrast(detectHighContrast());
    
    // Check periodically as it can change
    const interval = setInterval(() => {
      setIsHighContrast(detectHighContrast());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return isHighContrast;
}

// Accessibility utility functions
export const AccessibilityUtils = {
  // Generate unique IDs for accessibility attributes
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if element is visible to screen readers
  isVisibleToScreenReaders: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    
    return (
      computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden' &&
      computedStyle.opacity !== '0' &&
      element.getAttribute('aria-hidden') !== 'true'
    );
  },

  // Focus first focusable element in container
  focusFirstFocusable: (container: HTMLElement): boolean => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement | null;
    
    if (focusable) {
      focusable.focus();
      return true;
    }
    return false;
  },

  // Create accessible error message
  createErrorMessage: (fieldId: string, message: string): string => {
    return `${fieldId}-error`;
  },

  // Announce form errors to screen readers
  announceFormErrors: (errors: Record<string, string>): void => {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      const announcement = `Form contains ${errorMessages.length} error${errorMessages.length > 1 ? 's' : ''}: ${errorMessages.join(', ')}`;
      // This would integrate with useScreenReader hook
      logger.info('Form errors announced to screen reader', { errorCount: errorMessages.length });
    }
  }
};

// ARIA attribute helpers
export const AriaHelpers = {
  // Set multiple ARIA attributes at once
  setAttributes: (element: HTMLElement, attributes: Record<string, string>): void => {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value);
    });
  },

  // Remove multiple ARIA attributes
  removeAttributes: (element: HTMLElement, keys: string[]): void => {
    keys.forEach(key => {
      element.removeAttribute(`aria-${key}`);
    });
  },

  // Toggle ARIA expanded state
  toggleExpanded: (element: HTMLElement): void => {
    const isExpanded = element.getAttribute('aria-expanded') === 'true';
    element.setAttribute('aria-expanded', String(!isExpanded));
  },

  // Set ARIA busy state
  setBusy: (element: HTMLElement, isBusy: boolean): void => {
    element.setAttribute('aria-busy', String(isBusy));
    if (isBusy) {
      element.setAttribute('aria-live', 'polite');
    } else {
      element.removeAttribute('aria-live');
    }
  }
};