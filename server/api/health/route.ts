import {getConnections,contentStore} from '../../../lib/connections';
import {isOwner} from '../../../lib/access';
import {env,database} from '../../../lib/runtime';
export async function GET(request:Request){
 if(!await isOwner(request))return Response.json({error:'Owner sign-in required'},{status:403});
 let db=false;try{await (await contentStore()).prepare('SELECT 1').first();db=true}catch{}
 let ai='not configured';const model=env.GROQ_MODEL||'qwen/qwen3.8-27b';
 const config=await getConnections();if(config.groqKey){try{const r=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+config.groqKey},signal:AbortSignal.timeout(8000)});if(r.ok){const result=await r.json();ai=result.data?.some((m:any)=>m.id===model)?'ready':'model unavailable';}else ai=r.status===401?'API key rejected':r.status===429?'rate limited':'provider unavailable';}catch{ai='connection unavailable';}}
 return Response.json({database:db,chatStatus:ai,model,databaseProvider:config.tursoToken?'Turso':'Hosted database'},{headers:{'Cache-Control':'no-store'}});
}
