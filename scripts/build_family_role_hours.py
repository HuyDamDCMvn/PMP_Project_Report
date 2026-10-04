"""Read-only attribution of linked-ticket time to the person who logged it."""
import json
import re
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from decimal import Decimal, ROUND_FLOOR
from urllib.request import Request, urlopen
try:
    from .build_weekly_hours import ROOT, parse_event, quarter
except ImportError:
    from build_weekly_hours import ROOT, parse_event, quarter


def nearest_quarter(value):
    return (value * 4 + Decimal('0.5')).to_integral_value(rounding=ROUND_FLOOR) / 4


def attribute(events, cutoff):
    additions, unresolved = [], 0
    for event in sorted(events, key=lambda e: e['changedAt']):
        if event['changedAt'][:10] > cutoff or event['workDate'] > cutoff:
            continue
        hours = Decimal(event['hours'])
        if hours >= 0:
            if not event['user']:
                unresolved += 1
            additions.append(dict(event, hours=hours))
            continue
        candidates = [a for a in additions if a['workDate'] == event['workDate'] and a['hours'] > 0 and abs(a['hours'] + hours) <= Decimal('0.005')]
        own = [a for a in candidates if a['user'] == event['user']]
        if own:
            own[-1]['hours'] += hours
        elif len({a['user'] for a in candidates}) == 1 and candidates:
            candidates[-1]['hours'] += hours
        else:
            unresolved += 1
    totals = defaultdict(Decimal)
    for event in additions:
        totals[event['user']] += event['hours']
    return totals, unresolved


def main():
    data = json.loads((ROOT / 'public/data/dashboard-data.json').read_text(encoding='utf-8'))
    cutoff = data['meta']['asOf']
    ids = {i for f in data['families'] if f.get('end') and f['end'] <= cutoff for i in f['ticketIds']}
    tickets = [t for t in data['tickets'] if t['id'] in ids]
    roles, names = {}, {}
    for line in (ROOT / 'AGENTS.md').read_text(encoding='utf-8').splitlines():
        parts = [s.strip() for s in line.split('|')]
        if len(parts) == 3 and parts[0] in ('MEP Modeler', 'Digital Coordinator'):
            roles[parts[2]] = parts[0]
            names[parts[2]] = parts[1]
    config = (ROOT / 'env.local.md').read_text(encoding='utf-8')
    base = re.search(r'^- Base:\s*(.+)$', config, re.M).group(1).strip().strip('`')
    token = re.search(r'^- Token:\s*(.+)$', config, re.M).group(1).strip().strip('`')
    cache = ROOT / '.time-history-cache/person-hours'
    cache.mkdir(parents=True, exist_ok=True)

    def read(ticket):
        path = cache / f"{ticket['id']}.json"
        if path.exists():
            return ticket, json.loads(path.read_text(encoding='utf-8'))
        try:
            with urlopen(Request(f"{base}/issues/{ticket['id']}", headers={'Authorization': token}), timeout=45) as response:
                issue = json.load(response)['issues'][0]
            if issue.get('project', {}).get('name') != 'DCMvn_Annotation Project':
                raise ValueError('Project mismatch')
            events, unparsed = [], 0
            for event in issue.get('history', []):
                try:
                    parsed = parse_event(event)
                    if parsed:
                        work, hours = parsed
                        events.append({'workDate': work.isoformat(), 'hours': str(hours),
                                       'changedAt': event.get('created_at', ''), 'user': event.get('user', {}).get('name', '')})
                except (ValueError, ArithmeticError):
                    unparsed += 1
            result = {'events': events, 'unparsed': unparsed}
            path.write_text(json.dumps(result), encoding='utf-8')
        except Exception:
            result = {'events': [], 'failed': True}
        return ticket, result

    output = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for index, future in enumerate(as_completed([pool.submit(read, t) for t in tickets]), 1):
            ticket, result = future.result()
            totals, unresolved = attribute(result['events'], cutoff)
            rows = [{'user': user, 'name': names.get(user, user), 'role': roles.get(user, 'Other'), 'hours': float(nearest_quarter(hours))}
                    for user, hours in totals.items()]
            output.append({'ticketId': ticket['id'], 'complete': not (result.get('failed') or result.get('unparsed') or unresolved),
                           'unresolvedDeletions': unresolved, 'people': rows})
            if index % 100 == 0:
                print(f'Read {index}/{len(tickets)} linked tickets', flush=True)
    target = ROOT / 'public/data/family-role-hours.json'
    target.write_text(json.dumps({'meta': {'asOf': cutoff, 'retrievedAt': datetime.now().isoformat(timespec='seconds'),
        'incomplete': sum(not t['complete'] for t in output), 'source': 'Read-only ticket time history; AGENTS.md personnel roles'},
        'tickets': sorted(output, key=lambda t: t['ticketId'])}, separators=(',', ':')), encoding='utf-8')
    print(f"Saved {len(output)} tickets; {sum(not t['complete'] for t in output)} incomplete", flush=True)


if __name__ == '__main__':
    main()
