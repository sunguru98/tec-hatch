import React, { useState, useEffect } from 'react'
import { Text } from '@tecommons/ui'
import styled from 'styled-components'
import { formatBigNumber, toDecimals } from '../../utils/bn-utils'
import { useAppState } from '../../providers/AppState'
import { useUserState } from '../../providers/UserState'

export default ({ value, onError }) => {
  const {
    config: {
      hatchConfig: {
        contributionToken: {
          symbol: contributionSymbol,
          decimals: contributionDecimals,
        },
        token: { symbol, decimals },
        exchangeRate,
      },
    },
  } = useAppState()
  const { allowedContributionAmount, collateralBalance } = useUserState()
  const [evaluatedPrice, setEvaluatedPrice] = useState(null)
  const [formattedValue, setFormattedValue] = useState(formatBigNumber(0, 0))

  // recalculate price when amount changed
  useEffect(() => {
    const valueBn = toDecimals(value, contributionDecimals)
    if (collateralBalance.lt(valueBn)) {
      // cannot mint more than your own balance
      setFormattedValue(formatBigNumber(valueBn, contributionDecimals))
      setEvaluatedPrice(null)
      onError(false, `Your ${contributionSymbol} balance is not sufficient`)
    } else if (allowedContributionAmount.lt(valueBn)) {
      setFormattedValue(formatBigNumber(valueBn, contributionDecimals))
      setEvaluatedPrice(null)
      onError(
        false,
        `You can contribute a maximum of ${formatBigNumber(
          allowedContributionAmount,
          contributionDecimals
        )} ${contributionSymbol}`
      )
    } else if (value?.length && value > 0) {
      // only try to evaluate when an amount is entered, and valid
      setFormattedValue(formatBigNumber(valueBn, contributionDecimals))
      setEvaluatedPrice(formatBigNumber(exchangeRate.times(valueBn), decimals))
      onError(true, null)
    } else {
      // if input is empty, reset to default values and disable order button
      setFormattedValue(formatBigNumber(0, 0))
      setEvaluatedPrice(null)
      onError(false, null)
    }
  }, [
    value,
    decimals,
    contributionDecimals,
    contributionSymbol,
    exchangeRate,
    onError,
    collateralBalance,
    allowedContributionAmount,
  ])

  return (
    <div css="display: flex; justify-content: space-between; padding: 0 5px;">
      <div>
        <Text weight="bold">TOTAL</Text>
      </div>
      <div css="display: flex; flex-direction: column">
        <div css="display: flex; justify-content: flex-end;">
          <AmountField weight="bold">{formattedValue}</AmountField>
          <Text weight="bold">{contributionSymbol}</Text>
        </div>
        <div css="display: flex; justify-content: flex-end;">
          {evaluatedPrice && (
            <AmountField color="grey">~{evaluatedPrice}</AmountField>
          )}
          {evaluatedPrice && <Text color="grey">{symbol}</Text>}
        </div>
      </div>
    </div>
  )
}

const AmountField = styled(Text)`
  margin-right: 10px;
`
