const {chromium}=require('playwright-core');
const fs=require('node:fs/promises'),assert=require('node:assert/strict');
async function main(){
const base='http://127.0.0.1:3000';
assert.equal((await fetch(base+'/api/health')).status,200);
assert.equal((await fetch(base+'/resume.pdf')).headers.get('content-type'),'application/pdf');
assert.equal((await fetch(base+'/server.cjs')).status,404);
const bad=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'X',email:'bad',message:'short'})});assert.equal(bad.status,400);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(base);await page.locator('h1').waitFor();
assert.match(await page.locator('h1').innerText(),/Sameer/i);
assert.equal(await page.locator('.project').count(),4);
await page.getByRole('button',{name:'AI / SaaS',exact:true}).click();
assert.equal(await page.locator('.project').count(),2);
await page.getByRole('button',{name:'Project details',exact:true}).first().click();
await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
assert.equal(await page.getByRole('dialog').count(),0);
await page.getByRole('button',{name:'All projects',exact:true}).click();
assert.equal(await page.locator('.project').count(),4);
await page.locator('#contact').scrollIntoViewIfNeeded();
await page.locator('#name').fill('Portfolio smoke test');
await page.locator('#email').fill('test@example.com');
await page.locator('#message').fill('Automated portfolio smoke test. No reply needed.');
await page.getByRole('button',{name:'Send message',exact:true}).click();
await page.getByRole('status').filter({hasText:'Message saved'}).waitFor();
const repeat=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test user',email:'test@example.com',message:'Rate limit verification message.'})});assert.equal(repeat.status,429);
const saved=await fs.readFile('data/messages.jsonl','utf8');
assert(saved.includes('Automated portfolio smoke test'));
await fs.writeFile('data/messages.jsonl',saved.split('\n').filter(line=>!line.includes('Automated portfolio smoke test. No reply needed.')).join('\n'));
await page.goto(base);await page.locator('h1').waitFor();
await fs.mkdir('artifacts',{recursive:true});
await page.screenshot({path:'artifacts/desktop.png'});
for(const width of [375,390,768]){
await page.setViewportSize({width,height:900});await page.goto(base);await page.locator('h1').waitFor();
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,'Overflow at width '+width);
if(width===375){
await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'projects'}).click();
assert.equal(await page.getByRole('button',{name:'Open navigation'}).getAttribute('aria-expanded'),'false');
await page.goto(base);await page.screenshot({path:'artifacts/mobile.png'});
}
}
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.glitch').evaluate(el=>getComputedStyle(el).animationName),'none');
await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.evaluate(()=>document.fonts.check('900 16px "Font Awesome 6 Free"')),true);
assert.deepEqual(errors,[]);
await browser.close();console.log('PASS: browser render, filters, modal, mobile menu, responsive widths, reduced motion, fonts, CV, contact save, invalid input, rate limit, private file route.');
}
main().catch(error=>{console.error(error);process.exit(1);});

