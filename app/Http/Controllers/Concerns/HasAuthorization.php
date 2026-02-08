<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Bill;
use App\Models\Patient;

trait HasAuthorization
{
    /**
     * Check if user can access bills
     */
    protected function authorizeBillingAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-billing')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify bills
     */
    protected function authorizeBillingModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-billing')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can access this specific bill
     */
    protected function canAccessBill(Bill $bill): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        // Super admin can access all bills
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users with broad billing permissions
        if ($user->hasPermission('view-all-billing')) {
            return true;
        }

        // Creator access
        if ($bill->created_by === $user->id) {
            return true;
        }

        // Patient access (for patient portal)
        if ($bill->patient && $bill->patient->user_id === $user->id) {
            return true;
        }

        return $user->hasPermission('view-billing');
    }

    /**
     * Check if user can modify this specific bill
     */
    protected function canModifyBill(Bill $bill): bool
    {
        // Cannot modify paid or voided bills
        if ($bill->payment_status === 'paid' || $bill->voided_at) {
            return false;
        }

        return $this->canAccessBill($bill) &&
               auth()->user()?->hasPermission('edit-billing');
    }

    /**
     * Check if user can access patients
     */
    protected function authorizePatientAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-patients')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify patients
     */
    protected function authorizePatientModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-patients')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can access this specific patient
     */
    protected function canAccessPatient(Patient $patient): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        // Super admin can access all patients
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users with broad permissions can access all patients
        if ($user->hasPermission('view-all-patients')) {
            return true;
        }

        // Owner access (patients viewing their own data in portal)
        if ($patient->user_id === $user->id) {
            return true;
        }

        return $user->hasPermission('view-patients');
    }
}