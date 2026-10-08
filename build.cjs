const fs=require('node:fs/promises'),path=require('node:path'),esbuild=require('esbuild'),postcss=require('postcss'),tailwind=require('@tailwindcss/postcss');
async function build(){
let html=await fs.readFile(path.join(__dirname,'index.html'),'utf8');
const jsx=html.match(/<script type="text\/jsx">([\s\S]*?)<\/script>/)[1];
const js=await esbuild.build({stdin:{contents:jsx,loader:'jsx',resolveDir:__dirname},bundle:true,write:false,minify:true,define:{'process.env.NODE_ENV':'"production"'},target:'es2020'});
const css=html.match(/<style id="styles">([\s\S]*?)<\/style>/)[1];
const compiled=await postcss([tailwind({base:__dirname})]).process(css,{from:path.join(__dirname,'index.css')});
const icons=(await fs.readFile(path.join(__dirname,'node_modules/@fortawesome/fontawesome-free/css/all.min.css'),'utf8')).replaceAll('../webfonts/','/webfonts/');
html=html.replace(/<style id="styles">[\s\S]*?<\/style>/,()=>'<style>'+icons+'\n'+compiled.css+'</style>').replace(/<script type="text\/jsx">[\s\S]*?<\/script>/,()=>'<script>'+js.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>');
await fs.mkdir(path.join(__dirname,'dist'),{recursive:true});await fs.writeFile(path.join(__dirname,'dist/index.html'),html);
await fs.cp(path.join(__dirname,'node_modules/@fortawesome/fontawesome-free/webfonts'),path.join(__dirname,'dist/webfonts'),{recursive:true});
console.log('Built dist/index.html — frontend CSS and JS inline.');
}
module.exports=build;if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});

