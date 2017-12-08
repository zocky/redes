Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });
const fs = require('fs');
const path = require('path');
const __build = path.resolve(__dirname,'build');

const grammar = fs.readFileSync('./src/redes.peg','utf8');
const srcBase = require('./src/base-parser').toString();
const srcSplit = Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
  
emptyBuild();
buildRedesPegWithPeg();
buildRedesWithRedesPeg();
buildRedesWithRedes();
compareParsers();

var time = 0;
function startTime() {
  var [s,ns] = process.hrtime();
  time = s * 1000 + ns / 1e6;
}
function endTime(note) {
  var [s,ns] = process.hrtime();
  var ellapsed = s * 1000 + ns/1e6 - time;
  console.log(note,ellapsed+'ms');
  return ellapsed;
}

function buildRedesPegWithPeg() {
  const pegjs = require('pegjs');
  console.time('buildRedesPegWithPeg')
  var srcParser = pegjs.generate(grammar,{format:'bare',output:'source'});
  console.timeEnd('buildRedesPegWithPeg')
  
  let src = fs.readFileSync('./src/redes-peg.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("'###REDESBASE###'").join(srcBase);
  fs.writeFileSync('./build/redespeg-with-peg.js',src,'utf8');
}

function buildRedesWithRedesPeg() {
  const redesPeg = require('./build/redespeg-with-peg');
  console.time('buildRedesWithRedesPeg')
  var srcParser = redesPeg.toSource(grammar);
  console.timeEnd('buildRedesWithRedesPeg')
  
  let src = fs.readFileSync('./src/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  fs.writeFileSync('./build/redes-with-redespeg.js',src,'utf8');
}

function buildRedesWithRedes() {
  const redes = require('./build/redes-with-redespeg');
  console.time('buildRedesWithRedes')
  var srcParser = redes.toSource(grammar);
  console.timeEnd('buildRedesWithRedes')
  
  let src = fs.readFileSync('./src/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  fs.writeFileSync('./build/redes-with-redes.js',src,'utf8');
}

function emptyBuild() {
  var files = fs.readdirSync(__build);
  for (const file of files) {
    fs.unlinkSync(path.join(__build, file));
  }
}

function compareParsers() {
  const redesWithRedesPeg = fs.readFileSync('./build/redes-with-redespeg.js','utf8');
  const redesWithRedes = fs.readFileSync('./build/redes-with-redes.js','utf8');
  if (redesWithRedes !== redesWithRedesPeg) throw 'ERROR: generated files are different.'
  console.log('SUCCESS: Generated files are identical.')
}