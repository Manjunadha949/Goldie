import {createClient, type Client} from '@libsql/client/web';
let client:Client|undefined;
function databaseClient(){if(!client){if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw Error('Configure the Turso environment variables');client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN,fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(20000)})});}return client;}
class Statement{
 args:any[]=[];constructor(public sql:string){}bind(...args:any[]){const statement=new Statement(this.sql);statement.args=args;return statement;}
 async first<T=Record<string,unknown>>(){const result=await databaseClient().execute({sql:this.sql,args:this.args});return (result.rows[0] as T)||null;}
 async run(){const result=await databaseClient().execute({sql:this.sql,args:this.args});return {meta:{changes:result.rowsAffected}};}
}
export const env={
 DB:{prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){const results=await databaseClient().batch(statements.map(s=>({sql:s.sql,args:s.args})),'write');return results.map(r=>({meta:{changes:r.rowsAffected}}));}},
 BUCKET:{async put(key:string,bytes:Uint8Array,options:any){await databaseClient().execute({sql:'INSERT INTO portfolio_media (key,bytes,content_type) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET bytes=excluded.bytes,content_type=excluded.content_type',args:[key,bytes,options.httpMetadata.contentType]});},async get(key:string){const row=(await databaseClient().execute({sql:'SELECT bytes,content_type FROM portfolio_media WHERE key = ?',args:[key]})).rows[0];return row?{body:new Uint8Array(row.bytes as ArrayBuffer),httpMetadata:{contentType:String(row.content_type)}}:null;}},
 get STUDIO_USERNAME(){return process.env.STUDIO_USERNAME;},get STUDIO_PASSWORD(){return process.env.STUDIO_PASSWORD;},get GROQ_API_KEY(){return process.env.GROQ_API_KEY;},get GROQ_MODEL(){return process.env.GROQ_MODEL;},get INTEGRATION_KEY(){return process.env.INTEGRATION_KEY;},get TURSO_DATABASE_URL(){return process.env.TURSO_DATABASE_URL;},get TURSO_AUTH_TOKEN(){return process.env.TURSO_AUTH_TOKEN;}
};
export function database(){return {execute:(query:string)=>env.DB.prepare(query).first()};}
