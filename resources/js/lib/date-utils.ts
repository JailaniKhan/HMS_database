/**
 * Date formatting utilities
 * Centralized date handling for consistent formatting across the application
 */

import { format, parseISO, formatDistanceToNow, differenceInDays, differenceInMonths, isValid } from 'date-fns';

/**
 * Format a date string or Date object
 * @param date - The date to format
 * @param formatStr - The format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (
    date: string | Date | null | undefined,
    formatStr: string = 'MMM d, yyyy'
): string => {
    if (!date) {
        return '-';
    }

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return '-';
        }
        return format(dateObj, formatStr);
    } catch {
        return '-';
    }
};

/**
 * Format a date with time
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (
    date: string | Date | null | undefined
): string => {
    return formatDate(date, 'MMM d, yyyy h:mm a');
};

/**
 * Format a date for display in tables
 * @param date - The date to format
 * @returns Formatted date string for tables
 */
export const formatDateShort = (
    date: string | Date | null | undefined
): string => {
    return formatDate(date, 'MM/dd/yyyy');
};

/**
 * Format a time only
 * @param date - The date to format
 * @returns Formatted time string
 */
export const formatTime = (
    date: string | Date | null | undefined
): string => {
    return formatDate(date, 'h:mm a');
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - The date to compare
 * @returns Relative time string
 */
export const getRelativeTime = (
    date: string | Date | null | undefined
): string => {
    if (!date) {
        return '-';
    }

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return '-';
        }
        return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
        return '-';
    }
};

/**
 * Calculate days until a future date (or days since a past date)
 * @param date - The target date
 * @returns Number of days (positive for future, negative for past)
 */
export const getDaysUntil = (date: string | Date | null | undefined): number | null => {
    if (!date) {
        return null;
    }

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return null;
        }
        return differenceInDays(dateObj, new Date());
    } catch {
        return null;
    }
};

/**
 * Calculate months until a future date
 * @param date - The target date
 * @returns Number of months
 */
export const getMonthsUntil = (date: string | Date | null | undefined): number | null => {
    if (!date) {
        return null;
    }

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return null;
        }
        return differenceInMonths(dateObj, new Date());
    } catch {
        return null;
    }
};

/**
 * Check if a date is expired
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export const isExpired = (date: string | Date | null | undefined): boolean => {
    const days = getDaysUntil(date);
    return days !== null && days < 0;
};

/**
 * Check if a date is expiring soon
 * @param date - The date to check
 * @param thresholdDays - Number of days threshold (default: 30)
 * @returns True if the date is within the threshold
 */
export const isExpiringSoon = (
    date: string | Date | null | undefined,
    thresholdDays: number = 30
): boolean => {
    const days = getDaysUntil(date);
    return days !== null && days >= 0 && days <= thresholdDays;
};

/**
 * Get expiry status
 * @param date - The expiry date
 * @param warningDays - Days before expiry to show warning (default: 30)
 * @returns Status string: 'expired', 'expiring-soon', or 'valid'
 */
export const getExpiryStatus = (
    date: string | Date | null | undefined,
    warningDays: number = 30
): 'expired' | 'expiring-soon' | 'valid' => {
    if (!date) {
        return 'valid';
    }

    const days = getDaysUntil(date);
    if (days === null) {
        return 'valid';
    }

    if (days < 0) {
        return 'expired';
    }

    if (days <= warningDays) {
        return 'expiring-soon';
    }

    return 'valid';
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param date - The date to format
 * @returns Formatted date string for input
 */
export const formatDateForInput = (
    date: string | Date | null | undefined
): string => {
    return formatDate(date, 'yyyy-MM-dd');
};

/**
 * Format a datetime for input fields (YYYY-MM-DDTHH:mm)
 * @param date - The date to format
 * @returns Formatted datetime string for input
 */
export const formatDateTimeForInput = (
    date: string | Date | null | undefined
): string => {
    return formatDate(date, "yyyy-MM-dd'T'HH:mm");
};

/**
 * Get today's date formatted for input
 * @returns Today's date string
 */
export const getTodayForInput = (): string => {
    return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get current datetime formatted for input
 * @returns Current datetime string
 */
export const getNowForInput = (): string => {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
};

/**
 * Parse a date string to Date object
 * @param dateStr - The date string to parse
 * @returns Date object or null if invalid
 */
export const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) {
        return null;
    }

    try {
        const date = parseISO(dateStr);
        return isValid(date) ? date : null;
    } catch {
        return null;
    }
};

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
    DISPLAY: 'MMM d, yyyy',
    DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
    SHORT: 'MM/dd/yyyy',
    INPUT: 'yyyy-MM-dd',
    INPUT_DATETIME: "yyyy-MM-dd'T'HH:mm",
    TIME: 'h:mm a',
    TIME_24: 'HH:mm',
    MONTH_YEAR: 'MMMM yyyy',
    DAY_MONTH: 'MMM d',
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

/**
 * Get a human-readable expiry message
 * @param date - The expiry date
 * @returns Human-readable message
 */
export const getExpiryMessage = (
    date: string | Date | null | undefined
): string => {
    if (!date) {
        return 'No expiry date';
    }

    const days = getDaysUntil(date);
    if (days === null) {
        return 'Invalid date';
    }

    if (days < 0) {
        return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    }

    if (days === 0) {
        return 'Expires today';
    }

    if (days === 1) {
        return 'Expires tomorrow';
    }

    if (days <= 7) {
        return `Expires in ${days} days`;
    }

    if (days <= 30) {
        const weeks = Math.floor(days / 7);
        return `Expires in ${weeks} week${weeks !== 1 ? 's' : ''}`;
    }

    const months = Math.floor(days / 30);
    if (months > 0) {
        return `Expires in ${months} month${months !== 1 ? 's' : ''}`;
    }

    return `Expires in ${days} days`;
};