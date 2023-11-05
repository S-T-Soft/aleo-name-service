import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {padArray, splitStringToBigInts, stringToBigInt} from "@/lib/util";
import React from "react";
import * as process from "process";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useRecords} from "@/lib/hooks/use-records";
import {Record, StatusChangeCallback} from "@/types";
import toast from "@/components/ui/toast";
import {TypeOptions} from "react-toastify";
import {useTransaction} from "@/lib/hooks/use-transaction";
import {useCredit} from "@/lib/hooks/use-credit";
import {useClient} from "@/lib/hooks/use-client";


export function useANS() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const NEXT_PUBLIC_REGISTRAR_PROGRAM = process.env.NEXT_PUBLIC_REGISTRAR_PROGRAM;
  const NEXT_PUBLIC_FEES_REGISTER = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER!);
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
  const {getCreditRecord} = useCredit();
  const {getAddress} = useClient();
  const {publicKey, requestTransaction} = useWallet();

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const getFormattedU128Input = (str: string) => {
    const bint = stringToBigInt(str);
    return `${bint}u128`;
  }

  const getFormattedNameInput = (name: string) => {
    const nameInputs = padArray(splitStringToBigInts(name), 4);
    return [`${nameInputs[0]}u128`, `${nameInputs[1]}u128`, `${nameInputs[2]}u128`, `${nameInputs[3]}u128`];
  }

  const calcPrice = (name: string) => {
    let price = 1250000000;
    for (let i = 1; i < name.length; i++) {
      price = Math.max(2000000, price / 5);
    }
    return price;
  }

  const register = async (name: string, isPrivate: boolean, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();

    onStatusChange && onStatusChange(true, {hasError: false, message: "Registering"});

    let price = calcPrice(name);

    getCreditRecord(price, isPrivate ? 2 : 1)
      .then((record) => {
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          WalletAdapterNetwork.Testnet,
          NEXT_PUBLIC_REGISTRAR_PROGRAM!,
          "register_fld",
          [getFormattedNameInput(name), publicKey, record],
          NEXT_PUBLIC_FEES_REGISTER,
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
      [getFormattedNameInput(name),
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
        record.private  // private record use private fee, public record use public fee
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
        false
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
        false
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
        false
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
      false
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
        [record.nameHash, getFormattedU128Input(category), getFormattedNameInput(content)],
        NEXT_PUBLIC_FEES_SET_RESOLVER_RECORD,
        false
      );

      requestTransaction && requestTransaction(aleoTransaction)
        .then((txId) => {
          addTransaction("setResolver", txId, [name], onStatusChange);
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
        false
      );

      requestTransaction && requestTransaction(aleoTransaction)
        .then((txId) => {
          addTransaction("unsetResolver", txId, [name], onStatusChange);
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
    setResolver: setResolverRecord, unsetResolver: unsetResolverRecord, calcPrice, getFormattedNameInput,
    registerSubName};
}