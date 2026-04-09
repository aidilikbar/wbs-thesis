<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReviewDelegationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assignee_user_id' => ['required', 'integer', 'exists:users,id'],
            'assigned_unit' => ['nullable', 'string', 'max:120'],
            'distribution_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
