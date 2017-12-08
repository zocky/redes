const redesParser = function redes() {
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  function $_parse(text) {
    var depth=0;
    const stack=[];
    var pos = 0;
    var state = {
      text: text,
      pos: 0,
    }
    var res = $_start(state);
    if (state.pos!==text.length) {
      var lines = state.text.slice(0,state.pos).split(/\n/);
      var line = lines.length;
      var col = lines.pop().length;
    }
    return res[0];
  }
  
  const $_token = (chars) => {
  	return (S)=> (
        S.text.substr(S.pos,chars.length) === chars
        && (S.pos+=chars.length,[chars])
    )
  }
  const $_itoken= (chars)=> {
  	return (S)=>{
      if(S.text.substr(S.pos,chars.length).toLowerCase() === chars) {
        S.pos+=chars.length;
        return ([chars]);
      }
    }
  }
  const $_char=(re)=> {
  	return (S)=>{ 
      var char = S.text.charAt(S.pos);
      return re.test(char) && (S.pos++,[char]);
    }
  }
  const $_any=() =>{
  	return (S) => S.pos < S.text.length && [S.text.charAt(S.pos++)];
  }
  const $_seq=(args,action) =>{
  	return (S)=>{ 
      const pos=S.pos;
      var ret = {};
      for (var arg of args) {
      	var res = arg[0](S);
        if(!res) return (S.pos=pos,false);
        if(arg[1]) ret[arg[1]] = res[0];
      }
      if (action) return ([action(ret)])
      return ([ret])
    }
  }
  const $_or=(args)=> {
  	return (S)=>{ 
      for (var arg of args) {
      	var res = arg(S);
        if (res) return (res);
      }
      return false
    }
  }
  const $_dollar=(arg)=> {
  	return (S)=>{
    	const pos=S.pos;
      if (!arg(S)) return (S.pos=pos,false);
      return ([S.text.slice(pos,S.pos)]);
    }
  }
  const $_amp=(arg)=> {
  	return (S)=>{
    	const pos=S.pos;
      var res = arg(S);
      S.pos = pos;
      if (!res) return false;
      return res;
    }
  }
  const $_bang=(arg)=> {
  	return (S)=>{
    	const pos=S.pos;
      var res = arg(S);
      S.pos = pos;
      if (res) return false;
      return [];
    }
  }
  const $_plus=(arg) =>{
  	return (S)=>{
      const pos=S.pos;
      var ret = [];
      do {
        var res = arg(S);
        if (!res) break;
        ret.push(res[0]);
      } while (true)
      if (!ret.length) return (S.pos=pos,false);
      return ([ret]);
    }   
  }
  const $_maybe=(arg) =>{
  	return (S)=>{
      const pos=S.pos;
      var res = arg(S);
      if (!res) return [];
      return (res);
    }   
  }
  const $_star=(arg)=> {
    return (S)=>{
      const pos=S.pos;
      var ret = [];
      do {
        var res = arg(S);
        if (!res) break;
        ret.push(res[0]);
      } while (true)
      return ([ret]);
    }   
  }
  
  /*###SPLIT###*/
function indent (t) {
    return "\n  "+t.replace(/\n/g,'\n  ')+"\n";
  }
  var cur_def;
  var def_dep={};

  var sorted = {};
  function sortDeps() {
    do {
      var keys = Object.keys(def_dep);
      keys.sort((a,b)=>{
        returnObject.keys(def_dep[a]).length - Object.keys(def_dep[b]).length; 
      });
      console.log('keys',keys.map(k=>[k,Object.keys(def_dep[k]).length]));
      return;
      outer: for (var k of keys) {
        for (var dep in def_dep[k]) {
          console.log('try',k,dep,!!sorted[dep])
          if (!sorted[dep]) continue outer;  
        }
        console.log('found',k)
        sorted[k] = true;
        delete def_dep[k];
      }
    } while(Object.keys(def_dep).length < keys.length)
    return Object.keys(sorted);
  }


  var comp_eol; 
  const rule_eol = (S) => {
  if (!comp_eol) {
  comp_eol = $_or([
    $_plus($_seq([
      [comp__||rule__],
      [$_token("\n",false)]
    ])),
    $_seq([
      [comp__||rule__],
      [$_bang($_token(".",false))]
    ])
  ])
  }
  return comp_eol(S);
  }
  var comp___; 
  const rule___ = (S) => {
  if (!comp___) {
  comp___ = $_plus($_char(/^[ \n\t\r]/))
  }
  return comp___(S);
  }
  var comp__; 
  const rule__ = (S) => {
  if (!comp__) {
  comp__ = $_star($_char(/^[ \n\t\r]/))
  }
  return comp__(S);
  }
  var comp_ident; 
  const rule_ident = (S) => {
  if (!comp_ident) {
  comp_ident = $_dollar($_plus($_seq([
    [$_char(/^[a-z_]/i)],
    [$_star($_char(/^[a-z0-9]/i))]
  ])))
  }
  return comp_ident(S);
  }
  var comp_template_chunk; 
  const rule_template_chunk = (S) => {
  if (!comp_template_chunk) {
  comp_template_chunk = $_or([
    $_dollar($_token('\\$')),
    $_dollar($_seq([
      [$_token('$')],
      [comp_block||rule_block]
    ])),
    $_dollar($_plus($_char(/^[^$`]/))),
    $_seq([
      [$_token("$",false)],
      [$_bang($_token("{",false))]
    ])
  ])
  }
  return comp_template_chunk(S);
  }
  var comp_template; 
  const rule_template = (S) => {
  if (!comp_template) {
  comp_template = $_dollar($_seq([
    [$_token('`')],
    [$_star(comp_template_chunk||rule_template_chunk)],
    [$_token('`')]
  ]))
  }
  return comp_template(S);
  }
  var comp_block_chunk; 
  const rule_block_chunk = (S) => {
  if (!comp_block_chunk) {
  comp_block_chunk = $_or([
    $_dollar($_plus($_char(/^[^'"{}`]/))),
    $_dollar($_seq([
      [$_token("'",false)],
      [$_star($_or([
        $_token("\\'",false),
        $_char(/^[^\n']/)
      ]))],
      [$_token("'",false)]
    ])),
    $_dollar($_seq([
      [$_token('"')],
      [$_star($_or([
        $_token('\\"'),
        $_char(/^[^\n"]/)
      ]))],
      [$_token('"')]
    ])),
    comp_template||rule_template,
    $_dollar(comp_block||rule_block)
  ])
  }
  return comp_block_chunk(S);
  }
  var comp_block; 
  const rule_block = (S) => {
  if (!comp_block) {
  comp_block = $_seq([
    [$_token("{",false)],
    [comp__||rule__],
    [$_star(comp_block_chunk||rule_block_chunk),'chunks'],
    [comp__||rule__],
    [$_token("}",false)]
  ], ({chunks}) => {
  return chunks.join('') 
  })
  }
  return comp_block(S);
  }
  var comp_dot; 
  const rule_dot = (S) => {
  if (!comp_dot) {
  comp_dot = $_seq([
    [$_token(".",false),'dot']
  ], ({dot}) => {
  return `$_dot()`
  })
  }
  return comp_dot(S);
  }
  var comp_char; 
  const rule_char = (S) => {
  if (!comp_char) {
  comp_char = $_seq([
    [$_token("[",false)],
    [$_dollar($_plus($_or([
      $_token("\\]",false),
      $_char(/^[^\]]/)
    ]))),'c'],
    [$_token("]",false)],
    [$_maybe($_token("i",false)),'i']
  ], ({c,i}) => {
  return `$_char(/^[${c}]/${i||''})`
  })
  }
  return comp_char(S);
  }
  var comp_token; 
  const rule_token = (S) => {
  if (!comp_token) {
  comp_token = $_or([
    $_seq([
      [$_char(/^['']/)],
      [$_dollar($_plus($_or([
        $_token("\\'",false),
        $_char(/^[^']/)
      ]))),'c'],
      [$_char(/^['']/)],
      [$_maybe($_token("i",false)),'i']
    ], ({c,i}) => {
    if (i) return `$_itoken('${c.toLowerCase()}')`;
      else return `$_token('${c}')`;
    
    }),
    $_seq([
      [$_char(/^[""]/)],
      [$_dollar($_plus($_or([
        $_token('\\"'),
        $_char(/^[^"]/)
      ]))),'c'],
      [$_char(/^[""]/)],
      [$_maybe($_token("i",false)),'i']
    ], ({c,i}) => {
    return `$_token("${c}",${!!i})`
    })
  ])
  }
  return comp_token(S);
  }
  var comp_atom; 
  const rule_atom = (S) => {
  if (!comp_atom) {
  comp_atom = $_or([
    comp_token||rule_token,
    comp_char||rule_char,
    comp_dot||rule_dot,
    comp_rule||rule_rule,
    $_seq([
      [$_token("(",false)],
      [comp__||rule__],
      [comp_or||rule_or,'or'],
      [comp__||rule__],
      [$_token(")",false)]
    ], ({or}) => {
    return or 
    })
  ])
  }
  return comp_atom(S);
  }
  var comp_plus; 
  const rule_plus = (S) => {
  if (!comp_plus) {
  comp_plus = $_seq([
    [comp_atom||rule_atom,'atom'],
    [comp__||rule__],
    [$_token("+",false)]
  ], ({atom}) => {
  return `$_plus(${atom})`
  
  })
  }
  return comp_plus(S);
  }
  var comp_star; 
  const rule_star = (S) => {
  if (!comp_star) {
  comp_star = $_seq([
    [comp_atom||rule_atom,'atom'],
    [comp__||rule__],
    [$_token("*",false)]
  ], ({atom}) => {
  return `$_star(${atom})`
  
  })
  }
  return comp_star(S);
  }
  var comp_maybe; 
  const rule_maybe = (S) => {
  if (!comp_maybe) {
  comp_maybe = $_seq([
    [comp_atom||rule_atom,'atom'],
    [comp__||rule__],
    [$_token("?",false)]
  ], ({atom}) => {
  return `$_maybe(${atom})`
  
  })
  }
  return comp_maybe(S);
  }
  var comp_rule; 
  const rule_rule = (S) => {
  if (!comp_rule) {
  comp_rule = $_seq([
    [$_bang(comp_def||rule_def)],
    [comp_ident||rule_ident,'ident']
  ], ({ident}) => {
  return `comp_${ident}||rule_${ident}` 
  
  })
  }
  return comp_rule(S);
  }
  var comp_bit; 
  const rule_bit = (S) => {
  if (!comp_bit) {
  comp_bit = $_or([
    comp_star||rule_star,
    comp_plus||rule_plus,
    comp_maybe||rule_maybe,
    comp_atom||rule_atom
  ])
  }
  return comp_bit(S);
  }
  var comp_piece; 
  const rule_piece = (S) => {
  if (!comp_piece) {
  comp_piece = $_or([
    $_seq([
      [$_token("!",false)],
      [comp_bit||rule_bit,'bit']
    ], ({bit}) => {
    return `$_bang(${bit})`
    
    }),
    $_seq([
      [$_token("&",false)],
      [comp_bit||rule_bit,'bit']
    ], ({bit}) => {
    return `$_amp(${bit})`
    
    }),
    $_seq([
      [$_token("$",false)],
      [comp_bit||rule_bit,'bit']
    ], ({bit}) => {
    return `$_dollar(${bit})`
    
    }),
    $_seq([
      [$_token("&",false)],
      [comp_action||rule_action]
    ], ({}) => {
    return `$_amp($_any())`
    
    }),
    comp_bit||rule_bit
  ])
  }
  return comp_piece(S);
  }
  var comp_anon_chunk; 
  const rule_anon_chunk = (S) => {
  if (!comp_anon_chunk) {
  comp_anon_chunk = $_seq([
    [comp_piece||rule_piece,'piece']
  ], ({piece}) => {
  return {piece}
  
  })
  }
  return comp_anon_chunk(S);
  }
  var comp_named_chunk; 
  const rule_named_chunk = (S) => {
  if (!comp_named_chunk) {
  comp_named_chunk = $_seq([
    [comp_ident||rule_ident,'name'],
    [comp__||rule__],
    [$_token(":",false)],
    [comp__||rule__],
    [comp_piece||rule_piece,'piece']
  ], ({name,piece}) => {
  return {name,piece}
  
  })
  }
  return comp_named_chunk(S);
  }
  var comp_chunk; 
  const rule_chunk = (S) => {
  if (!comp_chunk) {
  comp_chunk = $_or([
    comp_named_chunk||rule_named_chunk,
    comp_anon_chunk||rule_anon_chunk
  ])
  }
  return comp_chunk(S);
  }
  var comp_action; 
  const rule_action = (S) => {
  if (!comp_action) {
  comp_action = $_seq([
    [comp__||rule__],
    [comp_block||rule_block,'block']
  ], ({block}) => {
  return block 
  })
  }
  return comp_action(S);
  }
  var comp_seq; 
  const rule_seq = (S) => {
  if (!comp_seq) {
  comp_seq = $_or([
    $_seq([
      [$_or([
        $_seq([
          [comp_chunk||rule_chunk,'head'],
          [$_plus($_seq([
            [comp___||rule___],
            [comp_chunk||rule_chunk,'chunk']
          ], ({chunk}) => {
          return chunk 
          })),'tail']
        ], ({head,tail}) => {
        return [head].concat(tail)
        }),
        $_seq([
          [comp_named_chunk||rule_named_chunk,'chunk']
        ], ({chunk}) => {
        return [chunk] 
        })
      ]),'chunks'],
      [$_maybe(comp_action||rule_action),'action']
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
    comp_piece||rule_piece
  ])
  }
  return comp_seq(S);
  }
  var comp_or; 
  const rule_or = (S) => {
  if (!comp_or) {
  comp_or = $_seq([
    [comp_seq||rule_seq,'head'],
    [$_star($_seq([
      [comp__||rule__],
      [$_char(/^[|/]/)],
      [comp__||rule__],
      [comp_seq||rule_seq,'seq']
    ], ({seq}) => {
    return seq 
    })),'tail']
  ], ({head,tail}) => {
  if(!tail.length) return head; 
      return `$_or([${indent([head].concat(tail).join(',\n'))}])`
  
  })
  }
  return comp_or(S);
  }
  var comp_def; 
  const rule_def = (S) => {
  if (!comp_def) {
  comp_def = $_seq([
    [comp__||rule__],
    [comp_ident||rule_ident,'ident'],
    [comp__||rule__],
    [$_token("=",false)],
    [comp__||rule__],
    [comp_or||rule_or,'or'],
    [comp_eol||rule_eol]
  ], ({ident,or}) => {
  return {name:ident,rule:or}
  
  })
  }
  return comp_def(S);
  }
  var comp_defs; 
  const rule_defs = (S) => {
  if (!comp_defs) {
  comp_defs = $_seq([
    [$_plus(comp_def||rule_def),'defs']
  ], ({defs}) => {
  var methods = defs.map(def=>{
  	  return `var comp_${def.name}; 
  const rule_${def.name} = (S) => {
  if (!comp_${def.name}) {
  comp_${def.name} = ${def.rule}
  }
  return comp_${def.name}(S);
  }`
    }).reverse();
    
    methods.push(`function $_start(S) {\n  return rule_${defs[0].name}(S)\n}`)
    
    return indent(methods.join('\n'))
  
  })
  }
  return comp_defs(S);
  }
  var comp_grammar; 
  const rule_grammar = (S) => {
  if (!comp_grammar) {
  comp_grammar = $_seq([
    [$_maybe(comp_action||rule_action),'intro'],
    [comp__||rule__],
    [comp_defs||rule_defs,'defs']
  ], ({intro,defs}) => {
  return '\n'+(intro||'') + '\n' + defs;
  
  })
  }
  return comp_grammar(S);
  }
  function $_start(S) {
    return rule_grammar(S)
  }
/*###SPLIT###*/

  return {parse:$_parse}
};

module.exports = {Parser,toSource};

function Parser (grammar,options){
  var src = toSource(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function toSource (grammar,options) {
  var src = redesParser().parse(grammar);
  var parts = redesParser.toString().split('/*###SPLIT###*/') 
  parts[1] = src;
  return parts.join('/*###SPLIT###*/');
}
