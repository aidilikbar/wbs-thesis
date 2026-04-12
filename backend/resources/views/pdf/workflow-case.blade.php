<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $document_title }}</title>
    <style>
        @page {
            margin: 28px 28px 40px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #26221d;
            font-size: 11px;
            line-height: 1.45;
        }

        .header {
            background: #fbf7ef;
            color: #26221d;
            border: 1px solid #decfb1;
            border-top: 4px solid #b84a55;
            padding: 22px 24px;
        }

        .header-top {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .header-top td {
            vertical-align: top;
        }

        .brand-lockup {
            width: 192px;
            padding-right: 18px;
        }

        .brand-logo {
            display: block;
            width: 176px;
            height: auto;
        }

        .brand-name {
            margin-top: 10px;
            font-size: 10px;
            line-height: 1.35;
            color: #6b604f;
        }

        .kicker {
            font-size: 10px;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: #9b8662;
            margin-bottom: 10px;
        }

        h1 {
            margin: 0;
            font-size: 24px;
            line-height: 1.2;
            color: #27231e;
        }

        .header-meta {
            margin-top: 14px;
            width: 100%;
            border-collapse: collapse;
        }

        .header-meta td {
            padding: 4px 0;
            vertical-align: top;
            color: #3b342b;
        }

        .header-meta .label {
            width: 140px;
            color: #8f7d60;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.14em;
            font-weight: 700;
        }

        .pill {
            display: inline-block;
            padding: 5px 10px;
            margin-right: 8px;
            margin-top: 8px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            background: #efe6d4;
            border: 1px solid #d8c5a4;
            color: #564938;
        }

        .section {
            margin-top: 18px;
            page-break-inside: auto;
        }

        .section-title {
            margin: 0 0 10px;
            padding: 10px 14px;
            background: #f3ead9;
            border-left: 5px solid #b84a55;
            color: #5f4d1f;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            page-break-after: avoid;
        }

        .panel {
            border: 1px solid #e5d8bf;
            padding: 14px 16px;
            background: #fffdfa;
            page-break-inside: auto;
        }

        .panel + .panel {
            margin-top: 12px;
        }

        .detail-table,
        .list-table {
            width: 100%;
            border-collapse: collapse;
        }

        .detail-table th,
        .detail-table td,
        .list-table th,
        .list-table td {
            border-bottom: 1px solid #e5ebf3;
            padding: 8px 0;
            vertical-align: top;
        }

        .detail-table tr:last-child th,
        .detail-table tr:last-child td,
        .list-table tr:last-child th,
        .list-table tr:last-child td {
            border-bottom: none;
        }

        .detail-table th {
            width: 34%;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #9b5b62;
            font-weight: 700;
            padding-right: 12px;
        }

        .value {
            white-space: pre-wrap;
            word-break: break-word;
            color: #2f2a24;
        }

        .empty {
            color: #8b7c65;
            font-style: italic;
        }

        .list-table th {
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #9b5b62;
            font-weight: 700;
            padding-right: 12px;
        }

        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: -20px;
            color: #857864;
            font-size: 9px;
        }

        .footer-table {
            width: 100%;
            border-top: 1px solid #ddd1ba;
            border-collapse: collapse;
        }

        .footer-table td {
            padding-top: 8px;
            vertical-align: top;
        }

        .footer-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <header class="header">
        <table class="header-top">
            <tr>
                <td class="brand-lockup">
                    <img class="brand-logo" src="{{ public_path('logos/kws_logo_header.png') }}" alt="KWS logo">
                    <div class="brand-name">
                        KPK Whistleblowing System<br>
                        Case Report Export
                    </div>
                </td>
                <td>
                    <div class="kicker">KPK Whistleblowing System</div>
                    <h1>{{ $case_title }}</h1>

                    <div>
                        <span class="pill">{{ $stage_label }}</span>
                        @if ($status_label)
                            <span class="pill">{{ $status_label }}</span>
                        @endif
                        @if ($severity_label)
                            <span class="pill">{{ $severity_label }}</span>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <table class="header-meta">
            <tr>
                <td class="label">Case Number</td>
                <td>{{ $case_number }}</td>
                <td class="label">Public Reference</td>
                <td>{{ $public_reference ?: 'Not available' }}</td>
            </tr>
            <tr>
                <td class="label">Document</td>
                <td>{{ $document_title }}</td>
                <td class="label">Confidentiality</td>
                <td>Internal workflow record</td>
            </tr>
        </table>
    </header>

    <section class="section">
        <h2 class="section-title">Case Overview</h2>
        <div class="panel">
            <table class="detail-table">
                @foreach ($overview_rows as $row)
                    <tr>
                        <th>{{ $row['label'] }}</th>
                        <td class="value">{{ $row['value'] }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
        <div class="panel">
            <table class="detail-table">
                @foreach ($reporter_rows as $row)
                    <tr>
                        <th>{{ $row['label'] }}</th>
                        <td class="value">{{ $row['value'] }}</td>
                    </tr>
                @endforeach
                @foreach ($workflow_rows as $row)
                    <tr>
                        <th>{{ $row['label'] }}</th>
                        <td class="value">{{ $row['value'] }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
    </section>

    @foreach ($records as $record)
        <section class="section">
            <h2 class="section-title">{{ $record['title'] }}</h2>
            <div class="panel">
                <table class="detail-table">
                    @foreach ($record['rows'] as $row)
                        <tr>
                            <th>{{ $row['label'] }}</th>
                            <td class="value">{{ $row['value'] }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </section>
    @endforeach

    <section class="section">
        <h2 class="section-title">Case Attachments</h2>
        <div class="panel">
            @if ($attachments !== [])
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($attachments as $attachment)
                            <tr>
                                <td class="value">{{ $attachment['name'] }}</td>
                                <td>{{ $attachment['type'] }}</td>
                                <td>{{ $attachment['size'] }}</td>
                                <td>{{ $attachment['uploaded_at'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p class="empty">No case attachments were stored for this report.</p>
            @endif
        </div>
    </section>

    <section class="section">
        <h2 class="section-title">Workflow Timeline</h2>
        <div class="panel">
            @if ($timeline !== [])
                <table class="list-table">
                    <thead>
                        <tr>
                            <th>When</th>
                            <th>Visibility</th>
                            <th>Stage</th>
                            <th>Headline</th>
                            <th>Actor</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($timeline as $entry)
                            <tr>
                                <td>{{ $entry['when'] }}</td>
                                <td>{{ $entry['visibility'] }}</td>
                                <td>{{ $entry['stage'] }}</td>
                                <td class="value">{{ $entry['headline'] }}@if($entry['detail'])&#10;{{ $entry['detail'] }}@endif</td>
                                <td>{{ $entry['actor'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <p class="empty">No workflow timeline entries are available for this case.</p>
            @endif
        </div>
    </section>

    <footer class="footer">
        <table class="footer-table">
            <tr>
                <td>Confidential workflow record generated from the KPK Whistleblowing System prototype.</td>
                <td class="footer-right">Generated {{ $exported_at }} by {{ $exported_by }}</td>
            </tr>
        </table>
    </footer>
</body>
</html>
