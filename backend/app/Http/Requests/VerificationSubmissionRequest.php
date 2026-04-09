<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerificationSubmissionRequest extends FormRequest
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
            'summary' => ['required', 'string', 'max:4000'],
            'corruption_aspect_tags' => ['nullable', 'array', 'max:8'],
            'corruption_aspect_tags.*' => ['string', Rule::in(array_keys(config('wbs.corruption_aspect_tags')))],
            'has_authority' => ['required', 'boolean'],
            'criminal_assessment' => ['required', 'string', Rule::in(['indicated', 'not_indicated'])],
            'reason' => ['required', 'string', 'max:2000'],
            'recommendation' => ['required', 'string', Rule::in(array_keys(config('wbs.verification_recommendations')))],
            'forwarding_destination' => ['nullable', 'required_if:recommendation,forward', 'string', 'max:255'],
            'publish_update' => ['sometimes', 'boolean'],
            'public_message' => ['nullable', 'required_if:publish_update,true', 'string', 'max:600'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $summary = $this->input('summary', $this->input('internal_note'));

        $this->merge([
            'summary' => $summary,
            'has_authority' => $this->input('has_authority', true),
            'criminal_assessment' => $this->input('criminal_assessment', 'indicated'),
            'reason' => $this->input('reason', $summary),
            'recommendation' => $this->input('recommendation', 'review'),
        ]);
    }
}
