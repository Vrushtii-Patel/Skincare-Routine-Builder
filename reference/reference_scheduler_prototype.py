import json, itertools, os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
D = SCRIPT_DIR + '/'
ing={i['id']:i for i in json.load(open(D+'ingredients.json'))['ingredients']}
con=json.load(open(D+'conflicts.json')); fre=json.load(open(D+'frequencies.json'))
W=fre['scheduling']['penaltyWeights']; DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
SPEC=lambda r:(2 if (r['a'] in ing and r['b'] in ing) else 1 if (r['a'] in ing or r['b'] in ing) else 0)
def match(x,i): return x==i or x in ing[i]['tags']
def rule_for(i,j):
    hits=[]
    for r in con['rules']:
        ok=(match(r['a'],i) and match(r['b'],j)) or (match(r['a'],j) and match(r['b'],i))
        if r['a']==r['b'] and (i==j): ok=False
        if ok: hits.append(r)
    if not hits: return None
    return sorted(hits,key=lambda r:(-SPEC(r),-W[r['severity']] if r['severity'] in W else 0,r['id']))[0]
def build(products,sensitive=False):
    units=[]
    for p in products:
        sch=[k for k in p['ingredients'] if ing[k]['schedulingMode']=='scheduled']
        if not sch: continue
        n=min(fre['ingredients'][k]['sensitiveNights' if sensitive else 'normalNights'] for k in sch)
        t={fre['ingredients'][k]['time'] for k in sch}-{'any'}
        units.append(dict(id=p['id'],ings=p['ingredients'],sch=sch,n=n,time=(t.pop() if t else 'any')))
    pair={}
    for a,b in itertools.combinations(units,2):
        rs=[r for i in a['sch'] for j in b['sch'] if i!=j for r in [rule_for(i,j)] if r and r['enforcement']=='soft']
        if rs: pair[(a['id'],b['id'])]=max(rs,key=lambda r:W[r['severity']])
    # time-of-day resolution
    notes=[]
    for (x,y),r in sorted(pair.items()):
        ux=next(u for u in units if u['id']==x); uy=next(u for u in units if u['id']==y)
        if r['resolutionOrder'][0]=='time-of-day':
            for u,o in ((ux,uy),(uy,ux)):
                if u['time']=='any' and o['time'] in('AM','PM'):
                    u['time']='AM' if o['time']=='PM' else 'PM'; notes.append(f"{u['id']} -> {u['time']} (separated from {o['id']} by time of day, rule {r['id']})")
    for u in units:
        if u['time']=='any': u['time']='PM'
    grid={(s,d):[] for s in('AM','PM') for d in range(7)}
    deg={u['id']:sum(1 for k in pair if u['id'] in k) for u in units}
    order=sorted(units,key=lambda u:(-deg[u['id']],-u['n'],-max(['none','low','moderate','high'].index(ing[k]['irritationPotential']) for k in u['sch']),u['id']))
    warnings=[]
    for u in order:
        chosen=[]
        for _ in range(u['n']):
            best=None
            for d in range(7):
                if d in chosen: continue
                pen=0; slot=grid[(u['time'],d)]
                for o in slot:
                    k=(u['id'],o) if (u['id'],o) in pair else (o,u['id'])
                    if k in pair and pair[k]['resolutionOrder'] and 'night' in pair[k]['resolutionOrder']: pen+=W[pair[k]['severity']]
                if len(slot)>=fre['scheduling']['maxScheduledActivesPerNight']: pen+=W['overMaxActives']
                if 'retinoid' in sum([ing[k]['tags'] for k in u['sch']],[]):
                    for nb in ((d-1)%7,(d+1)%7):
                        if nb in chosen and u['time']=='PM': pen+=W['consecutiveRetinoid']
                score=(pen,len(slot),d)
                if best is None or score<best[0]: best=(score,d)
            chosen.append(best[1]); grid[(u['time'],best[1])].append(u['id'])
            if best[0][0]>0: warnings.append(f"{u['id']} on {DAYS[best[1]]} {u['time']}: unresolved soft penalty {best[0][0]}")
    rest=[DAYS[d] for d in range(7) if not grid[('PM',d)] and not grid[('AM',d)]]
    pm_rest=[DAYS[d] for d in range(7) if not grid[('PM',d)]]
    return grid,notes,warnings,pm_rest
shelf=[dict(id='retinol-serum',ingredients=['retinol','squalane']),
       dict(id='glycolic-toner',ingredients=['glycolic-acid']),
       dict(id='bpo-gel',ingredients=['benzoyl-peroxide']),
       dict(id='vitc-serum',ingredients=['vitamin-c']),
       dict(id='niacinamide',ingredients=['niacinamide'])]
for s in (False,True):
    g,n,w,r=build(shelf,s); g2=build(shelf,s)[0]
    print('sensitive' if s else 'normal','deterministic:',g==g2)
    for sl in('AM','PM'): print(sl,[','.join(g[(sl,d)]) or '-' for d in range(7)])
    print('notes',n); print('warnings',w); print('PM rest nights',r)
