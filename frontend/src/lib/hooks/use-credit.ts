import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {StatusChangeCallback} from "@/types";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useTransaction} from "@/lib/hooks/use-transaction";
import React from "react";
import {TypeOptions} from "react-toastify";
import toast from "@/components/ui/toast";
import {useClient} from "@/lib/hooks/use-client";
import {useModal} from "@/components/modal-views/context";

export function useCredit() {
  const { openModal } = useModal();
  const {addTransaction} = useTransaction();
  const {getAddress} = useClient();
  const {publicKey, requestRecordPlaintexts, requestTransaction} = useWallet();

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const getCreditRecords = async (amounts: number[]) => {
    return new Promise<{plaintext: string}[]>((resolve, reject) => {
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
            reject({"message": "You don't have enough private credits"});
            return;
          }
        }

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
      ? getCreditRecords([amount, fee!]).then((records) => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            WalletAdapterNetwork.Testnet,
            "credits.aleo",
            method,
            [records[0], recipient, amount + "u64"],
            fee!
          );
          if (requestTransaction)
            return requestTransaction(aleoTransaction);
          else
            throw new Error("requestTransaction is not defined");
        })
      : Promise.resolve().then(() => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            WalletAdapterNetwork.Testnet,
            "credits.aleo",
            method,
            [recipient, amount + "u64"],
            fee!,
            false
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

  return {getCreditRecords, transferCredits}
}