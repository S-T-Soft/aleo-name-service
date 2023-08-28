import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {StatusChangeCallback} from "@/types";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {LeoWalletAdapter} from "@demox-labs/aleo-wallet-adapter-leo";
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
  const {wallet, publicKey, requestRecords} = useWallet();

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const getCreditRecord = async (amount: number, count: number) => {
    return new Promise((resolve, reject) => {
      requestRecords!("credits.aleo")
      .then((records) => {
        records = records.filter((rec) => !rec.spent);
        if (records.length < count+1000) {
          const message = `You need ${count} records at least to finish this transaction`;
          reject({message});
          openModal("FAUCET_VIEW");
          return;
        }

        const matchRecords = records.filter((rec) =>
          +rec.data.microcredits.substring(0, rec.data.microcredits.length - 11) >= amount);

        if (matchRecords.length == 0) {
          const message = "You don't have enough credits";
          reject({message});
          return;
        }

        resolve(matchRecords[Math.floor(Math.random() * matchRecords.length)]);
      }).catch((err) => {
        reject(err);
      });
    });
  }

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
    } else {
      const message = `Recipient must be a valid ANS (****.ans)`;
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    if (recipient === publicKey) {
      const message = "You cannot transfer to yourself";
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    amount = amount * 1000000;

    const createTransactionPromise = (method === "transfer_private" || method === "transfer_private_to_public")
      ? getCreditRecord(amount, 2).then((record) => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            WalletAdapterNetwork.Testnet,
            "credits.aleo",
            method,
            [record, recipient, amount + "u64"],
            method === "transfer_private" ? 3000 : 1507000
          );
          return (wallet?.adapter as LeoWalletAdapter).requestTransaction(
            aleoTransaction
          );
        })
      : Promise.resolve().then(() => {
          const aleoTransaction = Transaction.createTransaction(
            publicKey,
            WalletAdapterNetwork.Testnet,
            "credits.aleo",
            method,
            [recipient, amount + "u64"],
            method === "transfer_public" ? 3016000 : 1514000
          );
          return (wallet?.adapter as LeoWalletAdapter).requestTransaction(
            aleoTransaction
          );
        });

    createTransactionPromise.then((txId) => {
      addTransaction("transferCredits", txId, [], onStatusChange);
    })
    .catch((error) => {
      notify("error", error.message);
      onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
    });
  }

  return {getCreditRecord, transferCredits}
}