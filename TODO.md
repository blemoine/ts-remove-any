- differentiate between super type and sub type:
  function da(x) {
  Math.parseInt(x) // x is a supertype of string
  }
  da('value') // x is a subtype of 'value'

* any | { target: Element } -> should return any

* auth.ts -> Error | AxiosError | Error | AxiosError & AxiosError
* country-page.tsx -> T & any
* conditional-request.ts -> T & undefined | null | Error
* render-with-design-system-server.tsx -> Uint8Array[] (maybe good?)
* memoize.test.ts -> A[number] and A[number] | T
*
