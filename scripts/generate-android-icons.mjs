import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const svg=await readFile(path.join(root,'resources','app-icon.svg'));
const images=path.join(root,'public');
await mkdir(images,{recursive:true});
await sharp(svg).resize(512,512).png({compressionLevel:9}).toFile(path.join(images,'app-icon.png'));
const res=path.join(root,'android','app','src','main','res');
if(!existsSync(res)){
 console.log('No generated Android platform; web app icon created.');
 process.exit(0);
}
const densities={mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192};
for(const [density,size] of Object.entries(densities)){
 const folder=path.join(res,'mipmap-'+density);
 await mkdir(folder,{recursive:true});
 const image=await sharp(svg).resize(size,size).png().toBuffer();
 await writeFile(path.join(folder,'ic_launcher.png'),image);
 await writeFile(path.join(folder,'ic_launcher_round.png'),image);
 const fsize=Math.round(size*108/48);
 // Composite the foreground into the Android adaptive icon safe zone.
 const logo=await sharp(svg).resize(Math.round(fsize*.68),Math.round(fsize*.68)).png().toBuffer();
 await sharp({create:{width:fsize,height:fsize,channels:4,background:'#00000000'}})
   .composite([{input:logo,gravity:'centre'}])
   .png().toFile(path.join(folder,'ic_launcher_foreground.png'));
}
const backgroundPath=path.join(res,'values','ic_launcher_background.xml');
if(existsSync(backgroundPath)){
 const previous=await readFile(backgroundPath,'utf8');
 const next=previous.replace(/<color name="ic_launcher_background">[^<]*<\/color>/,'<color name="ic_launcher_background">#102639</color>');
 await writeFile(backgroundPath,next);
}
console.log('Created custom icons for browser and 5 Android density buckets.');
