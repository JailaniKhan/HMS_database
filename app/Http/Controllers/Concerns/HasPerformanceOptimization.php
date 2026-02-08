<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Builder;

trait HasPerformanceOptimization
{
    /**
     * Get cached static data
     */
    protected function getCachedStaticData(string $cacheKey, callable $callback, int $minutes = 60): mixed
    {
        return Cache::remember($cacheKey, $minutes * 60, $callback);
    }

    /**
     * Clear static data cache
     */
    protected function clearStaticCache(string $pattern): void
    {
        // Note: In production, use Cache::tags() for better cache management
        Cache::flush();
    }

    /**
     * Apply eager loading with optimized select
     */
    protected function withOptimizedRelations(Builder $query, array $relations): Builder
    {
        foreach ($relations as $relation => $columns) {
            if (is_string($relation)) {
                $query->with([$relation => function ($q) use ($columns) {
                    $q->select($columns);
                }]);
            } else {
                $query->with($columns);
            }
        }
        return $query;
    }

    /**
     * Optimize query with pagination and select
     */
    protected function optimizeIndexQuery(Builder $query, ?int $perPage = null, array $select = ['*']): mixed
    {
        $pageSize = min(max($perPage ?? 15, 1), 100);

        return $query
            ->select($select)
            ->paginate($pageSize)
            ->withQueryString();
    }

    /**
     * Get medicine categories (cached)
     */
    protected function getMedicineCategories(): mixed
    {
        return $this->getCachedStaticData('medicine_categories', function () {
            return \App\Models\MedicineCategory::select('id', 'name', 'description')
                ->orderBy('name')
                ->get();
        }, 120);
    }

    /**
     * Get departments (cached)
     */
    protected function getDepartments(): mixed
    {
        return $this->getCachedStaticData('departments', function () {
            return \App\Models\Department::select('id', 'name', 'code')
                ->orderBy('name')
                ->get();
        }, 120);
    }

    /**
     * Get suppliers (cached)
     */
    protected function getSuppliers(): mixed
    {
        return $this->getCachedStaticData('suppliers', function () {
            return \App\Models\Supplier::select('id', 'name', 'phone', 'email', 'status')
                ->orderBy('name')
                ->get();
        }, 60);
    }

    /**
     * Get insurance providers (cached)
     */
    protected function getInsuranceProviders(): mixed
    {
        return $this->getCachedStaticData('insurance_providers', function () {
            return \App\Models\InsuranceProvider::select('id', 'name', 'code', 'status')
                ->where('status', 'active')
                ->orderBy('name')
                ->get();
        }, 60);
    }

    /**
     * Get doctors list (cached for 5 minutes)
     */
    protected function getDoctorsList(): mixed
    {
        return $this->getCachedStaticData('doctors_list', function () {
            return \App\Models\Doctor::select('id', 'doctor_id', 'full_name', 'specialization', 'department_id')
                ->with(['department:id,name'])
                ->orderBy('full_name')
                ->get();
        }, 5);
    }

    /**
     * Get patients list (cached for 2 minutes - more volatile)
     */
    protected function getPatientsList(): mixed
    {
        return $this->getCachedStaticData('patients_list', function () {
            return \App\Models\Patient::select('id', 'patient_id', 'first_name', 'father_name', 'phone')
                ->orderBy('first_name')
                ->get();
        }, 2);
    }

    /**
     * Optimize large dataset query with cursor
     */
    protected function cursorLargeDataset(Builder $query, callable $callback): void
    {
        $query->chunk(100, function ($items) use ($callback) {
            foreach ($items as $item) {
                $callback($item);
            }
        });
    }

    /**
     * Prevent N+1 by checking relations are loaded
     */
    protected function ensureRelationsLoaded($model, array $relations): void
    {
        foreach ($relations as $relation) {
            if (!$model->relationLoaded($relation)) {
                $model->load($relation);
            }
        }
    }

    /**
     * Get optimized select columns for a model
     */
    protected function getOptimizedColumns(string $model, array $extra = []): array
    {
        $defaults = [
            'patient' => ['id', 'patient_id', 'first_name', 'father_name', 'phone', 'age', 'gender'],
            'doctor' => ['id', 'doctor_id', 'full_name', 'specialization', 'department_id'],
            'medicine' => ['id', 'name', 'generic_name', 'category_id', 'unit_price', 'stock_quantity'],
            'bill' => ['id', 'bill_id', 'patient_id', 'doctor_id', 'total_amount', 'payment_status', 'bill_date'],
            'appointment' => ['id', 'patient_id', 'doctor_id', 'appointment_date', 'status'],
            'department' => ['id', 'name', 'code'],
            'supplier' => ['id', 'name', 'phone', 'email', 'status'],
        ];

        $columns = $defaults[$model] ?? ['id', 'name'];
        return array_unique(array_merge($columns, $extra));
    }
}