import subprocess,sys,os
rows=[(a,float(b)) for a,b in (x.split(':') for x in open('data.txt').read().split())]
W,H=860,600; L,R,T,B=60,800,200,500; vmin,vmax=0,33000; n=len(rows)
X=lambda i:L+(R-L)*i/(n-1); Y=lambda v:B-(B-T)*(v-vmin)/(vmax-vmin)
N="#16213A";GR="#8C95A8";G="#1E9E5A";RED="#D94A3D"
def kr(v): return f"{int(round(v,-2)):,}".replace(","," ")+" kr"
imin=min(range(n),key=lambda i:rows[i][1])
def svg(k):
    pts=rows[:k+1] if k>0 else rows[:1]*2
    line=" ".join(f"{X(i if k>0 else 0):.1f},{Y(v):.1f}" for i,(d,v) in enumerate(pts))
    area=f"{L},{B} "+line+f" {X(k):.1f},{B}"
    v=pts[-1][1]; col=G if v>=10000 else RED
    yr=pts[-1][0][:4]
    extra=""
    if k>=imin:
        extra+=f'<circle cx="{X(imin):.1f}" cy="{Y(rows[imin][1]):.1f}" r="10" fill="{RED}" stroke="#fff" stroke-width="4"/><text x="{X(imin):.1f}" y="{Y(rows[imin][1])+42:.1f}" text-anchor="middle" font-family="Inter Display" font-weight="800" font-size="24" fill="{RED}">3 300 kr okt 2022</text>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{col}" stop-opacity="0.25"/><stop offset="1" stop-color="{col}" stop-opacity="0"/></linearGradient></defs>
<rect x="14" y="18" width="{W-24}" height="{H-28}" rx="34" fill="#CFCFCF"/><rect x="4" y="4" width="{W-24}" height="{H-28}" rx="34" fill="#fff"/>
<text x="{L}" y="62" font-family="Inter Display" font-weight="700" font-size="26" fill="{GR}">10 000 kr i Spotify-aktien · köpt nov 2021</text>
<text x="{L}" y="126" font-family="Inter Display" font-weight="800" font-size="60" fill="{col}">{kr(v)}</text>
<text x="{R}" y="124" text-anchor="end" font-family="Inter Display" font-weight="800" font-size="40" fill="{N}">{yr}</text>
<line x1="{L}" x2="{R}" y1="{Y(10000):.1f}" y2="{Y(10000):.1f}" stroke="{GR}" stroke-width="2" stroke-dasharray="8 8"/>
<text x="{L+4}" y="{Y(10000)-10:.1f}" font-family="Inter Display" font-weight="700" font-size="20" fill="{GR}">insatsen 10 000 kr</text>
<polygon points="{area}" fill="url(#g)"/>
<polyline points="{line}" fill="none" stroke="{col}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
{extra}
<circle cx="{X(k):.1f}" cy="{Y(v):.1f}" r="11" fill="{col}" stroke="#fff" stroke-width="4"/>
<text x="{L}" y="{H-30}" font-family="Inter Display" font-weight="600" font-size="20" fill="{GR}">Inkl. valuta (USD/SEK), utan courtage · Yahoo Finance, 19 nov 2026</text>
</svg>'''
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
F=48
for f in range(F):
    k=round((n-1)*f/(F-1))
    open('/tmp/sp/f.svg','w').write(svg(k))
    subprocess.run(["rsvg-convert","-z","1.5","/tmp/sp/f.svg","-o",f"{out}/{f:02d}.png"],check=True)
print('done',n)
