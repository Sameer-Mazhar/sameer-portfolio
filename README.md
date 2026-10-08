# Sameer Portfolio — step by step
## 1. Folder kholein
```powershell
cd E:\javascript\sameer-portfolio
```
## 2. Dependencies install karein
```powershell
npm install
```
Node.js installed hai. Versions ke liye: `node --version` aur `npm --version`.
## 3. Website chalayein
```powershell
npm run dev
```
Browser mein http://localhost:3000 kholein. Server stop: Ctrl+C.
HTML ko double-click ya Live Server se na kholein: JSX/Tailwind build aur Node contact API chahiye.
## 4. Architecture
- index.html: saari frontend CSS, Tailwind directives, React JSX aur JavaScript isi file mein.
- Navbar(): responsive navbar component, mobile menu aur active section.
- Footer(): footer component.
- IndexPage(): Navbar, Hero, Marquee, About, Skills, Projects, Experience, Contact aur Footer call karta hai.
- build.cjs: React JSX aur Tailwind compile karke dist/index.html mein CSS/JS inline karta hai.
- server.cjs: Node backend, static page, fonts, resume aur contact API. Backend browser HTML mein execute nahi ho sakta, is liye separate server file zaroori hai.
- public/resume.pdf: downloadable CV.
- data/messages.jsonl: submitted messages, har line aik JSON record. Public URL se accessible nahi.
- package.json: dependencies aur commands.
- dist/: generated files. Directly edit na karein.
Font Awesome local fonts use karta hai; runtime CDN dependency nahi.
## 5. Changes
index.html edit/save karein. Terminal mein Ctrl+C, phir npm run dev dobara aur browser refresh. Hot reload configured nahi.
Colors :root mein hain. Projects const projects array mein hain. Navbar aur Footer functions isi HTML mein hain.
Purana marquee tag obsolete hai; CSS animation se same sliding effect banaya hai. Hover se pause, scroll reveal, glitch, keyboard access aur reduced-motion support included.
CV mein GitHub/demo links nahi the. Project previews CSS illustrations hain, actual screenshots nahi.
Education CV ke mutabiq currently pursuing hai; graduation confirm hone par text update karein.
## 6. Build / start
```powershell
npm run build
npm start
```
npm start fresh build bhi karta hai.
Port change:
```powershell
$env:PORT = "3001"
npm start
```
## 7. Messages
```powershell
Get-Content .\data\messages.jsonl
```
Contact form server par save karta hai; email deliver nahi karta. Email delivery ke liye SMTP/provider aur credentials configure karne honge.
CV replace: apni PDF public/resume.pdf mein rakhein.
Current server local preview ke liye 127.0.0.1 par listen karta hai. Public hosting ke liye host binding, HTTPS aur persistent storage configure karein.
## 8. Check karein
Mobile menu, project filters, details, CV download aur form submission check karein. Tab se keyboard navigation; Escape se project modal close. Saved message data/messages.jsonl mein dekhein.


## Browser verification
Server chal raha ho to `node verify.cjs` run karein. Microsoft Edge installed hona chahiye. Form rate limit ki wajah se repeat test se pehle 60 seconds wait karein ya server restart karein. Preview screenshots artifacts/desktop.png aur artifacts/mobile.png mein hain.
