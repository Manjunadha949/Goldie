import {env} from '../../../lib/runtime';
import {isOwner,sameOrigin,digest,sessionToken} from '../../../lib/access';
import {passwordHash,verifyPassword} from '../../../lib/password';
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isOwner(request))return Response.json({error:'Please sign in again.'},{status:403});
 const raw=await request.text();if(raw.length>2000)return Response.json({error:'Invalid request.'},{status:400});
 let input;try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid request.'},{status:400})}
 if(!input||typeof input.currentPassword!=='string'||typeof input.newPassword!=='string'||input.newPassword.length<12||input.newPassword.length>128||input.currentPassword.length>128)return Response.json({error:'Use a new password between 12 and 128 characters.'},{status:400});
 const tokenHash=await digest(sessionToken(request)),now=Date.now(),key='password:'+tokenHash;
 const limit=await env.DB!.prepare('INSERT INTO studio_login_limits (key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at <= ? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at <= ? THEN ? ELSE reset_at END RETURNING attempts,reset_at').bind(key,now+900000,now,now,now+900000).first<{attempts:number}>();
 if(limit&&limit.attempts>5)return Response.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});
 if(!await verifyPassword(input.currentPassword))return Response.json({error:'Current password is incorrect.'},{status:401});
 if(input.currentPassword===input.newPassword)return Response.json({error:'Choose a different new password.'},{status:400});
 const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 await env.DB!.batch([env.DB!.prepare('INSERT INTO studio_credentials (id,hash,salt) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET hash=excluded.hash,salt=excluded.salt').bind('owner',await passwordHash(input.newPassword,salt),salt),env.DB!.prepare('DELETE FROM studio_sessions WHERE token_hash != ?').bind(tokenHash),env.DB!.prepare('DELETE FROM studio_login_limits WHERE key = ?').bind(key)]);
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
