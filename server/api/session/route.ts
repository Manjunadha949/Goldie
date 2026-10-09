import {isOwner} from '../../../lib/access';
export async function GET(request:Request){const owner=await isOwner(request);return Response.json({owner,signedIn:owner,authMode:'password'},{headers:{'Cache-Control':'no-store'}})}
