import {env} from '../../../lib/runtime';
import {sameOrigin,sessionToken,digest,COOKIE} from '../../../lib/access';
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Invalid request'},{status:403});const token=sessionToken(request);if(token)await env.DB!.prepare('DELETE FROM studio_sessions WHERE token_hash = ?').bind(await digest(token)).run();return Response.json({ok:true},{headers:{'Set-Cookie':`${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,'Cache-Control':'no-store'}})}
