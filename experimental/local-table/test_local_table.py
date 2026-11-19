import unittest
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from local_table import parse_export,build,decode,compare,normalize_native,prop

class LocalTableTests(unittest.TestCase):
    def test_omitted_simulation_velocity_is_zero_not_constructor_one(self):
        value=decode(prop('SimulationSetup','HairSimulationSetup','(bLocalSimulation=True,LocalBone="root",TeleportDistance=5000.000000)'))
        self.assertEqual(value['LinearVelocityScale'],0.0)
        self.assertEqual(value['AngularVelocityScale'],0.0)
        self.assertEqual(decode(prop('SimulationSetup','HairSimulationSetup','(LinearVelocityScale=1.000000)'))['LinearVelocityScale'],1.0)
    def test_nested_quoted_delimiters_and_zero(self):
        self.assertEqual(parse_export('(Key="a,b(\\\"c\\\")",Child=(Value=0.000000,Enabled=False))'),{'Key':'a,b("c")','Child':{'Value':0.0,'Enabled':False}})
    def test_rejects_ambiguous_input(self):
        for text in ['(A=1,A=2)','(A=1','(A=1)tail','(A=nan)','(A=1 B=2)','(A=1,)']:
            with self.subTest(text=text),self.assertRaises(ValueError):parse_export(text)
    def test_unknown_field_fails_closed(self):
        with self.assertRaises(ValueError):build({'Example':{'NewUnknownGameField':1}})
    def test_cli_refuses_partial_exports_and_existing_outputs(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'source.json';out=root/'out.json'
            data={'rowStruct':'PBZAppearanceStruct','totalRows':2,'count':1,'rows':{'Example':{'ItemId':'Example'}}}
            source.write_text(json.dumps(data),encoding='utf-8')
            cmd=[sys.executable,str(Path(__file__).with_name('build.py')),'--export',str(source),'--output',str(out)]
            self.assertNotEqual(subprocess.run(cmd,capture_output=True).returncode,0)
            self.assertFalse(out.exists())
            data['totalRows']=1;source.write_text(json.dumps(data),encoding='utf-8')
            self.assertEqual(subprocess.run(cmd,capture_output=True).returncode,0)
            original=out.read_bytes()
            self.assertNotEqual(subprocess.run(cmd,capture_output=True).returncode,0)
            self.assertEqual(out.read_bytes(),original)
    def test_semantic_compare_checks_both_sides(self):
        for left,right in [({'X':0},{}),({}, {'X':0}),([1],[]),(True,1),('old','new')]:
            with self.subTest(left=left,right=right),self.assertRaises(AssertionError):compare(left,right)
    def test_generated_table_keeps_native_reference_and_identity(self):
        rows={'Example':{'ItemId':'Example','AppearanceType':'Outfit','AppearanceTexture':'/Game/Test/Icon.Icon','bObtainableInGame':False,'AppearanceName':'(Namespace="Local",Key="Display")','BodyClothDataArray':['(ClothAsset="/Example/Cloth.Cloth")']}}
        table=build(rows)
        self.assertEqual({p['Name']:decode(p) for p in table['Exports'][0]['Table']['Data']},normalize_native(rows))
        self.assertEqual(table['Exports'][0]['ObjectName'],'DT_LocalProbe')
        self.assertNotIn('DT_PBZAppearanceTable',table['NameMap'])

if __name__=='__main__':unittest.main()
