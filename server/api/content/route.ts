import {contentStore,readContent,mirrorContent} from '../../../lib/connections';
import initial from '../../../data/content.json';
import textCatalog from '../../../lib/text-catalog.json';
import {isOwner,sameOrigin} from '../../../lib/access';
import {contentSchema} from '../../../lib/validation';
export async function GET(request:Request){
 const row=await readContent();
 const content=row?JSON.parse(row.document):structuredClone(initial);
 content.recognitions ??= structuredClone(initial.recognitions);
 content.research ??= structuredClone(initial.research);
 content.copy={...Object.fromEntries(textCatalog.map(x=>[x.key,x.key])),...initial.copy,...content.copy};
 content.images ??= structuredClone(initial.images);
 content.homeSections ??= structuredClone(initial.homeSections);
 content.education ??= structuredClone(initial.education);
 content.experience ??= structuredClone(initial.experience);
 if(!content.homeSections.some((x:{id:string})=>x.id==='experience')){const index=content.homeSections.findIndex((x:{id:string})=>x.id==='qualifications');content.homeSections.splice(index+1,0,{id:'experience',title:'Experience',visible:true});}
 content.visitFaqs ??= structuredClone(initial.visitFaqs);
 content.customSections ??= [];
 content.chatbotTopics ??= [];
 for(const l of content.locations){if(content.presentationVersion!==1&&/spinova|spenova/i.test(l.name)&&/^9:00 AM\s*[–-]\s*5:00 PM$/.test(l.timing))l.timing='9:00 AM – 6:00 PM';l.mapEmbed ??= '';}
 content.presentationVersion=1;

 for(let i=0;i<content.locations.length;i++){const l=content.locations[i];l.showAppointment ??= !/spinova|spenova/i.test(l.name);l.mapQuery ??= l.name+' '+l.address;}
 for(const l of content.locations){const fallback=initial.locations.find(x=>/spinova|spenova/i.test(l.name)?/spinova/i.test(x.name):/yukta/i.test(l.name)&&/yukta/i.test(x.name));if(fallback){for(const key of ['area','phone','email','rating','reviewCount','ratingDate'] as const)l[key] ??= fallback[key];if(!l.mapEmbed&&/yukta/i.test(l.name))l.mapEmbed=fallback.mapEmbed;}}
 const edit=new URL(request.url).searchParams.get('edit')==='1';
 if(edit && !await isOwner(request))return Response.json({error:'Owner sign-in required'},{status:403});
 if(!edit)for(const key of ['expertise','blogs','articles','videos','testimonials','gallery','recognitions','research','education','experience','customSections','chatbotTopics'])content[key]=content[key].filter((x:{published:boolean})=>x.published);
 return Response.json({content,version:row?.version||0,...(edit?{textCatalog}:{})},{headers:{'Cache-Control':edit?'no-store':'public, max-age=30, stale-while-revalidate=60'}});
}
export async function PUT(request:Request){
 if(!sameOrigin(request)||!await isOwner(request))return Response.json({error:'Owner sign-in required'},{status:403});
 const raw=await request.text();if(raw.length>1000000)return Response.json({error:'Content is too large'},{status:413});
 let input;try{input=JSON.parse(raw)}catch{return Response.json({error:'Invalid content'},{status:400})}
 const parsed=contentSchema.safeParse(input.content);if(!parsed.success||!Number.isSafeInteger(input.version)||input.version<0)return Response.json({error:parsed.success?'Invalid version':parsed.error.issues[0].message},{status:400});
 const version=input.version+1;
 const result=await (await contentStore()).prepare('INSERT INTO site_content (id,document,version,updated_at) SELECT ?,?,?,? WHERE ? = 0 OR EXISTS (SELECT 1 FROM site_content WHERE id = ?) ON CONFLICT(id) DO UPDATE SET document=excluded.document,version=excluded.version,updated_at=excluded.updated_at WHERE site_content.version = ?').bind('main',JSON.stringify(parsed.data),version,new Date().toISOString(),input.version,'main',input.version).run();
 if(!result.meta.changes)return Response.json({error:'The website changed in another session. Reload before saving.'},{status:409});
 await mirrorContent(JSON.stringify(parsed.data),version);
 return Response.json({version,saved:true},{headers:{'Cache-Control':'no-store'}});
}
