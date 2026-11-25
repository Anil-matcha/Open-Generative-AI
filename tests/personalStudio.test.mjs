import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, CAMERA_PRESETS, buildProviderPayload, composePrompt, getProvider, normalizeOutput, providerError } from '../lib/personal/catalog.mjs';
import { createVideoProvider } from '../lib/personal/provider.mjs';
import { validateAsset } from '../lib/personal/validation.mjs';
import { accessConfigured, issueSession, verifySession, passwordMatches } from '../lib/personal/access.mjs';
import { sceneManifest } from '../lib/personal/storage.mjs';
import { diagnoseProviderFailure } from '../lib/personal/providerDiagnostics.mjs';

const image = new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'});
const input = { image, prompt: 'Gentle natural movement.', duration: 1, aspectRatio:'9:16',quality:'fast' };

test('only verified free providers are callable; no paid fallback',()=>{
  assert.equal(getProvider('ltx').cost,'free');assert.equal(getProvider('wan').cost,'free');
  assert.throws(()=>createVideoProvider('muapi'));assert.throws(()=>getProvider('unknown'));
});
test('LTX maps verified named parameters and divisible-by-32 portrait dimensions',()=>{
  const payload=buildProviderPayload('ltx',input,image);
  assert.equal(payload.mode,'image-to-video');assert.equal(payload.input_image_filepath,image);
  assert.equal(payload.height_ui,512);assert.equal(payload.width_ui,288);
  assert.equal(payload.improve_texture_flag,false);assert.equal(payload.input_video_filepath,null);
  assert.ok(!('camera' in payload));assert.ok(!('audio' in payload));
  assert.throws(()=>buildProviderPayload('ltx',{...input,duration:99},image));
  assert.throws(()=>buildProviderPayload('ltx',{...input,aspectRatio:'4:3'},image));
});
test('Wan payload excludes unsupported aspect ratio, quality and scene conditioning',()=>{
  const payload=buildProviderPayload('wan',input,image);
  assert.equal(payload.input_image,image);assert.equal(payload.steps,4);
  assert.ok(!('aspect_ratio' in payload));assert.ok(!('quality' in payload));assert.ok(!('scene_image' in payload));
});
test('all twelve camera presets add prompt text without claiming native control',()=>{
  assert.equal(CAMERA_PRESETS.filter(item=>item.id!=='none').length,12);
  const prompt=composePrompt({prompt:'Walk.',cameraId:'dolly-in',appearance:'Blue eyes.',style:'Film.'});
  assert.match(prompt,/Walk\./);assert.match(prompt,/parallax/);assert.match(prompt,/Blue eyes/);
  assert.ok(PROVIDERS.filter(item=>item.cost==='free').every(item=>!item.nativeCamera));
});
test('file validation rejects disguised images, excessive sizes and invalid audio/video',async()=>{
  await validateAsset(image,'image');
  await assert.rejects(validateAsset(new Blob(['<svg/>'],{type:'image/png'}),'image'));
  await assert.rejects(validateAsset(new Blob([new Uint8Array(10*1024*1024+1)],{type:'image/png'}),'image'));
  await assert.rejects(validateAsset(new Blob(['not a movie'],{type:'video/mp4'}),'video'));
  await validateAsset(new Blob([new Uint8Array([0,0,0,24]),'ftypisom'],{type:'video/mp4'}),'video');
  await validateAsset(new Blob(['RIFF0000WAVE0000'],{type:'audio/wav'}),'audio');
  await assert.rejects(validateAsset(new Blob(['plain text'],{type:'audio/wav'}),'audio'));
});

function fakeClient(events,{schemaChanged=false}={}) {
  const state={closed:0,cancelled:0};
  const app={
    close(){state.closed++;},
    async view_api(){return {named_endpoints:{'/image_to_video':{parameters:Object.keys(buildProviderPayload('ltx',input,image)).filter(key=>!schemaChanged||key!=='mode').map(parameter_name=>({parameter_name}))}}};},
    submit(endpoint,payload){state.endpoint=endpoint;state.payload=payload;return {
      async *[Symbol.asyncIterator](){for(const event of events)yield event;},
      async cancel(){state.cancelled++;},
    };},
  };
  return {state,loadClient:async()=>({Client:{async connect(space,options){state.space=space;state.options=options;return app;}}})};
}
test('mock provider streams genuine queue fields and a normalized completed result',async()=>{
  const url=`${getProvider('ltx').host}/gradio_api/file=/tmp/video.mp4`;
  const fake=fakeClient([{type:'status',stage:'pending',position:2},{type:'status',stage:'pending',progress_data:[{progress:0.5}]},{type:'data',data:[{video:{url}},42]}]);
  const provider=createVideoProvider('ltx',{loadClient:fake.loadClient});
  const handle=await provider.submitGeneration(input);const updates=[];
  for await(const status of provider.getGenerationStatus(handle))updates.push(status);
  assert.deepEqual(updates.map(update=>update.status),['queued','generating','completed']);
  assert.equal(updates[0].position,2);assert.equal(updates[0].progress,null);assert.equal(updates[1].progress,50);
  assert.equal(provider.getGenerationResult(handle).url,url);assert.equal(fake.state.closed,1);
  assert.equal(fake.state.options.token,undefined);assert.equal(fake.state.endpoint,'/image_to_video');
});
test('schema drift fails before submitting a job',async()=>{
  const fake=fakeClient([],{schemaChanged:true});
  await assert.rejects(createVideoProvider('ltx',{loadClient:fake.loadClient}).submitGeneration(input));
  assert.equal(fake.state.endpoint,undefined);assert.equal(fake.state.closed,1);
});
test('quota, authentication, worker and timeout failures are actionable',()=>{
  assert.match(providerError(new Error('429 quota exceeded')),/kota/);
  assert.match(providerError(new Error('401 authentication required')),/oturum/);
  assert.match(providerError(new Error('404 Not Found')),/kullanılamıyor/);
  assert.match(providerError(new Error('Timed out')),/Uzak iş/);
});
test('provider queue errors are not reported as completed; connections close',async()=>{
  const fake=fakeClient([{type:'status',stage:'error',message:'GPU quota exceeded'}]);
  const provider=createVideoProvider('ltx',{loadClient:fake.loadClient});const handle=await provider.submitGeneration(input);
  await assert.rejects(async()=>{for await(const _ of provider.getGenerationStatus(handle)){}},/kota/);
  assert.throws(()=>provider.getGenerationResult(handle));assert.equal(fake.state.closed,1);
});
test('rejects off-provider video URLs and credentials in output URLs',()=>{
  assert.throws(()=>normalizeOutput('ltx',[{url:'javascript:alert(1)'}]));
  assert.throws(()=>normalizeOutput('ltx',[{url:'https://attacker.test/video.mp4'}]));
  assert.throws(()=>normalizeOutput('ltx',[{url:'https://user:pass@lightricks-ltx-video-distilled.hf.space/a.mp4'}]));
});
test('cancelling a browser job invokes Gradio cancellation',async()=>{
  const fake=fakeClient([]);const controller=new AbortController();
  await createVideoProvider('ltx',{loadClient:fake.loadClient}).submitGeneration(input,{signal:controller.signal});
  controller.abort();assert.equal(fake.state.cancelled,1);assert.equal(fake.state.closed,1);
});
test('private access rejects missing config, wrong passwords and modified or expired sessions',async()=>{
  assert.equal(accessConfigured({}),false);assert.equal(accessConfigured({STUDIO_PASSWORD:'short',STUDIO_SESSION_SECRET:'x'.repeat(32)}),false);
  assert.equal(await passwordMatches('right','right'),true);assert.equal(await passwordMatches('wrong','right'),false);
  const secret='test-secret-'.repeat(4),now=Date.now();
  const token=await issueSession(secret,now);
  assert.equal(await verifySession(token,secret,now),true);
  assert.equal(await verifySession(token+'x',secret,now),false);
  assert.equal(await verifySession(token+'.extra',secret,now),false);
  assert.equal(await verifySession(token,secret,now+13*60*60*1000),false);
  assert.equal(await verifySession(token,'different-secret',now),false);
});
test('scene manifest preserves audio, character and job links without serializing binary files',()=>{
  const result=sceneManifest([{id:'scene',characterId:'char',audioId:'audio',referenceId:'ref',dialogue:'Hello',latestGeneration:{id:'job',status:'completed'}}],[{id:'char',name:'Deniz',mainImageId:'ref'}],[{id:'audio',name:'voice.wav',blob:new Blob(['sound'])}]);
  assert.equal(result.schemaVersion,1);assert.equal(result.scenes[0].character.name,'Deniz');assert.equal(result.scenes[0].latestGeneration.id,'job');
  assert.equal(result.scenes[0].references[0].name,'voice.wav');assert.ok(!('blob' in result.scenes[0].references[0]));
});

test('provider diagnostics distinguish quota, auth, CSP and network without persisting raw secrets',()=>{
  const quota=diagnoseProviderFailure(new Error('You have exceeded your ZeroGPU quota (120s requested vs. -60s left). Authenticate with a Hugging Face token.'),'ltx','events');
  assert.equal(quota.diagnostic.code,'QUOTA_EXHAUSTED');assert.match(quota.message,/Anonim API/);
  assert.equal(diagnoseProviderFailure(new Error('401 Unauthorized'),'ltx','connect').diagnostic.code,'AUTH_REQUIRED');
  assert.equal(diagnoseProviderFailure(new Error('Failed to fetch'),'ltx','connect',true).diagnostic.code,'CSP_BLOCKED');
  const failed=diagnoseProviderFailure(new Error('Failed to fetch private prompt with Bearer sensitive-value'),'ltx','connect');
  assert.equal(failed.diagnostic.code,'NETWORK_OR_CORS');assert.ok(!JSON.stringify(failed.diagnostic).includes('sensitive-value'));assert.ok(!failed.message.includes('private prompt'));
  assert.equal(diagnoseProviderFailure(new Error('stream ended'),'ltx','events').diagnostic.code,'EVENT_STREAM_FAILED');
  assert.equal(diagnoseProviderFailure(Object.assign(new Error('Too many requests'),{status:429}),'ltx','connect').diagnostic.code,'RATE_LIMITED');
  const untrusted=Object.assign(new Error('Failed to fetch'),{diagnostic:{token:'private-value'}});
  assert.ok(!JSON.stringify(diagnoseProviderFailure(untrusted,'ltx','connect').diagnostic).includes('private-value'));
});

test('connection failure keeps its phase and a safe diagnostic instead of collapsing to provider unavailable',async()=>{
  const provider=createVideoProvider('ltx',{loadClient:async()=>({Client:{connect:async()=>{throw new TypeError('Failed to fetch');}}})});
  await assert.rejects(provider.submitGeneration(input),error=>error.diagnostic.code==='NETWORK_OR_CORS' && error.diagnostic.phase==='connect');
});
