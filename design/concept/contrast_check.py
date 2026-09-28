import zlib, struct, sys
def readpng(path):
    d=open(path,'rb').read(); i=8; idat=b''; w=h=0
    while i<len(d):
        n=struct.unpack('>I',d[i:i+4])[0]; t=d[i+4:i+8]; c=d[i+8:i+8+n]; i+=12+n
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',c[:10])
        elif t==b'IDAT': idat+=c
    raw=zlib.decompress(idat); bpp=4 if ct==6 else 3; st=w*bpp; rows=[]; prev=bytearray(st); p=0
    for y in range(h):
        f=raw[p]; p+=1; line=bytearray(raw[p:p+st]); p+=st
        for x in range(st):
            a=line[x-bpp] if x>=bpp else 0; b=prev[x]; c=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+(a+b)//2)&255
            elif f==4:
                pp=a+b-c; pa,pb,pc=abs(pp-a),abs(pp-b),abs(pp-c)
                line[x]=(line[x]+(a if pa<=pb and pa<=pc else b if pb<=pc else c))&255
        rows.append(line); prev=line
    return w,h,bpp,rows
def lum(r,g,b):
    f=lambda v:(v/255)/12.92 if v/255<=0.03928 else ((v/255+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def hexrgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
w,h,bpp,rows=readpng(sys.argv[1])
def bg(x0,y0,x1,y1):
    px=[]
    for y in range(y0,y1):
        r=rows[y]
        for x in range(x0,x1): px.append((r[x*bpp],r[x*bpp+1],r[x*bpp+2]))
    px.sort(key=lambda p:lum(*p)); m=px[len(px)//3]; return m, px[int(len(px)*0.9)]
checks=[("Name 'Janys' #e8ecff",'#e8ecff',1,(60,150,680,225)),
("Tagline 'amphibian in the' #dfe4ff",'#dfe4ff',1,(60,240,560,270)),
("Role line (mono 15px) #e2e6ff",'#e2e6ff',1,(60,282,580,302)),
("Terrace label (on pill) #f1eeff",'#f1eeff',1,(510,452,610,474)),
("Nav 'overview' #cdd3f2",'#cdd3f2',1,(1210,20,1290,44)),
("Cloud 'ask the frog' #29d3ff @.85",'#29d3ff',.85,(840,108,980,132)),
("Scroll cue #39ff88",'#39ff88',1,(700,845,900,870))]
for name,col,op,box in checks:
    b,bhi=bg(*box); fg=hexrgb(col); fg=tuple(op*f+(1-op)*bb for f,bb in zip(fg,b))
    L1,L2=lum(*fg),lum(*b); cr=(max(L1,L2)+0.05)/(min(L1,L2)+0.05)
    L3=lum(*bhi); cr2=(max(L1,L3)+0.05)/(min(L1,L3)+0.05)
    print(f"{name:42s} bg~{b} -> {cr:4.1f}:1 (worst bright bg {cr2:4.1f}:1)")
