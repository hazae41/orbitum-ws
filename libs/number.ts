import { BigNumber } from "../deps/ethers.ts";

function tens(power: number) {
  return BigNumber.from(10).pow(power)
}

export function getFloating(number: BigNumber, decimals = 18) {
  if (number.gt(tens(decimals)))
    return Number(number.div(tens(decimals)))
  else
    return Number(number) / Math.pow(10, 18)
}
