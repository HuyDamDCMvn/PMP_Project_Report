"""Read-only, sanitized time-history export. Credentials never enter the browser."""
import json
import re
import time
import hashlib
from pathlib import Path
from decimal import Decimal, ROUND_FLOOR
from datetime import date, datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

def parse_event(event):
    field = event.get('field', {}).get('name', '')
    if field not in ('Time allocated', 'Time allocated Deleted'):
        return None
    match = re.fullmatch(r'\s*(\d{1,4}[-.]\d{1,2}[-.]\d{1,4}):\s*([\d.,]+)\s*h\.?\s*', str(event.get('old_value', '')))
    if not match:
        raise ValueError('Unrecognized time event')
    raw_date, raw_hours = match.groups()
    work = datetime.strptime(raw_date, '%Y-%m-%d' if '-' in raw_date else '%d.%m.%Y').date()
    hours = Decimal(raw_hours.replace(',', '.'))
    return work, hours * (-1 if field.endswith('Deleted') else 1)

def quarter(value):
    return (value * 4).to_integral_value(rounding=ROUND_FLOOR) / 4

def main():
    source = json.loads((ROOT / 'public/data/dashboard-data.json').read_text(encoding='utf-8'))
    tickets = [t for t in source['tickets'] if t['active'] in ('Positive', 'Re-Assessment')]
    config = (ROOT / 'env.local.md').read_text(encoding='utf-8')
    base = re.search(r'^- Base:\s*(.+)$', config, re.M).group(1).strip().strip('`')
    token = re.search(r'^- Token:\s*(.+)$', config, re.M).group(1).strip().strip('`')
    cache = ROOT / '.time-history-cache'
    cache.mkdir(exist_ok=True)
    as_of = date.fromisoformat(source['meta']['asOf'])
    def read(ticket):
        path = cache / f"{ticket['id']}.json"
        if path.exists():
            return ticket, json.loads(path.read_text(encoding='utf-8'))
        for attempt in range(4):
            try:
                with urlopen(Request(f"{base}/issues/{ticket['id']}", headers={'Authorization': token}), timeout=60) as response:
                    issue = json.load(response)['issues'][0]
                if issue.get('project', {}).get('name') != 'DCMvn_Annotation Project':
                    raise ValueError('Project mismatch')
                events, errors = [], 0
                for event in issue.get('history', []):
                    try:
                        parsed = parse_event(event)
                        if parsed:
                            work, hours = parsed
                            events.append({'workDate': work.isoformat(), 'hours': str(hours), 'changedAt': event.get('created_at', '')})
                    except (ValueError, ArithmeticError):
                        errors += 1
                result = {'events': events, 'unparsed': errors}
                path.write_text(json.dumps(result), encoding='utf-8')
                return ticket, result
            except Exception:
                if attempt == 3:
                    return ticket, {'error': 'API read failed', 'events': []}
                time.sleep(attempt + 1)
    entries, audit = [], []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(read, t) for t in tickets]
        for index, future in enumerate(as_completed(futures), 1):
            ticket, result = future.result()
            totals = {}
            for event in result['events']:
                # Reconstruct the workbook snapshot, not today's edited ticket total.
                if event['changedAt'][:10] > as_of.isoformat() or event['workDate'] > as_of.isoformat():
                    continue
                work = date.fromisoformat(event['workDate'])
                year, week, _ = work.isocalendar()
                key = f'{year}-CW{week:02}'
                totals[key] = totals.get(key, Decimal(0)) + Decimal(event['hours'])
            net = sum(totals.values(), Decimal(0))
            source_hours = ticket.get('actualHoursSource')
            audit.append({'ticketId': ticket['id'], 'netHours': float(net), 'sourceHours': source_hours, 'unparsed': result.get('unparsed', 0), 'error': result.get('error'), 'difference': None if source_hours is None else round(float(net) - float(source_hours), 6)})
            for key, hours in totals.items():
                if key.startswith('2026-') and 1 <= int(key[-2:]) <= 40:
                    entries.append({'ticketId': ticket['id'], 'week': key, 'rawHours': float(hours), 'hours': float(quarter(hours))})
            if index % 100 == 0:
                print(f'Read {index}/{len(tickets)} tickets', flush=True)
    output = {'meta': {'asOf': as_of.isoformat(), 'retrievedAt': datetime.now().isoformat(timespec='seconds'), 'matrixSha256': hashlib.sha256((ROOT / 'RawSource/Annotation_Ticket_User_Matrix_Checked.xlsx').read_bytes()).hexdigest(), 'ticketCount': len(tickets), 'rounding': 'Net additions minus deletions per ticket and ISO week, floor to 0.25h before aggregation', 'failed': sum(bool(a['error']) for a in audit), 'unparsed': sum(a['unparsed'] for a in audit), 'reconciliationDifferences': sum(a['difference'] is not None and abs(a['difference']) > 0.011 for a in audit)}, 'entries': entries, 'audit': audit}
    target = ROOT / 'public/data/weekly-hours.json'
    target.write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(json.dumps({'hours': sum(e['hours'] for e in entries), **output['meta']}), flush=True)

if __name__ == '__main__':
    main()
