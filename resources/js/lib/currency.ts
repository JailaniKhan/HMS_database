/**
 * Currency formatting utilities
 * Centralized currency handling for consistent formatting across the application
 */

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: AFN)
 * @param locale - The locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number | null | undefined,
    currency: string = 'AFN',
    locale: string = 'en-US'
): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return formatCurrency(0, currency, locale);
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Format a number with specified decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale for formatting (default: en-US)
 * @returns Formatted number string
 */
export const formatNumber = (
    value: number | null | undefined,
    decimals: number = 2,
    locale: string = 'en-US'
): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return formatNumber(0, decimals, locale);
    }

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/**
 * Format a number as a percentage
 * @param value - The decimal value to format as percentage (e.g., 0.25 for 25%)
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - The locale for formatting (default: en-US)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
    value: number | null | undefined,
    decimals: number = 1,
    locale: string = 'en-US'
): string => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }

    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/**
 * Parse a currency string back to a number
 * @param value - The currency string to parse
 * @returns The numeric value
 */
export const parseCurrency = (value: string): number => {
    // Remove currency symbols and whitespace
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate the sum of an array of numbers
 * @param values - Array of numbers to sum
 * @returns The sum
 */
export const sumValues = (values: (number | null | undefined)[]): number => {
    return values.reduce((sum: number, val: number | null | undefined) => sum + (val ?? 0), 0);
};

/**
 * Round a number to specified decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns The rounded number
 */
export const roundTo = (value: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

/**
 * Currency symbols for common currencies
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
    AFN: '؋',
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: '₨',
    INR: '₹',
    AED: 'د.إ',
    SAR: '﷼',
};

/**
 * Get the currency symbol for a currency code
 * @param currencyCode - The ISO currency code
 * @returns The currency symbol
 */
export const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};