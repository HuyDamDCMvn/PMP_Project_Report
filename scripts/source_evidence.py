"""Read-only lineage/QA. Never repairs or reclassifies workbook cells."""
from datetime import date
from openpyxl.utils import get_column_letter

PROXIES = {
    '420mebuffertankstorathermheat1coilwithinsulation': (75204,579,'2026-09-10'),
    '420pabasketstrainervalvethreadstandard': (73549,714,'2026-07-10'),
    '430davolumeflowratemeasuringunitsvmr': (73075,989,'2026-07-13'),
    '430davolumeflowratemeasuringunitsvmrk': (73077,990,'2026-07-13'),
    '434pfcoccapmapressfkmblue': (72578,1257,'2026-10-05'),
    '473pfcoeelbow180soldered': (72490,1818,'2026-07-21'),
    '474mecylinderassembliesco2': (71722,1841,'2026-09-28'),
}

def source_ref(frame, header, row, file, sheet, value):
    return {'workbook':file,'sheet':sheet,'cell':f'{get_column_letter(frame.columns.get_loc(header)+1)}{row}', 'value':value,'snapshot':None}

def add_evidence(families, family_frame, matrix_frame, unmatched, clean, normalize, as_of):
    family_file='Family_Upload_vs_Annotation_Tickets_Checked.xlsx'
    matrix_file='Annotation_Ticket_User_Matrix_Checked.xlsx'
    matrix={int(r['Ticket ID']):(i+2,r) for i,r in matrix_frame.iterrows()}
    qa=[]
    unmatched_rows={normalize(r['Family Name']):(i+2,r['Family Name']) for i,r in unmatched.iterrows()}
    for family, (index,row) in zip(families,family_frame.iterrows()):
        excel_row=index+2
        cfm=source_ref(family_frame,'Actual_CFM',excel_row,family_file,'Family_vs_Tickets',family['actualCfm'])
        trm=source_ref(family_frame,'Actual_TRM',excel_row,family_file,'Family_vs_Tickets',family['actualTrm'])
        proxy=PROXIES.get(family['key'])
        if proxy and (proxy[0] not in family['ticketIds'] or proxy[1]!=excel_row or proxy[2]!=family['actualCfm']):
            raise ValueError(f'Proxy provenance changed for {family["key"]}: review required')
        family['milestoneEvidence']={'actualCfm':{
            'value':family['actualCfm'],'kind':'uploadCreatedProxy' if proxy else 'unknown',
            'sourceFile':family_file,'sourceSheet':'Family_vs_Tickets','sourceCell':cfm['cell'],
            'evidenceRef':'Meta!B47; public.families.created_at' if proxy else None,
            'sourceEventId':None,'sourceTimezone':'Asia/Ho_Chi_Minh' if proxy else None,
            'precision':'date','cycleId':None,'reviewedBy':None,'reviewedAt':None,
        }}
        def emit(kind,left,right=None,ticket=None):
            qa.append({'id':f'{kind}:{family["key"]}:{ticket or ""}', 'type':kind,'severity':'review',
                'familyId':family['id'],'familyKey':family['key'],'ticketId':ticket,
                'left':left,'right':right,'resolution':'unreviewed'})
        # Multi-ticket combined strings cannot be compared as individual statuses.
        if len(family['ticketIds'])==1:
            ticket=family['ticketIds'][0]
            if ticket in matrix:
                mi,mr=matrix[ticket]
                ms=clean(mr['Ticket Status'])
                if family['ticketStatus'].lower()!=str(ms).strip().lower():
                    emit('ticket_status_conflict',source_ref(family_frame,'Ticket_Status',excel_row,family_file,'Family_vs_Tickets',family['ticketStatus']),source_ref(matrix_frame,'Ticket Status',mi,matrix_file,'Matrix',ms),ticket)
        if family['key'] in unmatched_rows:
            ui,un=unmatched_rows[family['key']]
            emit('historical_sheet_overlap',source_ref(family_frame,'Family Name',excel_row,family_file,'Family_vs_Tickets',family['name']),source_ref(unmatched,'Family Name',ui,family_file,'Unmatched',un))
        def valid(value):
            try: return isinstance(value,str) and date.fromisoformat(value).isoformat()==value
            except ValueError: return False
        if valid(family['actualCfm']) and valid(family['actualTrm']) and family['actualCfm']<family['actualTrm']:
            emit('cfm_before_trm_review',cfm,trm)
        if valid(family['actualCfm']) and family['actualCfm']>as_of:
            emit('future_cfm',cfm)
    return qa

def apply_status_policy(tickets, families):
    # User decision 2026-10-05: prefer unambiguous directly-linked Family status.
    statuses={}
    for family in families:
        if len(family['ticketIds'])==1 and family['ticketStatus'] in {'new','acknowledged','assigned','resolved','closed'}:
            statuses.setdefault(family['ticketIds'][0],set()).add(family['ticketStatus'])
    for ticket in tickets:
        ticket['matrixStatus']=ticket['status']
        linked=statuses.get(ticket['id'],set())
        ticket['familyStatuses']=sorted(linked)
        if len(linked)==1:
            ticket['status']=next(iter(linked))
            ticket['statusSource']='Family_vs_Tickets.Ticket_Status (user-preferred)'
        else:
            ticket['statusSource']='Matrix.Ticket Status (no unambiguous Family status)'
