<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['required', 'string', 'max:40'],
            'unit' => ['nullable', 'string', 'max:120'],
            'is_active' => ['required', 'boolean'],
            'password' => ['nullable', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }
}
