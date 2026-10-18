import test from "node:test";import assert from "node:assert/strict";import {OBJECTS,CATEGORIES,filterObjects} from "../src/catalog.js";
test("unique catalog IDs",()=>assert.equal(new Set(OBJECTS.map(o=>o.id)).size,OBJECTS.length));
test("all objects have complete educational content",()=>{for(const o of OBJECTS){assert.ok(o.name&&o.how&&o.summary&&o.safety);assert.ok(o.steps.length>=3);assert.equal(o.states.length,3);assert.ok(o.duration>0)}});
test("categories have no duplicates",()=>assert.equal(new Set(CATEGORIES).size,CATEGORIES.length));
test("search normalizes case",()=>assert.equal(filterObjects(OBJECTS,{query:"BOUILLOIRE"}).length,1));
test("favorites filter only selected items",()=>assert.deepEqual(filterObjects(OBJECTS,{favoritesOnly:true,favorites:["kettle"]}).map(o=>o.id),["kettle"]));
test("category filtering",()=>assert.ok(filterObjects(OBJECTS,{category:"Cuisine"}).every(o=>o.category==="Cuisine")));
