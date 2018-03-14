// @flow
import { api } from 'neon-js'

import {
  showErrorNotification,
  showSuccessNotification,
  showInfoNotification
} from './notifications'
import {
  getNetwork,
  getWIF,
  getAddress,
  getSigningFunction,
  getPublicKey,
  getIsHardwareLogin,
  getNEO
} from '../core/deprecated'
import { ASSETS } from '../core/constants'
import asyncWrap from '../core/asyncHelper'
import { FIVE_MINUTES_MS } from '../core/time'

import { log } from '../util/Logs'
import { toNumber } from '../core/math'

// Constants
export const SET_CLAIM_REQUEST = 'SET_CLAIM_REQUEST'
export const DISABLE_CLAIM = 'DISABLE_CLAIM'

// Actions
export function setClaimRequest (claimRequest: boolean) {
  return {
    type: SET_CLAIM_REQUEST,
    payload: { claimRequest }
  }
}

export function disableClaim (disableClaimButton: boolean) {
  return {
    type: DISABLE_CLAIM,
    payload: { disableClaimButton }
  }
}

export const doClaimNotify = () => async (
  dispatch: DispatchType,
  getState: GetStateType
) => {
  const state = getState()
  const wif = getWIF(state)
  const address = getAddress(state)
  const net = getNetwork(state)
  const signingFunction = getSigningFunction(state)
  const publicKey = getPublicKey(state)
  const isHardwareClaim = getIsHardwareLogin(state)

  log(net, 'CLAIM', address, { info: 'claim all GAS' })

  let claimGasFn
  if (isHardwareClaim) {
    dispatch(
      showInfoNotification({
        message:
          'Sign transaction 2 of 2 to claim GAS on your hardware device (claiming GAS)',
        autoDismiss: 0
      })
    )
    claimGasFn = () =>
      api.neonDB.doClaimAllGas(net, publicKey, signingFunction)
  } else {
    claimGasFn = () => api.neonDB.doClaimAllGas(net, wif, null)
  }

  const [err, response] = await asyncWrap(claimGasFn())
  if (!err && response.result) {
    dispatch(
      showSuccessNotification({
        message:
          'Claim was successful! Your balance will update once the blockchain has processed it.'
      })
    )
    setTimeout(() => dispatch(disableClaim(false)), FIVE_MINUTES_MS)
  } else {
    return dispatch(showErrorNotification({ message: 'Claim failed' }))
  }
}

// To initiate claim, first send all NEO to own address, the set claimRequest state
// When new claims are available, this will trigger the claim
export const doGasClaim = () => async (
  dispatch: DispatchType,
  getState: GetStateType
) => {
  const state = getState()
  const wif = getWIF(state)
  const address = getAddress(state)
  const net = getNetwork(state)
  const NEO = getNEO(state)
  const signingFunction = getSigningFunction(state)
  const publicKey = getPublicKey(state)
  const isHardwareClaim = getIsHardwareLogin(state)

  // if no NEO in account, no need to send to self first
  if (NEO === '0') {
    return dispatch(doClaimNotify())
  } else {
    dispatch(
      showInfoNotification({
        message: 'Sending NEO to Yourself...',
        autoDismiss: 0
      })
    )
    log(net, 'SEND', address, { to: address, amount: NEO, asset: ASSETS.NEO })

    let sendAssetFn
    if (isHardwareClaim) {
      dispatch(
        showInfoNotification({
          message:
            'Sign transaction 1 of 2 to claim GAS on your hardware device (sending NEO to yourself)',
          autoDismiss: 0
        })
      )
      sendAssetFn = () =>
        api.neonDB.doSendAsset(
          net,
          address,
          publicKey,
          { [ASSETS.NEO]: toNumber(NEO) },
          signingFunction
        )
    } else {
      sendAssetFn = () =>
        api.neonDB.doSendAsset(net, address, wif, { [ASSETS.NEO]: toNumber(NEO) }, null)
    }

    const [err, response] = await asyncWrap(sendAssetFn())
    if (err || response.result === undefined || response.result === false) {
      return dispatch(
        showErrorNotification({ message: 'Transaction failed!' })
      )
    } else {
      dispatch(
        showInfoNotification({
          message: 'Waiting for transaction to clear...',
          autoDismiss: 0
        })
      )
      dispatch(setClaimRequest(true))
      return dispatch(disableClaim(true))
    }
  }
}

// State Getters
export const getClaimRequest = (state: Object) => state.claim.claimRequest
export const getDisableClaimButton = (state: Object) => state.claim.disableClaimButton

const initialState = {
  claimRequest: false,
  disableClaimButton: false
}

export default (state: Object = initialState, action: ReduxAction) => {
  switch (action.type) {
    case SET_CLAIM_REQUEST:
      const { claimRequest } = action.payload
      return {
        ...state,
        claimRequest
      }
    case DISABLE_CLAIM:
      const { disableClaimButton } = action.payload
      return {
        ...state,
        disableClaimButton
      }
    default:
      return state
  }
}
