Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });

try{
  const fs = require('fs');
  const peg = require('pegjs');

  var redesGrammar = fs.readFileSync('./src/redes.peg','utf8');
  var baseParser = require('./src/base-parser');
  var redesBase = baseParser.toString();
  
  var pegParser = peg.generate(redesGrammar,{format:'bare',output:'source'});
  var redesTemplatePeg = fs.readFileSync('./src/redes-peg.tmpl.js','utf8');
  let pegCode = redesTemplatePeg.split("'###REDESPARSER###'").join(pegParser);
  pegCode = pegCode.split("'###REDESBASE###'").join(redesBase);
  fs.writeFileSync('./build/redes-peg.js',pegCode);

  
  
  var redesTemplate = fs.readFileSync('./src/redes.tmpl.js','utf8');
  var redesParserCode= require('./build/redes-peg').source(redesGrammar);
  let redesCode = redesTemplate.split("'###REDESPARSER###'").join(redesParserCode);
  redesCode = redesCode.split("'###REDESBASE###'").join(redesBase);
  fs.writeFileSync('./build/redes.js',redesCode);
} catch(err) {
  console.log(err)
}