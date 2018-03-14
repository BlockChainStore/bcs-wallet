// @flow
import React from 'react'
import classNames from 'classnames'
import ArrowForward from 'react-icons/lib/md/arrow-forward'

import Button from '../../Button'
import NumberInput from '../../NumberInput'
import AddressInput from '../../Inputs/AddressInput'
import AssetInput from '../../Inputs/AssetInput'

import { formatBalance, COIN_DECIMAL_LENGTH } from '../../../core/formatters'
import { isToken } from '../../../core/wallet'

import styles from './AddRecipientDisplay.scss'

type Props = {
  balances: Object,
  onConfirm: Function,
  onCancel: Function
}

type State = {
  address: string,
  amount: string,
  symbol: SymbolType
}

export default class AddRecipientDisplay extends React.Component<Props, State> {
  state = {
    address: '',
    amount: '',
    symbol: Object.keys(this.props.balances)[0]
  }

  render = () => {
    const { balances, onCancel } = this.props
    const { address, amount, symbol } = this.state

    const balance = balances[symbol]
    const max = formatBalance(symbol, balance)

    return (
      <div className={styles.addRecipientDisplay}>
        <div className={styles.inputs}>
          <div className={styles.row}>
            <div id='sendAmount' className={styles.column}>
              <label className={styles.label}>Amount:</label>
              <NumberInput
                max={balance}
                value={amount}
                placeholder='Amount'
                options={{ numeralDecimalScale: COIN_DECIMAL_LENGTH }}
                onChange={(value) => this.handleChange('amount', value)} />
              <label className={styles.label}>
                ({max} {symbol} Available)
              </label>
            </div>
            <div className={styles.column}>
              <label className={styles.label}>Asset:</label>
              <AssetInput
                symbols={this.getSymbols()}
                value={symbol}
                onChange={(value) => this.handleChange('symbol', value)} />
            </div>
            <div className={classNames(styles.column, styles.sendToIcon)}>
              <ArrowForward />
            </div>
            <div id='sendAddress' className={classNames(styles.column, styles.recipient)}>
              <label className={styles.label}>Address:</label>
              <AddressInput
                placeholder='Recipient Address'
                value={address}
                onChange={(value) => this.handleChange('address', value)} />
            </div>
          </div>
        </div>
        <div className={styles.messages}>
          {isToken(symbol) && (
            <div className={styles.tokenInfoMessage}>Sending NEP5 tokens requires holding at least 1 drop of GAS</div>
          )}
        </div>
        <div className={styles.actions}>
          <Button cancel onClick={onCancel}>
            Cancel
          </Button>
          <Button id='doSend' disabled={!this.canConfirm()} onClick={this.handleConfirm}>
            Next
          </Button>
        </div>
      </div>
    )
  }

  handleChange = (key: string, value: string) => {
    this.setState({ [key]: value })
  }

  handleConfirm = () => {
    const { address, amount, symbol } = this.state
    this.props.onConfirm({ address, amount, symbol })
  }

  canConfirm = () => {
    const { address, amount } = this.state
    return !!address && !!amount
  }

  getSymbols = () => {
    return Object.keys(this.props.balances)
  }
}
