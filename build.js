Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });
const fs = require('fs');
const path = require('path');
const __build = path.resolve(__dirname,'build');

const grammar = fs.readFileSync('./src/redes.peg','utf8');
const srcBase = require('./src/base-parser').toString();
const srcSplit = Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
  
emptyBuild();
buildRedesPegWithPeg();
var time1 = buildRedesWithRedesPeg();
var time2 = buildRedesWithRedes();
console.log('ratio',(time2/time1).toFixed(2));
compareParsers();

var time = 0;
function startTime() {
  var [s,ns] = process.hrtime();
  time = s * 1000 + ns / 1e6;
}
function endTime(note) {
  var [s,ns] = process.hrtime();
  var ellapsed = s * 1000 + ns/1e6 - time;
  console.log(note,ellapsed.toFixed(2)+'ms');
  return ellapsed;
}

function buildRedesPegWithPeg() {
  const pegjs = require('pegjs');
  startTime('buildRedesPegWithPeg')
  var srcParser = pegjs.generate(grammar,{format:'bare',output:'source'});
  endTime('buildRedesPegWithPeg')
  
  let src = fs.readFileSync('./src/redes-peg.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("'###REDESBASE###'").join(srcBase);
  src = src.split("###SPLIT###").join(srcSplit);
  fs.writeFileSync('./build/redespeg-with-peg.js',src,'utf8');
}

function buildRedesWithRedesPeg() {
  const redesPeg = require('./build/redespeg-with-peg');
  startTime('buildRedesWithRedesPeg')
  var srcParser = redesPeg.toSource(grammar);
  var ellapsed = endTime('buildRedesWithRedesPeg')
  
  let src = fs.readFileSync('./src/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("###SPLIT###").join(srcSplit);
  fs.writeFileSync('./build/redes-with-redespeg.js',src,'utf8');
  return ellapsed;
}

function buildRedesWithRedes() {
  const redes = require('./build/redes-with-redespeg');
  startTime('buildRedesWithRedes')
  var srcParser = redes.toSource(grammar);
  var ellapsed = endTime('buildRedesWithRedes')
  
  let src = fs.readFileSync('./src/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("###SPLIT###").join(srcSplit);
  fs.writeFileSync('./build/redes-with-redes.js',src,'utf8');
  return ellapsed;
}

function emptyBuild() {
  var files = fs.readdirSync(__build);
  for (const file of files) {
    fs.unlinkSync(path.join(__build, file));
  }
}

function compareParsers() {
  const redesWithRedesPeg = fs.readFileSync('./build/redes-with-redespeg.js','utf8');
  const redesWithRedes = fs.readFileSync('./build/redes-with-redespeg.js','utf8');
  if (redesWithRedes !== redesWithRedesPeg) throw 'ERROR: generated files are different.'
  console.log('SUCCESS: Generated files are identical.')
}