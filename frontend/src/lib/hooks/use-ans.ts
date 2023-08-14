import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {padArray, splitStringToBigInts} from "@/lib/util";
import React, {useEffect, useState} from "react";
import * as process from "process";
import {LeoWalletAdapter} from "@demox-labs/aleo-wallet-adapter-leo";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useRecords} from "@/lib/hooks/use-records";
import {StatusChangeCallback} from "@/types";
import toast from "@/components/ui/toast";
import {TypeOptions} from "react-toastify";
import {useTransaction} from "@/lib/hooks/use-transaction";
import {useCredit} from "@/lib/hooks/use-credit";
import {useClient} from "@/lib/hooks/use-client";


export function useANS() {
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const NEXT_PUBLIC_FEES_REGISTER = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER!);
  const NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC!);
  const NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE = parseInt(process.env.NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE!);
  const NEXT_PUBLIC_FEES_SET_PRIMARY = parseInt(process.env.NEXT_PUBLIC_FEES_SET_PRIMARY!);
  const NEXT_PUBLIC_FEES_UNSET_PRIMARY = parseInt(process.env.NEXT_PUBLIC_FEES_UNSET_PRIMARY!);
  const NEXT_PUBLIC_FEES_TRANSFER_PRIVATE = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE!);
  const NEXT_PUBLIC_FEES_TRANSFER_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC!);

  const {records, refreshRecords} = useRecords();
  const {addTransaction} = useTransaction();
  const {getCreditRecord} = useCredit();
  const {getAddress, getNameHash} = useClient();
  const {wallet, publicKey} = useWallet();

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const getFormattedNameInput = (name: string) => {
    const nameInputs = padArray(splitStringToBigInts(name), 4);
    return `{data1: ${nameInputs[0]}u128, data2: ${nameInputs[1]}u128, data3: ${nameInputs[2]}u128, data4: ${nameInputs[3]}u128}`;
  }

  const getFormattedTokenIdInput = async (name: string) => {
    const names = name.split(".");
    const nameInputs = padArray(splitStringToBigInts(names[0]), 4);
    let parent = '0field';
    if (names.length > 1) {
      const parentName = names.slice(0, names.length - 1).join(".");
      parent = await getNameHash(parentName);
    }
    return `{data1: ${nameInputs[0]}u128, data2: ${nameInputs[1]}u128, data3: ${nameInputs[2]}u128, data4: ${nameInputs[3]}u128, parent: ${parent}}`;
  }

  const register = async (name: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();

    onStatusChange && onStatusChange(true, {hasError: false, message: "Registering"});

    getCreditRecord(5000000, 2)
      .then((record) => {
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          WalletAdapterNetwork.Testnet,
          NEXT_PUBLIC_PROGRAM!,
          "register",
          [getFormattedNameInput(name), publicKey, record],
          NEXT_PUBLIC_FEES_REGISTER
        );

        return (wallet?.adapter as LeoWalletAdapter).requestTransaction(
          aleoTransaction
        );
      })
      .then((txId) => {
        addTransaction("register", txId, [name], onStatusChange);
      })
      .catch((error) => {
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
        inputs.push(record.name_hash as string);
      }
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NEXT_PUBLIC_PROGRAM!,
        `transfer_${record.private ? "private" : "public"}`,
        inputs,
        fee
      );
      (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      ).then((txId) => {
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

    await refreshRecords("manual");

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
        [record.record],
        NEXT_PUBLIC_FEES_CONVERT_TO_PUBLIC
      );
      (wallet?.adapter as LeoWalletAdapter).requestTransaction(
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

      getFormattedTokenIdInput(record.name)
        .then((formattedTokenId) => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            WalletAdapterNetwork.Testnet,
            NEXT_PUBLIC_PROGRAM!,
            "convert_public_to_private",
            [formattedTokenId],
            NEXT_PUBLIC_FEES_CONVERT_TO_PRIVATE
          );
          return (wallet?.adapter as LeoWalletAdapter).requestTransaction(
            aleoTransaction
          );
        })
        .then((txId) => {
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
        [record.name_hash],
        NEXT_PUBLIC_FEES_SET_PRIMARY
      );

      (wallet?.adapter as LeoWalletAdapter).requestTransaction(
        aleoTransaction
      )
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
      NEXT_PUBLIC_FEES_UNSET_PRIMARY
    );

    (wallet?.adapter as LeoWalletAdapter).requestTransaction(
      aleoTransaction
    )
      .then((txId) => {
        addTransaction("unsetPrimaryName", txId, [], onStatusChange);
      }).catch((error) => {
      notify("error", error.message);
      onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
    });
  }

  return {register, transfer, convertToPrivate, convertToPublic, setPrimaryName, unsetPrimaryName};
}