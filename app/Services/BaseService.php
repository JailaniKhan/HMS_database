<?php

namespace App\Services;

abstract class BaseService
{
    /**
     * The model instance
     */
    protected $model;

    /**
     * Get all records with pagination
     */
    public function getAll($perPage = 10)
    {
        return $this->model->paginate($perPage);
    }

    /**
     * Find a record by ID
     */
    public function findById($id)
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create a new record
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * Update an existing record
     */
    public function update($id, array $data)
    {
        $record = $this->findById($id);
        $record->update($data);
        return $record;
    }

    /**
     * Delete a record
     */
    public function delete($id)
    {
        $record = $this->findById($id);
        return $record->delete();
    }
}