import {getConnections,saveConnections,tursoClient} from '../../../lib/connections';
import {isOwner,sameOrigin} from '../../../lib/access';
import {GET as readContent} from '../content/route';
export async function GET(request:Request){if(!await isOwner(request))return Response.json({error:'Owner sign-in required'},{status:403});const config=await getConnections();return Response.json({groqConfigured:!!config.groqKey,tursoConfigured:!!(config.tursoURL&&config.tursoToken),tursoURL:config.tursoURL||'',database:config.tursoToken?'Turso':'Hosted database'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isOwner(request))return Response.json({error:'Owner sign-in required'},{status:403});
 const raw=await request.text();if(raw.length>10000)return Response.json({error:'Invalid settings'},{status:400});let input;try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid settings'},{status:400})}
 if(!input||['groqKey','tursoURL','tursoToken'].some(k=>input[k]!==undefined&&(typeof input[k]!=='string'||input[k].length>4096)))return Response.json({error:'Invalid settings'},{status:400});
 const config={...await getConnections()};if(input.groqKey?.trim())config.groqKey=input.groqKey.trim();if(input.tursoURL?.trim())config.tursoURL=input.tursoURL.trim();if(input.tursoToken?.trim())config.tursoToken=input.tursoToken.trim();
 if(config.tursoURL&&!/^(?:libsql|https):\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.turso\.io\/?$/i.test(config.tursoURL))return Response.json({error:'Enter your Turso database URL ending in .turso.io'},{status:400});
 try{
  if(input.groqKey?.trim()){const response=await fetch('https://api.groq.com/openai/v1/models',{headers:{Authorization:'Bearer '+config.groqKey},signal:AbortSignal.timeout(8000)});if(!response.ok)return Response.json({error:'Groq could not validate this API key. Check the key and try again.'},{status:400});}
  if((input.tursoURL?.trim()||input.tursoToken?.trim())&&config.tursoURL&&config.tursoToken){
   const client=tursoClient(config);try{await client.execute('SELECT id FROM site_content LIMIT 1');const response=await readContent(request);const packet=await response.json() as any;await client.execute({sql:'INSERT OR IGNORE INTO site_content (id,document,version,updated_at) VALUES (?,?,?,?)',args:['main',JSON.stringify(packet.content),packet.version,new Date().toISOString()]});}finally{client.close();}
  }
  await saveConnections(config);return Response.json({saved:true,groqConfigured:!!config.groqKey,tursoConfigured:!!(config.tursoURL&&config.tursoToken)},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Connection could not be verified. Check the URL/token and ensure Turso has the project’s site_content table.'},{status:400});}
}
