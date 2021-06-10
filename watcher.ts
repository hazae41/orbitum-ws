import { JsonRpcProvider } from "https://esm.sh/@ethersproject/providers"
import { Contract } from "https://esm.sh/@ethersproject/contracts"
import { getGasPrice, getReserves, getTokenPrice } from "./libs/ethereum.ts";

const PAIR = JSON.parse(await Deno.readTextFile("abi/PAIR.json"));

const ethereum = new JsonRpcProvider(
  "https://eth.orbitum.space",
  { chainId: 1, name: "ethereum" })

export const Uniswap = {
  ETHDAI: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
  ETHWBTC: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940",
  ETHBAT: "0xb6909b960dbbe7392d405429eb2b3649752b4838"
}

export const prices = {
  ETH: new Array<number>(),
  WBTC: new Array<number>(),
  BAT: new Array<number>()
}

const ethdai = new Contract(Uniswap.ETHDAI, PAIR, ethereum)
const ethwbtc = new Contract(Uniswap.ETHWBTC, PAIR, ethereum)
const ethbat = new Contract(Uniswap.ETHBAT, PAIR, ethereum)

function repush<T>(array: T[], item: T) {
  if (array.length === 1024)
    array.shift()
  array.push(item)
}

export async function sync(blockTag: number) {
  const rethdai = await getReserves(ethdai, { blockTag })
  const rethwbtc = await getReserves(ethwbtc, { blockTag })
  const rethbat = await getReserves(ethbat, { blockTag })

  repush(prices.ETH, getGasPrice(rethdai, 18))
  repush(prices.WBTC, getTokenPrice(rethwbtc, 18))
  repush(prices.BAT, getTokenPrice(rethbat, 18))

  console.log(blockTag)
}

for (let i = 0; i < 16; i++)
  await sync(-16 + i)

ethereum.on("block", sync)