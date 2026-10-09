import {env} from '../../../lib/runtime';
import {isOwner,sameOrigin} from '../../../lib/access';
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isOwner(request))return Response.json({error:'Owner sign-in required'},{status:403});
 if(Number(request.headers.get('content-length'))>2200000)return Response.json({error:'Maximum image size is 2 MB'},{status:413});
 const file=(await request.formData()).get('file');if(!(file instanceof File)||file.size>2097152)return Response.json({error:'Choose a JPG, PNG or WebP under 2 MB'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());let type='',ext='';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){type='image/jpeg';ext='jpg'}
 else if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71){type='image/png';ext='png'}
 else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){type='image/webp';ext='webp'}
 if(!ext)return Response.json({error:'Unsupported image format'},{status:400});
 const key=crypto.randomUUID()+'.'+ext;await env.BUCKET!.put('photos/'+key,bytes,{httpMetadata:{contentType:type}});return Response.json({url:'/media/'+key});
}
