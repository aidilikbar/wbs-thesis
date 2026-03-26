<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCaseMessageRequest extends FormRequest
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
        $maxKilobytes = (int) config('wbs.attachments.max_kilobytes', 20480);
        $acceptedMimeTypes = implode(',', config('wbs.attachments.accepted_mimetypes', []));

        return [
            'body' => ['nullable', 'required_without:attachments', 'string', 'max:4000'],
            'attachments' => ['sometimes', 'array', 'max:'.config('wbs.attachments.max_files', 10)],
            'attachments.*' => ['file', "max:{$maxKilobytes}", "mimetypes:{$acceptedMimeTypes}"],
        ];
    }
}
