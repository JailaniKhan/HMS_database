<?php

namespace App\Http\Controllers\Concerns;

trait HasSanitization
{
    /**
     * Sanitize string input for XSS protection
     */
    protected function sanitizeString(?string $value): string
    {
        return htmlspecialchars(strip_tags($value ?? ''), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize phone number
     */
    protected function sanitizePhone(?string $phone): string
    {
        return preg_replace('/[^0-9+\-\s\(\)]/', '', $phone ?? '');
    }

    /**
     * Validate and sanitize integer
     */
    protected function sanitizeInt($value, ?int $default = null): ?int
    {
        $result = filter_var($value, FILTER_VALIDATE_INT);
        return $result !== false ? $result : $default;
    }

    /**
     * Validate and sanitize float
     */
    protected function sanitizeFloat($value, ?float $default = null): ?float
    {
        $result = filter_var($value, FILTER_VALIDATE_FLOAT);
        return $result !== false ? $result : $default;
    }

    /**
     * Sanitize blood group
     */
    protected function sanitizeBloodGroup(?string $bloodGroup): ?string
    {
        $validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        return in_array($bloodGroup, $validGroups) ? $bloodGroup : null;
    }

    /**
     * Sanitize gender
     */
    protected function sanitizeGender(?string $gender): ?string
    {
        $validGenders = ['male', 'female', 'other'];
        return in_array($gender, $validGenders) ? $gender : null;
    }

    /**
     * Sanitize search term
     */
    protected function sanitizeSearchTerm(?string $term): string
    {
        return preg_replace('/[^a-zA-Z0-9\s\-_.]/', '', $term ?? '');
    }
}