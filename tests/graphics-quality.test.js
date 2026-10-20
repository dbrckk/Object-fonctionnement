import test from "node:test";
import assert from "node:assert/strict";
import {graphicsProfile,validGraphicsMode,readGraphicsMode,GRAPHICS_KEY} from "../src/graphics-quality.js";

test("graphics modes are safe, deterministic, and capped for Android",()=>{
 assert.equal(validGraphicsMode("nonsense"),"auto");
 assert.equal(validGraphicsMode("eco"),"eco");
 assert.equal(graphicsProfile("eco",{devicePixelRatio:3,width:390}).pixelRatio,1);
 assert.equal(graphicsProfile("eco").shadowSize,256);
 assert.equal(graphicsProfile("eco").frameMs,50);
 assert.equal(graphicsProfile("auto",{devicePixelRatio:3,width:390}).pixelRatio,1.2);
 assert.equal(graphicsProfile("auto",{devicePixelRatio:3,width:768}).pixelRatio,1.5);
 assert.equal(graphicsProfile("auto",{devicePixelRatio:3,width:390}).shadowSize,512);
 assert.equal(graphicsProfile("auto",{devicePixelRatio:3,width:768}).shadowSize,1024);
 assert.equal(graphicsProfile("high",{devicePixelRatio:3,width:390}).pixelRatio,2);
 assert.equal(graphicsProfile("high").shadowSize,1024);
 assert.equal(graphicsProfile("high",{devicePixelRatio:3}).frameMs,33);
});
test("quality preference is sanitized and storage errors are harmless",()=>{
 assert.equal(readGraphicsMode({getItem(){return "high"}}),"high");
 assert.equal(readGraphicsMode({getItem(){return "invalid"}}),"auto");
 assert.equal(readGraphicsMode({getItem(){throw Error("blocked")}}),"auto");
 assert.equal(GRAPHICS_KEY,"object-fonctionnement:graphics:v1");
});
