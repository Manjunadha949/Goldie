import * as content from '../server/api/content/route';
import * as login from '../server/api/login/route';
import * as logout from '../server/api/logout/route';
import * as session from '../server/api/session/route';
import * as password from '../server/api/password/route';
import * as upload from '../server/api/upload/route';
import * as chat from '../server/api/chat/route';
import * as media from '../server/media/[key]/route';
import * as page from '../server/page';
import * as connections from '../server/api/connections/route';
import * as health from '../server/api/health/route';
const handlers:Record<string,any>={content,login,logout,session,password,upload,chat,media,page,health,connections};
export default {async fetch(request:Request){
 const original=new URL(request.url),endpoint=original.searchParams.get('endpoint')||original.pathname.split('/').pop()||'page';
 const route=handlers[endpoint];if(!route)return Response.json({error:'Not found'},{status:404});const method=request.method==='HEAD'?'GET':request.method;const handler=route[method];if(!handler)return Response.json({error:'Method not allowed'},{status:405});
 const url=new URL(request.url);url.pathname=endpoint==='page'?'/'+(url.searchParams.get('path')||''):endpoint==='media'?'/media/'+url.searchParams.get('key'):'/api/'+endpoint;url.searchParams.delete('endpoint');url.searchParams.delete('path');url.searchParams.delete('key');
 try{const response=await handler(new Request(url,request));return request.method==='HEAD'?new Response(null,{status:response.status,headers:response.headers}):response;}catch(error){console.error('Request failed:',endpoint,error instanceof Error?error.name:'Error');return Response.json({error:'This service is temporarily unavailable. Please try again or contact the clinic.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}};
