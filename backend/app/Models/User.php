<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'phone', 'role', 'unit', 'is_active', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_REPORTER = 'reporter';
    public const ROLE_SUPERVISOR_OF_VERIFICATOR = 'supervisor_of_verificator';
    public const ROLE_VERIFICATOR = 'verificator';
    public const ROLE_SUPERVISOR_OF_INVESTIGATOR = 'supervisor_of_investigator';
    public const ROLE_INVESTIGATOR = 'investigator';
    public const ROLE_DIRECTOR = 'director';
    public const ROLE_SYSTEM_ADMINISTRATOR = 'system_administrator';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    protected function roleLabel(): Attribute
    {
        return Attribute::get(
            fn () => config("wbs.roles.{$this->role}", str($this->role)->replace('_', ' ')->headline())
        );
    }

    public static function defaultUnitForRole(string $role): ?string
    {
        return config("wbs.default_units.{$role}");
    }

    public static function resolveUnitForRole(string $role, ?string $unit = null): ?string
    {
        $resolved = trim((string) ($unit ?? ''));

        if ($resolved !== '') {
            return $resolved;
        }

        return self::defaultUnitForRole($role);
    }

    public function operationalUnit(): ?string
    {
        return self::resolveUnitForRole($this->role, $this->unit);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_user_id');
    }

    public function sentCaseMessages(): HasMany
    {
        return $this->hasMany(CaseMessage::class, 'sender_user_id');
    }

    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles, true);
    }

    public function isInternalUser(): bool
    {
        return $this->role !== self::ROLE_REPORTER;
    }
}
