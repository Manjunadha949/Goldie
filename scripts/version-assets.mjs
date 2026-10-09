import {readFileSync,writeFileSync,mkdirSync,readdirSync,unlinkSync} from 'node:fs';
import {transformSync} from 'esbuild';
import {createHash} from 'node:crypto';
const directory='public/site-assets';mkdirSync(directory,{recursive:true});
const emitted=new Set();
function emit(name,source=readFileSync('public/'+name,'utf8')){const [base,ext]=name.split('.');source=transformSync(source,{loader:ext==='css'?'css':'js',minify:true,target:'es2022'}).code;const hash=createHash('sha256').update(source).digest('hex').slice(0,16);const filename=`${base}.${hash}.${ext}`;writeFileSync(directory+'/'+filename,source);emitted.add(filename);return '/site-assets/'+filename;}
let shell=JSON.parse(readFileSync('lib/shell.ts','utf8').replace(/^export default /,'').replace(/;\s*$/,''));
const studio=emit('studio.js');const chat=emit('chat.js');
const script=emit('script.js',readFileSync('public/script.js','utf8').replace("import('/studio.js')",`import('${studio}')`).replace("import('/chat.js')",`import('${chat}')`));
for(const name of ['script.js']){const url=name==='script.js'?script:emit(name);const [base,ext]=name.split('.');const pattern=new RegExp(`/(?:site-assets/)?${base}(?:\\.[a-f0-9]{16})?\\.${ext}`,'g');shell=shell.replace(pattern,url);}
const css=emit('site.css',['style.css','upgrade.css','refinement.css','editor.css','polish.css','design.css'].map(name=>readFileSync('public/'+name,'utf8')).join('\n'));
shell=shell.replace(/<link rel="stylesheet"[^>]+>/g,'').replace('</head>',`<link rel="stylesheet" href="${css}"></head>`);
writeFileSync('lib/shell.ts','export default '+JSON.stringify(shell)+';\n');
for(const old of readdirSync(directory))if(!emitted.has(old))unlinkSync(directory+'/'+old);
console.log('Versioned website assets so each update requests fresh scripts and styles.');
