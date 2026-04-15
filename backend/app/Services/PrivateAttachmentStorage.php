<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PrivateAttachmentStorage
{
    public function store(string $diskName, string $path, UploadedFile $file): void
    {
        $disk = Storage::disk($diskName);
        $mimeType = $file->getMimeType() ?: 'application/octet-stream';
        $directory = trim(dirname($path), '.');
        $name = basename($path);

        try {
            $storedPath = $disk->putFileAs($directory, $file, $name, [
                'visibility' => 'private',
                'mimetype' => $mimeType,
            ]);
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages([
                'attachments' => 'Attachment upload failed. Check the storage configuration and try again.',
            ]);
        }

        if ($storedPath === false || $storedPath === null) {
            throw ValidationException::withMessages([
                'attachments' => 'Attachment upload failed. Check the storage configuration and try again.',
            ]);
        }
    }
}
