

- differentiate between super type and sub type:
  function da(x) {
  Math.parseInt(x) // x is a supertype of string
  }
  da('value') // x is a subtype of 'value'

* any | { target: Element }  -> should return any
* window-click-handler.test.tsx -> __object
* auth.ts -> Error | AxiosError | Error | AxiosError & AxiosError
* country-page.tsx -> T & any
* help.tsx -> Request | __object
* purchase-unsuccessful-page.test.ts -> __object
* sitemap.ts -> T
* account-page.tsx -> FC (should be React.FC)
* conditional-request.ts -> T & undefined | null | Error
* "Function type notation must be parenthesized when used in a union type."
* render-with-design-system-server.tsx -> Uint8Array[] (maybe good?)
* memoize.test.ts -> A[number]    and A[number] | T
* 