// @flow
import createBatchActions from '../util/api/createBatchActions'
import accountsActions from './accountsActions'
import blockHeightActions from './blockHeightActions'
import pricesActions from './pricesActions'
import settingsActions from './settingsActions'

export const ID = 'APP'

export default createBatchActions(ID, {
  accounts: accountsActions,
  blockHeight: blockHeightActions,
  prices: pricesActions,
  settings: settingsActions
})
