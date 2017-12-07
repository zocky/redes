const redesParser = '###REDESPARSER###';
const redesBase = '###REDESBASE###';
const splitToken = '/*###SPLIT###*/';

module.exports = {Parser,toSource};

function Parser (grammar,options){
  var src = toSource(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function toSource (grammar,options) {
  var src = redesParser.parse(grammar);
  return redesBase.toString().slice(0,-1) + '\n' + splitToken + '\n' + src + '\n}'
}