#!/usr/bin/env python3
from __future__ import annotations
import json, os, re
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime
from pathlib import Path
import os


BASE = Path(__file__).resolve().parent

# Source discovery is automatic. Prefer the five report source files beside
# server.py when they exist; otherwise use the configured phases tree.
SOURCE_FILENAMES = {
    'requirement_breakdown.md', 'fe_acceptance_criteria.md',
    'be_acceptance_criteria.md', 'testcase.md', 'be_testcase.md'
}
_env_root = os.environ.get('PHASES_ROOT')
if _env_root:
    SOURCE_ROOT = Path(_env_root).expanduser()
    if not SOURCE_ROOT.is_absolute(): SOURCE_ROOT = BASE / SOURCE_ROOT
    SOURCE_ROOT = SOURCE_ROOT.resolve()
else:
    local_names = {x.name.lower() for x in BASE.glob('*.md')}
    if SOURCE_FILENAMES.issubset(local_names):
        SOURCE_ROOT = BASE.resolve()
    else:
        _candidates = [(BASE / 'phases').resolve(), (BASE.parent / 'phases').resolve()]
        SOURCE_ROOT = next((p for p in _candidates if p.exists()), _candidates[0])
PHASES_ROOT = SOURCE_ROOT
print(f"Report directory : {BASE}")
print(f"Phase directory  : {SOURCE_ROOT}")
PORT = int(os.environ.get('REPORT_PORT', '8765'))
HOST = os.environ.get('REPORT_HOST', '127.0.0.1')
NAVY, ORANGE = '#28285F', '#EC5814'

def read_text(p):
    try: return p.read_text(encoding='utf-8', errors='replace')
    except Exception: return ''

def md_files():
    return list(SOURCE_ROOT.rglob('*.md')) if SOURCE_ROOT.exists() else []

def clean(s): return re.sub(r'\s+', ' ', (s or '').replace('\r','')).strip()

def row(line):
    if not line.strip().startswith('|'): return None
    return [x.strip() for x in line.strip().strip('|').split('|')]

def expand_ac_ids(value):
    """Expand AC references, including compact ranges such as AC-CNT-06-01 to 05."""
    value = clean(value)
    full = re.findall(r'AC-[A-Z]+-\d+-\d+', value, re.I)
    if not full:
        # Also accept a comma/space separated list when the prefix is omitted
        # after the first ID, e.g. "AC-CNT-06-01, 02, 03".
        return []
    first = full[0].upper()
    m = re.match(r'(AC-[A-Z]+-\d+)-(\d+)$', first, re.I)
    if not m:
        return list(dict.fromkeys(x.upper() for x in full))
    prefix = m.group(1).upper()
    out = []
    # Explicit range: 01 to 05, 01-05, 01–05.
    rm = re.search(r'(?:AC-[A-Z]+-\d+-)?(\d+)\s*(?:to|[-–—])\s*(\d+)', value, re.I)
    if rm and ('to' in value.lower() or re.search(r'\d+\s*[-–—]\s*\d+', value)):
        start_n, end_n = int(rm.group(1)), int(rm.group(2))
        if end_n >= start_n and end_n - start_n <= 500:
            out.extend(f'{prefix}-{n:02d}' for n in range(start_n, end_n + 1))
    if not out:
        out.append(first)
    # Pick up any other fully-qualified IDs in the same cell.
    out.extend(x.upper() for x in full[1:])
    return list(dict.fromkeys(out))

def _header_index(headers, *names):
    """Return the first matching column index for common Markdown header variants."""
    normalized = {clean(h).lower().replace('**','').replace('_',' '): i for i,h in enumerate(headers)}
    for name in names:
        key = clean(name).lower().replace('_',' ')
        if key in normalized:
            return normalized[key]
    return None


def parse_requirement_matrix():
    """Discover every REQ/AC mapping in Markdown tables.

    The requirement matrix is intentionally treated as a discovery source, not
    limited to one exact heading or one exact column spelling. This makes a
    newly added requirement/AC row immediately available to the live report.
    """
    requirements = {}
    acs = {}
    for p in md_files():
        lines = read_text(p).splitlines()
        headers = None
        for line in lines:
            parts = row(line)
            if not parts:
                continue
            normalized = [clean(x).lower().replace('**','') for x in parts]
            req_idx = _header_index(parts, 'req id', 'req_id', 'requirement id', 'requirement_id')
            title_idx = _header_index(parts, 'requirement title', 'title', 'requirement')
            ac_idx = _header_index(parts, 'ac ids', 'ac_id', 'ac id', 'acceptance criteria', 'acceptance criterion ids')
            if req_idx is not None and title_idx is not None and ac_idx is not None:
                headers = parts
                continue
            if not headers:
                continue

            req_idx = _header_index(headers, 'req id', 'req_id', 'requirement id', 'requirement_id')
            title_idx = _header_index(headers, 'requirement title', 'title', 'requirement')
            ac_idx = _header_index(headers, 'ac ids', 'ac_id', 'ac id', 'acceptance criteria', 'acceptance criterion ids')
            layer_idx = _header_index(headers, 'layer')
            source_idx = _header_index(headers, 'source', 'sources')
            if req_idx is None or ac_idx is None:
                continue
            req_id = clean(parts[req_idx]) if req_idx < len(parts) else ''
            if not re.fullmatch(r'REQ-[A-Z]+-\d+', req_id, re.I):
                continue
            title = clean(parts[title_idx]) if title_idx is not None and title_idx < len(parts) else ''
            ac_cell = clean(parts[ac_idx]) if ac_idx < len(parts) else ''
            layer = clean(parts[layer_idx]) if layer_idx is not None and layer_idx < len(parts) else ''
            source = clean(parts[source_idx]) if source_idx is not None and source_idx < len(parts) else ''
            ac_ids = expand_ac_ids(ac_cell)
            if not ac_ids:
                continue
            r = requirements.setdefault(req_id, {'id':req_id,'title':title,'sources':[],'layer':layer,'matrix_source':source,'acs':[]})
            if title:
                r['title'] = title
            if layer:
                r['layer'] = layer
            if source:
                r.setdefault('matrix_sources', set()).add(source)
            r.setdefault('sources', []).append(p.name)
            for aid in ac_ids:
                r['acs'].append(aid)
                acs.setdefault(aid, {
                    'id':aid,
                    'requirement_id':req_id,
                    'criterion':f'Acceptance criterion {aid} referenced by requirement matrix.',
                    'tags':set(),
                    'sources':set()
                })
                acs[aid]['sources'].add(p.name)

    for r in requirements.values():
        r['acs'] = sorted(set(r.get('acs', [])))
        r['sources'] = sorted(set(r.get('sources', [])))
        if isinstance(r.get('matrix_sources'), set):
            r['matrix_sources'] = sorted(r['matrix_sources'])
    return requirements, acs

def parse_acceptance():
    """Parse FE/BE acceptance-criteria files."""
    requirements, acs = {}, {}
    for p in md_files():
        if p.name.lower() not in ('fe_acceptance_criteria.md','be_acceptance_criteria.md'): continue
        req_id=None; headers=None
        for line in read_text(p).splitlines():
            hm=re.match(r'^###\s+(REQ-[A-Z]+-\d+)\s+[—-]\s*(.+)$', line.strip())
            if hm:
                req_id=hm.group(1).upper(); title=clean(hm.group(2)); headers=None
                requirements.setdefault(req_id, {'id':req_id,'title':title,'sources':[]})['sources'].append(p.name)
                continue
            if not req_id: continue
            parts=row(line)
            if not parts: continue
            if clean(parts[0]).lower() in ('ac id','ac_id','acceptance criterion id'):
                headers=[clean(x).lower().replace('_',' ') for x in parts]; continue
            if not headers or len(parts)<2: continue
            idx={h:i for i,h in enumerate(headers)}
            aid=''
            for key in ('ac id','acceptance criterion id'):
                if key in idx and idx[key]<len(parts): aid=parts[idx[key]]; break
            aid=clean(aid).upper()
            if not re.fullmatch(r'AC-[A-Z]+-\d+-\d+', aid): continue
            ci=idx.get('acceptance criterion',idx.get('criterion',2))
            criterion=clean(parts[ci]) if ci<len(parts) else ''
            tag=clean(parts[idx['tag']]) if 'tag' in idx and idx['tag']<len(parts) else ''
            a=acs.setdefault(aid, {'id':aid,'requirement_id':req_id,'criterion':criterion,'tags':set(),'sources':set()})
            if len(criterion)>len(a['criterion']): a['criterion']=criterion
            if tag: a['tags'].add(tag)
            a['sources'].add(p.name)
    for a in acs.values(): a['tags']=sorted(a['tags']); a['sources']=sorted(a['sources'])
    for r in requirements.values(): r['acs']=[]
    for aid,a in acs.items(): requirements.setdefault(a['requirement_id'],{'id':a['requirement_id'],'title':'','sources':[]})['acs'].append(aid)
    for r in requirements.values(): r['acs']=sorted(set(r['acs'])); r['sources']=sorted(set(r['sources']))
    return sorted([r for r in requirements.values() if r['acs']],key=lambda x:x['id']), acs

def parse_requirement_details():
    """Discover REQ/AC tables directly from requirement_breakdown.md."""
    requirements, acs = {}, {}
    for p in md_files():
        if p.name.lower()!='requirement_breakdown.md': continue
        req_id=None; headers=None
        for line in read_text(p).splitlines():
            hm=re.match(r'^###\s+(REQ-[A-Z]+-\d+)\s+[—-]\s*(.+)$',line.strip())
            if hm:
                req_id=hm.group(1).upper(); headers=None
                requirements.setdefault(req_id,{'id':req_id,'title':clean(hm.group(2)),'sources':[],'acs':[]})
                requirements[req_id]['title']=clean(hm.group(2)); requirements[req_id]['sources'].append(p.name); continue
            if not req_id: continue
            parts=row(line)
            if not parts:
                if line.strip().startswith('#'): headers=None
                continue
            if clean(parts[0]).lower() in ('id','ac id','ac_id','acceptance criterion id'):
                headers=[clean(x).lower().replace('_',' ') for x in parts]; continue
            if not headers: continue
            idx={h:i for i,h in enumerate(headers)}
            ai=idx.get('id',idx.get('ac id',idx.get('acceptance criterion id')))
            if ai is None or ai>=len(parts): continue
            aid=clean(parts[ai]).upper()
            if not re.fullmatch(r'AC-[A-Z]+-\d+-\d+',aid): continue
            ci=idx.get('acceptance criterion',idx.get('criterion'))
            li=idx.get('layer')
            criterion=clean(parts[ci]) if ci is not None and ci<len(parts) else ''
            layer=clean(parts[li]) if li is not None and li<len(parts) else ''
            a=acs.setdefault(aid,{'id':aid,'requirement_id':req_id,'criterion':criterion,'tags':set(),'sources':set()})
            if criterion and len(criterion)>len(a['criterion']): a['criterion']=criterion
            for tag in re.findall(r'\[(FE\+BE|FE|BE)\]',layer,re.I): a['tags'].add('['+tag.upper()+']')
            a['sources'].add(p.name); requirements[req_id]['acs'].append(aid)
    for r in requirements.values(): r['acs']=sorted(set(r['acs'])); r['sources']=sorted(set(r['sources']))
    for a in acs.values(): a['tags']=sorted(a['tags']); a['sources']=sorted(a['sources'])
    return sorted(requirements.values(),key=lambda x:x['id']),acs

def parse_dev():
    out={}
    for p in md_files():
        if p.name.lower() not in ('fe_development_status.md','be_development_status.md'): continue
        headers=None
        for line in read_text(p).splitlines():
            parts=row(line)
            if not parts: continue
            if any(x.lower()=='ac id' for x in parts): headers=[clean(x).lower() for x in parts]; continue
            if not headers: continue
            idx={h:i for i,h in enumerate(headers)}
            if 'ac id' not in idx: continue
            aid=parts[idx['ac id']] if idx['ac id']<len(parts) else ''
            if not re.fullmatch(r'AC-[A-Z]+-\d+-\d+',aid): continue
            st=parts[idx['status']] if 'status' in idx and idx['status']<len(parts) else ''
            notes=parts[idx['notes']] if 'notes' in idx and idx['notes']<len(parts) else ''
            evidence=parts[idx['implementation']] if 'implementation' in idx and idx['implementation']<len(parts) else (parts[idx['evidence']] if 'evidence' in idx and idx['evidence']<len(parts) else '')
            out.setdefault(aid,[]).append({'source':p.name,'status':clean(st),'notes':clean(notes),'evidence':clean(evidence)})
    return out

def parse_tests():
    """Parse detailed test-case blocks AND explicit traceability matrices.

    The traceability matrix is important because users can add a new AC mapping
    there without adding/changing a detailed test-case section.  We index tests
    by AC ID, then the build step attaches them to the canonical requirement
    owner from requirement_breakdown.md.
    """
    tests=[]
    seen=set()

    def add_test(t):
        aid=clean(t.get('ac_id','')).upper()
        if not aid: return
        tcid=clean(t.get('id','')).upper()
        key=(aid,tcid,t.get('type',''))
        if key in seen: return
        seen.add(key)
        t['ac_id']=aid
        tests.append(t)

    for p in md_files():
        name=p.name.lower(); txt=read_text(p)
        if name=='testcase.md':
            # Detailed FE test-case sections.
            blocks=re.split(r'(?=^####?\s+TC-\d+\b)',txt,flags=re.M)
            for b in blocks:
                m=re.match(r'^####?\s+(TC-\d+)\s*[—:-]\s*(.*)',b,re.M)
                if not m: continue
                vals={}
                for line in b.splitlines():
                    if line.startswith('## '): break
                    parts=row(line)
                    if parts and len(parts)>1 and clean(parts[0]).strip('*') in ('Test Case ID','Requirement ID','AC ID','Automation Candidate','Priority'):
                        vals[clean(parts[0]).strip('*')]=clean(parts[1])
                aid=vals.get('AC ID','')
                for one_aid in [x.strip() for x in aid.split(',') if x.strip()]:
                    add_test({'id':m.group(1),'title':clean(m.group(2)),'ac_id':one_aid,
                              'req_id':vals.get('Requirement ID',''),'automation':vals.get('Automation Candidate',''),
                              'priority':vals.get('Priority',''),'type':'FE'})

            # Explicit FE traceability matrix.  This catches rows such as:
            # | AC-XCT-06-03 | REQ-XCT-05 | STORY-XCT-05-03 | TC-015 | ... |
            in_matrix=False; headers=None
            for line in txt.splitlines():
                if re.match(r'^##\s+Traceability Matrix\b',line,re.I):
                    in_matrix=True; headers=None; continue
                if in_matrix and re.match(r'^##\s+',line) and not re.match(r'^##\s+Traceability Matrix\b',line,re.I):
                    break
                if not in_matrix: continue
                parts=row(line)
                if not parts: continue
                if clean(parts[0]).lower()=='ac id':
                    headers=[clean(x).lower() for x in parts]; continue
                if not headers: continue
                idx={h:i for i,h in enumerate(headers)}
                aid=clean(parts[idx['ac id']]) if 'ac id' in idx and idx['ac id']<len(parts) else ''
                if not re.fullmatch(r'AC-[A-Z]+-\d+-\d+',aid,re.I): continue
                req=clean(parts[idx['req id']]) if 'req id' in idx and idx['req id']<len(parts) else ''
                story=clean(parts[idx['story (placeholder)']]) if 'story (placeholder)' in idx and idx['story (placeholder)']<len(parts) else ''
                tc_cell=clean(parts[idx['test case id(s)']]) if 'test case id(s)' in idx and idx['test case id(s)']<len(parts) else ''
                zephyr=clean(parts[idx['zephyr status']]) if 'zephyr status' in idx and idx['zephyr status']<len(parts) else ''
                automation=clean(parts[idx['automation']]) if 'automation' in idx and idx['automation']<len(parts) else ''
                for tcid in [x.strip() for x in tc_cell.split(',') if x.strip()]:
                    add_test({'id':tcid,'title':story or 'Traceability Matrix mapping','ac_id':aid,'req_id':req,
                              'automation':automation,'priority':'','zephyr':zephyr,'story':story,'type':'FE','source':'matrix'})

        elif name=='be_testcase.md':
            # Detailed BE test-case sections.
            blocks=re.split(r'(?=^####\s+BET-\d+:)',txt,flags=re.M)
            for b in blocks:
                m=re.match(r'^####\s+(BET-\d+):\s*(.*)',b,re.M)
                if not m: continue
                vals={}
                for line in b.splitlines():
                    if line.startswith('## '): break
                    parts=row(line)
                    if parts and len(parts)>1 and clean(parts[0]).strip('*') in ('Test Case ID','REQ ID','AC ID','Automation Candidate','Priority'):
                        vals[clean(parts[0]).strip('*')]=clean(parts[1])
                aid=vals.get('AC ID','')
                if aid:
                    add_test({'id':m.group(1),'title':clean(m.group(2)),'ac_id':aid,'req_id':vals.get('REQ ID',''),
                              'automation':vals.get('Automation Candidate',''),'priority':vals.get('Priority',''),'type':'BE'})

            # Explicit BE traceability matrix.  This fills any matrix-only
            # mappings and prevents the report from depending on block parsing.
            in_matrix=False; headers=None
            for line in txt.splitlines():
                if re.match(r'^##\s+10\.\s+Traceability Matrix\b',line,re.I) or re.match(r'^##\s+Traceability Matrix\b',line,re.I):
                    in_matrix=True; headers=None; continue
                if in_matrix and re.match(r'^##\s+',line) and not re.match(r'^##\s+10\.\s+Traceability Matrix\b',line,re.I) and not re.match(r'^##\s+Traceability Matrix\b',line,re.I):
                    break
                if not in_matrix: continue
                parts=row(line)
                if not parts: continue
                if clean(parts[0]).lower()=='bet id':
                    headers=[clean(x).lower() for x in parts]; continue
                if not headers: continue
                idx={h:i for i,h in enumerate(headers)}
                aid=clean(parts[idx['ac id']]) if 'ac id' in idx and idx['ac id']<len(parts) else ''
                if not re.fullmatch(r'AC-[A-Z]+-\d+-\d+',aid,re.I): continue
                bet=clean(parts[idx['bet id']]) if 'bet id' in idx and idx['bet id']<len(parts) else ''
                req=clean(parts[idx['req id']]) if 'req id' in idx and idx['req id']<len(parts) else ''
                priority=clean(parts[idx['priority']]) if 'priority' in idx and idx['priority']<len(parts) else ''
                test_type=clean(parts[idx['test type']]) if 'test type' in idx and idx['test type']<len(parts) else ''
                automation=clean(parts[idx['automation']]) if 'automation' in idx and idx['automation']<len(parts) else ''
                notes=clean(parts[idx['notes']]) if 'notes' in idx and idx['notes']<len(parts) else ''
                if bet:
                    add_test({'id':bet,'title':notes or 'Traceability Matrix mapping','ac_id':aid,'req_id':req,
                              'automation':automation,'priority':priority,'test_type':test_type,'type':'BE','source':'matrix'})
    return tests

def auto_status(ts):
    if not ts: return 'NOT_DRAFTED'
    vals=[t['automation'].upper() for t in ts]
    if any('AUTOMATION_REQUIRED' in v or 'AUTOMATION_RECOMMENDED' in v for v in vals): return 'AUTOMATED'
    if any('MANUAL' in v for v in vals): return 'MANUAL'
    if any('NOT_AUTOMATABLE' in v for v in vals): return 'NOT_AUTOMATABLE'
    return 'DRAFTED'

def build():
    # Merge the requirement traceability matrix with detailed acceptance data.
    # The matrix is authoritative for discovering new REQ/AC references;
    # detailed acceptance files enrich the same records when present.
    matrix_reqs, matrix_acs = parse_requirement_matrix()
    detail_reqs, detail_acs = parse_requirement_details()
    reqs, acs = parse_acceptance()
    req_map = {r['id']: r for r in detail_reqs}
    for r in reqs:
        if r['id'] not in req_map:
            req_map[r['id']] = r
        else:
            rr=req_map[r['id']]
            if r.get('title'): rr['title']=r['title']
            rr['acs']=sorted(set(rr.get('acs',[])+r.get('acs',[])))
            rr['sources']=sorted(set(rr.get('sources',[])+r.get('sources',[])))
    for rid, mr in matrix_reqs.items():
        if rid not in req_map:
            req_map[rid] = mr
        else:
            rr = req_map[rid]
            if mr.get('title') and not rr.get('title'): rr['title'] = mr['title']
            rr['acs'] = sorted(set(rr.get('acs', []) + mr.get('acs', [])))
            rr['sources'] = sorted(set(rr.get('sources', []) + mr.get('sources', [])))
            if mr.get('layer'): rr['layer'] = mr['layer']
            if mr.get('matrix_source'): rr['matrix_source'] = mr['matrix_source']
            if mr.get('matrix_sources'): rr['matrix_sources'] = mr['matrix_sources']
    for aid, da in detail_acs.items():
        if aid not in acs: acs[aid]=da
        else:
            if len(da.get('criterion','')) > len(acs[aid].get('criterion','')): acs[aid]['criterion']=da['criterion']
            acs[aid]['sources']=sorted(set(acs[aid].get('sources',[]))|set(da.get('sources',[])))
            acs[aid]['tags']=sorted(set(acs[aid].get('tags',[]))|set(da.get('tags',[])))
    for aid, ma in matrix_acs.items():
        if aid not in acs: acs[aid]=ma
        else: acs[aid]['sources']=sorted(set(acs[aid].get('sources',[]))|set(ma.get('sources',[])))

    # requirement_breakdown.md is authoritative for discovering requirement/AC
    # edges.  Do NOT collapse duplicate AC IDs across requirements: if a new
    # matrix row reuses an existing AC ID, keep both traceability edges so the
    # new requirement is visible.  The AC detail itself remains keyed by AC ID,
    # while tests are also keyed by AC ID so stale REQ IDs in testcase.md do not
    # prevent the test from attaching to the AC.
    matrix_owner={}
    for rid, mr in matrix_reqs.items():
        for aid in mr.get('acs',[]):
            matrix_owner.setdefault(aid, []).append(rid)

    # Add matrix-only requirements/AC references, but retain the original
    # requirement ownership from acceptance criteria when the same AC appears
    # under more than one requirement.
    for aid, rids in matrix_owner.items():
        for rid in rids:
            rr=req_map.setdefault(rid, {'id':rid,'title':'','sources':[],'acs':[]})
            if aid not in rr['acs']: rr['acs'].append(aid)

    reqs = sorted([r for r in req_map.values() if r.get('acs') or r.get('id') in matrix_reqs], key=lambda x:x['id'])
    dev=parse_dev(); tests=parse_tests(); by={}
    for t in tests: by.setdefault(t['ac_id'],[]).append(t)
    ac_list=[]
    def aggregate_impl(records):
        statuses=[]
        for d in records:
            raw=clean(d.get('status',''))
            if not raw: continue
            if raw.startswith('✅'): raw='Implemented'
            elif raw.startswith('⚠️') or raw.startswith('⚠'): raw='Partial'
            elif raw.startswith('❌'): raw='Not Implemented'
            elif raw.startswith('🚫') or raw.startswith('🔒'): raw='Blocked'
            statuses.append(raw)
        if not statuses: return 'Not Tracked'
        canonical={'Implemented','Partial','Not Implemented','Blocked'}
        statuses=[x if x in canonical else x for x in statuses]
        if all(x=='Implemented' for x in statuses): return 'Implemented'
        if all(x=='Not Implemented' for x in statuses): return 'Not Implemented'
        if 'Blocked' in statuses: return 'Blocked'
        if 'Partial' in statuses or len(set(statuses))>1: return 'Partial'
        return statuses[0]

    # Build one report row per requirement/AC traceability edge.  This is the
    # key distinction from the old implementation, which treated AC ID as the
    # whole identity and therefore dropped a newly-added requirement when it
    # reused an AC ID already present elsewhere.
    edge_rows=[]; used_edges=set()
    for r in reqs:
        for aid in r.get('acs',[]):
            if aid not in acs: continue
            a=acs[aid]
            ts=by.get(aid,[]); impl=dev.get(aid,[])
            item={**a,'requirement_id':r['id'],'implementation':impl,'tests':ts,
                  'automation_status':auto_status(ts),'test_count':len(ts),'impl_status':aggregate_impl(impl)}
            edge_rows.append(item); used_edges.add((r['id'],aid))
    # Preserve any acceptance criterion that is not referenced by a requirement
    # matrix, so the report never silently loses an AC.
    for aid,a in acs.items():
        if not any(x['id']==aid for x in edge_rows):
            ts=by.get(aid,[]); impl=dev.get(aid,[])
            edge_rows.append({**a,'implementation':impl,'tests':ts,'automation_status':auto_status(ts),
                              'test_count':len(ts),'impl_status':aggregate_impl(impl)})
    ac_list=edge_rows
    ac_list.sort(key=lambda x:(x.get('requirement_id',''),x['id']))
    # JSON-safe normalization: matrix parsing uses sets internally for de-duplication.
    # Convert every set to a deterministic list before returning the API payload.
    for a in ac_list:
        if isinstance(a.get('tags'), set):
            a['tags'] = sorted(a['tags'])
        if isinstance(a.get('sources'), set):
            a['sources'] = sorted(a['sources'])
    for r in reqs:
        if isinstance(r.get('sources'), set):
            r['sources'] = sorted(r['sources'])
        if isinstance(r.get('matrix_sources'), set):
            r['matrix_sources'] = sorted(r['matrix_sources'])
        ra=[a for a in ac_list if a.get('requirement_id') == r['id']]
        r['stats']={'ac_total':len(ra),'drafted':sum(a['test_count']>0 for a in ra),'automated':sum(a['automation_status']=='AUTOMATED' for a in ra),'manual':sum(a['automation_status']=='MANUAL' for a in ra),'not_drafted':sum(a['automation_status']=='NOT_DRAFTED' for a in ra)}
    unique_ac={a['id']:a for a in ac_list}
    total=len(unique_ac); drafted=sum(a['test_count']>0 for a in unique_ac.values()); automated=sum(a['automation_status']=='AUTOMATED' for a in unique_ac.values()); manual=sum(a['automation_status']=='MANUAL' for a in unique_ac.values()); notauto=sum(a['automation_status']=='NOT_AUTOMATABLE' for a in unique_ac.values())
    auto_tests=sum('AUTOMATION_' in t['automation'].upper() for t in tests); manual_tests=sum('MANUAL' in t['automation'].upper() for t in tests)
    impl_counts={}
    for a in unique_ac.values():
        s=a.get('impl_status','Not Tracked')
        impl_counts[s]=impl_counts.get(s,0)+1
    files=[]
    for p in md_files():
        try: mt=p.stat().st_mtime
        except: mt=0
        files.append({'path':str(p.relative_to(SOURCE_ROOT)).replace('\\','/'),'mtime':mt})
    # Source traceability matrices are generated from the same live records used
    # above, so the FE/BE tabs change automatically when testcase.md or
    # be_testcase.md changes.
    matrix_req_ac=[]
    for r in reqs:
        srcs=r.get('sources',[]) or []
        layer=r.get('layer') or ('BE' if any(re.match(r'^be_', str(x), re.I) for x in srcs) else ('FE' if any(re.match(r'^fe_', str(x), re.I) for x in srcs) else '—'))
        matrix_req_ac.append({'req_id':r['id'],'title':r.get('title',''),'ac_ids':', '.join(r.get('acs',[])),'layer':layer,'source':', '.join(srcs) if srcs else '—'})

    matrix_fe_tc=[]; matrix_be_tc=[]
    for a in ac_list:
        for tc in a.get('tests',[]) or []:
            if tc.get('type') == 'BE':
                matrix_be_tc.append({'bet_id':tc.get('id','—'),'ac_id':a['id'],'req_id':a.get('requirement_id',''),'priority':tc.get('priority') or '—','test_type':tc.get('test_type') or '—','automation':tc.get('automation') or '—','notes':tc.get('title') or '—'})
            else:
                matrix_fe_tc.append({'ac_id':a['id'],'req_id':a.get('requirement_id',''),'story':tc.get('story') or '—','test_cases':tc.get('id','—'),'zephyr':tc.get('zephyr') or '—','automation':tc.get('automation') or '—','source':tc.get('source') or (', '.join(a.get('sources',[]) or []) or 'AC')})

    return {'generated_at':datetime.now().astimezone().isoformat(timespec='seconds'),'source_root':str(SOURCE_ROOT),'brand':{'navy':NAVY,'orange':ORANGE},'summary':{'requirements':len(reqs),'acs':total,'tests':len(tests),'drafted_acs':drafted,'automated_acs':automated,'manual_acs':manual,'not_automatable_acs':notauto,'not_drafted_acs':total-drafted,'drafted_pct':round(drafted/total*100,1) if total else 0,'automation_pct':round(automated/total*100,1) if total else 0,'automation_of_drafted_pct':round(automated/drafted*100,1) if drafted else 0,'automated_tests':auto_tests,'manual_tests':manual_tests,'implementation_counts':impl_counts},'requirements':reqs,'acs':ac_list,'files':files,'matrix_req_ac':matrix_req_ac,'matrix_fe_tc':matrix_fe_tc,'matrix_be_tc':matrix_be_tc}

class Handler(BaseHTTPRequestHandler):

    def log_message(self, *args):
        pass

    def send_bytes(self, data, ctype, status=200):
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Accept, Content-Type')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Accept, Content-Type')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path

        # Report page
        if path in ('/', '/report', '/report/'):
            report_path = BASE / 'report.html'

            if not report_path.exists():
                self.send_error(404, 'report.html not found')
                return

            data = report_path.read_bytes()
            self.send_bytes(data, 'text/html; charset=utf-8')
            return

        # Logo
        if path in ('/IGS_Logo.webp', '/report/IGS_Logo.webp', '/assets/IGS_Logo.webp', '/report/assets/IGS_Logo.webp'):
            logo_path = BASE / 'IGS_Logo.webp'

            if not logo_path.exists():
                self.send_error(404, 'Logo not found')
                return

            data = logo_path.read_bytes()
            self.send_bytes(data, 'image/webp')
            return

        # Report API
        if path in ('/api/report', '/report/api/report'):
            self.send_bytes(
                json.dumps(
                    build(),
                    ensure_ascii=False
                ).encode('utf-8'),
                'application/json'
            )
            return

        # Also serve the logo without a leading slash so the same report works
        # when opened from a local file or from /report/.
        if path.endswith('/IGS_Logo.webp') or path == 'IGS_Logo.webp':
            logo_path = BASE / 'IGS_Logo.webp'
            if logo_path.exists():
                self.send_bytes(logo_path.read_bytes(), 'image/webp')
                return

        self.send_error(404, 'Not found')


if __name__ == "__main__":
    print()
    print("=" * 60)
    print("IGS Live Traceability Report")
    print("=" * 60)
    print(f"Report: http://127.0.0.1:{PORT}/")
    print(f"API:    http://127.0.0.1:{PORT}/api/report")
    print()
    print("Watching:", PHASES_ROOT)
    print("Press Ctrl+C to stop the server.")
    print("=" * 60)

    server = ThreadingHTTPServer((HOST, PORT), Handler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()
