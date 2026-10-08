const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto');
const limits=new Map();
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function handler(req,res){
res.setHeader('X-Content-Type-Options','nosniff');const url=new URL(req.url,'http://localhost');
if(url.pathname==='/api/health')return json(res,200,{ok:true});
if(url.pathname==='/api/contact'){
if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
if(!req.headers['content-type']?.includes('application/json'))return json(res,415,{error:'JSON required.'});
let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000)return json(res,413,{error:'Message too large.'});}
let input;try{input=JSON.parse(body);}catch{return json(res,400,{error:'Invalid JSON.'});}
if(!input||typeof input!=='object')return json(res,400,{error:'Invalid message.'});
const {name,email,message,website}=input;
if(website)return json(res,200,{ok:true});
if(typeof name!=='string'||name.trim().length<2||name.length>100||typeof email!=='string'||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof message!=='string'||message.trim().length<10||message.length>5000)return json(res,400,{error:'Enter your name, a valid email and a message of 10–5,000 characters.'});
const address=req.socket.remoteAddress,now=Date.now(),previous=limits.get(address);
if(previous&&now-previous<60000)return json(res,429,{error:'Please wait one minute before another message.'});
await fs.mkdir(path.join(__dirname,'data'),{recursive:true});
await fs.appendFile(path.join(__dirname,'data/messages.jsonl'),JSON.stringify({id:randomUUID(),name:name.trim(),email:email.trim(),message:message.trim(),createdAt:new Date().toISOString()})+'\n');
limits.set(address,now);return json(res,201,{ok:true,message:'Message saved to the server. You can also reach me directly by email.'});
}
if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
let file;if(url.pathname==='/'||url.pathname==='/index.html')file=path.join(__dirname,'dist/index.html');
else if(url.pathname==='/resume.pdf')file=path.join(__dirname,'public/resume.pdf');
else if(/^\/webfonts\/[a-zA-Z0-9.-]+\.(woff2|ttf)$/.test(url.pathname))file=path.join(__dirname,'dist',url.pathname);
else return json(res,404,{error:'Not found.'});
try{const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.pdf')?'application/pdf':file.endsWith('.woff2')?'font/woff2':file.endsWith('.ttf')?'font/ttf':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:bytes);}catch(e){if(e.code==='ENOENT')return json(res,404,{error:'File not found.'});throw e;}
}
require('./build.cjs')().then(()=>{const port=Number(process.env.PORT||3000);const server=http.createServer((req,res)=>handler(req,res).catch(e=>{console.error(e);if(!res.headersSent)json(res,500,{error:'Unable to save. Please email me directly.'});else res.end();}));server.listen(port,'127.0.0.1',()=>console.log('Portfolio ready: http://localhost:'+port));server.on('error',e=>{console.error(e.message);process.exitCode=1;});}).catch(e=>{console.error(e);process.exitCode=1;});
setInterval(()=>{for(const [key,time]of limits)if(Date.now()-time>60000)limits.delete(key);},60000).unref();

