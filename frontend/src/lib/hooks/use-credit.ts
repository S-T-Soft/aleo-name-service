import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {StatusChangeCallback, Record} from "@/types";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useTransaction} from "@/lib/hooks/use-transaction";
import React from "react";
import {TypeOptions} from "react-toastify";
import toast from "@/components/ui/toast";
import {useClient} from "@/lib/hooks/use-client";
import * as process from "process";
import {getFormattedNameInput} from "@/lib/util";
import {usePrivateFee} from "@/lib/hooks/use-private-fee";

export function useCredit() {
  const FEES_CREDIT_TRANSFER = parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_TRANSFER!);
  const FEES_CREDIT_CLAIM = parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_CLAIM!);
  const FEES_CREDIT_CLAIM_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_CLAIM_PUBLIC!);
  const NETWORK = process.env.NEXT_PUBLIC_NETWORK as WalletAdapterNetwork;

  const {addTransaction} = useTransaction();
  const {getAddress, getNameHash} = useClient();
  const TRANSFER_PROGRAM = process.env.NEXT_PUBLIC_TRANSFER_PROGRAM!;
  const {privateFee} = usePrivateFee();
  const {publicKey, requestRecordPlaintexts, requestTransaction} = useWallet();

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const getCreditRecords = async (amounts: number[], errorWhenMissing: boolean = true) => {
    return new Promise<{plaintext: string}[]>((resolve, reject) => {
      if (amounts.length === 0) {
        resolve([]);
        return;
      }
      requestRecordPlaintexts!("credits.aleo")
      .then((originalRecords) => {
        originalRecords = originalRecords.filter((rec) => !rec.spent && rec.data.microcredits !== "0u64.private");
        // sort amounts in descending order
        let sortedAmounts = amounts
          .map((value, index) => ({ value, index }))
          .sort((a, b) => b.value - a.value);

        let matchedRecords: {plaintext: string}[] = [];
        for (let { value: amount } of sortedAmounts) {
          let match = originalRecords.reduce((acc, rec) => {
            let microcredits = +rec.data.microcredits.substring(0, rec.data.microcredits.length - 11);
            if (microcredits >= amount) {
              if (!acc || microcredits > +acc.data.microcredits.substring(0, acc.data.microcredits.length - 11)) {
                return rec;
              }
            }
            return acc;
          }, null);

          if (match) {
            matchedRecords.push(match);
            originalRecords = originalRecords.filter(rec => rec !== match);
          } else {
            if (errorWhenMissing) {
              reject({"message": "You don't have enough private credits"});
            } else {
              matchedRecords.push({plaintext: ""});
            }
            return;
          }
        }
        console.log(matchedRecords);

        // sort matched records in original order
        matchedRecords = sortedAmounts.map(sa => matchedRecords[sa.index]);

        resolve(matchedRecords);
      }).catch((err) => {
        reject(err);
      });
    });
  };

  const transferCredits = async (method: string, recipient: string, amount: number, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Transferring"});

    if (recipient.indexOf(".") > -1) {
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
    } else if (recipient.trim().length < 63) {
      const message = `Recipient must be a valid address or ANS (****.ans)`;
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    if (recipient === publicKey && (method == "transfer_private" || method == "transfer_public")) {
      const message = "You cannot transfer to yourself";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    amount = amount * 1000000;

    const fee = {
      "transfer_private": 3000,
      "transfer_public": 264000,
      "transfer_private_to_public": 137000,
      "transfer_public_to_private": 137000
    }[method];

    const createTransactionPromise = (method === "transfer_private" || method === "transfer_private_to_public")
      ? getCreditRecords(privateFee ? [amount, fee!] : [amount]).then((records) => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            NETWORK,
            "credits.aleo",
            method,
            [records[0], recipient, amount + "u64"],
            fee!,
            privateFee
          );
          if (requestTransaction)
            return requestTransaction(aleoTransaction);
          else
            throw new Error("requestTransaction is not defined");
        })
      : Promise.resolve().then(() => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            NETWORK,
            "credits.aleo",
            method,
            [recipient, amount + "u64"],
            fee!,
            privateFee
          );
          if (requestTransaction)
            return requestTransaction(aleoTransaction);
          else
            throw new Error("requestTransaction is not defined");
        });

    createTransactionPromise.then((txId) => {
      addTransaction("transferCredits", txId, [], onStatusChange);
    })
    .catch((error) => {
      notify("error", error.message);
      onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
    });
  }

  const transferCreditsToANS = async (recipient: string, amount: number, password: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Transferring"});

    if (recipient.indexOf(".") == -1) {
      const message = `Recipient must be a valid ANS`;
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    amount = amount * 1000000;

    Promise.all([getCreditRecords([amount, FEES_CREDIT_TRANSFER]), getNameHash(recipient)])
      .then(([records, nameHash]) => {
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          NETWORK,
          TRANSFER_PROGRAM,
          "transfer_credits",
          [nameHash, getFormattedNameInput(password, 2), amount + "u64", records[0]],
          FEES_CREDIT_TRANSFER,
          privateFee
        );
        console.log(aleoTransaction);
        if (requestTransaction)
          return requestTransaction(aleoTransaction);
        else
          throw new Error("requestTransaction is not defined");
      })
      .then((txId) => {
        addTransaction("transferCreditsToANS", txId, [], onStatusChange);
      })
      .catch((error) => {
        notify("error", error.message);
        onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
      });
  }

  const claimCreditsFromANS = async (record: Record, amount: number, password: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Claiming"});

    const fee = record.private ? FEES_CREDIT_CLAIM : FEES_CREDIT_CLAIM_PUBLIC;

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      NETWORK,
      TRANSFER_PROGRAM,
      record.private ? "claim_credits_private" : "claim_credits_public",
      [record.private ? record.record : record.nameHash, getFormattedNameInput(password, 2), amount + "u64"],
      fee,
      privateFee
    );
    console.log(aleoTransaction);
    if (requestTransaction) {
      requestTransaction(aleoTransaction).then((txId) => {
        addTransaction("claimCreditsFromANS", txId, [], onStatusChange);
      })
        .catch((error) => {
          notify("error", error.message);
          onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
        });
    } else {
      notify("error", "requestTransaction is not defined");
      onStatusChange && onStatusChange(false, {hasError: true, message: "requestTransaction is not defined"});
    }
  }

  return {getCreditRecords, transferCredits, transferCreditsToANS, claimCreditsFromANS}
}