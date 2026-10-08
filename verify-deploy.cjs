const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{Readable}=require('node:stream');
const {chromium}=require('playwright-core'),health=require('./api/health'),contact=require('./api/contact');
async function call(handler,{method='POST',body,raw}={}){
const req=Readable.from(raw===undefined?[]:[raw]);req.method=method;req.headers={'content-type':'application/json'};if(body!==undefined)req.body=body;
const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);}};
await handler(req,res);return res;
}
async function main(){
const key=process.env.RESEND_API_KEY,from=process.env.CONTACT_FROM_EMAIL;
delete process.env.RESEND_API_KEY;delete process.env.CONTACT_FROM_EMAIL;
const valid={name:'Test user',email:'test@example.com',message:'A test message for validation.'};
let browser,server;
try{
assert.equal((await call(health)).body.contactMode,'email');
assert.equal((await call(contact,{body:valid})).statusCode,503);
assert.equal((await call(contact,{raw:JSON.stringify(valid)})).statusCode,503);
assert.equal((await call(contact,{raw:'invalid'})).statusCode,400);
assert.equal((await call(contact,{body:{...valid,email:'bad'}})).statusCode,400);
assert.equal((await call(contact,{method:'GET'})).statusCode,405);
assert.equal((await call(contact,{body:{website:'spam'}})).statusCode,200);
assert.equal((await call(contact,{raw:'x'.repeat(12001)})).statusCode,413);
const originalFetch=global.fetch;
process.env.RESEND_API_KEY='mock-test-key';process.env.CONTACT_FROM_EMAIL='test@verified.example';
try{
let delivery;
global.fetch=async(url,options)=>{delivery=JSON.parse(options.body);assert.equal(url,'https://api.resend.com/emails');return{ok:true};};
assert.equal((await call(contact,{body:valid})).statusCode,200);
assert.equal(delivery.reply_to,valid.email);assert.deepEqual(delivery.to,['sameermazhar41@gmail.com']);
global.fetch=async()=>({ok:false});assert.equal((await call(contact,{body:valid})).statusCode,502);
global.fetch=async()=>{throw Error('timeout');};assert.equal((await call(contact,{body:valid})).statusCode,502);
}finally{global.fetch=originalFetch;delete process.env.RESEND_API_KEY;delete process.env.CONTACT_FROM_EMAIL;}
assert.deepEqual(await fs.readFile('dist/resume.pdf'),await fs.readFile('public/resume.pdf'));
const html=await fs.readFile('dist/index.html','utf8');assert(!html.includes('type="text/jsx"'));assert(!html.includes('@import "tailwindcss"'));
server=http.createServer(async(req,res)=>{if(req.url==='/api/health')return health(req,res);if(req.url==='/api/contact')return contact(req,res);try{const relative=req.url==='/'?'index.html':req.url.slice(1);if(relative.includes('..'))throw Error();const data=await fs.readFile(path.join(__dirname,'dist',relative));res.setHeader('Content-Type',relative.endsWith('.woff2')?'font/woff2':relative.endsWith('.pdf')?'application/pdf':'text/html');res.end(data);}catch{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(3012,'127.0.0.1',resolve));
browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto('http://127.0.0.1:3012');await page.getByRole('button',{name:'Open email draft'}).waitFor();
assert.equal(await page.locator('.project').count(),4);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.getByRole('button',{name:'Open navigation'}).click();assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');
assert.equal((await fetch('http://127.0.0.1:3012/resume.pdf')).status,200);
assert.deepEqual(errors,[]);console.log('PASS: static build, resume, Vercel functions, validation, unconfigured email fallback, mocked delivery/error paths, browser render and mobile menu.');
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));if(key===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=key;if(from===undefined)delete process.env.CONTACT_FROM_EMAIL;else process.env.CONTACT_FROM_EMAIL=from;}
}
main().catch(e=>{console.error(e);process.exitCode=1;});