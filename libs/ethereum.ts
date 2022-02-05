import { BigNumber, Contract } from "../deps/ethers.ts";
import { getFloating } from "./number.ts";

export async function getReserves(pair: Contract) {
  return await (pair as any).getReserves() as [BigNumber, BigNumber]
}

export function getABPrice(
  reserve: [BigNumber, BigNumber],
  da: number, db: number
) {
  const [a, b] = reserve
  const x = getFloating(a, da)
  const y = getFloating(b, db)
  return x / y
}

export function getBAPrice(
  reserve: [BigNumber, BigNumber],
  da: number, db: number
) {
  const [a, b] = reserve
  const x = getFloating(a, da)
  const y = getFloating(b, db)
  return y / x
}