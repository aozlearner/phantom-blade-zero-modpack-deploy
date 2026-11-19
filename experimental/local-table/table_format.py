"""Authored tagged table metadata; no game assets used as templates."""

def empty_table():
 def imp(name,outer,package,cls):
  return {'$type':'UAssetAPI.Import, UAssetAPI','ObjectName':name,'OuterIndex':outer,'ClassPackage':package,'ClassName':cls,'PackageName':None,'bImportOptional':False}
 imports=[imp('DataTable',-3,'/Script/CoreUObject','Class'),imp('Default__DataTable',-3,'/Script/Engine','DataTable'),imp('/Script/Engine',0,'/Script/CoreUObject','Package'),imp('/Script/ProjectPBZ',0,'/Script/CoreUObject','Package'),imp('PBZAppearanceStruct',-4,'/Script/CoreUObject','Object')]
 names=['None','Class','Package','Object','DataTable','Default__DataTable','/Script/CoreUObject','/Script/Engine','/Script/ProjectPBZ','PBZAppearanceStruct','DT_LocalProbe','RowStruct','ObjectProperty','/Game/Mods/LocalWardrobeProbe/DT_LocalProbe']
 export={'$type':'UAssetAPI.ExportTypes.DataTableExport, UAssetAPI','Data':[{'$type':'UAssetAPI.PropertyTypes.Objects.ObjectPropertyData, UAssetAPI','Name':'RowStruct','ArrayIndex':0,'PropertyGuid':None,'Value':-5}],
  'Table':{'$type':'UAssetAPI.ExportTypes.UDataTable, UAssetAPI','Data':[]},'ObjectName':'DT_LocalProbe','OuterIndex':0,'ClassIndex':-1,'SuperIndex':0,'TemplateIndex':-2,'ObjectFlags':'RF_Public, RF_Standalone','SerialSize':0,'SerialOffset':0,'bIsAsset':True,'bNotForClient':False,'bNotForServer':False,'PackageFlags':'PKG_None','SerializationBeforeSerializationDependencies':[],'CreateBeforeSerializationDependencies':[],'SerializationBeforeCreateDependencies':[-1,-2],'CreateBeforeCreateDependencies':[],'Extras':''}
 j={'$type':'UAssetAPI.UAsset, UAssetAPI','NameMap':names,'CustomSerializationFlags':'None','UseSeparateBulkDataFiles':True,'IsUnversioned':True,'FileVersionLicenseeUE':0,'GameSpecificOverride':'None','ObjectVersion':'VER_UE4_CORRECT_LICENSEE_FLAG','ObjectVersionUE5':'OS_SUB_OBJECT_SHADOW_SERIALIZATION','CustomVersionContainer':[],
  'Exports':[export],'Imports':imports,'DependsMap':[[]],'LegacyFileVersion':-9,'UsesEventDrivenLoader':True,'WillSerializeNameHashes':True,'AssetRegistryRecords':[],'AssetRegistryDependencyDataOffset':-1,
  'Generations':[{'$type':'UAssetAPI.FGenerationInfo, UAssetAPI','ExportCount':1,'NameCount':len(names)}],'PackageGuid':'{00000000-0000-0000-0000-000000000000}','PersistentGuid':'{00000000-0000-0000-0000-000000000000}',
  'FolderName':'/Game/Mods/LocalWardrobeProbe/DT_LocalProbe','SavedHash':'AAAAAAAAAAAAAAAAAAAAAAAAAAA=','NamesReferencedFromExportDataCount':len(names),'PayloadTocOffset':-1,'DataResourceOffset':-1,'PackageFlags':'PKG_Cooked, PKG_FilterEditorOnly','HasUnversionedProperties':False,'IsFilterEditorOnly':True,'doWeHaveAssetRegistryData':True,'ChunkIDs':[],'AdditionalPackagesToCook':[], 'SoftObjectPathList':[], 'SoftPackageReferenceList':[], 'AppendedNullBytes':4}
 for name in ['RecordedEngineVersion','RecordedCompatibleWithEngineVersion']:
  j[name]={'$type':'UAssetAPI.FEngineVersion, UAssetAPI','Major':0,'Minor':0,'Patch':0,'Changelist':0,'Branch':None}
 j['doWeHaveAssetRegistryData']=False
 j['AdditionalFiles']=''
 for name in ['GatherableTextData','SearchableNames','ImportTypeHierarchies','MetaData','Thumbnails','WorldTileInfo','DataResources','ImportBits','SoftPackageBits','ExtraPackageDependencies','BulkData','Trailer','LocalizationId']:
  j[name]=None
 j.update(Info='Authored player-local table format',OtherAssetsFailedToAccess=[],DataResourceVersion='Invalid',PackageSource=0,SoftObjectPathsCount=0,SoftObjectPathsOffset=0,SearchableNamesOffset=0,ThumbnailTableOffset=0,ImportTypeHierarchiesCount=0,ImportTypeHierarchiesOffset=0,CompressionFlags=0,doWeHaveWorldTileInfo=False)
 names.append('ScriptStruct')
 export['Data'][0]['PropertyTypeName']=[{'Name':'ObjectProperty','InnerCount':1},{'Name':'ScriptStruct','InnerCount':1},{'Name':'/Script/CoreUObject','InnerCount':0}]
 return j
