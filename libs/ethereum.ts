import { BigNumber, Contract } from "../deps/ethers.ts";
import { getFloating } from "./number.ts";

export async function getReserves(pair: Contract, options: any) {
  return await pair.getReserves(options) as [BigNumber, BigNumber]
}

export function getGasPrice(reserve: [BigNumber, BigNumber], decimals: number) {
  const [a, b] = reserve
  const x = getFloating(a, 18)
  const y = getFloating(b, decimals)
  return x / y
}

export function getTokenPrice(reserve: [BigNumber, BigNumber], decimals: number) {
  const [a, b] = reserve
  const x = getFloating(a, decimals)
  const y = getFloating(b, 18)
  return y / x
}