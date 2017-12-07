Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });
const fs = require('fs');
const path = require('path');
const __build = path.resolve(__dirname,'build');

const grammar = fs.readFileSync('./src/redes.peg','utf8');
const srcBase = require('./src/base-parser').toString();
const srcSplit = Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
  
buildRedesPegWithPeg();  
   


function buildRedesPegWithPeg() {
  const pegjs = require('pegjs');
  var srcParser = peg.generate(redesGrammar,{format:'bare',output:'source'});
  
  let src = fs.readFileSync('./src/redes-peg.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("'###REDESBASE###'").join(srcBase);
  pegCode = pegCode.split("###SPLIT###").join(guid);
  fs.writeFileSync('./build/redes-peg.js',pegCode,'utf8');
}

function buildRedesWithRedesPeg() {

}

function buildRedesWithRedes() {

}

function emptyBuild() {
  var files = fs.readdirSync(__build);
  for (const file of files) {
    fs.unlinkSync(path.join(__build, file));
  }
}
