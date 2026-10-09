import {createClient} from '@libsql/client/web';
import {readFileSync,readdirSync} from 'node:fs';
if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first.');
const db=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
const statements=readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort().flatMap(name=>readFileSync('drizzle/'+name,'utf8').split('--> statement-breakpoint').filter(x=>x.trim()).map(sql=>sql.replace('CREATE TABLE ','CREATE TABLE IF NOT EXISTS ')));
statements.push('CREATE TABLE IF NOT EXISTS portfolio_media (key TEXT PRIMARY KEY NOT NULL, bytes BLOB NOT NULL, content_type TEXT NOT NULL)');
await db.batch(statements,'write');console.log('Database tables are ready. Existing records were preserved.');db.close();
