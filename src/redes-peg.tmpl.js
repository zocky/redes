'use strict';
const redesParser = '###REDESPARSER###';
const redesBase = '###REDESBASE###';

module.exports = {Parser,generate};

function Parser (grammar,options){
  var src = generate(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function generate (grammar,options) {
  var src = redesParser.parse(grammar);
  var parts = redesBase.toString().split('/*###SPLIT###*/') 
  parts[1] = src;
  return parts.join('/*###SPLIT###*/');
}