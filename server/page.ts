import {getConnections} from '../lib/connections';
import {renderPage} from '../lib/hosted-renderer';
import {GET as getContent} from './api/content/route';
export {renderPage};
const rendered=new Map<string,{html:string;status:number;until:number}>();
export async function GET(request:Request){
 const path=new URL(request.url).pathname.replace(/\/$/,'')||'/';
 const response=await getContent(new Request(new URL('/api/content',request.url)));if(!response.ok)return response;
 const packet=await response.json() as any;const key=((await getConnections()).tursoURL||'hosted')+path+':'+packet.version;let result=path==='/studio'?undefined:rendered.get(key);if(!result||result.until<Date.now()){const page=renderPage(path,packet);result={...page,until:Date.now()+60000};if(path!=='/studio'){if(rendered.size>=40)rendered.delete(rendered.keys().next().value!);rendered.set(key,result);}}
 return new Response(result.html,{status:result.status,headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':path==='/studio'?'no-store':'public, max-age=30, stale-while-revalidate=60'}});
}
