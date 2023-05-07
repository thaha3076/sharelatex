import { useState } from 'react'
import ToggleSwitch from '../../../../../frontend/js/features/history/components/change-list/toggle-switch'
import ChangeList from '../../../../../frontend/js/features/history/components/change-list/change-list'
import {
  EditorProviders,
  USER_EMAIL,
  USER_ID,
} from '../../../helpers/editor-providers'
import { HistoryProvider } from '../../../../../frontend/js/features/history/context/history-context'
import { updates } from '../fixtures/updates'
import { labels } from '../fixtures/labels'

const mountWithEditorProviders = (
  component: React.ReactNode,
  scope: Record<string, unknown> = {},
  props: Record<string, unknown> = {}
) => {
  cy.mount(
    <EditorProviders scope={scope} {...props}>
      <HistoryProvider>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="history-react">{component}</div>
        </div>
      </HistoryProvider>
    </EditorProviders>
  )
}

describe('change list', function () {
  describe('toggle switch', function () {
    it('renders switch buttons', function () {
      mountWithEditorProviders(
        <ToggleSwitch labelsOnly={false} setLabelsOnly={() => {}} />
      )

      cy.findByLabelText(/all history/i)
      cy.findByLabelText(/labels/i)
    })

    it('toggles "all history" and "labels" buttons', function () {
      function ToggleSwitchWrapped({ labelsOnly }: { labelsOnly: boolean }) {
        const [labelsOnlyLocal, setLabelsOnlyLocal] = useState(labelsOnly)
        return (
          <ToggleSwitch
            labelsOnly={labelsOnlyLocal}
            setLabelsOnly={setLabelsOnlyLocal}
          />
        )
      }

      mountWithEditorProviders(<ToggleSwitchWrapped labelsOnly={false} />)

      cy.findByLabelText(/all history/i).as('all-history')
      cy.findByLabelText(/labels/i).as('labels')
      cy.get('@all-history').should('be.checked')
      cy.get('@labels').should('not.be.checked')
      cy.get('@labels').click({ force: true })
      cy.get('@all-history').should('not.be.checked')
      cy.get('@labels').should('be.checked')
    })
  })

  describe('tags', function () {
    const scope = {
      ui: { view: 'history', pdfLayout: 'sideBySide', chatOpen: true },
    }

    const waitForData = () => {
      cy.wait('@updates')
      cy.wait('@labels')
      cy.wait('@diff')
    }

    beforeEach(function () {
      cy.intercept('GET', '/project/*/updates*', {
        body: updates,
      }).as('updates')
      cy.intercept('GET', '/project/*/labels', {
        body: labels,
      }).as('labels')
      cy.intercept('GET', '/project/*/filetree/diff*', {
        body: { diff: [{ pathname: 'main.tex' }, { pathname: 'name.tex' }] },
      }).as('diff')
    })

    it('renders tags', function () {
      mountWithEditorProviders(<ChangeList />, scope, {
        user: {
          id: USER_ID,
          email: USER_EMAIL,
          isAdmin: true,
        },
      })
      waitForData()

      cy.findByLabelText(/all history/i).click({ force: true })
      cy.findAllByTestId('history-version-details').as('details')
      cy.get('@details').should('have.length', 3)
      // 1st details entry
      cy.get('@details')
        .eq(0)
        .within(() => {
          cy.findAllByTestId('history-version-badge').as('tags')
        })
      cy.get('@tags').should('have.length', 2)
      cy.get('@tags').eq(0).should('contain.text', 'tag-2')
      cy.get('@tags').eq(1).should('contain.text', 'tag-1')
      // should have delete buttons
      cy.get('@tags').each(tag =>
        cy.wrap(tag).within(() => {
          cy.findByRole('button', { name: /delete/i })
        })
      )
      // 2nd details entry
      cy.get('@details')
        .eq(1)
        .within(() => {
          cy.findAllByTestId('history-version-badge').as('tags')
        })
      cy.get('@tags').should('have.length', 2)
      cy.get('@tags').eq(0).should('contain.text', 'tag-4')
      cy.get('@tags').eq(1).should('contain.text', 'tag-3')
      // should not have delete buttons
      cy.get('@tags').each(tag =>
        cy.wrap(tag).within(() => {
          cy.findByRole('button', { name: /delete/i }).should('not.exist')
        })
      )
      // 3rd details entry
      cy.get('@details')
        .eq(2)
        .within(() => {
          cy.findAllByTestId('history-version-badge').should('have.length', 0)
        })
      cy.findByLabelText(/labels/i).click({ force: true })
      cy.findAllByTestId('history-version-details').as('details')
      cy.get('@details').should('have.length', 2)
      cy.get('@details')
        .eq(0)
        .within(() => {
          cy.findAllByTestId('history-version-badge').as('tags')
        })
      cy.get('@tags').should('have.length', 2)
      cy.get('@tags').eq(0).should('contain.text', 'tag-2')
      cy.get('@tags').eq(1).should('contain.text', 'tag-1')
      cy.get('@details')
        .eq(1)
        .within(() => {
          cy.findAllByTestId('history-version-badge').as('tags')
        })
      cy.get('@tags').should('have.length', 3)
      cy.get('@tags').eq(0).should('contain.text', 'tag-5')
      cy.get('@tags').eq(1).should('contain.text', 'tag-4')
      cy.get('@tags').eq(2).should('contain.text', 'tag-3')
    })

    it('deletes tag', function () {
      mountWithEditorProviders(<ChangeList />, scope, {
        user: {
          id: USER_ID,
          email: USER_EMAIL,
          isAdmin: true,
        },
      })
      waitForData()

      cy.findByLabelText(/all history/i).click({ force: true })

      const labelToDelete = 'tag-2'
      cy.findAllByTestId('history-version-details').eq(0).as('details')
      cy.get('@details').within(() => {
        cy.findAllByTestId('history-version-badge').eq(0).as('tag')
      })
      cy.get('@tag').should('contain.text', labelToDelete)
      cy.get('@tag').within(() => {
        cy.findByRole('button', { name: /delete/i }).as('delete-btn')
      })
      cy.get('@delete-btn').click()
      cy.findByRole('dialog').as('modal')
      cy.get('@modal').within(() => {
        cy.findByRole('heading', { name: /delete label/i })
      })
      cy.get('@modal').contains(
        new RegExp(
          `are you sure you want to delete the following label "${labelToDelete}"?`,
          'i'
        )
      )
      cy.get('@modal').within(() => {
        cy.findByRole('button', { name: /cancel/i }).click()
      })
      cy.findByRole('dialog').should('not.exist')
      cy.get('@delete-btn').click()
      cy.findByRole('dialog').as('modal')
      cy.intercept('DELETE', '/project/*/labels/*', {
        statusCode: 500,
      }).as('delete')
      cy.get('@modal').within(() => {
        cy.findByRole('button', { name: /delete/i }).click()
      })
      cy.wait('@delete')
      cy.get('@modal').within(() => {
        cy.findByRole('alert').within(() => {
          cy.contains(/sorry, something went wrong/i)
        })
      })
      cy.findByText(labelToDelete).should('have.length', 1)

      cy.intercept('DELETE', '/project/*/labels/*', {
        statusCode: 204,
      }).as('delete')
      cy.get('@modal').within(() => {
        cy.findByRole('button', { name: /delete/i }).click()
      })
      cy.wait('@delete')
      cy.findByText(labelToDelete).should('not.exist')
    })
  })

  describe('paywall', function () {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const justOverADayAgo = now - 25 * 60 * 60 * 1000
    const twoDaysAgo = now - 48 * 60 * 60 * 1000

    const updates = {
      updates: [
        {
          fromV: 3,
          toV: 4,
          meta: {
            users: [
              {
                first_name: 'john.doe',
                last_name: '',
                email: 'john.doe@test.com',
                id: '1',
              },
            ],
            start_ts: oneMinuteAgo,
            end_ts: oneMinuteAgo,
          },
          labels: [],
          pathnames: [],
          project_ops: [{ add: { pathname: 'name.tex' }, atV: 3 }],
        },
        {
          fromV: 1,
          toV: 3,
          meta: {
            users: [
              {
                first_name: 'bobby.lapointe',
                last_name: '',
                email: 'bobby.lapointe@test.com',
                id: '2',
              },
            ],
            start_ts: justOverADayAgo,
            end_ts: justOverADayAgo - 10 * 1000,
          },
          labels: [],
          pathnames: ['main.tex'],
          project_ops: [],
        },
        {
          fromV: 0,
          toV: 1,
          meta: {
            users: [
              {
                first_name: 'john.doe',
                last_name: '',
                email: 'john.doe@test.com',
                id: '1',
              },
            ],
            start_ts: twoDaysAgo,
            end_ts: twoDaysAgo,
          },
          labels: [
            {
              id: 'label1',
              comment: 'tag-1',
              version: 0,
              user_id: USER_ID,
              created_at: justOverADayAgo,
            },
          ],
          pathnames: [],
          project_ops: [{ add: { pathname: 'main.tex' }, atV: 0 }],
        },
      ],
    }

    const labels = [
      {
        id: 'label1',
        comment: 'tag-1',
        version: 0,
        user_id: USER_ID,
        created_at: justOverADayAgo,
        user_display_name: 'john.doe',
      },
    ]

    const waitForData = () => {
      cy.wait('@updates')
      cy.wait('@labels')
      cy.wait('@diff')
    }

    beforeEach(function () {
      cy.intercept('GET', '/project/*/updates*', {
        body: updates,
      }).as('updates')
      cy.intercept('GET', '/project/*/labels', {
        body: labels,
      }).as('labels')
      cy.intercept('GET', '/project/*/filetree/diff*', {
        body: { diff: [{ pathname: 'main.tex' }, { pathname: 'name.tex' }] },
      }).as('diff')
    })

    it('shows non-owner paywall', function () {
      const scope = {
        ui: {
          view: 'history',
          pdfLayout: 'sideBySide',
          chatOpen: true,
        },
      }

      mountWithEditorProviders(<ChangeList />, scope, {
        user: {
          id: USER_ID,
          email: USER_EMAIL,
          isAdmin: false,
        },
      })

      waitForData()

      cy.get('.history-paywall-prompt').should('have.length', 1)
      cy.findAllByTestId('history-version').should('have.length', 2)
      cy.get('.history-paywall-prompt button').should('not.exist')
    })

    it('shows owner paywall', function () {
      const scope = {
        ui: {
          view: 'history',
          pdfLayout: 'sideBySide',
          chatOpen: true,
        },
      }

      mountWithEditorProviders(<ChangeList />, scope, {
        user: {
          id: USER_ID,
          email: USER_EMAIL,
          isAdmin: false,
        },
        projectOwner: {
          _id: USER_ID,
          email: USER_EMAIL,
        },
      })

      waitForData()

      cy.get('.history-paywall-prompt').should('have.length', 1)
      cy.findAllByTestId('history-version').should('have.length', 2)
      cy.get('.history-paywall-prompt button').should('have.length', 1)
    })

    it('shows all labels in free tier', function () {
      const scope = {
        ui: {
          view: 'history',
          pdfLayout: 'sideBySide',
          chatOpen: true,
        },
      }

      mountWithEditorProviders(<ChangeList />, scope, {
        user: {
          id: USER_ID,
          email: USER_EMAIL,
          isAdmin: false,
        },
        projectOwner: {
          _id: USER_ID,
          email: USER_EMAIL,
        },
      })

      waitForData()

      cy.findByLabelText(/labels/i).click({ force: true })

      // One pseudo-label for the current state, one for our label
      cy.get('.history-version-label').should('have.length', 2)
    })
  })
})
