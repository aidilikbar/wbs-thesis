<?php

return [
    'roles' => [
        'reporter' => 'Reporter',
        'supervisor_of_verificator' => 'Supervisor of Verificator',
        'verificator' => 'Verificator',
        'supervisor_of_investigator' => 'Supervisor of Investigator',
        'investigator' => 'Investigator',
        'director' => 'Director',
        'system_administrator' => 'System Administrator',
    ],
    'internal_roles' => [
        'supervisor_of_verificator',
        'verificator',
        'supervisor_of_investigator',
        'investigator',
        'director',
        'system_administrator',
    ],
    'categories' => [
        'bribery' => 'Bribery and gratuities',
        'procurement' => 'Procurement fraud',
        'fraud' => 'Financial fraud',
        'abuse_of_authority' => 'Abuse of authority',
        'conflict_of_interest' => 'Conflict of interest',
        'harassment' => 'Harassment or misconduct',
        'retaliation' => 'Retaliation against reporter',
        'other' => 'Other governance concern',
    ],
    'governance_tags' => [
        'retaliation-risk' => 'Retaliation risk',
        'conflict-sensitive' => 'Conflict-sensitive matter',
        'procurement' => 'Procurement exposure',
        'leadership' => 'Leadership escalation',
        'financial-loss' => 'Potential financial loss',
        'data-integrity' => 'Data integrity concern',
    ],
    'confidentiality_levels' => [
        'confidential' => 'Confidential identity',
        'identified' => 'Identified reporter',
    ],
    'case_stages' => [
        'submitted' => 'Submitted',
        'verification_in_progress' => 'Verification In Progress',
        'verification_review' => 'Verification Review',
        'verified' => 'Verified',
        'investigation_in_progress' => 'Investigation In Progress',
        'investigation_review' => 'Investigation Review',
        'director_review' => 'Director Review',
        'completed' => 'Completed',
    ],
    'governance_principles' => [
        'confidentiality' => 'Require registered reporters while preserving confidential identity handling in the workflow.',
        'traceability' => 'Record every delegation, approval, rejection, and completion as audit evidence.',
        'segregation' => 'Separate reporting, verification, investigation, direction, and administration duties by role.',
        'timeliness' => 'Track SLAs across verification, investigation, and director review.',
    ],
];
