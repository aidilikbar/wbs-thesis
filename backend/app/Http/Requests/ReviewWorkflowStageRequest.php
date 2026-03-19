<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewWorkflowStageRequest extends FormRequest
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
            'decision' => ['required', 'string', Rule::in(['approved', 'rejected'])],
            'internal_note' => ['required', 'string', 'max:2000'],
            'publish_update' => ['sometimes', 'boolean'],
            'public_message' => ['nullable', 'required_if:publish_update,true', 'string', 'max:600'],
        ];
    }
}
