import {TLD} from "@/types";

const parsePrices = (name: string) => {
  let prices = "";
  switch (name) {
    case "ans":
      prices = process.env.NEXT_PUBLIC_PRICES_ANS || "9999,250,50,10,2";
      break;
    default:
      return {};
  }
  const obj = {};
  prices.trim().split(",").forEach((price: string, index: number) => {
    obj[index + 1] = parseInt(price) * 1000000;
  });
  return obj;
}

const tlds: TLD[] = [
  {
    name: "ans",
    hash: "559532657689873513833888656958509165446284001025178663602770230581478239512field",
    registrar: process.env.NEXT_PUBLIC_REGISTER_PROGRAM!,
    prices: parsePrices("ans")
  }
];

export default tlds;