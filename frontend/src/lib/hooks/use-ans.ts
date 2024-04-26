import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {getFormattedU128Input, getFormattedNameInput} from "@/lib/util";
import React from "react";
import * as process from "process";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useRecords} from "@/lib/hooks/use-records";
import {CouponCard, Record, StatusChangeCallback, TLD} from "@/types";
import toast from "@/components/ui/toast";
import {TypeOptions} from "react-toastify";
import {useTransaction} from "@/lib/hooks/use-transaction";
import {useCredit} from "@/lib/hooks/use-credit";
import {useClient} from "@/lib/hooks/use-client";
import tlds from "@/config/tlds";
import {usePrivateFee} from "@/lib/hooks/use-private-fee";


export function useANS() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const NEXT_PUBLIC_COUPON_CARD_PROGRAM = process.env.NEXT_PUBLIC_COUPON_CARD_PROGRAM;
  const NEXT_PUBLIC_FEES_REGISTER = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER!);
  const NEXT_PUBLIC_FEES_REGISTER_FREE = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER_FREE!);
  const NEXT_PUBLIC_FEES_REGISTER_COUPON = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER_COUPON!);
  const NEXT_PUBLIC_FEES_REGISTER_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER_PUBLIC!);
  const NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC!);
  const NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE = parseInt(process.env.NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE!);
  const NEXT_PUBLIC_FEES_SET_PRIMARY = parseInt(process.env.NEXT_PUBLIC_FEES_SET_PRIMARY!);
  const NEXT_PUBLIC_FEES_UNSET_PRIMARY = parseInt(process.env.NEXT_PUBLIC_FEES_UNSET_PRIMARY!);
  const NEXT_PUBLIC_FEES_SET_RESOLVER_RECORD = parseInt(process.env.NEXT_PUBLIC_FEES_SET_RESOLVER_RECORD!);
  const NEXT_PUBLIC_FEES_TRANSFER_PRIVATE = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE!);
  const NEXT_PUBLIC_FEES_TRANSFER_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC!);

  const {records} = useRecords();
  const {addTransaction} = useTransaction();
  const {getCreditRecords} = useCredit();
  const {getAddress, getName} = useClient();
  const {privateFee} = usePrivateFee();
  const {publicKey, requestTransaction, requestRecordPlaintexts} = useWallet();

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const matchTld = (name: string) => {
    const is_valid = /^([a-z0-9-_]{1,64}\.)+[a-z]{1,10}$/.test(name);
    if (!is_valid) {
      return undefined;
    }
    return tlds.find(tld => name.endsWith(`.${tld.name}`));
  }

  const calcPrice = (name: string, tld: TLD, card: CouponCard | null) => {
    const length = name.length;
    const maxKey = Math.max(...Object.keys(tld.prices).map(Number));
    const priceKey = Math.min(length, maxKey);
    const price = tld.prices[priceKey];
    if (card && card.limit_name_length <= name.length) {
      return price * card.discount_percent / 100;
    }
    return price;
  }

  const getCouponCards = async (name: string, tld: TLD) => {
    return new Promise<CouponCard[]>((resolve, reject) => {
      requestRecordPlaintexts!(NEXT_PUBLIC_COUPON_CARD_PROGRAM!).then((records) => {
        return Promise.all(records.filter((rec) => !rec.spent).map(async (rec) => {
          const limit_name_length = parseInt(rec.data.limit_name_length.replace("u8.private", ""));
          let tld = rec.data.tld.replace(".private", "");
          if (tld == '0field') {
            tld = "";
          } else {
            tld = (await getName(tld)).name;
          }
          return {
            id: rec.ciphertext,
            discount_percent: parseInt(rec.data.discount_percent.replace("u8.private", "")),
            limit_name_length,
            tld: tld,
            enable: limit_name_length <= name.length,
            record: rec
          } as CouponCard;
        }));
      }).then((records) => {
        resolve(records.filter(rec => rec.tld == "" || rec.tld == tld.name)
          .sort((a, b) => {
            if (a.enable === b.enable) {
              if (a.limit_name_length === b.limit_name_length) {
                return a.discount_percent - b.discount_percent;
              }
              return b.limit_name_length - a.limit_name_length;
            }
            return a.enable ? -1 : 1;
          }))
      }).catch(() => {
        resolve([]);
      });
    })
  }

  const register = async (name: string, tld: TLD, card: CouponCard | null, isPrivate: boolean, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();

    onStatusChange && onStatusChange(true, {hasError: false, message: "Registering"});

    let price = calcPrice(name, tld, card);
    let functionName = "register_fld";
    let fee = NEXT_PUBLIC_FEES_REGISTER;
    let amounts = [price];
    if (price === 0) {
      functionName = "register_free";
      fee = NEXT_PUBLIC_FEES_REGISTER_FREE;
      amounts = [];
    } else if (card) {
      functionName = "register_fld_with_coupon";
      fee = NEXT_PUBLIC_FEES_REGISTER_COUPON;
    }
    if (isPrivate) {
      amounts.push(NEXT_PUBLIC_FEES_REGISTER);
    }

    getCreditRecords(amounts)
      .then((records) => {
        let inputs: any[] = [getFormattedNameInput(name, 4), tld.hash, publicKey];
        if (functionName != "register_free") {
          inputs.push(records[0]);
        }
        if (card) {
          inputs.push(card.record);
        }
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          WalletAdapterNetwork.Testnet,
          tld.registrar,
          functionName,
          inputs,
          fee,
          isPrivate // use private fee, or will leak the user address information
        );

        console.log(aleoTransaction);

        if (requestTransaction)
          return requestTransaction(aleoTransaction);
        else
          throw new Error("requestTransaction is not defined");
      })
      .then((txId) => {
        addTransaction("register", txId, [name], onStatusChange);
      })
      .catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
  }

  const registerSubName = async (name: string, parentRecord: Record, isPrivate: boolean, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();

    onStatusChange && onStatusChange(true, {hasError: false, message: "Registering"});

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NEXT_PUBLIC_PROGRAM!,
      "register_" + (parentRecord.private ? "private" : "public"),
      [getFormattedNameInput(name, 4),
        parentRecord.private ? parentRecord.record : parentRecord.nameHash,
        publicKey, '0u128'],
      NEXT_PUBLIC_FEES_REGISTER_PUBLIC,
      isPrivate // use private fee, or will leak the user address information
    );

    requestTransaction && requestTransaction(
        aleoTransaction
      ).then((txId) => {
        addTransaction("registerSubdomain", txId, [name], onStatusChange);
      }).catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
  }

  const transfer = async (name: string, recipient: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Transferring"});

    if (recipient.endsWith(".ans")) {
      try {
        const address = await getAddress(recipient);
        if (address.startsWith("Private")) {
          const message = `${recipient} is ${address}`;
          notify("error", message);
          onStatusChange && onStatusChange(false, {hasError: true, message});
          return;
        }
        recipient = address;
      } catch (e) {
        // @ts-ignore
        const message = e.message;
        notify("error", message);
        onStatusChange && onStatusChange(false, {hasError: true, message});
        return;
      }
    }

    if (recipient === publicKey) {
      const message = "You cannot transfer a name to yourself";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    const record = records?.find((rec) => rec.name === name);

    if (record) {
      const inputs = [recipient];
      let fee = NEXT_PUBLIC_FEES_TRANSFER_PUBLIC;
      if (record.private) {
        fee = NEXT_PUBLIC_FEES_TRANSFER_PRIVATE;
        inputs.splice(0, 0, record.record);
      } else {
        inputs.push(record.nameHash as string);
      }
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        `transfer_${record.private ? "private" : "public"}`,
        inputs,
        fee,
        privateFee
      );
      requestTransaction && requestTransaction(aleoTransaction).then((txId) => {
        addTransaction("transfer", txId, [name], onStatusChange);
      }).catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
    } else {
      const message = "You don't own this name";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }
  }

  const convertToPublic = async (name: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true,  {hasError: false, message: "Converting"});

    const record = records?.find((rec) => rec.name === name);

    if (record) {
      if (!record.private) {
        const message = "This name is already public";
        notify("error", message);
        onStatusChange && onStatusChange(false, {hasError: true, message});
        return;
      }
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        "convert_private_to_public",
        [record.record, publicKey],
        NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC,
        privateFee
      );
      requestTransaction && requestTransaction(
        aleoTransaction
      ).then((txId) => {
        addTransaction("convertToPublic", txId, [name], onStatusChange);
      }).catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
    } else {
      const message = "You don't own this name";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }
  }

  const convertToPrivate = async (name: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Converting"});

    const record = records?.find((rec) => rec.name === name);

    if (record) {
      if (record.private) {
        const message = "This name is already private";
        notify("error", message);
        onStatusChange && onStatusChange(false, {hasError: true, message});
        return;
      }

      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        "convert_public_to_private",
        [record.nameHash, publicKey],
        NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE,
        privateFee
      );
      if (requestTransaction)
        requestTransaction(aleoTransaction).then((txId) => {
            addTransaction("convertToPrivate", txId, [name], onStatusChange);
          }).catch((error) => {
          notify("error", error.message);
          onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
        });
    } else {
      const message = "You don't own this name";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }
  }

  const setPrimaryName = async (name: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Setting"});

    const record = records?.find((rec) => rec.name === name);

    if (record) {
      if (record.private) {
        const message = "Only public names can be set as primary name";
        notify("error", message);
        onStatusChange && onStatusChange(false, {hasError: true, message});
        return;
      }

      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        "set_primary_name",
        [record.nameHash],
        NEXT_PUBLIC_FEES_SET_PRIMARY,
        privateFee
      );

      requestTransaction && requestTransaction(aleoTransaction)
        .then((txId) => {
          addTransaction("setPrimaryName", txId, [name], onStatusChange);
        }).catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
    } else {
      const message = "You don't own this name";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }
  }

  const unsetPrimaryName = async (onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Unsetting"});

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NEXT_PUBLIC_PROGRAM!,
      "unset_primary_name",
      [],
      NEXT_PUBLIC_FEES_UNSET_PRIMARY,
      privateFee
    );

    requestTransaction && requestTransaction(aleoTransaction)
      .then((txId) => {
        addTransaction("unsetPrimaryName", txId, [], onStatusChange);
      }).catch((error) => {
      notify("error", error.message);
      onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
    });
  }

  const setResolverRecord = async (name: string, category: string, content: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Setting"});

    const record = records?.find((rec) => rec.name === name);

    if (record) {
      if (record.private) {
        const message = "Only public names can set resolvers";
        notify("error", message);
        onStatusChange && onStatusChange(false, {hasError: true, message});
        return;
      }

      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        "set_resolver_record",
        [record.nameHash, getFormattedU128Input(category), getFormattedNameInput(content, 8)],
        NEXT_PUBLIC_FEES_SET_RESOLVER_RECORD,
        privateFee
      );

      requestTransaction && requestTransaction(aleoTransaction)
        .then((txId) => {
          addTransaction("setResolverRecord", txId, [name], onStatusChange);
        }).catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
    } else {
      const message = "You don't own this name";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }
  }

  const unsetResolverRecord = async (name: string, category: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Unsetting"});

    const record = records?.find((rec) => rec.nameHash === name);

    if (record) {
      if (record.private) {
        const message = "Only public names can unset resolvers";
        notify("error", message);
        onStatusChange && onStatusChange(false, {hasError: true, message});
        return;
      }

      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        "unset_resolver_record",
        [record.nameHash, getFormattedU128Input(category)],
        NEXT_PUBLIC_FEES_UNSET_PRIMARY,
        privateFee
      );

      requestTransaction && requestTransaction(aleoTransaction)
        .then((txId) => {
          addTransaction("unsetResolverRecord", txId, [name], onStatusChange);
        }).catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
    } else {
      const message = "You don't own this name";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }
  }

  return {register, transfer, convertToPrivate, convertToPublic, setPrimaryName, unsetPrimaryName,
    setResolverRecord, unsetResolverRecord, calcPrice, registerSubName, getCouponCards, matchTld};
}