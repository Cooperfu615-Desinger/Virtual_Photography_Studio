'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildOpenAIImageRequest, generateOpenAIImage, submitOpenAIImage } = require('../src/openaiImageGeneration');
const base = { modelKey: 'openaiImage26Flare', prompt: 'A ceramic mug', resolution: '1k', aspectRatio: '9:16' };
const png = (w, h, color = 6) => { const b = Buffer.alloc(33); Buffer.from('89504e470d0a1a0a', 'hex').copy(b); b.write('IHDR', 12); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); b[25] = color; return `data:image/png;base64,${b.toString('base64')}`; };
test('2.6 versions map exact models and settings without changing 2.0', () => {
  for (const [modelKey, model] of [['openaiImage26Flare','gpt-image-2.6-flare'],['openaiImage26Sunburst','gpt-image-2.6-sunburst']]) {
    const body = buildOpenAIImageRequest({...base,modelKey,quality:'max',complexity:'low',background:'transparent',moderation:'low',outputFormat:'webp',outputCompression:75});
    assert.equal(body.model,model); assert.equal(body.n,1); assert.equal(body.quality,'max'); assert.equal(body.complexity,'low');
    assert.equal(body.background,'transparent'); assert.equal(body.output_format,'webp'); assert.equal(body.output_compression,75);
  }
  assert.equal(buildOpenAIImageRequest({...base,modelKey:'openaiImage2'}).model,'gpt-image-2');
});
test('incompatible settings fail before claiming a paid task', async () => {
  for (const extra of [{modelKey:'unknown'},{quality:'wrong'},{complexity:'max'},{outputFormat:'exe'},{background:'transparent',outputFormat:'jpeg'},{outputFormat:'gif',frameCount:17},{imageMode:'edit'},{imageMode:'edit',outputFormat:'svg'},{imageMode:'edit',referenceImage:png(4,4),mask:png(5,4)},{imageMode:'edit',referenceImage:png(4,4),mask:png(4,4),markup:png(4,4)}]) {
    let claims=0; await assert.rejects(submitOpenAIImage({apiKey:'fake',requestId:'fixture',input:{...base,...extra},store:{claim:()=>{claims++;}}})); assert.equal(claims,0);
  }
});
test('editing sends image and markup to official edit endpoint', async () => {
  const input={...base,modelKey:'openaiImage26Sunburst',imageMode:'edit',referenceImage:png(8,8),markup:png(8,8)}; let request;
  const result=await generateOpenAIImage({apiKey:'fake',input,fetchImpl:async(url,opts)=>{request={url,body:JSON.parse(opts.body)};return {ok:true,json:async()=>({data:[{b64_json:'YWJj'}]})};}});
  assert.match(request.url,/\/images\/edits$/); assert.equal(request.body.images[0].image_url,input.referenceImage); assert.equal(request.body.markup.image_url,input.markup); assert.equal(result.images[0].mimeType,'image/png'); assert.ok(!JSON.stringify(result).includes('fake'));
});
test('GIF uses auto size and formats retain actual MIME', async () => {
  for (const [format,mime] of [['gif','image/gif'],['svg','image/svg+xml'],['jpeg','image/jpeg']]) {
    let request; const result=await generateOpenAIImage({apiKey:'fake',input:{...base,outputFormat:format},fetchImpl:async(_url,opts)=>{request=JSON.parse(opts.body);return {ok:true,json:async()=>({data:[{b64_json:'YWJj'}]})};}});
    assert.equal(result.images[0].mimeType,mime); assert.ok(result.images[0].src.startsWith(`data:${mime};base64,`));
    if(format==='gif'){assert.equal(request.size,'auto');assert.equal(request.frame_count,9);assert.equal(request.frame_duration_ms,200);} if(format==='svg') assert.equal(request.n,1);
  }
});

test('automatic and custom sizes are bounded before submission', () => {
  assert.equal(buildOpenAIImageRequest({...base,resolution:'auto'}).size,'auto');
  assert.equal(buildOpenAIImageRequest({...base,resolution:'custom',customWidth:1024,customHeight:1536}).size,'1024x1536');
  assert.throws(()=>buildOpenAIImageRequest({...base,resolution:'custom',customWidth:1000,customHeight:1536}),/尺寸/);
  assert.equal(buildOpenAIImageRequest({...base,resolution:'custom',customWidth:0,customHeight:0,outputFormat:'gif'}).size,'auto');
});

test('a batch requests four images once and returns each distinct original in provider order', async () => {
  for (const modelKey of ['openaiImage26Flare', 'openaiImage26Sunburst']) {
    const encoded = ['first', 'second', 'third', 'fourth'].map(value => Buffer.from(value).toString('base64'));
    const bodies = [];
    const result = await generateOpenAIImage({ input: { ...base, modelKey, count: 4 }, apiKey: 'fixture',
      fetchImpl: async (_url, options) => {
        bodies.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ data: encoded.map(b64_json => ({ b64_json })) }) };
      } });
    assert.deepEqual(bodies.map(({ n, prompt }) => [n, prompt]), [[4, base.prompt]]);
    assert.deepEqual(result.images.map(image => image.src), encoded.map(value => 'data:image/png;base64,' + value));
  }
  for (const extra of [{ count: 3 }, { count: 4, outputFormat: 'svg' }, { count: 4, modelKey: 'openaiImage2' }]) {
    assert.throws(() => buildOpenAIImageRequest({ ...base, ...extra }), /張數/);
  }
});
