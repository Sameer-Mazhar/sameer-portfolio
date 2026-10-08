function json(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
module.exports=async function(req,res){
if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Use POST.'});}
if(!req.headers['content-type']?.includes('application/json'))return json(res,415,{error:'JSON required.'});
try{
let input=req.body;
if(input===undefined){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000)return json(res,413,{error:'Message too large.'});}input=body;}
if(typeof input==='string'||Buffer.isBuffer(input)){if(Buffer.byteLength(input)>12000)return json(res,413,{error:'Message too large.'});try{input=JSON.parse(input.toString());}catch{return json(res,400,{error:'Invalid JSON.'});}}
if(!input||typeof input!=='object'||Array.isArray(input))return json(res,400,{error:'Invalid message.'});
const {name,email,message,website}=input;
if(website)return json(res,200,{ok:true,message:'Message received.'});
if(typeof name!=='string'||name.trim().length<2||name.length>100||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof message!=='string'||message.trim().length<10||message.length>5000)return json(res,400,{error:'Enter your name, a valid email and a message of 10–5,000 characters.'});
if(!process.env.RESEND_API_KEY||!process.env.CONTACT_FROM_EMAIL)return json(res,503,{error:'Please email sameermazhar41@gmail.com. Direct form delivery is not configured.',contactMode:'email'});
const delivery=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.CONTACT_FROM_EMAIL,to:['sameermazhar41@gmail.com'],reply_to:email.trim(),subject:'Portfolio enquiry',text:'Name: '+name.trim()+'\nEmail: '+email.trim()+'\n\n'+message.trim()}),signal:AbortSignal.timeout(10000)});
if(!delivery.ok)return json(res,502,{error:'Email delivery failed. Please email me directly.'});
return json(res,200,{ok:true,message:'Message submitted for email delivery. Thank you!'});
}catch{return json(res,502,{error:'Unable to send right now. Please email me directly.'});}
};