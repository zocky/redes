const redesParser = '###REDESPARSER###';
const splitToken = '/*###SPLIT###*/';


module.exports = {Parser,toSource};

function Parser (grammar,options){
  var src = toSource(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function toSource (grammar,options) {
  var src = redesParser().parse(grammar);
  return redesParser.toString().split(splitToken)[0] + '\n' + src + '\n}'
}
