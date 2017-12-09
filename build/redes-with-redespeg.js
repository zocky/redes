'use strict';
const redesParser = function Redes() {
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  const Parser = {parse:$_parse}

  function $_parse(text="",{ast=false,loc=false}={}) {
    var _pos = 0;
    const _location={line:1,col:1};
    const $state = { 
      get $loc() {
        if (_pos!==state.pos) {
          const lines = state.text.slice(0,state.pos).split(/\n/);
          _location.line = lines.length+1;
          _location.column = lines[lines.length-1].length+1;
          _pos=state.pos;
        }
        return _location;
      },
      get $line() {
        return $state.$location.line;
      },
      get $col() {
        return $state.$location.col;
      }
    }
    const state = {
      ast,
      loc,
      text,
      pos: 0,
      $: $state
    }
    var res = $_start(state);
    if (state.pos!==text.length) {
      throw new Error(`Syntax error at [${$state.$line}:${$state.$col}]: ${text.substr(text,20)}`)
    }
    return res[0];
  }
  

  const $_literal = (chars="") => {
  	return (S)=> (
        S.text.substr(S.pos,chars.length) === chars
        && (S.pos+=chars.length,[chars])
    )
  }
  const $_iliteral= (chars)=> {
  	return (S)=>{
      const tchars = S.text.substr(S.pos,chars.length)
      if(tchars.toLowerCase() === chars) {
        S.pos+=chars.length;
        return ([tchars]);
      }
    }
  }
  const $_char=(re)=> {
  	return (S)=>{ 
      const char = S.text.charAt(S.pos);
      return re.test(char) && (S.pos++,[char]);
    }
  }
  const $_dot=() =>{
  	return (S) => S.pos < S.text.length && [S.text.charAt(S.pos++)];
  }
  const $_seq=(args,action) =>{
  	return (S)=>{ 
      const pos=S.pos;
      const ret = {};
      for (const [fn,name] of args) {
        switch(name) {
        case '!':
          const bpos = S.pos;
          const bres = fn(S,ret)
          if (bres) return (S.pos=pos,false);  
          S.pos = lpos; 
          break;
        case "&": 
          const apos = S.pos;
          const ares = fn(S,ret)
          if (!ares) return (S.pos=pos,false);  
          S.pos = apos; 
        default:
          const res = fn(S)
          if(!res) return (S.pos=pos,false);
          if(name) ret[name] = res[0];
        }
      }
      if (!S.ast && action) return [action(S.$,ret)];
      if(S.loc) ret.$loc = S.$.$loc;
      return [ret];
    }
  }
  const $_or=(args)=> {
  	return (S)=>{ 
      for (const arg of args) {
      	const res = arg(S);
        if (res) return (res);
      }
      return false
    }
  }
  const $_dollar=(arg)=> {
  	return (S)=>{
    	const pos = S.pos;
      return arg(S) && [S.text.slice(pos,S.pos)];
    }
  }
  const $_amp=(arg)=> {
  	return (S)=>{
    	const pos = S.pos, res = arg(S);
      S.pos = pos;
      return res;
    }
  }
  const $_bang=(arg)=> {
  	return (S)=>{
    	const pos=S.pos, res = arg(S);
      S.pos = pos;
      return res ? false : [];
    }
  }
  const $_plus=(arg) =>{
  	return (S)=>{
      const ret=[]; var res;
      while(res=arg(S)) ret.push(res[0]);
      return ret.length && [ret];
    }   
  }
  const $_maybe=(arg) =>{
  	return (S)=>{
      return arg(S) || [];
    }   
  }
  const $_star=(arg)=> {
    return (S)=>{
      var ret=[], res;
      while(res=arg(S)) ret.push(res[0]);
      return [ret];
    }   
  }
  
  /*###SPLIT###*/function indent (t) {
    	return "\n  "+t.replace(/\n/g,'\n  ')+"\n";
    }

	function str (str) { return JSON.stringify(String(str)) ;}
    
    function actionFn(names,action) {
     var actionArgs = `(state,{${names.join(',')}})`;
        try {
          var fn = new Function(`return(${action})`);
          var actionFn = `${actionArgs}=>(${action})`;
        } catch (err) {
          try {
            var fn = new Function(action);
            var actionFn = `${actionArgs}=>{${action}}`;
          } catch (err) {
            throw err
          }
        }
        return actionFn
    }
    const ops = {
      'literal':  ({literal})    =>  `$_literal(${str(literal)})`,
      'iliteral': ({literal})    =>  `$_iliteral(${str(literal)})`,
      'match':  ({char})     =>  `$_char(/[${char}]/)`,
      'imatch': ({char})     =>  `$_char(/[${char}]/i)`,
      'dot':    ()           =>  `$_dot()`,
      'dollar': ({child})    =>  `$_dollar(${proc(child)})`,
      'star':   ({child})    =>  `$_star(${proc(child)})`,
      'plus':   ({child})    =>  `$_plus(${proc(child)})`,
      'maybe':  ({child})    =>  `$_maybe(${proc(child)})`,
      'bang':   ({child})    =>  `$_bang(${proc(child)})`,
      'amp':    ({child})    =>  `$_amp(${proc(child)})`,
      'rule':   ({rule})     =>  {
        //if (!ruleNames.includes(rule)) error( 'Unknown rule '+rule);
        ruleDeps[curRule][rule]=true;
        if (compiledRules[rule]) return `comp_${rule}`;
      	return `(comp_${rule}||rule_${rule})`
       },
      'or':     ({children}) =>  `$_or([${children.map(proc).join(',\n')}])`,
      'seq':    ({children,action}) => {
        var names = [];
        var args = children.map(({op,name,child})=>{
          if (op) return `[${actionFn(names,child)},'${op}']`;
          if (!name) return `[${proc(child)}]`
          names.push(name);
          return `[${proc(child)},${str(name)}]`;
        })
		if (!action) return `$_seq([${args.join(',\n')}])`;
        var fn = actionFn(names,action);
        return `$_seq([${args.join(',\n')}],${fn})`;
      },
      'grammar': ({intro,defs}) => {
      	ruleNames = defs.map(def=>def.name);
        defs.reverse();
        ruleDeps = {};
        var done = {};
        compiledRules={};
        var rules = defs.map(def=>{
          curRule = def.name;
          var curDeps = ruleDeps[curRule]={};
          var procDef = proc(def.def);
          
          var futureDep = false;
          for (var d in curDeps) {
            if(!done[d]) {
              futureDep = true;
              break;
            }
          }
          done[curRule] = true;
          if (!futureDep) {
            compiledRules[def.name] = true;
            return `const comp_${def.name}=${procDef};`
          }
  		    return `var comp_${def.name}; const rule_${def.name}=(S)=>(comp_${def.name}||(comp_${def.name}=\n${procDef}))(S)`
        });
        //console.log(ruleDeps)
        return `${intro||''}\n\n${rules.join('\n')}\nconst $_start=(comp_${ruleNames[0]}||rule_${ruleNames[0]})`;
      }
    };
    var curRule;
    var ruleDeps;
    var ruleNames;
    var compiledRules;
    function proc(node) {
    	if (Array.isArray(node)) return node.map(n=>proc(n));
        if (!node || !node.$) return node;
    	if (ops[node.$]) {
        	return ops[node.$](node);
        } else {
          var ret = {$:node.$};
          for (var i in node) {
            if (i=='$') continue;
            ret[i]=proc(node[i]);
          }
          return ret;
        }
    }


const comp_ws=$_or([$_char(/[ \n\t\r]/),
$_seq([[$_literal("//")],
[$_star($_char(/[^\n]/))],
[$_literal("\n")]]),
$_seq([[$_literal("/*")],
[$_star($_seq([[$_bang($_literal("*/"))],
[$_dot()]]))],
[$_literal("*/")]])]);
const comp___=$_plus(comp_ws);
const comp__=$_star(comp_ws);
const comp_eol=$_or([$_plus($_seq([[comp__],
[$_literal("\n")]])),
$_seq([[comp__],
[$_bang($_literal("."))]])]);
const comp_ident=$_dollar($_plus($_seq([[$_char(/[a-z_]/i)],
[$_star($_char(/[a-z0-9]/i))]])));
var comp_template_chunk; const rule_template_chunk=(S)=>(comp_template_chunk||(comp_template_chunk=
$_or([$_dollar($_literal("\\$")),
$_dollar($_seq([[$_literal("$")],
[(comp_block||rule_block)]])),
$_dollar($_plus($_char(/[^$`]/))),
$_seq([[$_literal("$")],
[$_bang($_literal("{"))]])])))(S)
const comp_template=$_dollar($_seq([[$_literal("`")],
[$_star((comp_template_chunk||rule_template_chunk))],
[$_literal("`")]]));
var comp_block_chunk; const rule_block_chunk=(S)=>(comp_block_chunk||(comp_block_chunk=
$_or([$_dollar($_plus($_char(/[^'"{}`]/))),
$_dollar($_seq([[$_literal("'")],
[$_star($_or([$_literal("\\'"),
$_char(/[^\n']/)]))],
[$_literal("'")]])),
$_dollar($_seq([[$_literal("\"")],
[$_star($_or([$_literal("\\\""),
$_char(/[^\n"]/)]))],
[$_literal("\"")]])),
comp_template,
$_dollar((comp_block||rule_block))])))(S)
const comp_block=$_seq([[$_literal("{")],
[comp__],
[$_star((comp_block_chunk||rule_block_chunk)),"chunks"],
[comp__],
[$_literal("}")]],(state,{chunks})=>{return chunks.join('') });
const comp_dot=$_seq([[$_literal("."),"dot"]],(state,{dot})=>{return {$:'dot'}
});
const comp_match=$_seq([[$_literal("[")],
[$_dollar($_plus($_or([$_literal("\\]"),
$_char(/[^\]]/)]))),"char"],
[$_literal("]")],
[$_maybe($_literal("i")),"i"]],(state,{char,i})=>{if (i) return {$:'imatch',char};
  return {$:'match',char}
});
const comp_hex=$_char(/[0-9A-Fa-f]/);
const comp_special=$_or([$_seq([[$_literal("\\b"),"match"]],(state,{match})=>{return '\\u0008' }),
$_seq([[$_literal("\\t"),"match"]],(state,{match})=>{return '\\u0009' }),
$_literal("\\n"),
$_seq([[$_literal("\\v"),"match"]],(state,{match})=>{return '\\u000B' }),
$_seq([[$_literal("\\f"),"match"]],(state,{match})=>{return '\\u000C' }),
$_seq([[$_literal("\\r"),"match"]],(state,{match})=>{return '\\u000D' }),
$_seq([[$_literal("\\")],
[$_seq([[comp_hex],
[$_maybe(comp_hex)],
[$_maybe(comp_hex)]]),"d"]],(state,{d})=>{return '\\u'+ d.join('').parseInt(8).toString(16).padStart(4,'0')}),
$_seq([[$_literal("\\u")],
[$_seq([[comp_hex],
[comp_hex],
[comp_hex],
[comp_hex]]),"u"]],(state,{u})=>{return '\\u'+u.join(''); }),
$_literal("\\\\")]);
const comp_cliteral2=$_or([$_literal("\\\""),
comp_special,
$_char(/[^"]/)]);
const comp_literal2=$_seq([[$_char(/[""]/)],
[$_plus(comp_cliteral2),"literal"],
[$_char(/[""]/)]],(state,{literal})=>{return literal.join('') });
const comp_cliteral1=$_or([$_seq([[$_literal("\\'"),"match"]],(state,{match})=>{return "'" }),
$_seq([[$_literal("\""),"match"]],(state,{match})=>{return '\\"' }),
comp_special,
$_char(/[^']/)]);
const comp_literal1=$_seq([[$_char(/['']/)],
[$_plus(comp_cliteral1),"literal"],
[$_char(/['']/)]],(state,{literal})=>{return literal.join('') });
const comp_literal=$_seq([[$_or([comp_literal1,
comp_literal2]),"literal"],
[$_maybe($_literal("i")),"i"]],(state,{literal,i})=>{try {
    let str = JSON.parse(`"${literal}"`)
    if (i) return {$:'iliteral',literal:str};
    return {$:'literal',literal:str};
  } catch (err) {
    error(err);
  }
});
var comp_atom; const rule_atom=(S)=>(comp_atom||(comp_atom=
$_or([comp_literal,
comp_match,
comp_dot,
(comp_rule||rule_rule),
$_seq([[$_literal("(")],
[comp__],
[(comp_or||rule_or),"or"],
[comp__],
[$_literal(")")]],(state,{or})=>{return or })])))(S)
const comp_plus=$_seq([[(comp_atom||rule_atom),"child"],
[comp__],
[$_literal("+")]],(state,{child})=>{return {$:'plus',child}
});
const comp_star=$_seq([[(comp_atom||rule_atom),"child"],
[comp__],
[$_literal("*")]],(state,{child})=>{return {$:'star',child}
});
const comp_maybe=$_seq([[(comp_atom||rule_atom),"child"],
[comp__],
[$_literal("?")]],(state,{child})=>{return {$:'maybe',child}
});
const comp_rule=$_seq([[comp_ident,"rule"],
[$_bang($_seq([[comp__],
[$_maybe(comp_literal)],
[comp__],
[$_literal("=")]]))]],(state,{rule})=>{return {$:'rule',rule}; 
});
const comp_bit=$_or([comp_star,
comp_plus,
comp_maybe,
(comp_atom||rule_atom)]);
const comp_piece=$_or([$_seq([[$_literal("!")],
[comp_bit,"child"]],(state,{child})=>{return {$:'bang',child}
}),
$_seq([[$_literal("&")],
[comp_bit,"child"]],(state,{child})=>{return {$:'amp',child}
}),
$_seq([[$_literal("$")],
[comp_bit,"child"]],(state,{child})=>{return {$:'dollar',child}
}),
comp_bit]);
const comp_anon_chunk=$_seq([[comp_piece,"child"]],(state,{child})=>{return {child}
});
const comp_named_chunk=$_seq([[comp_ident,"name"],
[comp__],
[$_literal(":")],
[comp__],
[comp_piece,"child"]],(state,{name,child})=>{return {name,child}
});
var comp_predicate; const rule_predicate=(S)=>(comp_predicate||(comp_predicate=
$_seq([[$_char(/[!&]/),"op"],
[comp__],
[(comp_action||rule_action),"child"]],(state,{op,child})=>{return {op,child} 
})))(S)
const comp_chunk=$_or([comp_named_chunk,
comp_anon_chunk,
(comp_predicate||rule_predicate)]);
const comp_action=$_seq([[comp__],
[comp_block,"block"]],(state,{block})=>{return block });
const comp_seq=$_or([$_seq([[$_or([$_seq([[comp_chunk,"head"],
[$_plus($_seq([[comp___],
[comp_chunk,"chunk"]],(state,{chunk})=>{return chunk })),"tail"]],(state,{head,tail})=>{return [head].concat(tail)}),
$_seq([[comp_named_chunk,"chunk"]],(state,{chunk})=>{return [chunk] })]),"children"],
[$_maybe(comp_action),"action"]],(state,{children,action})=>{return {$:'seq',children,action}
}),
$_seq([[comp_piece,"piece"],
[comp_action,"action"]],(state,{piece,action})=>{return {$:'seq',children:[{name:'match',child:piece}],action};
}),
comp_piece]);
const comp_or=$_seq([[comp_seq,"head"],
[$_star($_seq([[comp__],
[$_char(/[|/]/)],
[comp__],
[comp_seq,"seq"]],(state,{seq})=>{return seq })),"tail"]],(state,{head,tail})=>{if(!tail.length) return head;
    return {$:'or',children:[head].concat(tail)};
});
const comp_def_head=$_seq([[comp_ident,"name"],
[comp__],
[$_maybe(comp_literal),"description"],
[comp__],
[$_literal("=")]],(state,{name,description})=>{return {name,description}
});
const comp_def=$_seq([[comp__],
[comp_def_head,"head"],
[comp__],
[comp_or,"def"],
[comp_eol]],(state,{head,def})=>{return {$:'def',name:head.name,def}
});
const comp_grammar=$_seq([[$_maybe(comp_action),"intro"],
[comp__],
[$_plus(comp_def),"defs"]],(state,{intro,defs})=>{return {$:'grammar',intro,defs};
});
const comp_proc=$_seq([[comp_grammar,"grammar"],
[comp__],
[$_bang($_dot())]],(state,{grammar})=>{return proc(grammar);
});
const $_start=(comp_proc||rule_proc)/*###SPLIT###*/

  return Parser;
};
const redesBase = '###REDESBASE###';

module.exports =  {Parser,generate};

function Parser (grammar,options){
  var src = generate(grammar);
  var fn = new Function('','return '+src);
  return fn()();
}

function generate (grammar,{format='bare',export:exportVar=null}={}) {
  var src = redesParser().parse(grammar);
  var parts = redesParser.toString().split('/*###SPLIT###*/') 
  parts[1] = src;
  src = parts.join('/*###SPLIT###*/');

  switch(format) {
    case 'bare': return src;
    case 'require': return exportVar ? `exports.${exportVar}=${src}` : `module.exports=${src}`;  
    case 'import': return exportVar ? `export const ${exportVar}=${src}` : `export default ${src}`;
    case 'global': return `(typeof global!=='undefined'?global:window).${exportVar||'Parser'}=${src}`;
    default: throw new Error('Format must be bare, require, import or cli');
  }
}
