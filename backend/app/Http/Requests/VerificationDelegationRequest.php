<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VerificationDelegationRequest extends FormRequest
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
            'reject_report' => ['sometimes', 'boolean'],
            'distribution_note' => ['nullable', 'string', 'max:2000'],
            'assignee_user_id' => ['required_unless:reject_report,true', 'nullable', 'integer', 'exists:users,id'],
            'assigned_unit' => ['nullable', 'string', 'max:120'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reject_report' => $this->boolean('reject_report'),
        ]);
    }
}
