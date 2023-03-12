

- differentiate between super type and sub type:
  function da(x) {
  Math.parseInt(x) // x is a supertype of string
  }
  da('value') // x is a subtype of 'value'

* support explicit any

* app/components/header/action-block/action-block.tsx <- not detected as any
* app/controllers/helpers/source-outage-status.ts  <- is not even seen ?!
* app/modules/checkout/utils/passenger-questions.ts <- no any found ( function addConditionToGraph(condition) {)