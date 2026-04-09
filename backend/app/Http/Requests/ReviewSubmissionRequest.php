<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewSubmissionRequest extends FormRequest
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
            'case_name' => ['required', 'string', 'max:255'],
            'reported_parties' => ['required', 'array', 'min:1', 'max:10'],
            'reported_parties.*.full_name' => ['required', 'string', 'max:255'],
            'reported_parties.*.position' => ['required', 'string', 'max:255'],
            'reported_parties.*.classification' => ['required', 'string', Rule::in(array_keys(config('wbs.reported_party_classifications')))],
            'description' => ['required', 'string', 'max:5000'],
            'corruption_aspect_tags' => ['nullable', 'array', 'max:8'],
            'corruption_aspect_tags.*' => ['string', Rule::in(array_keys(config('wbs.corruption_aspect_tags')))],
            'recommendation' => ['required', 'string', Rule::in(array_keys(config('wbs.review_recommendations')))],
            'delict' => ['required', 'string', Rule::in(array_keys(config('wbs.delict_tags')))],
            'article' => ['required', 'string', Rule::in(array_keys(config('wbs.corruption_articles')))],
            'start_month' => ['required', 'string', Rule::in(array_keys(config('wbs.months')))],
            'start_year' => ['required', 'digits:4'],
            'end_month' => ['required', 'string', Rule::in(array_keys(config('wbs.months')))],
            'end_year' => ['required', 'digits:4'],
            'city' => ['required', 'string', 'max:120'],
            'province' => ['required', 'string', 'max:120'],
            'modus' => ['required', 'string', 'max:3000'],
            'related_report_reference' => ['nullable', 'string', 'max:80'],
            'has_authority' => ['required', 'boolean'],
            'is_priority' => ['required', 'boolean'],
            'additional_information' => ['nullable', 'string', 'max:3000'],
            'conclusion' => ['required', 'string', 'max:3000'],
            'publish_update' => ['sometimes', 'boolean'],
            'public_message' => ['nullable', 'required_if:publish_update,true', 'string', 'max:600'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $caseFile = $this->route('caseFile');
        $report = $caseFile?->report;
        $incidentDate = $report?->incident_date ?? now();
        $legacyNote = $this->input('conclusion', $this->input('internal_note', ''));
        $reportedParties = $this->input('reported_parties');

        if (! is_array($reportedParties) || $reportedParties === []) {
            $reportedParties = $report?->reported_parties;

            if (! is_array($reportedParties) || $reportedParties === []) {
                $accusedParty = trim((string) ($report?->accused_party ?? ''));
                $reportedParties = $accusedParty === ''
                    ? []
                    : [[
                        'full_name' => $accusedParty,
                        'position' => 'Not specified',
                        'classification' => 'other',
                    ]];
            }
        }

        $this->merge([
            'case_name' => $this->input('case_name', $report?->title),
            'reported_parties' => $reportedParties,
            'description' => $this->input('description', $report?->description),
            'corruption_aspect_tags' => $this->input('corruption_aspect_tags', $report?->governance_tags ?? []),
            'recommendation' => $this->input('recommendation', 'internal_forwarding'),
            'delict' => $this->input('delict', 'other'),
            'article' => $this->input('article', 'article_2_31_1999'),
            'start_month' => $this->input('start_month', $incidentDate->format('m')),
            'start_year' => $this->input('start_year', $incidentDate->format('Y')),
            'end_month' => $this->input('end_month', $incidentDate->format('m')),
            'end_year' => $this->input('end_year', $incidentDate->format('Y')),
            'city' => $this->input('city', 'Not specified'),
            'province' => $this->input('province', 'Not specified'),
            'modus' => $this->input('modus', $legacyNote !== '' ? $legacyNote : ($report?->description ?? '')),
            'related_report_reference' => $this->input('related_report_reference', $report?->public_reference),
            'has_authority' => $this->input('has_authority', true),
            'is_priority' => $this->input('is_priority', false),
            'additional_information' => $this->input('additional_information'),
            'conclusion' => $legacyNote !== '' ? $legacyNote : $this->input('modus', $report?->description),
        ]);
    }
}
