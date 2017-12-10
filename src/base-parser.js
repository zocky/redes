/*
  baseParser: 

  Parsers are built from the source of S function and additional functions generated by
  the grammar parser.
*/

'use strict';


module.exports = function Redes() {
  const MAX_OPS = 100000;
  const MAX_DEPTH = 1000;
  const Parser = {
    parse: R$PARSE
  }

  function R$PARSE(text = "", {
    ast = false,
    loc = false
  } = {}) {
    var _pos = 0;
    const _location = {
      line: 1,
      col: 1
    };
    const $state = {
      get $loc() {
        if (_pos !== state.pos) {
          const lines = state.text.slice(0, state.pos).split(/\n/);
          _location.line = lines.length + 1;
          _location.column = lines[lines.length - 1].length + 1;
          _pos = state.pos;
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
      expected: {},
      expecting: false,
      expect_pos: 0,
      max_pos: 0,
      ast,
      loc,
      text,
      pos: 0,
      $: $state
    }
    var res = R$START(state);
    if (state.pos !== text.length) {
      var parsedText = state.text.slice(0,state.max_pos);
      var m = parsedText.match(/\n/g);
      var line = m ? m.length + 1 : 1;
      var col = parsedText.length - parsedText.lastIndexOf("\n");
      var found = JSON.stringify(state.text.substr(state.max_pos,8));
      var expected = Object.keys(state.expected);
      throw new Error(`Syntax error at line ${line}, column ${col}]. Found ${found}, expected one of ${state.expected}`)
    }
    return res[0];
  }

  const R$X = (expect, child) => {
    return (S) => {
      if (S.expecting) return child(S);
      S.expecting = true;
      const res = child(S);
      S.expecting = false;
      if (res) {
        if (S.pos > S.max_pos) {
          S.expected = {};
          S.max_pos = S.pos;
        }
        return res;
      } else {
        if (S.pos === S.max_pos) {
          S.expected[expect]=true;
        }
        return false;
      }
    }
  }

  const R$ADV = (S,test,res,len,expect) => {
    if (S.exoecting) return res && [res];
    if (test) {
      S.pos += len;
      if (S.pos > S.max_pos) {
        S.expected = {};
        S.max_pos = S.pos;
      }
      return [res];
    } else {
      if (S.pos === S.max_pos) {
        S.expected[expect]=true;
      }
      return false;
    }
  }

  const R$L = (chars = "") => {
    return (S) => {
      var testChars = S.text.substr(S.pos, chars.length);
      return R$ADV(S, testChars === chars,chars,chars.length,chars);
    }
  }
  const R$I = (chars) => {
    return (S) => {
      var testChars = S.text.substr(S.pos, chars.length).toLowerCase();
      return R$ADV(S, testChars === chars,chars,chars.length,chars);
    }
  }
  const R$C = (re) => {
    return (S) => {
      const char = S.text.charAt(S.pos);
      return R$ADV(S, re.test(char),char,1,re.source);
    }
  }
  const R$D = () => {
    return (S)=>R$ADV(S, S.pos < S.text.length,S.text.charAt(S.pos),1,'any char');
  }
  const R$Q = (args, action) => {
    return (S) => {
      const pos = S.pos;
      const ret = {};
      for (const [fn, name] of args) {
        switch (name) {
          case '!':
            const bpos = S.pos;
            const bres = fn(S, ret)
            if (bres) return (S.pos = pos, false);
            S.pos = lpos;
            break;
          case "&":
            const apos = S.pos;
            const ares = fn(S, ret)
            if (!ares) return (S.pos = pos, false);
            S.pos = apos;
          default:
            const res = fn(S)
            if (!res) return (S.pos = pos, false);
            if (name) ret[name] = res[0];
        }
      }
      if (!S.ast && action) return [action(S.$, ret)];
      if (S.loc) ret.$loc = S.$.$loc;
      return [ret];
    }
  }
  const R$O = (args) => {
    return (S) => {
      for (const arg of args) {
        const res = arg(S);
        if (res) return (res);
      }
      return false
    }
  }
  const R$T = (arg) => {
    return (S) => {
      const pos = S.pos;
      return arg(S) && [S.text.slice(pos, S.pos)];
    }
  }
  const R$A = (arg) => {
    return (S) => {
      const pos = S.pos,
        res = arg(S);
      S.pos = pos;
      return res;
    }
  }
  const R$B = (arg) => {
    return (S) => {
      const pos = S.pos,
        res = arg(S);
      S.pos = pos;
      return res ? false : [];
    }
  }
  const R$P = (arg) => {
    return (S) => {
      const ret = [];
      var res;
      while (res = arg(S)) ret.push(res[0]);
      return ret.length && [ret];
    }
  }
  const R$M = (arg) => {
    return (S) => {
      return arg(S) || [];
    }
  }
  const R$S = (arg) => {
    return (S) => {
      var ret = [],
        res;
      while (res = arg(S)) ret.push(res[0]);
      return [ret];
    }
  }

  /*###SPLIT###*/

  /*###SPLIT###*/

  return Parser;
}