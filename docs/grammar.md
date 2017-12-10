### Consume text


These are the basic building blocks of your grammar. They *consume* text if they
match, meaning that they will advance the current parsing position.

| syntax | meaning | notes |
|-|-|-|
|`.`|any&nbsp;character|Match exactly one character and return it as a string. This will fail only if the end of the text is reached.|
|<code>"*literal*"</code><br><code>'*literal*'</code>|literal&nbsp;string|Match the exact string and return it. You can use the same escape sequences as in JavaScript. You can use single or double qoutes.|
|<code>"*literal*"i</code><br><code>'*literal*'i</code>|literal&nbsp;string, ignore&nbsp;case|As above, except the match is case-insensitive.|
|<code>[*chars*]</code>|one&nbsp;of&nbsp;characters|Match one character from a set and return it as a string. The syntax is the same as in javascript regular expressions. You can use `-` for character ranges and `^` for matching anything except the listed characters. You can also use character classes like `\s` or `\w`.|
|<code>[*chars*]i</code>|one&nbsp;of&nbsp;characters, ignore&nbsp;case|As above, except the match is case-insensitive.|

### Repetition
Repetition operators, as in regular expressions, indicate that the preceding expression
should be matched repeatedly.

| syntax | meaning | notes |
|-|-|-|
|<code>*expr*&nbsp;?</code>|zero&nbsp;or&nbsp;one|Match the expression, and return its result. Otherwise, return `undefined`, but do not fail the match.|
|<code>*expr*&nbsp;*</code>|zero&nbsp;or&nbsp;more|Match the expression zero or more times. Return an **array** of results.|
|<code>*expr*&nbsp;+</code>|one&nbsp;or&nbsp;more|As above, except the match will fail if the expression is not matched at least once.|

### Look-ahead

Look-ahead operators allow you to check if the following expression will/will not
match, without advancing the current parsing position.

| syntax | meaning | notes |
|-|-|-|
|<code>&&nbsp;*expr*</code>|positive&nbsp;look&nbsp;ahead|Match the expression, and return its result. Otherwise, return `undefined`, but do not fail the match.|
|<code>!&nbsp;*expr*</code>|negative&nbsp;look&nbsp;ahead|As above, except the match will fail if the expression matches.|


### Sequence

#### <code>*expr1 expr2* ...</code> *match all expressions in sequence*