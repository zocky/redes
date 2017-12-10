'use strict';
const redesParser = function Redes() {
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  const Parser = {parse:R$PARSE}

  function R$PARSE(text="",{ast=false,loc=false}={}) {
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
        return $state.$loc.line;
      },
      get $col() {
        return $state.$loc.col;
      }
    }
    const state = {
      expected:[],
      expect_pos:0,
      ast,
      loc,
      text,
      pos: 0,
      $: $state
    }
    var res = R$START(state);
    if (state.pos!==text.length) {
      throw new Error(`Syntax error at [${$state.$line}:${$state.$col}]: ${text.substr(text,20)}, expected one of ${state.expected}`)
    }
    return res[0];
  }

  const R$X = (expect,child) => {
    return (S) => {
      var res=child;
      if (res) {
        S.expected = [];
        S.expect_pos = S.pos
      } else {
        S.expected.push(expect);
      }
      return res;
    }
  }

  const R$L = (chars="") => {
  	return (S)=> (
        S.text.substr(S.pos,chars.length) === chars
        && (S.pos+=chars.length,[chars])
    )
  }
  const R$I= (chars)=> {
  	return (S)=>{
      const tchars = S.text.substr(S.pos,chars.length)
      if(tchars.toLowerCase() === chars) {
        S.pos+=chars.length;
        return ([tchars]);
      }
    }
  }
  const R$C=(re)=> {
  	return (S)=>{ 
      const char = S.text.charAt(S.pos);
      return re.test(char) && (S.pos++,[char]);
    }
  }
  const R$D=() =>{
  	return (S) => S.pos < S.text.length && [S.text.charAt(S.pos++)];
  }
  const R$Q=(args,action) =>{
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
  const R$O=(args)=> {
  	return (S)=>{ 
      for (const arg of args) {
      	const res = arg(S);
        if (res) return (res);
      }
      return false
    }
  }
  const R$T=(arg)=> {
  	return (S)=>{
    	const pos = S.pos;
      return arg(S) && [S.text.slice(pos,S.pos)];
    }
  }
  const R$A=(arg)=> {
  	return (S)=>{
    	const pos = S.pos, res = arg(S);
      S.pos = pos;
      return res;
    }
  }
  const R$B=(arg)=> {
  	return (S)=>{
    	const pos=S.pos, res = arg(S);
      S.pos = pos;
      return res ? false : [];
    }
  }
  const R$P=(arg) =>{
  	return (S)=>{
      const ret=[]; var res;
      while(res=arg(S)) ret.push(res[0]);
      return ret.length && [ret];
    }   
  }
  const R$M=(arg) =>{
  	return (S)=>{
      return arg(S) || [];
    }   
  }
  const R$S=(arg)=> {
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
      'literal':  ({literal})    =>  `R$L(${str(literal)})`,
      'iliteral': ({literal})    =>  `R$I(${str(literal)})`,
      'match':  ({char})     =>  `R$C(/[${char}]/)`,
      'imatch': ({char})     =>  `R$C(/[${char}]/i)`,
      'dot':    ()           =>  `R$D()`,
      'dollar': ({child})    =>  `R$T(${proc(child)})`,
      'star':   ({child})    =>  `R$S(${proc(child)})`,
      'plus':   ({child})    =>  `R$P(${proc(child)})`,
      'maybe':  ({child})    =>  `R$M(${proc(child)})`,
      'bang':   ({child})    =>  `R$B(${proc(child)})`,
      'amp':    ({child})    =>  `R$A(${proc(child)})`,
      'rule':   ({rule})     =>  {
        //if (!ruleNames.includes(rule)) error( 'Unknown rule '+rule);
        ruleDeps[curRule][rule]=true;
        if (compiledRules[rule]) return `R$$_${rule}`;
      	return `(R$$_${rule}||R$_${rule})`
       },
      'or':     ({children}) =>  `R$O([${children.map(proc).join(',')}])`,
      'seq':    ({children,action}) => {
        var names = [];
        var args = children.map(({op,name,child})=>{
          if (op) return `[${actionFn(names,child)},'${op}']`;
          if (!name) return `[${proc(child)}]`
          names.push(name);
          return `[${proc(child)},${str(name)}]`;
        })
		if (!action) return `R$Q([${args.join(',')}])`;
        var fn = actionFn(names,action);
        return `R$Q([${args.join(',')}],${fn})`;
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
            return `const R$$_${def.name}=${procDef};`
          }
  		    return `var R$$_${def.name}; const R$_${def.name}=(S)=>(R$$_${def.name}||(R$$_${def.name}=\n${procDef}))(S)`
        });
        //console.log(ruleDeps)
        return `${intro||''}\n\n${rules.join('\n')}\nconst R$START=(R$$_${ruleNames[0]}||R$_${ruleNames[0]})`;
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


const R$$_ws=R$O([R$C(/[ \n\t\r]/),R$Q([[R$L("//")],[R$S(R$C(/[^\n]/))],[R$L("\n")]]),R$Q([[R$L("/*")],[R$S(R$Q([[R$B(R$L("*/"))],[R$D()]]))],[R$L("*/")]])]);
const R$$___=R$P(R$$_ws);
const R$$__=R$S(R$$_ws);
const R$$_eol=R$O([R$P(R$Q([[R$$__],[R$L("\n")]])),R$Q([[R$$__],[R$B(R$L("."))]])]);
const R$$_ident=R$T(R$P(R$Q([[R$C(/[a-z_]/i)],[R$S(R$C(/[a-z0-9]/i))]])));
var R$$_template_chunk; const R$_template_chunk=(S)=>(R$$_template_chunk||(R$$_template_chunk=
R$O([R$T(R$L("\\$")),R$T(R$Q([[R$L("$")],[(R$$_block||R$_block)]])),R$T(R$P(R$C(/[^$`]/))),R$Q([[R$L("$")],[R$B(R$L("{"))]])])))(S)
const R$$_template=R$T(R$Q([[R$L("`")],[R$S((R$$_template_chunk||R$_template_chunk))],[R$L("`")]]));
var R$$_block_chunk; const R$_block_chunk=(S)=>(R$$_block_chunk||(R$$_block_chunk=
R$O([R$T(R$P(R$C(/[^'"{}`]/))),R$T(R$Q([[R$L("'")],[R$S(R$O([R$L("\\'"),R$C(/[^\n']/)]))],[R$L("'")]])),R$T(R$Q([[R$L("\"")],[R$S(R$O([R$L("\\\""),R$C(/[^\n"]/)]))],[R$L("\"")]])),R$$_template,R$T((R$$_block||R$_block))])))(S)
const R$$_block=R$Q([[R$L("{")],[R$$__],[R$S((R$$_block_chunk||R$_block_chunk)),"chunks"],[R$$__],[R$L("}")]],(state,{chunks})=>{return chunks.join('') });
const R$$_dot=R$Q([[R$L("."),"dot"]],(state,{dot})=>{return {$:'dot'}
});
const R$$_match=R$Q([[R$L("[")],[R$T(R$P(R$O([R$L("\\]"),R$C(/[^\]]/)]))),"char"],[R$L("]")],[R$M(R$L("i")),"i"]],(state,{char,i})=>{if (i) return {$:'imatch',char};
  return {$:'match',char}
});
const R$$_hex=R$C(/[0-9A-Fa-f]/);
const R$$_special=R$O([R$Q([[R$L("\\b"),"match"]],(state,{match})=>{return '\\u0008' }),R$Q([[R$L("\\t"),"match"]],(state,{match})=>{return '\\u0009' }),R$L("\\n"),R$Q([[R$L("\\v"),"match"]],(state,{match})=>{return '\\u000B' }),R$Q([[R$L("\\f"),"match"]],(state,{match})=>{return '\\u000C' }),R$Q([[R$L("\\r"),"match"]],(state,{match})=>{return '\\u000D' }),R$Q([[R$L("\\")],[R$Q([[R$$_hex],[R$M(R$$_hex)],[R$M(R$$_hex)]]),"d"]],(state,{d})=>{return '\\u'+ d.join('').parseInt(8).toString(16).padStart(4,'0')}),R$Q([[R$L("\\u")],[R$Q([[R$$_hex],[R$$_hex],[R$$_hex],[R$$_hex]]),"u"]],(state,{u})=>{return '\\u'+u.join(''); }),R$L("\\\\")]);
const R$$_cliteral2=R$O([R$L("\\\""),R$$_special,R$C(/[^"]/)]);
const R$$_literal2=R$Q([[R$C(/[""]/)],[R$P(R$$_cliteral2),"literal"],[R$C(/[""]/)]],(state,{literal})=>{return literal.join('') });
const R$$_cliteral1=R$O([R$Q([[R$L("\\'"),"match"]],(state,{match})=>{return "'" }),R$Q([[R$L("\""),"match"]],(state,{match})=>{return '\\"' }),R$$_special,R$C(/[^']/)]);
const R$$_literal1=R$Q([[R$C(/['']/)],[R$P(R$$_cliteral1),"literal"],[R$C(/['']/)]],(state,{literal})=>{return literal.join('') });
const R$$_literal=R$Q([[R$O([R$$_literal1,R$$_literal2]),"literal"],[R$M(R$L("i")),"i"]],(state,{literal,i})=>{try {
    let str = JSON.parse(`"${literal}"`)
    if (i) return {$:'iliteral',literal:str};
    return {$:'literal',literal:str};
  } catch (err) {
    error(err);
  }
});
var R$$_atom; const R$_atom=(S)=>(R$$_atom||(R$$_atom=
R$O([R$$_literal,R$$_match,R$$_dot,(R$$_rule||R$_rule),R$Q([[R$L("(")],[R$$__],[(R$$_or||R$_or),"or"],[R$$__],[R$L(")")]],(state,{or})=>{return or })])))(S)
const R$$_plus=R$Q([[(R$$_atom||R$_atom),"child"],[R$$__],[R$L("+")]],(state,{child})=>{return {$:'plus',child}
});
const R$$_star=R$Q([[(R$$_atom||R$_atom),"child"],[R$$__],[R$L("*")]],(state,{child})=>{return {$:'star',child}
});
const R$$_maybe=R$Q([[(R$$_atom||R$_atom),"child"],[R$$__],[R$L("?")]],(state,{child})=>{return {$:'maybe',child}
});
const R$$_rule=R$Q([[R$$_ident,"rule"],[R$B(R$Q([[R$$__],[R$M(R$$_literal)],[R$$__],[R$L("=")]]))]],(state,{rule})=>{return {$:'rule',rule}; 
});
const R$$_bit=R$O([R$$_star,R$$_plus,R$$_maybe,(R$$_atom||R$_atom)]);
const R$$_piece=R$O([R$Q([[R$L("!")],[R$$_bit,"child"]],(state,{child})=>{return {$:'bang',child}
}),R$Q([[R$L("&")],[R$$_bit,"child"]],(state,{child})=>{return {$:'amp',child}
}),R$Q([[R$L("$")],[R$$_bit,"child"]],(state,{child})=>{return {$:'dollar',child}
}),R$$_bit]);
const R$$_anon_chunk=R$Q([[R$$_piece,"child"]],(state,{child})=>{return {child}
});
const R$$_named_chunk=R$Q([[R$$_ident,"name"],[R$$__],[R$L(":")],[R$$__],[R$$_piece,"child"]],(state,{name,child})=>{return {name,child}
});
var R$$_predicate; const R$_predicate=(S)=>(R$$_predicate||(R$$_predicate=
R$Q([[R$C(/[!&]/),"op"],[R$$__],[(R$$_action||R$_action),"child"]],(state,{op,child})=>{return {op,child} 
})))(S)
const R$$_chunk=R$O([R$$_named_chunk,R$$_anon_chunk,(R$$_predicate||R$_predicate)]);
const R$$_action=R$Q([[R$$__],[R$$_block,"block"]],(state,{block})=>{return block });
const R$$_seq=R$O([R$Q([[R$O([R$Q([[R$$_chunk,"head"],[R$P(R$Q([[R$$___],[R$$_chunk,"chunk"]],(state,{chunk})=>{return chunk })),"tail"]],(state,{head,tail})=>{return [head].concat(tail)}),R$Q([[R$$_named_chunk,"chunk"]],(state,{chunk})=>{return [chunk] })]),"children"],[R$M(R$$_action),"action"]],(state,{children,action})=>{return {$:'seq',children,action}
}),R$Q([[R$$_piece,"piece"],[R$$_action,"action"]],(state,{piece,action})=>{return {$:'seq',children:[{name:'match',child:piece}],action};
}),R$$_piece]);
const R$$_or=R$Q([[R$$_seq,"head"],[R$S(R$Q([[R$$__],[R$C(/[|/]/)],[R$$__],[R$$_seq,"seq"]],(state,{seq})=>{return seq })),"tail"]],(state,{head,tail})=>{if(!tail.length) return head;
    return {$:'or',children:[head].concat(tail)};
});
const R$$_def_head=R$Q([[R$$_ident,"name"],[R$$__],[R$M(R$$_literal),"description"],[R$$__],[R$L("=")]],(state,{name,description})=>{return {name,description}
});
const R$$_def=R$Q([[R$$__],[R$$_def_head,"head"],[R$$__],[R$$_or,"def"],[R$$_eol]],(state,{head,def})=>{return {$:'def',name:head.name,def}
});
const R$$_grammar=R$Q([[R$M(R$$_action),"intro"],[R$$__],[R$P(R$$_def),"defs"]],(state,{intro,defs})=>{return {$:'grammar',intro,defs};
});
const R$$_proc=R$Q([[R$$_grammar,"grammar"],[R$$__],[R$B(R$D())]],(state,{grammar})=>{return proc(grammar);
});
const R$START=(R$$_proc||R$_proc)/*###SPLIT###*/

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
