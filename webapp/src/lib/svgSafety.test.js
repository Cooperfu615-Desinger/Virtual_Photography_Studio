import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeSvg } from './svgSafety.js';
function parser(elements, { invalid = false, root = 'svg' } = {}) {
  return class { parseFromString() { return { documentElement: { localName: root }, querySelector: () => invalid ? {} : null, querySelectorAll: () => elements }; } };
}
const el = (localName, attrs = []) => ({localName,attributes:attrs.map(([name,value])=>({name,localName:name.includes(':')?name.split(':').at(-1):name,value}))});
test('SVG rejects active content, external URLs, entities, and invalid XML',()=>{
  const raw='<svg/>';
  assert.throws(()=>assertSafeSvg('<!DOCTYPE svg><svg/>',parser([])),/不安全/);
  assert.throws(()=>assertSafeSvg(raw,parser([],{invalid:true})),/解析/);
  for (const entry of [el('script'),el('foreignObject'),el('image',[['href','https://example.test/a']]),el('path',[['onclick','alert(1)']]),el('path',[['fill','url(https://example.test/a)']]),el('svg',[['xml:base','/elsewhere']])]) assert.throws(()=>assertSafeSvg(raw,parser([entry])));
  assert.equal(assertSafeSvg(raw,parser([el('svg',[['xmlns','http://www.w3.org/2000/svg']]),el('path',[['fill','url(#paint)']])])),raw);
});
