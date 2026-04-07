<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class ApiDocumentationController extends Controller
{
    public function __invoke(): Response
    {
        $documentation = (string) config('l5-swagger.default', 'default');
        $documentationTitle = (string) config(
            "l5-swagger.documentations.{$documentation}.api.title",
            config('app.name', 'API Documentation')
        );

        return response()->view('vendor.l5-swagger.index', [
            'documentation' => $documentation,
            'documentationTitle' => $documentationTitle,
            'urlsToDocs' => [
                $documentationTitle => route("l5-swagger.{$documentation}.docs", [], false),
            ],
            'operationsSorter' => config('l5-swagger.defaults.operations_sort'),
            'configUrl' => config('l5-swagger.defaults.additional_config_url'),
            'validatorUrl' => config('l5-swagger.defaults.validator_url'),
            'useAbsolutePath' => false,
        ]);
    }
}
