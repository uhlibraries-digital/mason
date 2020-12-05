import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as TestUtils from 'react-dom/test-utils'
import { Dispatcher } from "../../src/lib/dispatcher"
import { AppStore } from "../../src/lib/stores"
import { InMemoryDispatcher } from "../helpers/in-memory-dispatcher"
import { App } from '../../src/renderer/app'


describe('App', () => {
  let appStore: AppStore
  let dispatcher: Dispatcher


  beforeEach(async () => {
    appStore = new AppStore()
    dispatcher = new InMemoryDispatcher(appStore)
  })

  it('renders', async () => {
    const app = (TestUtils.renderIntoDocument(
      <App
        dispatcher={dispatcher}
        appStore={appStore}
      />
    ) as unknown) as React.Component<any, any>
    // Give any promises a tick to resolve.
    await wait(0)

    const node = ReactDOM.findDOMNode(app)
    expect(node).not.toBeNull()
  })
})

function wait(timeout: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, timeout)
  })
}
