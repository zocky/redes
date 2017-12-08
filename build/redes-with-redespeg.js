'use strict';

const redesParser = function redes() {
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  function $_parse(text="") {
    var state = {
      text: text,
      pos: 0,
    }
    var res = $_start(state);
    if (state.pos!==text.length) {
      var lines = state.text.slice(0,state.pos).split(/\n/);
      var line = lines.length;
      var col = lines.pop().length+1;
      throw new Error(`Syntax error at [${line}:${col}]: ${text.substr(text,20)}`)
    }
    return res[0];
  }
  
  const $_token = (chars="") => {
  	return (S)=> (
        S.text.substr(S.pos,chars.length) === chars
        && (S.pos+=chars.length,[chars])
    )
  }
  const $_itoken= (chars)=> {
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
      for (const arg of args) {
      	const res = arg[0](S);
        if(!res) return (S.pos=pos,false);
        if(arg[1]) ret[arg[1]] = res[0];
      }
      return action ? [action(ret)] : [ret];
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
    const ops = {
      'token':  ({token})    =>  `$_token(${str(token)})`,
      'itoken': ({token})    =>  `$_itoken(${str(token)})`,
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
        if (!ruleNames.includes(rule)) error( 'Unknown rule '+rule);
      	return `(comp_${rule}||rule_${rule})`
       },
      'or':     ({children}) =>  `$_or([${children.map(proc).join(',\n')}])`,
      'seq':    ({children,action}) => {
        var names = [];
        var args = children.map(({name,child})=>{
          if (!name) return `[${proc(child)}]`
          names.push(name);
          return `[${proc(child)},${str(name)}]`;
        })
		if (!action) return `$_seq([${args.join(',\n')}])`;
        var actionArgs = `({${names.join(',')}})`;
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
        return `$_seq([${args.join(', ')}],${actionFn})`;
      },
      'def':   ({name,def}) => {
		return `var comp_${name}; const rule_${name}=(S)=>(comp_${name}||(comp_${name}=${proc(def)}))(S)`
      },
      'grammar': ({intro,defs}) => {
      	ruleNames = defs.map(def=>def.name);
        var rules = defs.map(proc);
        return `${intro}\n\n${rules.join('\n')}\nconst $_start=rule_${defs[0].name}`;
      }
    };
    var ruleNames;
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


var comp_proc; const rule_proc=(S)=>(comp_proc||(comp_proc=$_seq([[(comp_grammar||rule_grammar),"grammar"], [(comp__||rule__)], [$_bang($_dot())]],({grammar})=>{return proc(grammar);
})))(S)
var comp_grammar; const rule_grammar=(S)=>(comp_grammar||(comp_grammar=$_seq([[$_maybe((comp_action||rule_action)),"intro"], [(comp__||rule__)], [$_plus((comp_def||rule_def)),"defs"]],({intro,defs})=>{return {$:'grammar',intro,defs};
})))(S)
var comp_def; const rule_def=(S)=>(comp_def||(comp_def=$_seq([[(comp__||rule__)], [(comp_ident||rule_ident),"name"], [(comp__||rule__)], [$_token("=")], [(comp__||rule__)], [(comp_or||rule_or),"def"], [(comp_eol||rule_eol)]],({name,def})=>{return {$:'def',name,def}
})))(S)
var comp_or; const rule_or=(S)=>(comp_or||(comp_or=$_seq([[(comp_seq||rule_seq),"head"], [$_star($_seq([[(comp__||rule__)], [$_char(/[|/]/)], [(comp__||rule__)], [(comp_seq||rule_seq),"seq"]],({seq})=>{return seq })),"tail"]],({head,tail})=>{if(!tail.length) return head;
    return {$:'or',children:[head].concat(tail)};
})))(S)
var comp_seq; const rule_seq=(S)=>(comp_seq||(comp_seq=$_or([$_seq([[$_or([$_seq([[(comp_chunk||rule_chunk),"head"], [$_plus($_seq([[(comp___||rule___)], [(comp_chunk||rule_chunk),"chunk"]],({chunk})=>{return chunk })),"tail"]],({head,tail})=>{return [head].concat(tail)}),
$_seq([[(comp_named_chunk||rule_named_chunk),"chunk"]],({chunk})=>{return [chunk] })]),"children"], [$_maybe((comp_action||rule_action)),"action"]],({children,action})=>{return {$:'seq',children,action}
}),
$_seq([[(comp_piece||rule_piece),"piece"], [(comp_action||rule_action),"action"]],({piece,action})=>{return {$:'seq',children:[{name:'match',child:piece}],action};
}),
(comp_piece||rule_piece)])))(S)
var comp_action; const rule_action=(S)=>(comp_action||(comp_action=$_seq([[(comp__||rule__)], [(comp_block||rule_block),"block"]],({block})=>{return block })))(S)
var comp_chunk; const rule_chunk=(S)=>(comp_chunk||(comp_chunk=$_or([(comp_named_chunk||rule_named_chunk),
(comp_anon_chunk||rule_anon_chunk)])))(S)
var comp_named_chunk; const rule_named_chunk=(S)=>(comp_named_chunk||(comp_named_chunk=$_seq([[(comp_ident||rule_ident),"name"], [(comp__||rule__)], [$_token(":")], [(comp__||rule__)], [(comp_piece||rule_piece),"child"]],({name,child})=>{return {name,child}
})))(S)
var comp_anon_chunk; const rule_anon_chunk=(S)=>(comp_anon_chunk||(comp_anon_chunk=$_seq([[(comp_piece||rule_piece),"child"]],({child})=>{return {child}
})))(S)
var comp_piece; const rule_piece=(S)=>(comp_piece||(comp_piece=$_or([$_seq([[$_token("!")], [(comp_bit||rule_bit),"child"]],({child})=>{return {$:'bang',child}
}),
$_seq([[$_token("&")], [(comp_bit||rule_bit),"child"]],({child})=>{return {$:'amp',child}
}),
$_seq([[$_token("$")], [(comp_bit||rule_bit),"child"]],({child})=>{return {$:'dollar',child}
}),
(comp_bit||rule_bit)])))(S)
var comp_bit; const rule_bit=(S)=>(comp_bit||(comp_bit=$_or([(comp_star||rule_star),
(comp_plus||rule_plus),
(comp_maybe||rule_maybe),
(comp_atom||rule_atom)])))(S)
var comp_rule; const rule_rule=(S)=>(comp_rule||(comp_rule=$_seq([[$_bang((comp_def||rule_def))], [(comp_ident||rule_ident),"rule"]],({rule})=>{return {$:'rule',rule}; 
})))(S)
var comp_maybe; const rule_maybe=(S)=>(comp_maybe||(comp_maybe=$_seq([[(comp_atom||rule_atom),"child"], [(comp__||rule__)], [$_token("?")]],({child})=>{return {$:'maybe',child}
})))(S)
var comp_star; const rule_star=(S)=>(comp_star||(comp_star=$_seq([[(comp_atom||rule_atom),"child"], [(comp__||rule__)], [$_token("*")]],({child})=>{return {$:'star',child}
})))(S)
var comp_plus; const rule_plus=(S)=>(comp_plus||(comp_plus=$_seq([[(comp_atom||rule_atom),"child"], [(comp__||rule__)], [$_token("+")]],({child})=>{return {$:'plus',child}
})))(S)
var comp_atom; const rule_atom=(S)=>(comp_atom||(comp_atom=$_or([(comp_token||rule_token),
(comp_match||rule_match),
(comp_dot||rule_dot),
(comp_rule||rule_rule),
$_seq([[$_token("(")], [(comp__||rule__)], [(comp_or||rule_or),"or"], [(comp__||rule__)], [$_token(")")]],({or})=>{return or })])))(S)
var comp_token; const rule_token=(S)=>(comp_token||(comp_token=$_seq([[$_or([(comp_token1||rule_token1),
(comp_token2||rule_token2)]),"token"], [$_maybe($_token("i")),"i"]],({token,i})=>{try {
    let str = JSON.parse(`"${token}"`)
    if (i) return {$:'itoken',token:str};
    return {$:'token',token:str};
  } catch (err) {
    error(err);
  }
})))(S)
var comp_token1; const rule_token1=(S)=>(comp_token1||(comp_token1=$_seq([[$_char(/['']/)], [$_plus((comp_ctoken1||rule_ctoken1)),"token"], [$_char(/['']/)]],({token})=>{return token.join('') })))(S)
var comp_ctoken1; const rule_ctoken1=(S)=>(comp_ctoken1||(comp_ctoken1=$_or([$_seq([[$_token("\\'"),"match"]],({match})=>{return "'" }),
$_seq([[$_token("\""),"match"]],({match})=>{return '\\"' }),
$_char(/[^']/)])))(S)
var comp_token2; const rule_token2=(S)=>(comp_token2||(comp_token2=$_seq([[$_char(/[""]/)], [$_plus((comp_ctoken2||rule_ctoken2)),"token"], [$_char(/[""]/)]],({token})=>{return token.join('') })))(S)
var comp_ctoken2; const rule_ctoken2=(S)=>(comp_ctoken2||(comp_ctoken2=$_or([$_token("\\\""),
$_char(/[^"]/)])))(S)
var comp_match; const rule_match=(S)=>(comp_match||(comp_match=$_seq([[$_token("[")], [$_dollar($_plus($_or([$_token("\\]"),
$_char(/[^\]]/)]))),"char"], [$_token("]")], [$_maybe($_token("i")),"i"]],({char,i})=>{if (i) return {$:'imatch',char};
  return {$:'match',char}
})))(S)
var comp_dot; const rule_dot=(S)=>(comp_dot||(comp_dot=$_seq([[$_token("."),"dot"]],({dot})=>{return {$:'dot'}
})))(S)
var comp_block; const rule_block=(S)=>(comp_block||(comp_block=$_seq([[$_token("{")], [(comp__||rule__)], [$_star((comp_block_chunk||rule_block_chunk)),"chunks"], [(comp__||rule__)], [$_token("}")]],({chunks})=>{return chunks.join('') })))(S)
var comp_block_chunk; const rule_block_chunk=(S)=>(comp_block_chunk||(comp_block_chunk=$_or([$_dollar($_plus($_char(/[^'"{}`]/))),
$_dollar($_seq([[$_token("'")],
[$_star($_or([$_token("\\'"),
$_char(/[^\n']/)]))],
[$_token("'")]])),
$_dollar($_seq([[$_token("\"")],
[$_star($_or([$_token("\\\""),
$_char(/[^\n"]/)]))],
[$_token("\"")]])),
(comp_template||rule_template),
$_dollar((comp_block||rule_block))])))(S)
var comp_template; const rule_template=(S)=>(comp_template||(comp_template=$_dollar($_seq([[$_token("`")],
[$_star((comp_template_chunk||rule_template_chunk))],
[$_token("`")]]))))(S)
var comp_template_chunk; const rule_template_chunk=(S)=>(comp_template_chunk||(comp_template_chunk=$_or([$_dollar($_token("\\$")),
$_dollar($_seq([[$_token("$")],
[(comp_block||rule_block)]])),
$_dollar($_plus($_char(/[^$`]/))),
$_seq([[$_token("$")],
[$_bang($_token("{"))]])])))(S)
var comp_ident; const rule_ident=(S)=>(comp_ident||(comp_ident=$_dollar($_plus($_seq([[$_char(/[a-z_]/i)],
[$_star($_char(/[a-z0-9]/i))]])))))(S)
var comp__; const rule__=(S)=>(comp__||(comp__=$_star($_char(/[ \n\t\r]/))))(S)
var comp___; const rule___=(S)=>(comp___||(comp___=$_plus($_char(/[ \n\t\r]/))))(S)
var comp_eol; const rule_eol=(S)=>(comp_eol||(comp_eol=$_or([$_plus($_seq([[(comp__||rule__)],
[$_token("\n")]])),
$_seq([[(comp__||rule__)],
[$_bang($_token("."))]])])))(S)
const $_start=rule_proc/*###SPLIT###*/

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
