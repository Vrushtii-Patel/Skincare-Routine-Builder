#!/usr/bin/env python3
"""Cross-file consistency checks for the skincare data files. Run: python3 validate.py"""
import json, sys, itertools
from urllib.parse import urlparse
import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
def get_path(f):
    p = os.path.join(SCRIPT_DIR, f)
    if os.path.exists(p): return p
    p_src = os.path.join(SCRIPT_DIR, '..', 'src', 'data', f)
    if os.path.exists(p_src): return p_src
    return f
L = lambda f: json.load(open(get_path(f)))
ing, con, fre, src = L('ingredients.json'), L('conflicts.json'), L('frequencies.json'), L('sources.json')
errors = []
def err(m): errors.append(m)

CATS = {'retinoid','retinol-alternative','exfoliating-acid','antibacterial','other-active','antioxidant','hydrator','soothing','sunscreen'}
IRR = {'none','low','moderate','high'}; AVAIL = {'otc','rx','both'}
MODES = {'scheduled','every-routine','user-directed'}; TIMES = {'AM','PM','any'}
KINDS = set(con['semantics']['kind']); SEV = set(con['semantics']['severity']); ENF = set(con['semantics']['enforcement'])
EVI = set(con['semantics']['evidence']); EXC = set(con['semantics']['excludeWhen']); RES = {'time-of-day','night'}

ids = [i['id'] for i in ing['ingredients']]
if len(ids) != len(set(ids)): err('duplicate ingredient ids')
tags = set(ing['tags']); by_id = {i['id']: i for i in ing['ingredients']}
src_ids = [s['id'] for s in src['sources']]
if len(src_ids) != len(set(src_ids)): err('duplicate source ids')
if set(ids) & tags: err(f'ids collide with tags: {set(ids)&tags}')
if len(tags) != len(ing['tags']): err('duplicate ingredient tags')
for s in src['sources']:
    if not s.get('title') or not s.get('organization') or not s.get('supports'):
        err(f"{s.get('id')}: source missing title/organization/supports")
    u = urlparse(s.get('url', ''))
    if u.scheme != 'https' or not u.netloc:
        err(f"{s.get('id')}: source URL must be an absolute HTTPS URL")

used_tags = set()
for i in ing['ingredients']:
    k = i['id']
    for field in ('name','category','tags','irritationPotential','availability','schedulingMode','preferredTime','pregnancyAdvisory','notes','sourceIds'):
        if field not in i: err(f'{k}: missing ingredient field {field}')
    if i['category'] not in CATS: err(f'{k}: bad category')
    if i['irritationPotential'] not in IRR: err(f'{k}: bad irritationPotential')
    if i['availability'] not in AVAIL: err(f'{k}: bad availability')
    if i['schedulingMode'] not in MODES: err(f'{k}: bad schedulingMode')
    if i['preferredTime'] not in TIMES: err(f'{k}: bad preferredTime')
    for t in i['tags']:
        used_tags.add(t)
        if t not in tags: err(f'{k}: unknown tag {t}')
    for s in i['sourceIds']:
        if s not in src_ids: err(f'{k}: unknown source {s}')
    if i['pregnancyAdvisory'] and 'retinoid' not in i['tags']: err(f'{k}: pregnancyAdvisory on non-retinoid')
    if 'retinoid' in i['tags'] and not i['pregnancyAdvisory']: err(f'{k}: retinoid missing pregnancyAdvisory')
    if i['availability'] == 'rx' and i['schedulingMode'] != 'user-directed': err(f'{k}: rx-only must be user-directed')
for t in tags - used_tags: err(f'unused tag {t}')

def resolves(x): return x in by_id or x in tags
def expand(x): return {x} if x in by_id else {i for i in by_id if x in by_id[i]['tags']}
seen = set(); rids = []
for r in con['rules']:
    rids.append(r['id'])
    for field in ('title','explanation','tip','sourceIds','resolutionOrder','excludeWhen'):
        if field not in r: err(f"{r.get('id')}: missing rule field {field}")
    for field in ('title','explanation','tip'):
        if not isinstance(r.get(field), str) or not r.get(field).strip():
            err(f"{r.get('id')}: empty rule text field {field}")
    if not (resolves(r['a']) and resolves(r['b'])): err(f"{r['id']}: unresolved a/b")
    if r['kind'] not in KINDS: err(f"{r['id']}: bad kind")
    if r['severity'] not in SEV: err(f"{r['id']}: bad severity")
    if r['enforcement'] not in ENF: err(f"{r['id']}: bad enforcement")
    if r['enforcement'] == 'hard': err(f"{r['id']}: hard rules not allowed in this dataset")
    if r['evidence'] not in EVI: err(f"{r['id']}: bad evidence")
    if set(r['excludeWhen']) - EXC: err(f"{r['id']}: bad excludeWhen")
    if set(r['resolutionOrder']) - RES: err(f"{r['id']}: bad resolutionOrder")
    if r['enforcement'] == 'soft' and not r['resolutionOrder']: err(f"{r['id']}: soft rule needs resolutionOrder")
    if r['enforcement'] == 'none' and r['severity'] not in ('info',): err(f"{r['id']}: enforcement none should be info")
    if r['severity'] == 'info' and r['enforcement'] != 'none': err(f"{r['id']}: info must be enforcement none")
    if r['evidence'] == 'insufficient' and r['sourceIds']: err(f"{r['id']}: insufficient evidence but sources listed")
    if r['evidence'] != 'insufficient' and not r['sourceIds']: err(f"{r['id']}: sourced evidence but no sources")
    if r['evidence'] == 'insufficient' and 'conservative' not in r['explanation']: err(f"{r['id']}: insufficient rule must say it is conservative")
    for s in r['sourceIds']:
        if s not in src_ids: err(f"{r['id']}: unknown source {s}")
    key = frozenset([r['a'], r['b']])
    if key in seen: err(f"{r['id']}: duplicate (symmetric) pair")
    seen.add(key)
    if not expand(r['a']) or not expand(r['b']): err(f"{r['id']}: matches no ingredients")
if len(rids) != len(set(rids)): err('duplicate rule ids')
no_rule_seen = set()
for n in con['reviewedNoRule']:
    key = frozenset([n.get('a'), n.get('b')])
    if key in no_rule_seen: err(f"duplicate reviewedNoRule pair {n.get('a')}/{n.get('b')}")
    no_rule_seen.add(key)
    for field in ('decision','reason','sourceIds'):
        if field not in n: err(f"reviewedNoRule {n.get('a')}/{n.get('b')}: missing {field}")
    if not (resolves(n['a']) and resolves(n['b'])): err(f"noRule {n['a']}/{n['b']} unresolved")
    if frozenset([n['a'], n['b']]) in seen: err(f"noRule {n['a']}/{n['b']} also has a rule")
    for s in n['sourceIds']:
        if s not in src_ids: err(f'noRule unknown source {s}')

for k, f in fre['ingredients'].items():
    if k not in by_id: err(f'freq {k}: unknown ingredient'); continue
    i = by_id[k]
    if f['mode'] != i['schedulingMode']: err(f'freq {k}: mode mismatch')
    if f['time'] != i['preferredTime']: err(f'freq {k}: time mismatch')
    if f['mode'] == 'scheduled':
        if not (1 <= f['sensitiveNights'] <= f['normalNights'] <= f['maxUserNights'] <= 7): err(f'freq {k}: nights not ordered 1<=sens<=normal<=max<=7')
    else:
        if not f.get('requiresDirections'): err(f'freq {k}: user-directed needs requiresDirections')
for i in ing['ingredients']:
    if i['schedulingMode'] in ('scheduled','user-directed') and i['id'] not in fre['ingredients']: err(f"{i['id']}: scheduled/user-directed but no frequency entry")
    if i['schedulingMode'] == 'every-routine' and i['id'] in fre['ingredients']: err(f"{i['id']}: every-routine must not have frequency entry")
for t in fre['scheduling']['noConsecutiveNightsForTags']:
    if t not in tags: err(f'unknown tag in scheduling: {t}')
w = fre['scheduling']['penaltyWeights']
if not all(isinstance(v, int) and v > 0 for v in w.values()): err('penalty weights must be positive ints')

print(f"ingredients={len(ids)} tags={len(tags)} rules={len(rids)} noRule={len(con['reviewedNoRule'])} freq={len(fre['ingredients'])} sources={len(src_ids)}")
if errors:
    print('FAILED'); [print(' -', e) for e in errors]; sys.exit(1)
print('ALL CHECKS PASSED')
