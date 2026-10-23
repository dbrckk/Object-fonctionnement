// Run *after* 'cap add android' and 'cap sync android'.
// This generated native platform is intentionally not committed.
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";

const appGradle=resolve("android/app/build.gradle");
const variablesGradle=resolve("android/variables.gradle");
const [gradle,variables]=await Promise.all([
 readFile(appGradle,"utf8"),readFile(variablesGradle,"utf8")
]);
const api=(key)=>new RegExp("\\b"+key+"\\s*=\\s*36\\b").test(variables);
if(!api("compileSdkVersion")||!api("targetSdkVersion")){
 throw new Error("Google Play requires API 36. Check Capacitor 8 platform variables.gradle.");
}
if(!/\bversionCode\s*(?:=\s*)?\d+/.test(gradle)||
   !/\bversionName\s*(?:=\s*)?["'][^"']+["']/.test(gradle))
 throw new Error("Cannot safely locate native app version in generated build.gradle.");
let updated=gradle
 .replace(/\bversionCode\s*(?:=\s*)?\d+/, "versionCode = 48")
 .replace(/\bversionName\s*(?:=\s*)?["'][^"']+["']/, 'versionName = "0.48.0"');

const envNames=["PLAY_UPLOAD_KEYSTORE_PATH","PLAY_UPLOAD_KEYSTORE_PASSWORD",
 "PLAY_UPLOAD_KEY_ALIAS","PLAY_UPLOAD_KEY_PASSWORD"];
const count=envNames.filter(name=>Boolean(process.env[name])).length;
if(count>0&&count<envNames.length)
 throw new Error("Incomplete Play upload signing environment: configure all four secrets.");
if(count===envNames.length){
 // Only environment variable names are written to Gradle. Neither upload
 // keystore nor passphrases are committed or printed in the Actions log.
 updated+=`
android {
  signingConfigs {
    playUpload {
      storeFile = file(System.getenv("PLAY_UPLOAD_KEYSTORE_PATH"))
      storePassword = System.getenv("PLAY_UPLOAD_KEYSTORE_PASSWORD")
      keyAlias = System.getenv("PLAY_UPLOAD_KEY_ALIAS")
      keyPassword = System.getenv("PLAY_UPLOAD_KEY_PASSWORD")
    }
  }
  buildTypes {
    release {
      signingConfig = signingConfigs.playUpload
    }
  }
}
`;
 console.log("Android API 36: signed release AAB configured from environment secrets.");
}else{
 console.log("Android API 36: unsigned release bundle only; no credentials configured.");
 console.log("Do not upload this bundle to Google Play. Set the Play upload secrets.");
}
await writeFile(appGradle,updated);
console.log("Android release versionCode=48, versionName=0.48.0");
