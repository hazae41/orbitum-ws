import { Contract, providers } from "./deps/ethers.ts"
import { getABPrice, getReserves, getBAPrice } from "./libs/ethereum.ts";

const PAIR = JSON.parse(await Deno.readTextFile("abi/PAIR.json"));

const ethereum = new providers.JsonRpcProvider(
  "https://eth.orbitum.space",
  { chainId: 1, name: "ethereum" })

export const binance = new providers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org",
  { chainId: 56, name: "binance" })

export const Uniswap = {
  ETHDAI: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
  ETHWBTC: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
  ETHBAT: "0xb6909b960dbbe7392d405429eb2b3649752b4838"
}

export const Pancakeswap = {
  WBNBBUSD: "0x1b96b92314c44b159149f7e0303511fb2fc4774f",
  WBNBORBTM: "0x21210adab172cacc38ab95a51efe6c011ae7ddba"
}

export const prices = {
  ETH: new Array<number>(),
  WBTC: new Array<number>(),
  BAT: new Array<number>(),
  WBNB: new Array<number>(),
  ORBTM: new Array<number>()
}

const ethdai = new Contract(Uniswap.ETHDAI, PAIR, ethereum)
const ethwbtc = new Contract(Uniswap.ETHWBTC, PAIR, ethereum)
const ethbat = new Contract(Uniswap.ETHBAT, PAIR, ethereum)

const wbnbbusd = new Contract(Pancakeswap.WBNBBUSD, PAIR, binance)
const wbnborbtm = new Contract(Pancakeswap.WBNBORBTM, PAIR, binance)

function repush<T>(array: T[], item: T) {
  if (array.length === 1024)
    array.shift()
  array.push(item)
}

ethereum.on("block", async (blockTag: number) => {
  try {
    const rethdai = await getReserves(ethdai, { blockTag })
    const rethwbtc = await getReserves(ethwbtc, { blockTag })
    const rethbat = await getReserves(ethbat, { blockTag })

    const eth = getABPrice(rethdai, 18, 18)
    const wbtc = getBAPrice(rethwbtc, 18, 8)
    const bat = getBAPrice(rethbat, 18, 18)

    repush(prices.ETH, eth)
    repush(prices.WBTC, wbtc * eth)
    repush(prices.BAT, bat * eth)
  } catch (e: unknown) {
    console.error(e)
  }
})

binance.on("block", async (blockTag: number) => {
  try {
    const rwbnbbusd = await getReserves(wbnbbusd, { blockTag })
    const rwbnborbtm = await getReserves(wbnborbtm, { blockTag })

    const wbnb = getBAPrice(rwbnbbusd, 18, 18)
    const orbtm = getABPrice(rwbnborbtm, 18, 18)

    repush(prices.WBNB, wbnb)
    repush(prices.ORBTM, orbtm * wbnb)
  } catch (e: unknown) {
    console.error(e)
  }
})