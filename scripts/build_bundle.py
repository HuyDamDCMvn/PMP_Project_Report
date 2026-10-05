"""Package existing offline datasets; never query or invent API evidence."""
import hashlib
import json
from pathlib import Path
FILES=['dashboard-data.json','family-role-hours.json','weekly-hours.json']
def semantic_bytes(data):
    data=json.loads(json.dumps(data))
    for field in ['generated','releaseId','schemaVersion']:
        data['meta'].pop(field,None)
    return json.dumps(data,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf-8')
def build_bundle(root):
    directory=root/'public'/'data'
    datasets={name:json.loads((directory/name).read_text(encoding='utf-8')) for name in FILES}
    as_of=datasets[FILES[0]]['meta']['asOf']
    if any(d['meta'].get('asOf')!=as_of for d in datasets.values()):
        raise ValueError('Supplemental snapshot mismatch; rebuild approved offline inputs before release')
    main=datasets[FILES[0]]
    hashes={name:hashlib.sha256((root/'RawSource'/name).read_bytes()).hexdigest() for name in main['meta']['sources']+['Annotation_RFA_equivalence_Checked.xlsx']}
    if datasets['weekly-hours.json']['meta'].get('matrixSha256')!=hashes['Annotation_Ticket_User_Matrix_Checked.xlsx']:
        raise ValueError('Weekly-hours Matrix hash mismatch')
    main['meta']['sourceHashes']=hashes
    main['meta']['statusPolicy']='Family preferred for unambiguous direct links; Matrix preserved. User decision 2026-10-05.'
    release=hashlib.sha256(b''.join(semantic_bytes(datasets[n]) for n in FILES)).hexdigest()
    manifest={'schemaVersion':1,'releaseId':release,'asOf':as_of,'sourceHashes':hashes,'generator':'offline-bundle-v1',
        'rounding':{'ticket':'quarter-floor','weeklySpent':'signed-ticket-week-quarter-floor','familyEffort':'nearest-quarter-half-up'},
        'warnings':['Role history archive/source hashes unavailable; existing sanitized snapshot retained. Event provenance not independently verified.'],'files':[]}
    for name,dataset in datasets.items():
        dataset['meta'].update(schemaVersion=1,releaseId=release)
        raw=json.dumps(dataset,ensure_ascii=False,separators=(',',':')).encode('utf-8')
        (directory/name).write_bytes(raw)
        manifest['files'].append({'name':name,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)})
    (directory/'bundle-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    return manifest
if __name__=='__main__':
    print(build_bundle(Path(__file__).resolve().parents[1])['releaseId'])
