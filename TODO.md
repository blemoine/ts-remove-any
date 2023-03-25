- differentiate between super type and sub type:
  function da(x) {
  Math.parseInt(x) // x is a supertype of string
  }
  da('value') // x is a subtype of 'value'

* any | { target: Element } -> should return any

* auth.ts -> Error | AxiosError | Error | AxiosError & AxiosError
* conditional-request.ts -> T & undefined | null | Error
* memoize.test.ts -> A[number] and A[number] | T
*
