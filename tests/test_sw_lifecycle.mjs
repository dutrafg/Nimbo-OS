import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
const calls=new Map();let online=true, activated=false;
const mockFetch=async req=>{
 if(!online)throw Error('offline');
 const url=new URL(typeof req==='string'?req:req.url);
 const path=url.pathname==='/'?'/index.html':url.pathname;
 const file=join(dist,path.replace(/^\//,''));
 let body;
 try{body=readFileSync(file)}catch{throw Error('Missing '+path)}
 return new Response(body,{status:200});
};
const store=new Map();
const caches={
 async open(name){if(!store.has(name))store.set(name,new Map());const m=store.get(name);return {
   async addAll(urls){for(const req of urls){const resp=await mockFetch(req);m.set(req.url,resp);}},
   async match(req){const u=typeof req==='string'?req:req.url;return m.get(u)?.clone();}
 };},
 async keys(){return [...store.keys()]},
 async delete(key){return store.delete(key)},
 async match(req){const u=typeof req==='string'?req:req.url;for(const m of store.values()){if(m.has(u))return m.get(u).clone();}}
};
const handlers={};const self={
 registration:{scope:'https://nimbo.test/'},location:{origin:'https://nimbo.test'},
 addEventListener(type,fn){handlers[type]=fn},
 skipWaiting(){activated=true},
 clients:{async claim(){}}
};
const ctx={self,caches,fetch:mockFetch,URL,Request,Response,console};
vm.runInNewContext(readFileSync(join(dist,'sw.js'),'utf8'),ctx);
let installation;
handlers.install({waitUntil(p){installation=p}});
await installation;
assert.equal((await caches.keys()).length,1);
assert.equal(activated,false,'update should never activate before confirmation');
const result={};
handlers.fetch({request:{url:'https://nimbo.test/',method:'GET',mode:'navigate'},respondWith(p){result.navigation=p}});
const response=await result.navigation;
assert.ok((await response.text()).includes('Nimbo OS 0.14.2'));
online=false;
handlers.fetch({request:{url:'https://nimbo.test/',method:'GET',mode:'navigate'},respondWith(p){result.offline=p}});
assert.ok((await (await result.offline).text()).includes('Nimbo OS 0.14.2'));
handlers.message({data:{type:'NIMBO_APPLY_UPDATE'}});
assert.equal(activated,true);
let completion;
handlers.activate({waitUntil(p){completion=p}});
await completion;
console.log('PASS: 7 core assets pre-cached, offline navigation, manual activation, old cache cleanup');