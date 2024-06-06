import {TLD} from "@/types";

const tlds: TLD[] = [
  {
    name: "ans",
    hash: "3601410589032411677092457044111621862970800028849492457114786804129430260029field",
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