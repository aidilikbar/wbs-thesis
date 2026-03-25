<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maxKilobytes = (int) config('wbs.attachments.max_kilobytes', 20480);
        $acceptedMimeTypes = implode(',', config('wbs.attachments.accepted_mimetypes', []));

        return [
            'title' => ['required', 'string', 'max:120'],
            'category' => ['required', 'string', Rule::in(array_keys(config('wbs.categories')))],
            'description' => ['required', 'string', 'min:30', 'max:5000'],
            'incident_date' => ['nullable', 'date', 'before_or_equal:today'],
            'incident_location' => ['nullable', 'string', 'max:255'],
            'accused_party' => ['nullable', 'string', 'max:255'],
            'evidence_summary' => ['nullable', 'string', 'max:1500'],
            'confidentiality_level' => ['required', 'string', Rule::in(array_keys(config('wbs.confidentiality_levels')))],
            'requested_follow_up' => ['sometimes', 'boolean'],
            'witness_available' => ['sometimes', 'boolean'],
            'governance_tags' => ['nullable', 'array', 'max:6'],
            'governance_tags.*' => ['string', Rule::in(array_keys(config('wbs.governance_tags')))],
            'attachments' => ['sometimes', 'array', 'max:'.config('wbs.attachments.max_files', 10)],
            'attachments.*' => ['file', "max:{$maxKilobytes}", "mimetypes:{$acceptedMimeTypes}"],
        ];
    }
}
