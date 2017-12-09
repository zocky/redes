Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });
const fs = require('fs');
const path = require('path');
const __build = path.resolve(__dirname,'build');
const __dist = path.resolve(__dirname,'dist');
const __src = path.resolve(__dirname,'src');

const grammar = fs.readFileSync(__src+'/redes.peg','utf8');
const srcBase = require(__src+'/base-parser').toString();

emptyDir(__build);
buildRedesPegWithPeg();
buildRedesWithRedesPeg();
buildRedesWithRedes();
compareParsers();
emptyDir(__dist+'/npm');
emptyDir(__dist+'/browser');
deployToDist();



function buildRedesPegWithPeg() {
  const pegjs = require('pegjs');
  console.time('buildRedesPegWithPeg')
  var srcParser = pegjs.generate(grammar,{format:'bare',output:'source'});
  console.timeEnd('buildRedesPegWithPeg')
  
  let src = fs.readFileSync(__src+'/redes-peg.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("'###REDESBASE###'").join(srcBase);
  fs.writeFileSync(__build+'/redespeg-with-peg.js',src,'utf8');
}

function buildRedesWithRedesPeg() {
  const redesPeg = require(__build+'/redespeg-with-peg');
  console.time('buildRedesWithRedesPeg')
  var srcParser = redesPeg.generate(grammar);
  console.timeEnd('buildRedesWithRedesPeg')
  
  let src = fs.readFileSync(__src+'/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("/*###EXPORT###*/").join('module.exports = ');
  fs.writeFileSync(__build+'/redes-with-redespeg.js',src,'utf8');
}

function buildRedesWithRedes() {
  const redes = require(__build+'/redes-with-redespeg');
  console.time('buildRedesWithRedes')
  var srcParser = redes.generate(grammar);
  console.timeEnd('buildRedesWithRedes')
  
  let src = fs.readFileSync(__src+'/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  src = src.split("/*###EXPORT###*/").join('module.exports = ');
  fs.writeFileSync(__build+'/redes-with-redes.js',src,'utf8');
}

function emptyDir(dir) {
  var files = fs.readdirSync(dir);
  for (const file of files) {
    fs.unlinkSync(path.join(dir, file));
  }
}

function compareParsers() {
  const redesWithRedesPeg = fs.readFileSync(__build+'/redes-with-redespeg.js','utf8');
  const redesWithRedes = fs.readFileSync(__build+'/redes-with-redes.js','utf8');
  if (redesWithRedes !== redesWithRedesPeg) throw 'ERROR: generated files are different.'
  console.log('SUCCESS: Generated files are identical.',redesWithRedesPeg.length,redesWithRedes.length)
}

function deployToDist() {
  const redes = require(__build+'/redes-with-redes.js');
  console.time('buildRedesWithRedes')
  var srcParser = redes.generate(grammar);
  console.timeEnd('buildRedesWithRedes')
  
  let src = fs.readFileSync(__src+'/redes.tmpl.js','utf8');
  src = src.split("'###REDESPARSER###'").join(srcParser);
  let out = src.split("/*###EXPORT###*/").join('module.exports = ');
  fs.writeFileSync(__dist+'/npm/redes.js',out,'utf8');
  out = src.split("/*###EXPORT###*/").join('(typeof global!=="undefined"?global:window).Redes = ');
  fs.writeFileSync(__dist+'/browser/redes.js',out,'utf8');
}
