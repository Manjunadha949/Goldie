import {env} from '../../../lib/runtime';
import {sameOrigin,digest,equalSecret,COOKIE} from '../../../lib/access';
import {verifyPassword} from '../../../lib/password';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Please sign in from this website.'},{status:403});
 const config=env as typeof env & {STUDIO_USERNAME?:string,STUDIO_PASSWORD?:string};
 if(!config.STUDIO_USERNAME||!config.STUDIO_PASSWORD)return Response.json({error:'Login is not configured yet.'},{status:503});
 const raw=await request.text();if(raw.length>1000)return Response.json({error:'Invalid login.'},{status:400});
 let input;try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid login.'},{status:400})}
 if(!input||typeof input.username!=='string'||typeof input.password!=='string')return Response.json({error:'Enter your username and password.'},{status:400});
 const now=Date.now();const key=await digest('studio:'+ (request.headers.get('cf-connecting-ip')||request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'unknown'));
 const limit=await env.DB!.prepare('INSERT INTO studio_login_limits (key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at <= ? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at <= ? THEN ? ELSE reset_at END RETURNING attempts,reset_at').bind(key,now+900000,now,now,now+900000).first<{attempts:number,reset_at:number}>();
 if(limit&&limit.attempts>5)return Response.json({error:'Too many attempts. Please try again in 15 minutes.'},{status:429,headers:{'Retry-After':'900'}});
 const correctUser=await equalSecret(input.username.trim(),config.STUDIO_USERNAME);const correctPassword=await verifyPassword(input.password);
 if(!correctUser||!correctPassword)return Response.json({error:'Incorrect username or password.'},{status:401});
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 await env.DB!.batch([env.DB!.prepare('INSERT INTO studio_sessions (token_hash,expires_at) VALUES (?,?)').bind(await digest(token),now+28800000),env.DB!.prepare('DELETE FROM studio_login_limits WHERE key = ?').bind(key),env.DB!.prepare('DELETE FROM studio_sessions WHERE expires_at <= ?').bind(now)]);
 return Response.json({ok:true},{headers:{'Set-Cookie':`${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,'Cache-Control':'no-store'}});
}
