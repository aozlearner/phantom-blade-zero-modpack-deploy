"""Experimental player-local table reconstruction; generated data stays private."""
from pathlib import Path
import json, re
from table_format import empty_table

ZERO = '{00000000-0000-0000-0000-000000000000}'

def parse_export(text):
    """Parse a strict subset of Unreal export text; reject anything ambiguous."""
    at = 0
    def value():
        nonlocal at
        if at >= len(text): raise ValueError('Missing value')
        if text[at] == '(':
            at += 1; result = {}
            while at < len(text) and text[at] != ')':
                m = re.match(r'[A-Za-z_][A-Za-z_0-9]*=', text[at:])
                if not m: raise ValueError('Expected field at '+str(at))
                key=m[0][:-1]; at+=len(m[0])
                if key in result: raise ValueError('Duplicate field '+key)
                result[key]=value()
                if at < len(text) and text[at] == ',':
                    at+=1
                    if at>=len(text) or text[at]==')':raise ValueError('Trailing comma')
                elif at >= len(text) or text[at] != ')': raise ValueError('Expected delimiter')
            if at >= len(text): raise ValueError('Unclosed struct')
            at+=1; return result
        if text[at] == '"':
            result, size=json.JSONDecoder().raw_decode(text[at:]); at+=size; return result
        m=re.match(r'[^,()]+',text[at:])
        if not m: raise ValueError('Invalid scalar')
        token=m[0];at+=len(token)
        if token in ('True','False'):return token=='True'
        if re.fullmatch(r'-?\d+(\.\d+)?',token):return float(token) if '.' in token else int(token)
        raise ValueError('Unsupported token '+token)
    result=value()
    if at != len(text):raise ValueError('Trailing data')
    return result

# Reflected field/type facts, not inherited implementation code.
SCHEMAS={
 'FlowLocText': {'Namespace':'Str','Key':'Str'},
 'AppearanceClothData': {'ClothAsset':'soft:ChaosClothAsset'},
 'AppearanceGroomData': {'GroomAsset':'soft:GroomAsset','GroomBindingAsset':'soft:GroomBindingAsset','SimulationSettings':'HairSimulationSettings','bDisableSimulationWhenHatVisible':'Bool'},
 'HairSimulationSettings': {'bOverrideSettings':'Bool','SimulationSetup':'HairSimulationSetup','SolverSettings':'HairSimulationSolver','ExternalForces':'HairSimulationForces','MaterialConstraints':'HairSimulationConstraints'},
 'HairSimulationSetup': {'bResetSimulation':'Bool','bDebugSimulation':'Bool','bLocalSimulation':'Bool','LinearVelocityScale':'Float','AngularVelocityScale':'Float','LocalBone':'Name','TeleportDistance':'Float'},
 'HairSimulationSolver': {'bEnableSimulation':'Bool'},
 'HairSimulationForces': {'GravityVector':'Vector','AirDrag':'Float','AirVelocity':'Vector'},
 'HairSimulationConstraints': {key:'Float' for key in ['BendDamping','BendStiffness','StretchDamping','StretchStiffness','StaticFriction','KineticFriction','StrandsViscosity','CollisionRadius']},
 'GameplayTag': {'TagName':'Name'},
 'PBZAppearanceStruct': {},
}
row=SCHEMAS['PBZAppearanceStruct']
for key in ['AppearanceName','AppearanceDesc','UnlockConditionDesc','LockedTipText']: row[key]='FlowLocText'
for key in ['AppearanceTexture','HighPrecisionTexture']:row[key]='soft:Texture2D'
for key in ['BodyMeshAsset','ClothMeshAsset','HatAsset','HeadAsset','NeckAsset','MeshBandAsset','BrowLashCardAsset']:row[key]='soft:SkeletalMesh'
row.update(GroomPhysicsAsset='soft:PhysicsAsset',AppearanceType='enum:EAppearanceType',ItemId='Name',GroomDataArray='array:AppearanceGroomData',UsedInSequences='array:soft:LevelSequence')
for key in ['BodyClothDataArray','HeadClothDataArray','HeadClothDataArrayHatHidden']:row[key]='array:AppearanceClothData'
for key in ['OutfitBodyItem','OutfitHatItem','OutfitBeardItem','OutfitHairStyleItem','OutfitSequenceHairStyleItem','OutfitNeckItem','OutfitMeshBandItem','OutfitBrowLashCardItem']:row[key]='Name'
for key in ['bHatUseSkinComponent','bDefaultHatHidden','bObtainableInGame']:row[key]='Bool'
for key in ['PBZItemTypeTag','AddTagWhenHas','AddTagWhenUse']:row[key]='GameplayTag'

def module(kind):
    if kind.startswith('Hair') or kind in ['GroomAsset','GroomBindingAsset']:return 'HairStrandsCore'
    if kind in ['Vector']:return 'CoreUObject'
    if kind=='ChaosClothAsset':return 'ChaosClothAssetEngine'
    if kind=='GameplayTag':return 'GameplayTags'
    if kind=='LevelSequence':return 'LevelSequence'
    if kind in SCHEMAS or kind.startswith('EAppearance'):return 'ProjectPBZ'
    return 'Engine'

def node(name,count=0):return {'Name':name,'InnerCount':count}
def typename(kind):
    if kind.startswith('array:'):return [node('ArrayProperty',1)]+typename(kind[6:])
    if kind.startswith('soft:'):
        name=kind[5:];return [node('SoftObjectProperty',1),node(name,1),node('/Script/'+module(name))]
    if kind.startswith('enum:'):
        name=kind[5:];return [node('EnumProperty',2),node(name,1),node('/Script/'+module(name)),node('ByteProperty')]
    if kind in SCHEMAS or kind=='Vector':return [node('StructProperty',1),node(kind,1),node('/Script/'+module(kind))]
    return [node(kind+'Property')]

def prop(name,kind,value):
    base={'Name':name,'ArrayIndex':0,'PropertyGuid':None,'PropertyTypeName':typename(kind)}
    if kind in SCHEMAS or kind=='Vector':
        if isinstance(value,str):value=parse_export(value)
        if not isinstance(value,dict):raise TypeError((name,kind,value))
        if kind=='HairSimulationSetup':
            # Export-text omits zero fields; the native constructor initializes
            # these two to 1.0. Preserve exported zero, not constructor defaults.
            value={'LinearVelocityScale':0.0,'AngularVelocityScale':0.0,**value}
        if kind=='Vector':
            if set(value)!=set('XYZ'):raise ValueError('Incomplete vector')
            data=[{'$type':'UAssetAPI.PropertyTypes.Structs.VectorPropertyData, UAssetAPI','Name':name,'Value':value}]
        else:
            schema=SCHEMAS[kind]
            unknown=set(value)-set(schema)
            if unknown:raise ValueError((kind,unknown))
            data=[prop(key,schema[key],val) for key,val in value.items()]
        return dict(base,**{'$type':'UAssetAPI.PropertyTypes.Structs.StructPropertyData, UAssetAPI','StructType':kind,'StructGUID':ZERO,'SerializeNone':True,'Value':data})
    extra={}
    if kind.startswith('array:'):
        inner=kind[6:]; data=[prop(name,inner,v) for v in value]
        extra={'ArrayType':typename(inner)[0]['Name']}
        if inner in SCHEMAS:extra['DummyStruct']=prop(name,inner,{})
        kind='Array';value=data
    elif kind.startswith('soft:'):
        if value:
            if not value.startswith('/') or '.' not in value:raise ValueError('Malformed asset path')
            package,asset=value.rsplit('.',1)
        else:package=asset='None'
        value={'AssetPath':{'PackageName':package,'AssetName':asset},'SubPathString':None};kind='SoftObject'
    elif kind.startswith('enum:'):
        enum=kind[5:];extra={'EnumType':enum,'InnerType':'ByteProperty'};value=enum+'::'+value;kind='Enum'
    return dict(base,**{'$type':'UAssetAPI.PropertyTypes.Objects.'+kind+'PropertyData, UAssetAPI','Value':value},**extra)

def build(rows):
    j=empty_table();e=j['Exports'][0]
    e['Table']['Data']=[prop(name,'PBZAppearanceStruct',value) for name,value in rows.items()]
    # A superset name map is harmless; never serialize the old table/graphs.
    names=dict.fromkeys(j['NameMap'])
    def collect(x):
        if isinstance(x,str):
            if not x.startswith('UAssetAPI.') and x:names[x]=None
        elif isinstance(x,list):
            for v in x:collect(v)
        elif isinstance(x,dict):
            for k,v in x.items():
                if k!='$type':collect(v)
    collect(e)
    j['NameMap']=list(names);j['Generations'][0]['NameCount']=len(names);j['NamesReferencedFromExportDataCount']=len(names)
    return j

def decode(p):
    kind=p['$type'].split('.')[-1].split(',')[0]
    value=p['Value']
    if kind=='StructPropertyData':
        if p['StructType']=='Vector':return {k:float(v) for k,v in value[0]['Value'].items() if k in 'XYZ'}
        return {x['Name']:decode(x) for x in value}
    if kind=='ArrayPropertyData':return [decode(x) for x in value]
    if kind=='SoftObjectPropertyData':
        if value['SubPathString'] not in [None,'']:raise ValueError('Unexpected subobject')
        path=value['AssetPath']
        return '' if path['PackageName']=='None' else path['PackageName']+'.'+path['AssetName']
    if kind=='EnumPropertyData':return value.split('::',1)[1]
    if kind=='FloatPropertyData':return float(value)
    return value

def normalize_native(v):
    if isinstance(v,str) and v.startswith('('):return normalize_native(parse_export(v))
    if isinstance(v,list):return [normalize_native(x) for x in v]
    if isinstance(v,dict):
        if 'LocalBone' in v and 'TeleportDistance' in v:
            v={'LinearVelocityScale':0.0,'AngularVelocityScale':0.0,**v}
        return {k:normalize_native(x) for k,x in v.items()}
    return v

def compare(a,b,path=''):
    if isinstance(a,dict):
        if not isinstance(b,dict) or set(a)!=set(b):raise AssertionError('Field set differs at '+path)
        for k in a:compare(a[k],b[k],path+'/'+k)
    elif isinstance(a,list):
        if not isinstance(b,list) or len(a)!=len(b):raise AssertionError('Array differs at '+path)
        for i,(x,y) in enumerate(zip(a,b)):compare(x,y,path+'/'+str(i))
    elif isinstance(a,float):
        import math
        if not isinstance(b,(int,float)) or not math.isclose(a,b,rel_tol=1e-6,abs_tol=1e-7):raise AssertionError('Float differs at '+path)
    elif type(a)!=type(b) or a!=b:raise AssertionError('Value differs at '+path+': '+repr(a)+' != '+repr(b))

