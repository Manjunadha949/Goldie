import {env} from './runtime';
import {createClient} from '@libsql/client/web';
type Connections={groqKey?:string;tursoURL?:string;tursoToken?:string};
let cached:{value:Connections;until:number}|undefined;
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes));
const decode=(value:string)=>Uint8Array.from(atob(value),x=>x.charCodeAt(0));
async function encryptionKey(){if(!env.INTEGRATION_KEY)throw Error('Connection settings are unavailable');return crypto.subtle.importKey('raw',Uint8Array.from(env.INTEGRATION_KEY.match(/.{2}/g)!,x=>parseInt(x,16)),'AES-GCM',false,['encrypt','decrypt']);}
export async function getConnections():Promise<Connections>{
 if(cached&&cached.until>Date.now())return cached.value;
 const row=await env.DB.prepare('SELECT document FROM site_content WHERE id = ?').bind('connections').first<{document:string}>();
 let value:Connections={};if(row){const packet=JSON.parse(row.document);const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(packet.iv)},await encryptionKey(),decode(packet.bytes));value=JSON.parse(new TextDecoder().decode(bytes));}
 value.groqKey ||= env.GROQ_API_KEY;value.tursoURL ||= env.TURSO_DATABASE_URL;value.tursoToken ||= env.TURSO_AUTH_TOKEN;
 cached={value,until:Date.now()+30000};return value;
}
export async function saveConnections(value:Connections){
 const iv=crypto.getRandomValues(new Uint8Array(12)),bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(),new TextEncoder().encode(JSON.stringify(value)));
 await env.DB.prepare('INSERT INTO site_content (id,document,version,updated_at) VALUES (?,?,1,?) ON CONFLICT(id) DO UPDATE SET document=excluded.document,version=site_content.version+1,updated_at=excluded.updated_at').bind('connections',JSON.stringify({iv:encode(iv),bytes:encode(new Uint8Array(bytes))}),new Date().toISOString()).run();cached=undefined;contentCache=undefined;
}
export function tursoClient(config:Connections){return createClient({url:config.tursoURL!,authToken:config.tursoToken,fetch:(url:any,options:any)=>fetch(url,{...options,signal:AbortSignal.timeout(20000)})});}
export async function contentStore(){const config=await getConnections();if(!config.tursoURL||!config.tursoToken)return env.DB;const client=tursoClient(config);
 class Statement{args:any[]=[];constructor(public sql:string){}bind(...args:any[]){const s=new Statement(this.sql);s.args=args;return s}async first<T=Record<string,unknown>>(){const r=await client.execute({sql:this.sql,args:this.args});return r.rows[0] as T||null}async run(){const r=await client.execute({sql:this.sql,args:this.args});return {meta:{changes:r.rowsAffected}}}}
 return {prepare:(sql:string)=>new Statement(sql)};
}

let contentCache:{row:{document:string,version:number}|null;until:number}|undefined;
export async function mirrorContent(document:string,version:number){contentCache={row:{document,version},until:Date.now()+60000};}
export async function readContent(){if(contentCache&&contentCache.until>Date.now())return contentCache.row;const row=await env.DB.prepare('SELECT document,version FROM site_content WHERE id = ?').bind('main').first<{document:string,version:number}>();contentCache={row,until:Date.now()+60000};return row;}
