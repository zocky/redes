const redesParser = '###REDESPARSER###';
const redesBase = '###REDESBASE###';

module.exports = {Parser,toSource};

function Parser (grammar,options){
  var src = toSource(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function toSource (grammar,options) {
  var src = redesParser.parse(grammar);
  var parts = redesBase.toString().split('/*###SPLIT###*/') 
  parts[1] = src;
  return parts.join('/*###SPLIT###*/');
}