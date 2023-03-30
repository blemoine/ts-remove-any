- differentiate between super type and sub type:
  function da(x) {
  Math.parseInt(x) // x is a supertype of string
  }
  da('value') // x is a subtype of 'value'


* upgrade ts-morph and TS

* trip-stops-helper

For imports:
  * they should be relative path (no /Users/xxx)
  * we should not import something already available in the scope
  * the revert should remove the import we've just add