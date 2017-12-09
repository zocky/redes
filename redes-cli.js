#!/usr/bin/node

const fs=require("fs");
const path=require("path");
const redes = require("./dist/redes.js");

const [,,arg1,arg2] = process.argv;
if (arg1 == '--help') {
  console.log('Usage:');
  console.log(__filename+' : Read from stdin, write to stdout.')
  console.log(__filename+' <source> : Read from <source>, write to stdout.')
  console.log(__filename+' <source> <target> : Read from <source>, write to <target>.')
  console.log(__filename+' <source> : Read from <stdin>, write to <target>.')
  process.exit(0)
}
if (!arg1 || arg1 =='-') {
  var source = process.stdin;
} else {
  var source = fs.createReadStream(path.resolve(process.cwd(),arg1));
}
var text = '';
source
.setEncoding('utf8')
.resume()
.on('error',error=>{
  console.error(String(error));
  process.exit(-1);
})
.on('data',chunk=>text+=chunk)
.on('end',()=>{
  try {
    var result = redes.generate(text);
    if (arg2) fs.writeFileSync(path.resolve(process.cwd(),arg2),result,'utf8');
    else process.stdout.write(result);
    process.exit(0);
  } catch(error) {
    console.error(String(error));
    process.exit(-1);
  }
})