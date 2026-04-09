<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class CatalogController extends Controller
{
    #[OA\Get(
        path: '/api/catalog',
        operationId: 'getCatalog',
        summary: 'Get reference catalog',
        description: 'Returns the reference data used by the whistleblowing forms, tracking page, and governance workflow.',
        tags: ['Reference Data'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reference catalog returned successfully.',
                content: new OA\JsonContent(ref: '#/components/schemas/CatalogResponse')
            ),
        ]
    )]
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'roles' => config('wbs.roles'),
                'internal_roles' => config('wbs.internal_roles'),
                'categories' => config('wbs.categories'),
                'governance_tags' => config('wbs.governance_tags'),
                'confidentiality_levels' => config('wbs.confidentiality_levels'),
                'reported_party_classifications' => config('wbs.reported_party_classifications'),
                'corruption_aspect_tags' => config('wbs.corruption_aspect_tags'),
                'verification_recommendations' => config('wbs.verification_recommendations'),
                'review_recommendations' => config('wbs.review_recommendations'),
                'delict_tags' => config('wbs.delict_tags'),
                'corruption_articles' => config('wbs.corruption_articles'),
                'months' => config('wbs.months'),
                'case_stages' => config('wbs.case_stages'),
                'principles' => config('wbs.governance_principles'),
            ],
        ]);
    }
}
