import {env} from './runtime';
export const COOKIE='__Host-meghana-studio';
export async function digest(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export function sessionToken(request:Request){return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export async function isOwner(request:Request):Promise<boolean>{const token=sessionToken(request);if(!/^[a-f0-9]{64}$/.test(token)||!env.DB)return false;const row=await env.DB.prepare('SELECT expires_at FROM studio_sessions WHERE token_hash = ?').bind(await digest(token)).first<{expires_at:number}>();return !!row&&row.expires_at>Date.now();}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function equalSecret(a:string,b:string){const x=await digest(a),y=await digest(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);return diff===0;}
