import {TLD} from "@/types";

const tlds: TLD[] = [
  {
    name: "ans",
    hash: "559532657689873513833888656958509165446284001025178663602770230581478239512field",
    registrar: process.env.NEXT_PUBLIC_REGISTER_PROGRAM!,
    prices: {
      1: 1250000000,
      2: 250000000,
      3: 50000000,
      4: 10000000,
      5: 2000000
    }
  }
];

export default tlds;