import { Contract, providers } from "./deps/ethers.ts"
import { getABPrice, getReserves, getBAPrice } from "./libs/ethereum.ts";

const PAIR = JSON.parse(await Deno.readTextFile("abi/PAIR.json"));

export const ethereum = new providers.JsonRpcProvider(
  "https://eth.orbitum.space",
  { chainId: 1, name: "ethereum" })

export const polygon = new providers.JsonRpcProvider(
  "https://polygon-rpc.com/",
  { chainId: 137, name: "polygon" })

export const Uniswap = {
  ETH_DAI: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
  ETH_WBTC: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
}

export const Quickswap = {
  MATIC_ORBTM: "0x0D64A856beb63b3f4FC5A98Eca51f757ffdA0BEd",
  MATIC_USDC: "0x6e7a5fafcec6bb1e78bae2a1f0b612012bf14827"
}

export const prices = {
  ETH: new Array<number>(),
  WBTC: new Array<number>(),
  ORBTM: new Array<number>(),
  MATIC: new Array<number>()
}

const ETH_DAI = new Contract(Uniswap.ETH_DAI, PAIR, ethereum)
const ETH_WBTC = new Contract(Uniswap.ETH_WBTC, PAIR, ethereum)

const MATIC_USDC = new Contract(Quickswap.MATIC_USDC, PAIR, polygon)
const MATIC_ORBTM = new Contract(Quickswap.MATIC_ORBTM, PAIR, polygon)

function repush<T>(array: T[], item: T) {
  if (array.length === 1024)
    array.shift()
  array.push(item)
}

ethereum.on("block", async (i: number) => {
  try {
    const rETH_DAI = await getReserves(ETH_DAI)
    const rETH_WBTC = await getReserves(ETH_WBTC)

    const pETH = getABPrice(rETH_DAI, 18, 18)
    const pWBTC = getBAPrice(rETH_WBTC, 8, 18)

    repush(prices.ETH, pETH)
    repush(prices.WBTC, pWBTC * pETH)
  } catch (e: unknown) {
    console.error(e)
  }
})

polygon.on("block", async (i: number) => {
  try {
    const rMATIC_USDC = await getReserves(MATIC_USDC)
    const rMATIC_ORBTM = await getReserves(MATIC_ORBTM)

    const pMATIC = getBAPrice(rMATIC_USDC, 18, 6)
    const pORBTM = getABPrice(rMATIC_ORBTM, 18, 18)

    repush(prices.MATIC, pMATIC)
    repush(prices.ORBTM, pORBTM * pMATIC)
  } catch (e: unknown) {
    console.error(e)
  }
})