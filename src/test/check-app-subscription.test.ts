// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
const source=readFileSync('supabase/functions/check-app-subscription/index.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(status=200,body:object={subscriber:{entitlements:{}}},valid=true){
 let handler!:(req:Request)=>Promise<Response>;
 const fetch=vi.fn(async()=>new Response(JSON.stringify(body),{status}));
 runInNewContext(compiled,{exports:{},Response,Date,encodeURIComponent,fetch,
  require:(name:string)=>name.includes('revenuecat-public')?{REVENUECAT_APPLE_PUBLIC_KEY:'appl_public'}:{createClient:()=>({auth:{getUser:async()=>({data:{user:valid?{id:'verified-user'}:null},error:null})}})},
  Deno:{env:{get:()=>undefined},serve:(fn:typeof handler)=>{handler=fn;}}});
 return {fetch,call:(auth=true)=>handler(new Request('https://example.test',{method:'POST',headers:auth?{Authorization:'Bearer token'}:{},body:JSON.stringify({user_id:'attacker-choice',subscribed:true})}))};
}
it('authenticates the caller and ignores client entitlement claims and user IDs',async()=>{
 const f=fixture();const r=await f.call();expect(r.status).toBe(200);expect(await r.json()).toMatchObject({subscribed:false});
 expect(f.fetch).toHaveBeenCalledWith('https://api.revenuecat.com/v1/subscribers/verified-user',{headers:{Authorization:'Bearer appl_public'}});
});
it('rejects missing or invalid authentication before RevenueCat',async()=>{
 for(const f of [fixture(),fixture(200,{},false)]){expect((await f.call(false)).status).toBe(401);expect(f.fetch).not.toHaveBeenCalled();}
 const f=fixture(200,{},false);expect((await f.call()).status).toBe(401);expect(f.fetch).not.toHaveBeenCalled();
});
it('fails closed during a provider outage',async()=>{const f=fixture(500);const r=await f.call();expect(r.status).toBe(503);expect(await r.json()).not.toHaveProperty('subscribed');});
it.each([[null,true],['2000-01-01T00:00:00Z',false],['2999-01-01T00:00:00Z',true],['invalid',false]])('evaluates entitlement expiration %s',async(expires,active)=>{
 const f=fixture(200,{subscriber:{entitlements:{pro:{expires_date:expires,product_identifier:'monthly'}}}});expect(await (await f.call()).json()).toMatchObject({subscribed:active});
});
