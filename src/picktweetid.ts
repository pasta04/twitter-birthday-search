import fs from 'fs-extra';

const filename = '_out.json';
const list = fs.readJSONSync(filename);

const idlist = {};

const ignore = [
  'BhwWE12ry948WS7',
  'NT3hBOmaz3FmxD6',
  'kumamusikun1',
  '10ck_kys',
  'Alice_Kirara023',
  'AIKA_SONI_GL',
  'Lily_Mark2',
  'EsuekkusuBNR34',
  'fuyume_portrait',
  '3hr_mebius',
  'taroro_nook',
  'otomego_loveyou',
  'Gou051225',
  'sayamarurun2020',
  'tsukihikaru578',
  'takumapuri',
  'Yume__loveuu',
  'Xuanyin20090630',
  'UltramanEdge',
  'STARRIGHTM78',
  'tosisatoJB74',
];

for (const item of list) {
  const id = item.id_str;
  const screen_name = item.user.screen_name;
  const url = `https://twitter.com/${screen_name}/status/${id}`;
  if (ignore.includes(screen_name)) continue;
  idlist[url] = url;
}

// console.log(Object.keys(idlist).sort().join('\n'));
fs.writeFileSync('_out.txt', Object.keys(idlist).sort().join('\n'));
