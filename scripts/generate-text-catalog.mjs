import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';import {parseHTML} from 'linkedom';
const shell=JSON.parse(readFileSync('lib/shell.ts','utf8').replace(/^export default /,'').replace(/;\s*$/,''));
const initial=JSON.parse(readFileSync('data/content.json','utf8'));
const names={header:'Header & navigation',home:'Welcome & introduction','care-strip':'Care highlights',about:'About the doctor',care:'Expertise headings',approach:'Philosophy',recognition:'Recognition',qualifications:'Education & journey',experience:'Experience headings','visit-faq':'Visit FAQs',locations:'Location labels',contact:'Contact & appointments',footer:'Footer','videos-preview':'Video headings',gallery:'Gallery headings','blogs-preview':'Blog headings','articles-preview':'Article headings','testimonials-preview':'Testimonial headings'};
const catalog=new Map();
function collect(document,fallback,skip=new Set()){
 function visit(node){if(node.nodeType===3){const key=node.nodeValue.trim();if(!key||!/[\p{L}]/u.test(key)||skip.has(key))return;
 const parent=node.parentElement;if(!parent||parent.closest('script,style,textarea,svg,[aria-hidden="true"]'))return;
 const section=parent.closest('header,footer,section,[id="care-strip"]');const id=section?.tagName==='HEADER'?'header':section?.tagName==='FOOTER'?'footer':section?.id;
 const group=names[id]||fallback;if(!catalog.has(key))catalog.set(key,{key,group,label:key.length>85?key.slice(0,82)+'…':key});
 return;}for(const child of node.childNodes||[])visit(child);}
 visit(document.body);
 for(const el of document.body.querySelectorAll('[placeholder],[aria-label],[alt],[title]')){if(el.closest('svg,[aria-hidden="true"]'))continue;for(const name of ['placeholder','aria-label','alt','title']){const key=el.getAttribute(name);if(!key||!/[\p{L}]/u.test(key)||skip.has(key)||catalog.has(key))continue;catalog.set(key,{key,group:fallback==='Clinic assistant'?fallback:'Image descriptions & control labels',label:name+': '+key});}}

 if(document.title&&!catalog.has(document.title))catalog.set(document.title,{key:document.title,group:'Page titles',label:'Browser page title'});
}
collect(parseHTML(shell).document,'Other website text');
mkdirSync('.sites-runtime',{recursive:true});await build({entryPoints:['lib/hosted-renderer.ts'],outfile:'.sites-runtime/text-renderer.mjs',bundle:true,platform:'node',format:'esm'});
const {renderPage}=await import('../.sites-runtime/text-renderer.mjs?'+Date.now());
const skip=new Set();function values(x){if(Array.isArray(x))x.forEach(values);else if(x&&typeof x==='object')Object.values(x).forEach(values);else if(typeof x==='string'){skip.add(x.trim());x.split(/\n\s*\n/).forEach(v=>skip.add(v.trim()));}}
for(const [key,value] of Object.entries(initial))if(key!=='copy')values(value);
const baseline=structuredClone(initial);baseline.copy={};
collect(parseHTML(renderPage('/',{content:baseline,version:0}).html).document,'Other website text',skip);
for(const kind of ['expertise','gallery','blogs','articles','videos','testimonials','recognitions','research']){
 for(const path of ['/'+kind,...baseline[kind].slice(0,1).map(x=>'/'+kind+'/'+x.id)])collect(parseHTML(renderPage(path,{content:baseline,version:0}).html).document,'Content page labels',skip);
}
const chat=readFileSync('public/chat.js','utf8').match(/panel\.innerHTML=`([\s\S]*?)`;/)?.[1]||'';
collect(parseHTML('<html><body>'+chat.replace(/\$\{[^}]+\}/g,'')+'</body></html>').document,'Clinic assistant');
for(const key of Object.keys(initial.copy))if(!catalog.has(key))catalog.set(key,{key,group:'Other website text',label:key.length>85?key.slice(0,82)+'…':key});
// Interactive labels that appear only after a click.
for(const key of ['Menu','Close','Locations','Book a consultation','Play video','Close video ×','Ask the clinic','Try chat again'])if(!catalog.has(key))catalog.set(key,{key,group:'Buttons & navigation',label:key});
writeFileSync('lib/text-catalog.json',JSON.stringify([...catalog.values()],null,2)+'\n');
console.log('Generated '+catalog.size+' editable website text fields.');
