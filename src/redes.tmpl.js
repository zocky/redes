const redesParser = '###REDESPARSER###';

module.exports = {Parser,toSource};

function Parser (grammar,options){
  var src = toSource(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function toSource (grammar,options) {
  var src = redesParser().parse(grammar);
  var parts = redesParser.toString().split('/*###SPLIT###*/') 
  parts[1] = src;
  return parts.join('/*###SPLIT###*/');
}
