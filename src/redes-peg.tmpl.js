const redesParser = '###REDESPARSER###';

const redesBase = '###REDESBASE###';

module.exports.Parser = function(grammar,options){
  var src = redesSource(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

module.exports.source = function (grammar,options) {
  var src = redesParser.parse(grammar);
  return redesBase.toString().slice(0,-1) + '\n' + src + '\n}'
}