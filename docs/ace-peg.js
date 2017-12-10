/*
  PEG Mode for ACE by Jason Patterson.

  Procured from http://www.cablemo.net/pegjsaceeditor/kitchen-sink.html

*/

define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"], function(require, exports, module) {
  "use strict";
  
  var Range = require("../range").Range;
  
  var MatchingBraceOutdent = function() {};
  
  (function() {
  
      this.checkOutdent = function(line, input) {
          if (! /^\s+$/.test(line))
              return false;
  
          return /^\s*\}/.test(input);
      };
  
      this.autoOutdent = function(doc, row) {
          var line = doc.getLine(row);
          var match = line.match(/^(\s*\})/);
  
          if (!match) return 0;
  
          var column = match[1].length;
          var openBracePos = doc.findMatchingBracket({row: row, column: column});
  
          if (!openBracePos || openBracePos.row == row) return 0;
  
          var indent = this.$getIndent(doc.getLine(openBracePos.row));
          doc.replace(new Range(row, 0, row, column-1), indent);
      };
  
      this.$getIndent = function(line) {
          return line.match(/^\s*/)[0];
      };
  
  }).call(MatchingBraceOutdent.prototype);
  
  exports.MatchingBraceOutdent = MatchingBraceOutdent;
  });
  
  define("ace/mode/doc_comment_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";
  
  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
  
  var DocCommentHighlightRules = function() {
      this.$rules = {
          "start" : [ {
              token : "comment.doc.tag",
              regex : "@[\\w\\d_]+" // TODO: fix email addresses
          }, 
          DocCommentHighlightRules.getTagRule(),
          {
              defaultToken : "comment.doc",
              caseInsensitive: true
          }]
      };
  };
  
  oop.inherits(DocCommentHighlightRules, TextHighlightRules);
  
  DocCommentHighlightRules.getTagRule = function(start) {
      return {
          token : "comment.doc.tag.storage.type",
          regex : "\\b(?:TODO|FIXME|XXX|HACK)\\b"
      };
  }
  
  DocCommentHighlightRules.getStartRule = function(start) {
      return {
          token : "comment.doc", // doc comment
          regex : "\\/\\*(?=\\*)",
          next  : start
      };
  };
  
  DocCommentHighlightRules.getEndRule = function (start) {
      return {
          token : "comment.doc", // closing comment
          regex : "\\*\\/",
          next  : start
      };
  };
  
  
  exports.DocCommentHighlightRules = DocCommentHighlightRules;
  
  });
  
  define("ace/mode/javascript_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/doc_comment_highlight_rules","ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";
  
  var oop = require("../lib/oop");
  var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
  var identifierRe = "[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*\\b";
  
  var JavaScriptHighlightRules = function(options) {
      var keywordMapper = this.createKeywordMapper({
          "variable.language":
              "Array|Boolean|Date|Function|Iterator|Number|Object|RegExp|String|Proxy|"  + // Constructors
              "Namespace|QName|XML|XMLList|"                                             + // E4X
              "ArrayBuffer|Float32Array|Float64Array|Int16Array|Int32Array|Int8Array|"   +
              "Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|"                    +
              "Error|EvalError|InternalError|RangeError|ReferenceError|StopIteration|"   + // Errors
              "SyntaxError|TypeError|URIError|"                                          +
              "decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|" + // Non-constructor functions
              "isNaN|parseFloat|parseInt|"                                               +
              "JSON|Math|"                                                               + // Other
              "this|arguments|prototype|window|document"                                 , // Pseudo
          "keyword":
              "const|yield|import|get|set|" +
              "break|case|catch|continue|default|delete|do|else|finally|for|function|" +
              "if|in|instanceof|new|return|switch|throw|try|typeof|let|var|while|with|debugger|" +
              "__parent__|__count__|escape|unescape|with|__proto__|" +
              "class|enum|extends|super|export|implements|private|public|interface|package|protected|static",
          "storage.type":
              "const|let|var|function",
          "constant.language":
              "null|Infinity|NaN|undefined",
          "support.function":
              "alert",
          "constant.language.boolean": "true|false"
      }, "identifier");
      var kwBeforeRe = "case|do|else|finally|in|instanceof|return|throw|try|typeof|yield|void";
  
      var escapedRe = "\\\\(?:x[0-9a-fA-F]{2}|" + // hex
          "u[0-9a-fA-F]{4}|" + // unicode
          "[0-2][0-7]{0,2}|" + // oct
          "3[0-6][0-7]?|" + // oct
          "37[0-7]?|" + // oct
          "[4-7][0-7]?|" + //oct
          ".)";
  
      this.$rules = {
          "no_regex" : [
              {
                  token : "comment",
                  regex : "\\/\\/",
                  next : "line_comment"
              },
              DocCommentHighlightRules.getStartRule("doc-start"),
              {
                  token : "comment", // multi line comment
                  regex : /\/\*/,
                  next : "comment"
              }, {
                  token : "string",
                  regex : "'(?=.)",
                  next  : "qstring"
              }, {
                  token : "string",
                  regex : '"(?=.)',
                  next  : "qqstring"
              }, {
                  token : "constant.numeric", // hex
                  regex : /0[xX][0-9a-fA-F]+\b/
              }, {
                  token : "constant.numeric", // float
                  regex : /[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/
              }, {
                  token : [
                      "storage.type", "punctuation.operator", "support.function",
                      "punctuation.operator", "entity.name.function", "text","keyword.operator"
                  ],
                  regex : "(" + identifierRe + ")(\\.)(prototype)(\\.)(" + identifierRe +")(\\s*)(=)",
                  next: "function_arguments"
              }, {
                  token : [
                      "storage.type", "punctuation.operator", "entity.name.function", "text",
                      "keyword.operator", "text", "storage.type", "text", "paren.lparen"
                  ],
                  regex : "(" + identifierRe + ")(\\.)(" + identifierRe +")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : [
                      "entity.name.function", "text", "keyword.operator", "text", "storage.type",
                      "text", "paren.lparen"
                  ],
                  regex : "(" + identifierRe +")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : [
                      "storage.type", "punctuation.operator", "entity.name.function", "text",
                      "keyword.operator", "text",
                      "storage.type", "text", "entity.name.function", "text", "paren.lparen"
                  ],
                  regex : "(" + identifierRe + ")(\\.)(" + identifierRe +")(\\s*)(=)(\\s*)(function)(\\s+)(\\w+)(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : [
                      "storage.type", "text", "entity.name.function", "text", "paren.lparen"
                  ],
                  regex : "(function)(\\s+)(" + identifierRe + ")(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : [
                      "entity.name.function", "text", "punctuation.operator",
                      "text", "storage.type", "text", "paren.lparen"
                  ],
                  regex : "(" + identifierRe + ")(\\s*)(:)(\\s*)(function)(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : [
                      "text", "text", "storage.type", "text", "paren.lparen"
                  ],
                  regex : "(:)(\\s*)(function)(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : "keyword",
                  regex : "(?:" + kwBeforeRe + ")\\b",
                  next : "start"
              }, {
                  token : ["support.constant"],
                  regex : /that\b/
              }, {
                  token : ["storage.type", "punctuation.operator", "support.function.firebug"],
                  regex : /(console)(\.)(warn|info|log|error|time|trace|timeEnd|assert)\b/
              }, {
                  token : keywordMapper,
                  regex : identifierRe
              }, {
                  token : "punctuation.operator",
                  regex : /[.](?![.])/,
                  next  : "property"
              }, {
                  token : "keyword.operator",
                  regex : /--|\+\+|\.{3}|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\|\||\?\:|[!$%&*+\-~\/^]=?/,
                  next  : "start"
              }, {
                  token : "punctuation.operator",
                  regex : /[?:,;.]/,
                  next  : "start"
              }, {
                  token : "paren.lparen",
                  regex : /[\[({]/,
                  next  : "start"
              }, {
                  token : "paren.rparen",
                  regex : /[\])}]/
              }, {
                  token: "comment",
                  regex: /^#!.*$/
              }
          ],
          property: [{
                  token : "text",
                  regex : "\\s+"
              }, {
                  token : [
                      "storage.type", "punctuation.operator", "entity.name.function", "text",
                      "keyword.operator", "text",
                      "storage.type", "text", "entity.name.function", "text", "paren.lparen"
                  ],
                  regex : "(" + identifierRe + ")(\\.)(" + identifierRe +")(\\s*)(=)(\\s*)(function)(?:(\\s+)(\\w+))?(\\s*)(\\()",
                  next: "function_arguments"
              }, {
                  token : "punctuation.operator",
                  regex : /[.](?![.])/
              }, {
                  token : "support.function",
                  regex : /(s(?:h(?:ift|ow(?:Mod(?:elessDialog|alDialog)|Help))|croll(?:X|By(?:Pages|Lines)?|Y|To)?|t(?:op|rike)|i(?:n|zeToContent|debar|gnText)|ort|u(?:p|b(?:str(?:ing)?)?)|pli(?:ce|t)|e(?:nd|t(?:Re(?:sizable|questHeader)|M(?:i(?:nutes|lliseconds)|onth)|Seconds|Ho(?:tKeys|urs)|Year|Cursor|Time(?:out)?|Interval|ZOptions|Date|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Date|FullYear)|FullYear|Active)|arch)|qrt|lice|avePreferences|mall)|h(?:ome|andleEvent)|navigate|c(?:har(?:CodeAt|At)|o(?:s|n(?:cat|textual|firm)|mpile)|eil|lear(?:Timeout|Interval)?|a(?:ptureEvents|ll)|reate(?:StyleSheet|Popup|EventObject))|t(?:o(?:GMTString|S(?:tring|ource)|U(?:TCString|pperCase)|Lo(?:caleString|werCase))|est|a(?:n|int(?:Enabled)?))|i(?:s(?:NaN|Finite)|ndexOf|talics)|d(?:isableExternalCapture|ump|etachEvent)|u(?:n(?:shift|taint|escape|watch)|pdateCommands)|j(?:oin|avaEnabled)|p(?:o(?:p|w)|ush|lugins.refresh|a(?:ddings|rse(?:Int|Float)?)|r(?:int|ompt|eference))|e(?:scape|nableExternalCapture|val|lementFromPoint|x(?:p|ec(?:Script|Command)?))|valueOf|UTC|queryCommand(?:State|Indeterm|Enabled|Value)|f(?:i(?:nd|le(?:ModifiedDate|Size|CreatedDate|UpdatedDate)|xed)|o(?:nt(?:size|color)|rward)|loor|romCharCode)|watch|l(?:ink|o(?:ad|g)|astIndexOf)|a(?:sin|nchor|cos|t(?:tachEvent|ob|an(?:2)?)|pply|lert|b(?:s|ort))|r(?:ou(?:nd|teEvents)|e(?:size(?:By|To)|calc|turnValue|place|verse|l(?:oad|ease(?:Capture|Events)))|andom)|g(?:o|et(?:ResponseHeader|M(?:i(?:nutes|lliseconds)|onth)|Se(?:conds|lection)|Hours|Year|Time(?:zoneOffset)?|Da(?:y|te)|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Da(?:y|te)|FullYear)|FullYear|A(?:ttention|llResponseHeaders)))|m(?:in|ove(?:B(?:y|elow)|To(?:Absolute)?|Above)|ergeAttributes|a(?:tch|rgins|x))|b(?:toa|ig|o(?:ld|rderWidths)|link|ack))\b(?=\()/
              }, {
                  token : "support.function.dom",
                  regex : /(s(?:ub(?:stringData|mit)|plitText|e(?:t(?:NamedItem|Attribute(?:Node)?)|lect))|has(?:ChildNodes|Feature)|namedItem|c(?:l(?:ick|o(?:se|neNode))|reate(?:C(?:omment|DATASection|aption)|T(?:Head|extNode|Foot)|DocumentFragment|ProcessingInstruction|E(?:ntityReference|lement)|Attribute))|tabIndex|i(?:nsert(?:Row|Before|Cell|Data)|tem)|open|delete(?:Row|C(?:ell|aption)|T(?:Head|Foot)|Data)|focus|write(?:ln)?|a(?:dd|ppend(?:Child|Data))|re(?:set|place(?:Child|Data)|move(?:NamedItem|Child|Attribute(?:Node)?)?)|get(?:NamedItem|Element(?:sBy(?:Name|TagName|ClassName)|ById)|Attribute(?:Node)?)|blur)\b(?=\()/
              }, {
                  token :  "support.constant",
                  regex : /(s(?:ystemLanguage|cr(?:ipts|ollbars|een(?:X|Y|Top|Left))|t(?:yle(?:Sheets)?|atus(?:Text|bar)?)|ibling(?:Below|Above)|ource|uffixes|e(?:curity(?:Policy)?|l(?:ection|f)))|h(?:istory|ost(?:name)?|as(?:h|Focus))|y|X(?:MLDocument|SLDocument)|n(?:ext|ame(?:space(?:s|URI)|Prop))|M(?:IN_VALUE|AX_VALUE)|c(?:haracterSet|o(?:n(?:structor|trollers)|okieEnabled|lorDepth|mp(?:onents|lete))|urrent|puClass|l(?:i(?:p(?:boardData)?|entInformation)|osed|asses)|alle(?:e|r)|rypto)|t(?:o(?:olbar|p)|ext(?:Transform|Indent|Decoration|Align)|ags)|SQRT(?:1_2|2)|i(?:n(?:ner(?:Height|Width)|put)|ds|gnoreCase)|zIndex|o(?:scpu|n(?:readystatechange|Line)|uter(?:Height|Width)|p(?:sProfile|ener)|ffscreenBuffering)|NEGATIVE_INFINITY|d(?:i(?:splay|alog(?:Height|Top|Width|Left|Arguments)|rectories)|e(?:scription|fault(?:Status|Ch(?:ecked|arset)|View)))|u(?:ser(?:Profile|Language|Agent)|n(?:iqueID|defined)|pdateInterval)|_content|p(?:ixelDepth|ort|ersonalbar|kcs11|l(?:ugins|atform)|a(?:thname|dding(?:Right|Bottom|Top|Left)|rent(?:Window|Layer)?|ge(?:X(?:Offset)?|Y(?:Offset)?))|r(?:o(?:to(?:col|type)|duct(?:Sub)?|mpter)|e(?:vious|fix)))|e(?:n(?:coding|abledPlugin)|x(?:ternal|pando)|mbeds)|v(?:isibility|endor(?:Sub)?|Linkcolor)|URLUnencoded|P(?:I|OSITIVE_INFINITY)|f(?:ilename|o(?:nt(?:Size|Family|Weight)|rmName)|rame(?:s|Element)|gColor)|E|whiteSpace|l(?:i(?:stStyleType|n(?:eHeight|kColor))|o(?:ca(?:tion(?:bar)?|lName)|wsrc)|e(?:ngth|ft(?:Context)?)|a(?:st(?:M(?:odified|atch)|Index|Paren)|yer(?:s|X)|nguage))|a(?:pp(?:MinorVersion|Name|Co(?:deName|re)|Version)|vail(?:Height|Top|Width|Left)|ll|r(?:ity|guments)|Linkcolor|bove)|r(?:ight(?:Context)?|e(?:sponse(?:XML|Text)|adyState))|global|x|m(?:imeTypes|ultiline|enubar|argin(?:Right|Bottom|Top|Left))|L(?:N(?:10|2)|OG(?:10E|2E))|b(?:o(?:ttom|rder(?:Width|RightWidth|BottomWidth|Style|Color|TopWidth|LeftWidth))|ufferDepth|elow|ackground(?:Color|Image)))\b/
              }, {
                  token : "identifier",
                  regex : identifierRe
              }, {
                  regex: "",
                  token: "empty",
                  next: "no_regex"
              }
          ],
          "start": [
              DocCommentHighlightRules.getStartRule("doc-start"),
              {
                  token : "comment", // multi line comment
                  regex : "\\/\\*",
                  next : "comment_regex_allowed"
              }, {
                  token : "comment",
                  regex : "\\/\\/",
                  next : "line_comment_regex_allowed"
              }, {
                  token: "string.regexp",
                  regex: "\\/",
                  next: "regex"
              }, {
                  token : "text",
                  regex : "\\s+|^$",
                  next : "start"
              }, {
                  token: "empty",
                  regex: "",
                  next: "no_regex"
              }
          ],
          "regex": [
              {
                  token: "regexp.keyword.operator",
                  regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
              }, {
                  token: "string.regexp",
                  regex: "/[sxngimy]*",
                  next: "no_regex"
              }, {
                  token : "invalid",
                  regex: /\{\d+\b,?\d*\}[+*]|[+*$^?][+*]|[$^][?]|\?{3,}/
              }, {
                  token : "constant.language.escape",
                  regex: /\(\?[:=!]|\)|\{\d+\b,?\d*\}|[+*]\?|[()$^+*?.]/
              }, {
                  token : "constant.language.delimiter",
                  regex: /\|/
              }, {
                  token: "constant.language.escape",
                  regex: /\[\^?/,
                  next: "regex_character_class"
              }, {
                  token: "empty",
                  regex: "$",
                  next: "no_regex"
              }, {
                  defaultToken: "string.regexp"
              }
          ],
          "regex_character_class": [
              {
                  token: "regexp.charclass.keyword.operator",
                  regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
              }, {
                  token: "constant.language.escape",
                  regex: "]",
                  next: "regex"
              }, {
                  token: "constant.language.escape",
                  regex: "-"
              }, {
                  token: "empty",
                  regex: "$",
                  next: "no_regex"
              }, {
                  defaultToken: "string.regexp.charachterclass"
              }
          ],
          "function_arguments": [
              {
                  token: "variable.parameter",
                  regex: identifierRe
              }, {
                  token: "punctuation.operator",
                  regex: "[, ]+"
              }, {
                  token: "punctuation.operator",
                  regex: "$"
              }, {
                  token: "empty",
                  regex: "",
                  next: "no_regex"
              }
          ],
          "comment_regex_allowed" : [
              DocCommentHighlightRules.getTagRule(),
              {token : "comment", regex : "\\*\\/", next : "start"},
              {defaultToken : "comment", caseInsensitive: true}
          ],
          "comment" : [
              DocCommentHighlightRules.getTagRule(),
              {token : "comment", regex : "\\*\\/", next : "no_regex"},
              {defaultToken : "comment", caseInsensitive: true}
          ],
          "line_comment_regex_allowed" : [
              DocCommentHighlightRules.getTagRule(),
              {token : "comment", regex : "$|^", next : "start"},
              {defaultToken : "comment", caseInsensitive: true}
          ],
          "line_comment" : [
              DocCommentHighlightRules.getTagRule(),
              {token : "comment", regex : "$|^", next : "no_regex"},
              {defaultToken : "comment", caseInsensitive: true}
          ],
          "qqstring" : [
              {
                  token : "constant.language.escape",
                  regex : escapedRe
              }, {
                  token : "string",
                  regex : "\\\\$",
                  next  : "qqstring"
              }, {
                  token : "string",
                  regex : '"|$',
                  next  : "no_regex"
              }, {
                  defaultToken: "string"
              }
          ],
          "qstring" : [
              {
                  token : "constant.language.escape",
                  regex : escapedRe
              }, {
                  token : "string",
                  regex : "\\\\$",
                  next  : "qstring"
              }, {
                  token : "string",
                  regex : "'|$",
                  next  : "no_regex"
              }, {
                  defaultToken: "string"
              }
          ]
      };
      
      
      if (!options || !options.noES6) {
          this.$rules.no_regex.unshift({
              regex: "[{}]", onMatch: function(val, state, stack) {
                  this.next = val == "{" ? this.nextState : "";
                  if (val == "{" && stack.length) {
                      stack.unshift("start", state);
                      return "paren";
                  }
                  if (val == "}" && stack.length) {
                      stack.shift();
                      this.next = stack.shift();
                      if (this.next.indexOf("string") != -1 || this.next.indexOf("jsx") != -1)
                          return "paren.quasi.end";
                  }
                  return val == "{" ? "paren.lparen" : "paren.rparen";
              },
              nextState: "start"
          }, {
              token : "string.quasi.start",
              regex : /`/,
              push  : [{
                  token : "constant.language.escape",
                  regex : escapedRe
              }, {
                  token : "paren.quasi.start",
                  regex : /\${/,
                  push  : "start"
              }, {
                  token : "string.quasi.end",
                  regex : /`/,
                  next  : "pop"
              }, {
                  defaultToken: "string.quasi"
              }]
          });
          
          if (!options || !options.noJSX)
              JSX.call(this);
      }
      
      this.embedRules(DocCommentHighlightRules, "doc-",
          [ DocCommentHighlightRules.getEndRule("no_regex") ]);
      
      this.normalizeRules();
  };
  
  oop.inherits(JavaScriptHighlightRules, TextHighlightRules);
  
  function JSX() {
      var tagRegex = identifierRe.replace("\\d", "\\d\\-");
      var jsxTag = {
          onMatch : function(val, state, stack) {
              var offset = val.charAt(1) == "/" ? 2 : 1;
              if (offset == 1) {
                  if (state != this.nextState)
                      stack.unshift(this.next, this.nextState, 0);
                  else
                      stack.unshift(this.next);
                  stack[2]++;
              } else if (offset == 2) {
                  if (state == this.nextState) {
                      stack[1]--;
                      if (!stack[1] || stack[1] < 0) {
                          stack.shift();
                          stack.shift();
                      }
                  }
              }
              return [{
                  type: "meta.tag.punctuation." + (offset == 1 ? "" : "end-") + "tag-open.xml",
                  value: val.slice(0, offset)
              }, {
                  type: "meta.tag.tag-name.xml",
                  value: val.substr(offset)
              }];
          },
          regex : "</?" + tagRegex + "",
          next: "jsxAttributes",
          nextState: "jsx"
      };
      this.$rules.start.unshift(jsxTag);
      var jsxJsRule = {
          regex: "{",
          token: "paren.quasi.start",
          push: "start"
      };
      this.$rules.jsx = [
          jsxJsRule,
          jsxTag,
          {include : "reference"},
          {defaultToken: "string"}
      ];
      this.$rules.jsxAttributes = [{
          token : "meta.tag.punctuation.tag-close.xml", 
          regex : "/?>", 
          onMatch : function(value, currentState, stack) {
              if (currentState == stack[0])
                  stack.shift();
              if (value.length == 2) {
                  if (stack[0] == this.nextState)
                      stack[1]--;
                  if (!stack[1] || stack[1] < 0) {
                      stack.splice(0, 2);
                  }
              }
              this.next = stack[0] || "start";
              return [{type: this.token, value: value}];
          },
          nextState: "jsx"
      }, 
      jsxJsRule,
      {
          token : "entity.other.attribute-name.xml",
          regex : tagRegex
      }, {
          token : "keyword.operator.attribute-equals.xml",
          regex : "="
      }, {
          token : "text.tag-whitespace.xml",
          regex : "\\s+"
      }, {
          token : "string.attribute-value.xml",
          regex : "'",
          stateName : "jsx_attr_q",
          push : [
              {token : "string.attribute-value.xml", regex: "'", next: "pop"},
              jsxJsRule,
              {include : "reference"},
              {defaultToken : "string.attribute-value.xml"}
          ]
      }, {
          token : "string.attribute-value.xml",
          regex : '"',
          stateName : "jsx_attr_qq",
          push : [
              jsxJsRule,
              {token : "string.attribute-value.xml", regex: '"', next: "pop"},
              {include : "reference"},
              {defaultToken : "string.attribute-value.xml"}
          ]
      }];
      this.$rules.reference = [{
          token : "constant.language.escape.reference.xml",
          regex : "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
      }];
  }
  
  exports.JavaScriptHighlightRules = JavaScriptHighlightRules;
  });
  
  define("ace/mode/pegjs_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules","ace/mode/javascript_highlight_rules"], function (require, exports, module) {
    "use strict";
  
    var oop = require("ace/lib/oop");
    var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;
    var JavaScriptHighlightRules = require("ace/mode/javascript_highlight_rules").JavaScriptHighlightRules;
  
    var PegjsHighlightRules = function () {
  
      this.$rules = {
  
        'start': [
          {
            token: 'identifier',
            regex: '[a-zA-Z][a-zA-Z0-9]+'
          },
          {
            token: 'string',
            regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
          },
          {
            token: 'keyword.operator',
            regex: '[=/](?!/)',
            next : 'peg-rule'
          },
          {
            token: 'comment',
            regex: '[//].*'
          }
        ],
  
        'peg-rule': [
          {
            token: "text",
            regex: "(?=[a-zA-Z][a-zA-Z0-9]+\\S*=)",
            next: "start"
          },
          {
            token: 'string',
            regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
          },
          {
            token: 'string',
            regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
          },
          {
            token: 'keyword.operator',
            regex: '[=]',
          },
          {
            token: ['variable', "keyword.operator"],
            regex: '([a-zA-Z][a-zA-Z0-9]+)(:)'
          },
          {
            token: 'string',
            regex: '\\[(?:(?:\\\\.)|(?:[^\\]\\\\]))*?\\]'
          },
          {
            token: 'identifier',
            regex: '[a-zA-Z][a-zA-Z0-9]+'
          },
          {
            token: 'keyword.operator',
            regex: '(?:[+?*()]|/(?!/))'
          },
          {
            token: 'keyword',
            regex: '{',
            next : 'js-start'
          },
          {
            token: 'comment',
            regex: '[//].*'
          }
        ]
  
      };
  
      for (var i in this.$rules) {
        this.$rules[ i ].unshift({
          token: 'comment',
          regex: '/\\*',
          next : 'comment'
        });
      }
  
      this.$rules.comment = [
        {
          token: 'comment',
          regex: '\\*/',
          next : 'start'
        },
        {
          token: 'comment',
          regex: '.'
        }
      ];
  
      this.embedRules(JavaScriptHighlightRules, 'js-', [
        { token: 'keyword', regex: '}', next: 'start' }
      ]);
  
    };
  
    oop.inherits(PegjsHighlightRules, TextHighlightRules);
    exports.PegjsHighlightRules = PegjsHighlightRules;
  
  });
  
  define("ace/mode/pegjs",["require","exports","module","ace/lib/oop","ace/mode/text","ace/tokenizer","ace/mode/matching_brace_outdent","ace/worker/worker_client","ace/range","ace/mode/pegjs_highlight_rules","ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";
  
  var oop = require("../lib/oop");
  var TextMode = require("./text").Mode;
  var Tokenizer = require("../tokenizer").Tokenizer;
  var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
  var WorkerClient = require("../worker/worker_client").WorkerClient;
  var Range = require("../range").Range;
  var PegjsHighlightRules = require("./pegjs_highlight_rules").PegjsHighlightRules;
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
  var Mode = function() {
      this.HighlightRules = TextHighlightRules;
      this.HighlightRules = PegjsHighlightRules;
      this.$outdent = new MatchingBraceOutdent();
  };
  oop.inherits(Mode, TextMode);
  
  (function() {
      this.lineCommentStart = "//";
      this.blockComment = {start: "/*", end: "*/"};
      this.getNextLineIndent = function(state, line, tab) {
          var indent = this.$getIndent(line);
          return indent;
      };
  
      this.checkOutdent = function(state, line, input) {
          return this.$outdent.checkOutdent(line, input);
      };
  
      this.autoOutdent = function(state, doc, row) {
          this.$outdent.autoOutdent(doc, row);
      };
      function addCSSRule(sheet, selector, rules, index) {
        if("insertRule" in sheet) {
          sheet.insertRule(selector + "{" + rules + "}", index);
        }
        else if("addRule" in sheet) {
          sheet.addRule(selector, rules, index);
        }
      }
      this.createWorker = function(session) {
          var markers = [];
          var sheet = document.styleSheets[0];
          addCSSRule(sheet, ".pegjs_highlight_info", "position: absolute;border-bottom: solid 1px gray;z-index: 2000;");
          addCSSRule(sheet, ".pegjs_highlight_error", "position: absolute;border-bottom: solid 1px rgb(224, 4, 4);z-index: 2000;");
          addCSSRule(sheet, ".pegjs_highlight_warning", "position: absolute;border-bottom: solid 1px #DDC50F;z-index: 2000;");
          
          var worker = new WorkerClient(["ace"], "ace/mode/pegjs_worker", "Worker");
          worker.attachToDocument(session.getDocument());
          worker.on("clearMarkers", function (results){
              session.setAnnotations(results.data);
              for (var x=0; x < markers.length;x++){
                  session.removeMarker(markers[x]);
              }
              markers = [];
          });
          worker.on("annotate", function(results) {
              session.setAnnotations(results.data);
              for (var x=0, len = results.data.length, error;x<len;x++) {
                  error = results.data[x];
                  if (error.endColumn) {
                      markers.push(session.addMarker(new Range(error.row, error.column, error.endRow, error.endColumn) , "pegjs_highlight_" + error.type, "text"));
                  }
              }
          });
          worker.on("terminate", function() {
              session.clearAnnotations();
          });
          return worker;
      };
  
  }).call(Mode.prototype);
  
  exports.Mode = Mode;
  });