import {WalletAdapterNetwork} from "@demox-labs/aleo-wallet-adapter-base";
import * as process from "process";

const env = {
  REGISTRY_PROGRAM: process.env.NEXT_PUBLIC_PROGRAM!,
  REGISTER_QUEST_PROGRAM: process.env.NEXT_PUBLIC_REGISTER_QUEST_PROGRAM!,
  COUPON_CARD_PROGRAM: process.env.NEXT_PUBLIC_COUPON_CARD_PROGRAM!,
  RESOLVER_PROGRAM: process.env.NEXT_PUBLIC_RESOLVER_PROGRAM!,
  TRANSFER_PROGRAM: process.env.NEXT_PUBLIC_TRANSFER_PROGRAM!,
  CREDIT_PROGRAM: "credits.aleo",
  MTSP_PROGRAM: "token_registry.aleo",
  ENABLE_CREDIT_TRANSFER: process.env.NEXT_PUBLIC_ENABLE_CREDIT_TRANSFER === "true",
  FEES: {
    REGISTER: parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER!),
    REGISTER_FREE: parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER_FREE!),
    REGISTER_COUPON: parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER_COUPON!),
    REGISTER_PUBLIC: parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER_PUBLIC!),
    CONVERT_TO_PUBLIC: parseInt(process.env.NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC!),
    CONVERT_TO_PRIVATE: parseInt(process.env.NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE!),
    SET_PRIMARY: parseInt(process.env.NEXT_PUBLIC_FEES_SET_PRIMARY!),
    UNSET_PRIMARY: parseInt(process.env.NEXT_PUBLIC_FEES_UNSET_PRIMARY!),
    SET_RESOLVER_RECORD: parseInt(process.env.NEXT_PUBLIC_FEES_SET_RESOLVER_RECORD!),
    SET_RESOLVER_RECORD_PUBLIC: parseInt(process.env.NEXT_PUBLIC_FEES_SET_RESOLVER_RECORD_PUBLIC!),
    UNSET_RESOLVER_RECORD: parseInt(process.env.NEXT_PUBLIC_FEES_UNSET_RESOLVER_RECORD!),
    UNSET_RESOLVER_RECORD_PUBLIC: parseInt(process.env.NEXT_PUBLIC_FEES_UNSET_RESOLVER_RECORD_PUBLIC!),
    TRANSFER_PRIVATE: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE!),
    TRANSFER_PUBLIC: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC!),
    CREDIT_TRANSFER: parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_TRANSFER!),
    CREDIT_CLAIM: parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_CLAIM!),
    CREDIT_CLAIM_PUBLIC: parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_CLAIM_PUBLIC!),
    TRANSFER_PRIVATE_CREDITS: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_CREDITS!),
    TRANSFER_PUBLIC_CREDITS: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_CREDITS!),
    TRANSFER_PUBLIC_TO_PRIVATE_CREDITS: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_TO_PRIVATE_CREDITS!),
    TRANSFER_PRIVATE_TO_PUBLIC_CREDITS: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_TO_PUBLIC_CREDITS!),
    TRANSFER_PRIVATE_ARC21: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_ARC21!),
    TRANSFER_PUBLIC_ARC21: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_ARC21!),
    TRANSFER_PUBLIC_TO_PRIVATE_ARC21: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_TO_PRIVATE_ARC21!),
    TRANSFER_PRIVATE_TO_PUBLIC_ARC21: parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_TO_PUBLIC_ARC21!)
  },
  NETWORK: process.env.NEXT_PUBLIC_NETWORK as WalletAdapterNetwork,
  DEBUG_ADDR: process.env.NEXT_PUBLIC_DEBUG_ADDR,
  GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL ? process.env.NEXT_PUBLIC_GATEWAY_URL : "https://gateway.pinata.cloud/ipfs/",
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL!,
  EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL!,
  GO_URL: process.env.NEXT_PUBLIC_GO_URL!
};

export default env;