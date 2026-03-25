<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReportAttachmentRequest extends FormRequest
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
            'file' => [
                'required',
                'file',
                "max:{$maxKilobytes}",
                "mimetypes:{$acceptedMimeTypes}",
            ],
        ];
    }
}
