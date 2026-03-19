<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DelegateCaseRequest extends FormRequest
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
            'due_in_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ];
    }
}
