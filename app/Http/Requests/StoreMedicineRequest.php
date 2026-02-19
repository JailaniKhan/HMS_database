<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicineRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'medicine_id' => ['required', 'string', 'max:100', 'unique:medicines,medicine_id'],
            'category_id' => ['required', 'exists:medicine_categories,id'],
            'description' => ['nullable', 'string', 'max:5000'],
            'manufacturer' => ['required', 'string', 'max:255'],
            'chemical_name' => ['nullable', 'string', 'max:255'],
            'strength' => ['nullable', 'string', 'max:100'],
            'dosage_form' => ['nullable', 'string', 'max:100'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0', 'gte:cost_price'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'reorder_level' => ['required', 'integer', 'min:0'],
            'expiry_date' => ['required', 'date', 'after:today'],
            'batch_number' => ['required', 'string', 'max:100'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:50'],
            'side_effects' => ['nullable', 'string', 'max:1000'],
            'instructions' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The medicine name is required.',
            'medicine_id.required' => 'The medicine ID is required.',
            'medicine_id.unique' => 'This medicine ID already exists.',
            'category_id.required' => 'Please select a category.',
            'category_id.exists' => 'The selected category does not exist.',
            'cost_price.required' => 'The cost price is required.',
            'sale_price.required' => 'The sale price is required.',
            'sale_price.gte' => 'The sale price must be greater than or equal to the cost price.',
            'stock_quantity.required' => 'The stock quantity is required.',
            'stock_quantity.min' => 'Stock quantity cannot be negative.',
            'reorder_level.required' => 'The reorder level is required.',
            'expiry_date.required' => 'The expiry date is required.',
            'expiry_date.after' => 'The expiry date must be a future date.',
            'batch_number.required' => 'The batch number is required.',
            'manufacturer.required' => 'The manufacturer name is required.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'medicine_id' => 'medicine ID',
            'category_id' => 'category',
            'cost_price' => 'cost price',
            'sale_price' => 'sale price',
            'stock_quantity' => 'stock quantity',
            'reorder_level' => 'reorder level',
            'expiry_date' => 'expiry date',
            'batch_number' => 'batch number',
            'dosage_form' => 'dosage form',
        ];
    }
}