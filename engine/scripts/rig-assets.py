"""Prepare generated transparent PNGs as deterministic paper-puppet layers.

This is production asset slicing, not generation: no faces or colors are repainted.
The approved generated pixels are retained; polygon masks separate articulated parts.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import numpy as np
import json

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'public' / 'characters-v2' / 'raw'
OUT = ROOT / 'public' / 'characters-v2'
OUT.mkdir(parents=True, exist_ok=True)

# Coordinates refer to the original 1024 x 1536 generation canvas.
# Each crop retains the original coordinate system, so the rig cannot drift.
SPECS = {
 'woman-front': {'center':480,'floor':1500,'top':40,'headPivot':[478,294], 'head':[(270,0),(680,0),(680,283),(550,283),(542,322),(468,340),(418,319),(415,282),(270,282)],'arms':[
  {'name':'leftArm','pivot':[373,326],'poly':[(0,300),(371,300),(390,357),(387,465),(371,572),(362,683),(365,747),(344,904),(0,904)]},
  {'name':'rightArm','pivot':[589,327],'poly':[(590,294),(1024,294),(1024,738),(689,735),(628,629),(596,516),(575,398)]}
 ],'legTop':1164,'split':487},
 'woman-threequarter': {'center':492,'floor':1510,'top':29,'headPivot':[475,302], 'head':[(260,0),(660,0),(660,292),(555,292),(551,332),(492,350),(423,327),(418,298),(260,298)],'arms':[
  {'name':'leftArm','pivot':[359,344],'poly':[(0,315),(359,315),(382,377),(385,498),(383,593),(365,680),(354,773),(352,928),(0,928)]},
  {'name':'rightArm','pivot':[578,340],'poly':[(578,307),(1024,307),(1024,793),(687,792),(635,663),(598,532),(565,403)]}
 ],'legTop':1194,'split':506},
 'man-threequarter': {'center':520,'floor':1500,'top':16,'headPivot':[493,249], 'head':[(300,0),(660,0),(660,224),(563,224),(562,275),(506,303),(440,280),(430,237),(300,237)],'arms':[
  {'name':'leftArm','pivot':[332,313],'poly':[(0,283),(337,283),(354,350),(341,491),(320,619),(309,735),(293,886),(0,886)]},
  {'name':'rightArm','pivot':[626,300],'poly':[(626,266),(1024,266),(1024,760),(725,758),(686,633),(650,499),(605,371)]}
 ],'legTop':749,'split':526},
 'woman-sad': {'center':510,'floor':1513,'top':22,'headPivot':[510,285], 'head':[(290,0),(700,0),(700,285),(290,285)],'arms':[
  {'name':'leftArm','pivot':[389,326],'poly':[(0,299),(388,299),(411,370),(409,501),(400,603),(391,720),(394,881),(0,881)]},
  {'name':'rightArm','pivot':[631,328],'poly':[(632,300),(1024,300),(1024,905),(664,905),(649,781),(620,672),(613,493),(614,397)]}
 ],'legTop':1222,'split':521},
 'woman-seated': {'center':498,'floor':1514,'top':22},
 'man-seated': {'center':530,'floor':1484,'top':43},
}

def polygon(size, pts):
 m=Image.new('L',size,0);ImageDraw.Draw(m).polygon(pts,fill=255);return m

def save_part(im,mask,dest):
 out=im.copy();out.putalpha(ImageChops.multiply(im.getchannel('A'),mask));box=out.getbbox()
 if box is None: raise ValueError(f'Empty layer {dest}')
 out.crop(box).save(dest,optimize=True)
 return {'file':str(dest.relative_to(ROOT/'public')).replace('\\','/'),'box':list(box)}

def connected_mask(im,mask,near):
 """Discard disconnected cut-edge crumbs, retaining the actual sleeve/torso."""
 alpha=np.array(im.getchannel('A')).astype(float)*np.array(mask)/255
 solid=alpha>80
 yy,xx=np.where(solid)
 if len(xx)==0:return mask
 idx=np.argmin((xx-near[0])**2+(yy-near[1])**2)
 binary=Image.fromarray((solid*255).astype('uint8')).copy()
 ImageDraw.floodfill(binary,(int(xx[idx]),int(yy[idx])),128,thresh=0)
 keep=Image.fromarray((np.array(binary)==128).astype('uint8')*255).filter(ImageFilter.MaxFilter(3))
 return ImageChops.multiply(mask,keep)

manifest={}
for name,spec in SPECS.items():
 src=RAW/(name+'.png')
 if not src.exists():continue
 im=Image.open(src).convert('RGBA')
 a=np.array(im.getchannel('A'))
 ys,xs=np.where(a>200)
 print(name,im.size,'solid alpha bounds',tuple(map(int,(xs.min(),ys.min(),xs.max(),ys.max()))))
 info={'width':im.width,'height':im.height,'center':spec['center'],'floor':spec['floor'],'top':spec['top'],'layers':{}}
 if 'head' not in spec:
  info['layers']['whole']=save_part(im,Image.new('L',im.size,255),OUT/(name+'-whole.png'))
 else:
  masks={}
  # Slight overlap at the neck hides the cut seam when the head tilts gently.
  masks['head']=polygon(im.size,spec['head'])
  for arm in spec['arms']:
   mask=polygon(im.size,arm['poly'])
   if name.startswith('woman'):
    # The rose skirt must stay with the torso even where its edge crosses an
    # arm crop. This prevents a detached sliver from travelling with the sleeve.
    pixels=np.array(im).astype(float)
    r,g,b=pixels[:,:,0],pixels[:,:,1],pixels[:,:,2]
    rose=(r>g*1.13)&(b>g*.90)&(g<190)&(np.indices(a.shape)[0]>500)
    m=np.array(mask);m[rose]=0
    if arm['name']=='rightArm':
     yy,xx=np.indices(a.shape)
     # A diagonal cut follows the transparent gap below the raised sleeve.
     # This also catches pale anti-aliased skirt-edge pixels outside the hue mask.
     skirt_edge=(yy>545)&(xx<(620+(yy-545)*.65))
     m[skirt_edge]=0
    mask=Image.fromarray(m)
   masks[arm['name']]=mask
  yy=spec['legTop'];split=spec['split']
  masks['leftLeg']=polygon(im.size,[(0,yy),(split+8,yy),(split+8,1536),(0,1536)])
  masks['rightLeg']=polygon(im.size,[(split+8,yy),(1024,yy),(1024,1536),(split+8,1536)])
  body=Image.new('L',im.size,255)
  for mask in masks.values():body=ImageChops.subtract(body,mask)
  masks['body']=body
  for part,mask in masks.items():
   if part=='body':mask=connected_mask(im,mask,[spec['center'],600])
   if part in ('leftArm','rightArm'):
    pivot=next(arm['pivot'] for arm in spec['arms'] if arm['name']==part)
    mask=connected_mask(im,mask,[pivot[0]+(130 if part=='rightArm' else 0),pivot[1]+170])
   info['layers'][part]=save_part(im,mask,OUT/(name+'-'+part+'.png'))
  info['headPivot']=spec['headPivot'];info['armPivots']={arm['name']:arm['pivot'] for arm in spec['arms']}
  info['legPivot']=[spec['center'],spec['legTop']]
 manifest[name]=info

(ROOT/'src'/'data'/'character-rig.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print('Prepared',len(manifest),'character views and all non-destructive puppet crops.')
