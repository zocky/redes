const redesParser = '###REDESPARSER###';

const redesBase = '###REDESBASE###';

module.exports.Parser = function(grammar,options){
  var src = redesSource(grammar);
  console.log(src);
  var fn = new Function('','return '+src);
  return fn();
}

function redesSource (grammar,options) {
  var src = redesParser.parse(grammar);
  return redesBase.toString().slice(0,-1) + src + '\n}'
}