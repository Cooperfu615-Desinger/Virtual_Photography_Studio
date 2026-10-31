// Read-only CLI: JSON on stdout; never creates files, installs dependencies or calls a provider.
import {measure} from './lib/c6Distribution.mjs';
const args=process.argv.slice(2);let count=1000,inventoryOnly=false;
for(let i=0;i<args.length;i++){
  if(args[i]==='--inventory-only')inventoryOnly=true;
  else if(args[i]==='--count'){const value=args[++i];if(!/^\d+$/.test(value||''))throw new Error('Expected integer --count');count=Number(value);}
  else if(args[i]==='--help'){console.log('node scripts/c6_distribution.mjs [--inventory-only] [--count 1..10000]\nJSON goes to stdout. Default: 6500 deterministic generations; no file writes.');process.exit(0);}
  else throw new Error('Unknown option: '+args[i]);
}
if(!Number.isSafeInteger(count)||count<1||count>10000)throw new Error('count must be 1..10000');
console.log(JSON.stringify(measure({count,inventoryOnly}),null,2));
