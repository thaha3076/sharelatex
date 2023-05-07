import '@testing-library/cypress/add-commands'
import {
  interceptCompile,
  waitForCompile,
  interceptDeferredCompile,
} from './compile'
import { interceptEvents } from './events'
import { interceptSpelling } from './spelling'
import { interceptAsync } from './intercept-async'

// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,no-unused-vars
  namespace Cypress {
    // eslint-disable-next-line no-unused-vars
    interface Chainable {
      interceptAsync: typeof interceptAsync
      interceptCompile: typeof interceptCompile
      interceptEvents: typeof interceptEvents
      interceptSpelling: typeof interceptSpelling
      waitForCompile: typeof waitForCompile
      interceptDeferredCompile: typeof interceptDeferredCompile
    }
  }
}

Cypress.Commands.add('interceptAsync', interceptAsync)
Cypress.Commands.add('interceptCompile', interceptCompile)
Cypress.Commands.add('interceptEvents', interceptEvents)
Cypress.Commands.add('interceptSpelling', interceptSpelling)
Cypress.Commands.add('waitForCompile', waitForCompile)
Cypress.Commands.add('interceptDeferredCompile', interceptDeferredCompile)
