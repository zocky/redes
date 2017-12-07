const redesParser = function redes() {
  const FAIL = ['FAIL'];
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  return {parse:$_parse}
  function $_parse(text) {
    var state = {
      text: text,
      pos: 0,
      ops: 0,
      stack:[],
      begin() {
        this.stack.push(this.pos);
        if (this.stack.length> MAX_DEPTH)
          throw({message:'too much recursion: MAX_DEPTH='+MAX_DEPTH});
        this.ops++;
        if (this.ops>this.MAX_OPS)
          throw({message:'too many ops: MAX_OPS='+MAX_OPS});
      },
      found(c) {
        this.stack.pop();
        return c;
      },
      fail() {
        this.pos = this.stack.pop();
        return FAIL;
      }
    }
    var res = $_start.apply(state);
    if (state.pos!==text.length) {
      var lines = state.text.slice(0,state.pos).split(/\n/);
      var line = lines.length;
      var col = lines.pop().length;
      console.log('syntax error at line',line,'col',col,text.slice(state.pos,20))
    }
    return res;
  }
  
  function $_token(chars) {
  	return function (){ 
      this.begin();
      if(this.text.substr(this.pos,chars.length) == chars) {
        this.pos+=chars.length;
        return this.found(chars);
      }
      return this.fail()
    }
  }
  function $_char(re) {
  	re = new RegExp(re);
  	return function (){ 
      this.begin();
      if(this.pos>=this.text.length) return this.fail();
      var char = this.text.charAt(this.pos);
      if (!re.test(char)) return this.fail();
      this.pos++;
      return this.found(char);
    }
  }
  function $_any() {
  	return function (){ 
      this.begin();
      if(res.pos>=this.text.length) return this.fail;
      var char = this.text.charAt(this.pos);
      this.pos++;
      return this.found(char);
    }
  }
  function $_seq(args,action) {
  	return function (){ 
      this.begin();
      var ret = {};
      for (var arg of args) {
        if (!Array.isArray(arg)) {
          console.log(arg)
          throw 'not an array'
        }
      	var res = arg[0].apply(this);
        if(res==FAIL) return this.fail();
        if(arg[1]) ret[arg[1]] = res;
      }
      if (action) return this.found(action.call(this,ret,this))
      return this.found(ret)
    }
  }
  function $_or(...args) {
  	return function (){ 
      this.begin();
      for (var arg of args) {
      	var res = arg.apply(this);
        if(res!==FAIL) return this.found(res);
      }
      return this.fail()
    }
  }
  function $_dollar(arg) {
  	return function (){
    	this.begin();
      let start = this.pos;
      if (arg.apply(this)===FAIL) return this.fail();
      return this.found(this.text.slice(start,this.pos));
    }
  }
  function $_amp(arg) {
  	return function (){
    	this.begin();
      let start = this.pos;
      var res = arg.apply(this);
      if (res===FAIL) return this.fail();
      this.pos = start;
      return this.found(res);
    }
  }
  function $_bang(arg) {
  	return function (){
    	this.begin();
      let start = this.pos;
      var res = arg.apply(this);
      if (res!==FAIL) return this.fail();
      this.pos = start;
      return this.found();
    }
  }
  function $_plus(arg) {
  	return function (){
      this.begin();
      var ret = [];
      do {
        var res = arg.apply(this);
        if (res===FAIL) break;
        ret.push(res);
      } while (true)
      if (!ret.length) return this.fail();
      return this.found(ret);
    }   
  }
  function $_maybe(arg) {
  	return function (){
      this.begin();
      var ret = [];
      var res = arg.apply(this);
      if (res===FAIL) return this.found();
      return this.found(res);
    }   
  }
  function $_star(arg) {
    return function (){
      this.begin();
      var ret = [];
      do {
        var res = arg.apply(this);
        if (res===FAIL) break;
        ret.push(res);
      } while (true)
      return this.found(ret);
    }   
  }

/*
    PEG Grammar for generating the redes grammar parser.
    The same grammar should be parsable by redes, and should produce the same output as PEG.
  */

	function indent (t) {
    	return "\n  "+t.replace(/\n/g,'\n  ')+"\n";
    }
    


  function rule_grammar() {
    return $_seq([
      [$_maybe(rule_action),'intro'],
      [rule__],
      [rule_defs,'defs']
    ], ({intro,defs}) => {
    return (intro||'') + '\n' + defs;
    
    }).apply(this)
  }
  function rule_defs() {
    return $_seq([
      [$_plus(rule_def),'defs']
    ], ({defs}) => {
    var methods = defs.map(def=>(
    	`function rule_${def.name}() {${indent(`return ${def.rule}.apply(this)`)}}`
      ));
      methods.push(`function $_start() {\n  return rule_${defs[0].name}.apply(this)\n}`)
      
      return indent(methods.join('\n'))
    
    }).apply(this)
  }
  function rule_def() {
    return $_seq([
      [rule__],
      [rule_ident,'ident'],
      [rule__],
      [$_token("=",false)],
      [rule__],
      [rule_or,'or'],
      [rule_eol]
    ], ({ident,or}) => {
    return {name:ident,rule:or}
    
    }).apply(this)
  }
  function rule_or() {
    return $_seq([
      [rule_seq,'head'],
      [$_star($_seq([
        [rule__],
        [$_char("[|/]",false)],
        [rule__],
        [rule_seq,'seq']
      ], ({seq}) => {
      return seq 
      })),'tail']
    ], ({head,tail}) => {
    if(!tail.length) return head; 
        return `$_or(${indent([head].concat(tail).join(',\n'))})`
    
    }).apply(this)
  }
  function rule_seq() {
    return $_or(
      $_seq([
        [$_or(
          $_seq([
            [rule_chunk,'head'],
            [$_plus($_seq([
              [rule___],
              [rule_chunk,'chunk']
            ], ({chunk}) => {
            return chunk 
            })),'tail']
          ], ({head,tail}) => {
          return [head].concat(tail)
          }),
          $_seq([
            [rule_named_chunk,'chunk']
          ], ({chunk}) => {
          return [chunk] 
          })
        ),'chunks'],
        [$_maybe(rule_action),'action']
      ], ({chunks,action}) => {
      var names = [];
          var args = [];
          chunks.forEach(chunk=>{
            if(chunk.name) {
              names.push(chunk.name);
              args.push(`[${chunk.piece},'${chunk.name}']`);
            } else {
              args.push(`[${chunk.piece}]`);
            }
          })
          var fn = '';
          if(action) {
          	try {
                new Function('','return ('+action+')')
       	   	  fn = `, ({${names.join(',')}}) => (\n${action}\n)`
              } catch(err) {
                try {
                	new Function('',action)
       	   	    fn = `, ({${names.join(',')}}) => {\n${action}\n}`
                } catch(err) {
                  throw(err);
                }
              }
          }
          return `$_seq([${indent(args.join(',\n'))}]${fn})`
      
      }),
      rule_piece
    ).apply(this)
  }
  function rule_action() {
    return $_seq([
      [rule__],
      [rule_block,'block']
    ], ({block}) => {
    return block 
    }).apply(this)
  }
  function rule_chunk() {
    return $_or(
      rule_named_chunk,
      rule_anon_chunk
    ).apply(this)
  }
  function rule_named_chunk() {
    return $_seq([
      [rule_ident,'name'],
      [rule__],
      [$_token(":",false)],
      [rule__],
      [rule_piece,'piece']
    ], ({name,piece}) => {
    return {name,piece}
    
    }).apply(this)
  }
  function rule_anon_chunk() {
    return $_seq([
      [rule_piece,'piece']
    ], ({piece}) => {
    return {piece}
    
    }).apply(this)
  }
  function rule_piece() {
    return $_or(
      $_seq([
        [$_token("!",false)],
        [rule_bit,'bit']
      ], ({bit}) => {
      return `$_bang(${bit})`
      
      }),
      $_seq([
        [$_token("&",false)],
        [rule_bit,'bit']
      ], ({bit}) => {
      return `$_amp(${bit})`
      
      }),
      $_seq([
        [$_token("$",false)],
        [rule_bit,'bit']
      ], ({bit}) => {
      return `$_dollar(${bit})`
      
      }),
      rule_bit
    ).apply(this)
  }
  function rule_bit() {
    return $_or(
      rule_star,
      rule_plus,
      rule_maybe,
      rule_atom
    ).apply(this)
  }
  function rule_rule() {
    return $_seq([
      [$_bang(rule_def)],
      [rule_ident,'ident']
    ], ({ident}) => {
    return `rule_${ident}` 
    
    }).apply(this)
  }
  function rule_maybe() {
    return $_seq([
      [rule_atom,'atom'],
      [rule__],
      [$_token("?",false)]
    ], ({atom}) => {
    return `$_maybe(${atom})`
    
    }).apply(this)
  }
  function rule_star() {
    return $_seq([
      [rule_atom,'atom'],
      [rule__],
      [$_token("*",false)]
    ], ({atom}) => {
    return `$_star(${atom})`
    
    }).apply(this)
  }
  function rule_plus() {
    return $_seq([
      [rule_atom,'atom'],
      [rule__],
      [$_token("+",false)]
    ], ({atom}) => {
    return `$_plus(${atom})`
    
    }).apply(this)
  }
  function rule_atom() {
    return $_or(
      rule_token,
      rule_char,
      rule_dot,
      rule_rule,
      $_seq([
        [$_token("(",false)],
        [rule__],
        [rule_or,'or'],
        [rule__],
        [$_token(")",false)]
      ], ({or}) => {
      return or 
      })
    ).apply(this)
  }
  function rule_token() {
    return $_or(
      $_seq([
        [$_char("['']",false)],
        [$_dollar($_plus($_or(
          $_token("\\\\'",false),
          $_char("[^']",false)
        ))),'c'],
        [$_char("['']",false)],
        [$_maybe($_token("i",false)),'i']
      ], ({c,i}) => {
      return `$_token(${JSON.stringify(c)},${!!i})`
      }),
      $_seq([
        [$_char("[\"\"]",false)],
        [$_dollar($_plus($_or(
          $_token("\\\\\"",false),
          $_char("[^\"]",false)
        ))),'c'],
        [$_char("[\"\"]",false)],
        [$_maybe($_token("i",false)),'i']
      ], ({c,i}) => {
      return `$_token(${JSON.stringify(c)},${!!i})`
      })
    ).apply(this)
  }
  function rule_char() {
    return $_seq([
      [$_dollar($_seq([
        [$_token("[",false)],
        [$_plus($_or(
          $_token("\\\\]",false),
          $_char("[^\\]]",false)
        ))],
        [$_token("]",false)]
      ])),'c'],
      [$_maybe($_token("i",false)),'i']
    ], ({c,i}) => {
    return `$_char(${JSON.stringify(c)},${!!i})`
    }).apply(this)
  }
  function rule_dot() {
    return $_seq([
      [$_token(".",false),'dot']
    ], ({dot}) => {
    return `$_dot()`
    }).apply(this)
  }
  function rule_regex() {
    return $_seq([
      [$_char("[/]",false)],
      [$_dollar($_plus($_or(
        $_token("\\\\/",false),
        $_char("[^/]",false)
      ))),'c'],
      [$_char("[/]",false)],
      [$_maybe($_token("i",false)),'i']
    ], ({c,i}) => {
    return `$_char(${JSON.stringify(c)},${!!i})`
    }).apply(this)
  }
  function rule_block() {
    return $_seq([
      [$_token("{",false)],
      [rule__],
      [$_star(rule_block_chunk),'chunks'],
      [rule__],
      [$_token("}",false)]
    ], ({chunks}) => {
    return chunks.join('') 
    }).apply(this)
  }
  function rule_block_chunk() {
    return $_or(
      $_dollar($_plus($_char("[^'\"{}`]",false))),
      $_dollar($_seq([
        [$_token("'",false)],
        [$_star($_or(
          $_token("\\\\'",false),
          $_char("[^\\n']",false)
        ))],
        [$_token("'",false)]
      ])),
      $_dollar($_seq([
        [$_token("\"",false)],
        [$_star($_or(
          $_token("\\\\\"",false),
          $_char("[^\\n\"]",false)
        ))],
        [$_token("\"",false)]
      ])),
      rule_template,
      $_dollar(rule_block)
    ).apply(this)
  }
  function rule_template() {
    return $_dollar($_seq([
      [$_token("`",false)],
      [$_star(rule_template_chunk)],
      [$_token("`",false)]
    ])).apply(this)
  }
  function rule_template_chunk() {
    return $_or(
      $_dollar($_token("\\\\$",false)),
      $_dollar($_seq([
        [$_token("$",false)],
        [rule_block]
      ])),
      $_dollar($_plus($_char("[^$`]",false))),
      $_seq([
        [$_token("$",false)],
        [$_bang($_token("{",false))]
      ])
    ).apply(this)
  }
  function rule_ident() {
    return $_dollar($_plus($_seq([
      [$_char("[a-z_]",true)],
      [$_star($_char("[a-z0-9]",true))]
    ]))).apply(this)
  }
  function rule__() {
    return $_star($_char("[ \\n\\t\\r]",false)).apply(this)
  }
  function rule___() {
    return $_plus($_char("[ \\n\\t\\r]",false)).apply(this)
  }
  function rule_eol() {
    return $_or(
      $_plus($_seq([
        [rule__],
        [$_token("\\n",false)]
      ])),
      $_seq([
        [rule__],
        [$_bang($_token(".",false))]
      ])
    ).apply(this)
  }
  function $_start() {
    return rule_grammar.apply(this)
  }

};

const redesBase = function redes() {
  const FAIL = ['FAIL'];
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  return {parse:$_parse}
  function $_parse(text) {
    var state = {
      text: text,
      pos: 0,
      ops: 0,
      stack:[],
      begin() {
        this.stack.push(this.pos);
        if (this.stack.length> MAX_DEPTH)
          throw({message:'too much recursion: MAX_DEPTH='+MAX_DEPTH});
        this.ops++;
        if (this.ops>this.MAX_OPS)
          throw({message:'too many ops: MAX_OPS='+MAX_OPS});
      },
      found(c) {
        this.stack.pop();
        return c;
      },
      fail() {
        this.pos = this.stack.pop();
        return FAIL;
      }
    }
    var res = $_start.apply(state);
    if (state.pos!==text.length) {
      var lines = state.text.slice(0,state.pos).split(/\n/);
      var line = lines.length;
      var col = lines.pop().length;
      console.log('syntax error at line',line,'col',col,text.slice(state.pos,20))
    }
    return res;
  }
  
  function $_token(chars) {
  	return function (){ 
      this.begin();
      if(this.text.substr(this.pos,chars.length) == chars) {
        this.pos+=chars.length;
        return this.found(chars);
      }
      return this.fail()
    }
  }
  function $_char(re) {
  	re = new RegExp(re);
  	return function (){ 
      this.begin();
      if(this.pos>=this.text.length) return this.fail();
      var char = this.text.charAt(this.pos);
      if (!re.test(char)) return this.fail();
      this.pos++;
      return this.found(char);
    }
  }
  function $_any() {
  	return function (){ 
      this.begin();
      if(res.pos>=this.text.length) return this.fail;
      var char = this.text.charAt(this.pos);
      this.pos++;
      return this.found(char);
    }
  }
  function $_seq(args,action) {
  	return function (){ 
      this.begin();
      var ret = {};
      for (var arg of args) {
        if (!Array.isArray(arg)) {
          console.log(arg)
          throw 'not an array'
        }
      	var res = arg[0].apply(this);
        if(res==FAIL) return this.fail();
        if(arg[1]) ret[arg[1]] = res;
      }
      if (action) return this.found(action.call(this,ret,this))
      return this.found(ret)
    }
  }
  function $_or(...args) {
  	return function (){ 
      this.begin();
      for (var arg of args) {
      	var res = arg.apply(this);
        if(res!==FAIL) return this.found(res);
      }
      return this.fail()
    }
  }
  function $_dollar(arg) {
  	return function (){
    	this.begin();
      let start = this.pos;
      if (arg.apply(this)===FAIL) return this.fail();
      return this.found(this.text.slice(start,this.pos));
    }
  }
  function $_amp(arg) {
  	return function (){
    	this.begin();
      let start = this.pos;
      var res = arg.apply(this);
      if (res===FAIL) return this.fail();
      this.pos = start;
      return this.found(res);
    }
  }
  function $_bang(arg) {
  	return function (){
    	this.begin();
      let start = this.pos;
      var res = arg.apply(this);
      if (res!==FAIL) return this.fail();
      this.pos = start;
      return this.found();
    }
  }
  function $_plus(arg) {
  	return function (){
      this.begin();
      var ret = [];
      do {
        var res = arg.apply(this);
        if (res===FAIL) break;
        ret.push(res);
      } while (true)
      if (!ret.length) return this.fail();
      return this.found(ret);
    }   
  }
  function $_maybe(arg) {
  	return function (){
      this.begin();
      var ret = [];
      var res = arg.apply(this);
      if (res===FAIL) return this.found();
      return this.found(res);
    }   
  }
  function $_star(arg) {
    return function (){
      this.begin();
      var ret = [];
      do {
        var res = arg.apply(this);
        if (res===FAIL) break;
        ret.push(res);
      } while (true)
      return this.found(ret);
    }   
  }
};

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