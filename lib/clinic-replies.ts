export function clinicReply(question:string,content:any):string|undefined{
 const q=question.toLowerCase().replace(/[’']/g,'').trim();
 if(/^(hi|hello|hey|namaste)[!.\s]*$/.test(q))return 'Hello! I can help with Dr. Meghana’s services, consultation timings, locations and appointment enquiries. What would you like to know?';
 if(/suicid|cant breathe|cannot breathe|severe chest pain|unconscious|heavy bleeding/.test(q))return 'Please contact local emergency services immediately. Do not wait for this chat to respond.';
 if(/what.*(medicine|dose|treatment)|diagnos|my (symptom|report|pain)|should i take|prescrib/.test(q))return 'I can help with clinic information, but cannot diagnose, interpret reports or recommend medicines. Please discuss your concerns with a qualified clinician. For urgent symptoms, seek emergency care.';
 if(/hours|timing|when.*(open|available)|opening|closing|schedule/.test(q))return content.locations.map((l:any)=>l.name+' — '+l.timing).join('\n\n')+'\n\nPlease contact the clinic to confirm the day and availability.';
 if(/where|location|address|directions|reach.*clinic/.test(q))return content.locations.map((l:any)=>l.name+'\n'+l.address+'\n'+l.timing).join('\n\n');
 if(/appoint|booking|book.*(visit|consult)|contact|phone|whatsapp|call.*doctor/.test(q))return 'For appointment enquiries, message the clinic on WhatsApp: https://wa.me/'+content.settings.whatsapp+' or email '+content.settings.email+'. The clinic must confirm availability; this chat cannot book an appointment.';
 if(/fee|price|cost|charge/.test(q))return 'Consultation fees are not listed here. Please ask the clinic on WhatsApp: https://wa.me/'+content.settings.whatsapp;
 if(/language|telugu|hindi|kannada|speak/.test(q))return content.copy?.['English · Telugu · Hindi · Kannada']||'Dr. Meghana speaks English, Telugu, Hindi and Kannada.';
 if(/expertise|speciali|services|conditions|what.*doctor.*(do|help)/.test(q))return content.expertise.map((x:any)=>'• '+x.title).join('\n');
 if(/qualif|education|studied|degree/.test(q))return content.education.map((x:any)=>x.title+' — '+x.summary).join('\n');
 if(/who.*(doctor|meghana)|about.*(doctor|meghana)/.test(q))return (content.copy?.['Dr. Gada Lakshmi Meghana']||'Dr. Gada Lakshmi Meghana')+' is a Consultant Physician, Diabetologist and Critical Care Specialist. '+content.expertise.slice(0,4).map((x:any)=>x.title).join(', ')+'.';
 const tokens=q.split(/\W+/).filter((x:string)=>x.length>3&&!['what','does','please','about','have','this','that','your','with','from','tell','need','help'].includes(x));
 const topic=(content.chatbotTopics||[]).filter((x:any)=>x.published).map((x:any)=>({x,score:tokens.filter((t:string)=>(x.title+' '+x.summary).toLowerCase().includes(t)).length})).sort((a:any,b:any)=>b.score-a.score)[0];
 if(topic?.score>=2&&!/dose|prescrib|diagnos/.test(topic.x.body))return topic.x.body;
 const service=content.expertise.find((x:any)=>tokens.some((t:string)=>x.title.toLowerCase().includes(t)));if(service)return service.title+': '+service.summary+'\n\nFor advice about your own health, enquire about a consultation with the clinic.';
 return undefined;
}
