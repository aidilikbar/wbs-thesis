<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\CaseFile;
use App\Models\CaseTimelineEvent;
use App\Models\GovernanceControl;
use App\Models\Report;
use App\Services\CaseWorkflowService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class WbsDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        AuditLog::query()->delete();
        CaseTimelineEvent::query()->delete();
        CaseFile::query()->delete();
        Report::query()->delete();
        GovernanceControl::query()->delete();

        GovernanceControl::query()->create([
            'code' => 'ANON-01',
            'name' => 'Anonymity safeguard',
            'description' => 'Protect whistleblower identity across intake, tracking, and escalation flows.',
            'owner_role' => 'Governance Office',
            'status' => 'active',
            'target_metric' => '100% secure anonymous intake',
            'current_metric' => 'Enabled by design',
            'notes' => 'Submission workflow returns only a reference and tracking token to the reporter.',
        ]);

        GovernanceControl::query()->create([
            'code' => 'SEG-02',
            'name' => 'Segregation of duties',
            'description' => 'Separate intake handling from investigation execution and oversight monitoring.',
            'owner_role' => 'Chief Compliance Officer',
            'status' => 'active',
            'target_metric' => 'Distinct owners for intake and investigation',
            'current_metric' => 'Intake and investigation units separated',
            'notes' => 'Assignment workflow records unit ownership and investigator hand-offs.',
        ]);

        GovernanceControl::query()->create([
            'code' => 'SLA-03',
            'name' => 'Triage timeliness',
            'description' => 'Monitor elapsed time from intake to assignment and escalation decisions.',
            'owner_role' => 'Case Management Lead',
            'status' => 'warning',
            'target_metric' => 'Average triage under 72 hours',
            'current_metric' => 'Measured via dashboard',
            'notes' => 'Prototype dashboard computes average triage hours from case timestamps.',
        ]);

        GovernanceControl::query()->create([
            'code' => 'AUD-04',
            'name' => 'Audit trail completeness',
            'description' => 'Log every important event that changes a report or case state.',
            'owner_role' => 'Internal Audit',
            'status' => 'active',
            'target_metric' => 'All state changes logged',
            'current_metric' => 'Implemented for submission, assignment, and status changes',
            'notes' => 'Audit records are queryable from the governance dashboard API.',
        ]);

        /** @var CaseWorkflowService $workflow */
        $workflow = app(CaseWorkflowService::class);

        $procurement = $workflow->submitReport([
            'title' => 'Procurement committee requested unofficial facilitation payment',
            'category' => 'procurement',
            'description' => 'A vendor liaison reported that a procurement committee member requested a facilitation payment before technical evaluation results would be released.',
            'incident_date' => now()->subDays(12)->toDateString(),
            'incident_location' => 'Bandung Regional Office',
            'accused_party' => 'Procurement Committee Member',
            'evidence_summary' => 'Meeting notes, invoice screenshots, and two witness names are available.',
            'anonymity_level' => 'confidential',
            'reporter_email' => 'vendor.relation@example.test',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['procurement', 'financial-loss'],
        ]);

        $retaliation = $workflow->submitReport([
            'title' => 'Supervisor threatened staff after ethics complaint',
            'category' => 'retaliation',
            'description' => 'A staff member reported retaliatory reassignment threats after raising concerns about travel expense manipulation by a supervisor.',
            'incident_date' => now()->subDays(6)->toDateString(),
            'incident_location' => 'Head Office',
            'accused_party' => 'Division Supervisor',
            'evidence_summary' => 'Chat transcripts and calendar evidence available.',
            'anonymity_level' => 'anonymous',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['retaliation-risk', 'leadership'],
        ]);

        $conflict = $workflow->submitReport([
            'title' => 'Potential conflict of interest in grant review panel',
            'category' => 'conflict_of_interest',
            'description' => 'A reviewer appears to have an undeclared family connection with one of the shortlisted applicants in a grant review panel.',
            'incident_date' => now()->subDays(3)->toDateString(),
            'incident_location' => 'Research Funding Unit',
            'accused_party' => 'Panel Reviewer',
            'evidence_summary' => 'Public company registry and social media screenshots support the allegation.',
            'anonymity_level' => 'identified',
            'reporter_name' => 'Laila N.',
            'reporter_email' => 'laila.n@example.test',
            'requested_follow_up' => true,
            'witness_available' => false,
            'governance_tags' => ['conflict-sensitive'],
        ]);

        $fraud = $workflow->submitReport([
            'title' => 'Repeated duplicate reimbursement claim patterns',
            'category' => 'fraud',
            'description' => 'Finance staff observed repeated duplicate reimbursement claims with altered timestamps across two reporting periods.',
            'incident_date' => now()->subDays(20)->toDateString(),
            'incident_location' => 'Finance Directorate',
            'accused_party' => 'Project Accountant',
            'evidence_summary' => 'Ledger extracts and approval chain screenshots available.',
            'anonymity_level' => 'confidential',
            'reporter_email' => 'controller@example.test',
            'requested_follow_up' => true,
            'witness_available' => true,
            'governance_tags' => ['financial-loss', 'data-integrity'],
        ]);

        $workflow->assignCase(CaseFile::query()->findOrFail($procurement['caseFile']->id), [
            'owner_name' => 'Rani Putri',
            'assigned_unit' => 'Anti-Corruption Investigation Desk',
            'due_in_days' => 7,
        ]);

        $workflow->updateCaseStatus(CaseFile::query()->findOrFail($procurement['caseFile']->id), [
            'stage' => 'investigation',
            'internal_note' => 'Evidence package validated and moved into formal investigation.',
            'publish_update' => true,
            'public_message' => 'Your report passed initial assessment and entered formal investigation.',
            'actor_name' => 'Rani Putri',
        ]);

        $workflow->assignCase(CaseFile::query()->findOrFail($retaliation['caseFile']->id), [
            'owner_name' => 'Bagas Santoso',
            'assigned_unit' => 'Ethics and Protection Desk',
            'due_in_days' => 3,
        ]);

        $workflow->updateCaseStatus(CaseFile::query()->findOrFail($retaliation['caseFile']->id), [
            'stage' => 'escalated',
            'internal_note' => 'Immediate whistleblower protection measures requested from governance leadership.',
            'publish_update' => true,
            'public_message' => 'The report requires protected escalation and is being handled with priority safeguards.',
            'actor_name' => 'Bagas Santoso',
        ]);

        $workflow->assignCase(CaseFile::query()->findOrFail($conflict['caseFile']->id), [
            'owner_name' => 'Nadia Prabowo',
            'assigned_unit' => 'Integrity Review Unit',
            'due_in_days' => 10,
        ]);

        $workflow->updateCaseStatus(CaseFile::query()->findOrFail($conflict['caseFile']->id), [
            'stage' => 'assessment',
            'internal_note' => 'Conflict disclosure evidence is being cross-checked against panel declarations.',
            'publish_update' => true,
            'public_message' => 'The report is currently under structured assessment by the integrity review unit.',
            'actor_name' => 'Nadia Prabowo',
        ]);

        $workflow->assignCase(CaseFile::query()->findOrFail($fraud['caseFile']->id), [
            'owner_name' => 'Dimas Haryanto',
            'assigned_unit' => 'Forensic Audit Cell',
            'due_in_days' => 5,
        ]);

        $workflow->updateCaseStatus(CaseFile::query()->findOrFail($fraud['caseFile']->id), [
            'stage' => 'resolved',
            'internal_note' => 'Duplicate claims verified and referred for disciplinary action with repayment controls.',
            'publish_update' => true,
            'public_message' => 'The case has been resolved and corrective action has been initiated.',
            'actor_name' => 'Dimas Haryanto',
        ]);
    }
}
