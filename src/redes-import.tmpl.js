'use strict';

const redesParser = '###REDESPARSER###';

export {Parser,generate};

function Parser (grammar,options){
  var src = generate(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function generate (grammar,{format='bare',export:exportVar=null}={}) {
  var src = redesParser().parse(grammar);
  var parts = redesParser.toString().split('/*###SPLIT###*/') 
  parts[1] = src;
  src = parts.join('/*###SPLIT###*/');

  switch(format) {
    case 'bare': return src;
    case 'require': return exportVar ? `exports.${exportVar}=${src}` : `module.exports=${src}`;  
    case 'import': return exportVar ? `export const ${exportVar}=${src}` : `export default ${src}`;
    case 'global': return `(typeof global!=='undefined'?global:window).${exportVar||'Parser'}=${src}`;
    default: throw new Error('Format must be bare, require, import or global');
  }
}
