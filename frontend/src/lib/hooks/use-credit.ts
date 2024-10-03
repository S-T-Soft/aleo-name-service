import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {StatusChangeCallback, Record, ARC21Token} from "@/types";
import {Transaction, WalletAdapterNetwork, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useTransaction} from "@/lib/hooks/use-transaction";
import React from "react";
import {TypeOptions} from "react-toastify";
import toast from "@/components/ui/toast";
import {useClient} from "@/lib/hooks/use-client";
import * as process from "process";
import {getFormattedNameInput} from "@/lib/util";
import {usePrivateFee} from "@/lib/hooks/use-private-fee";
import tokens from "@/config/tokens";

export function useCredit() {
  const CREDIT_PROGRAM = "credits.aleo";
  const MTSP_PROGRAM = "token_registry.aleo";
  const FEES_CREDIT_TRANSFER = parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_TRANSFER!);
  const FEES_CREDIT_CLAIM = parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_CLAIM!);
  const FEES_CREDIT_CLAIM_PUBLIC = parseInt(process.env.NEXT_PUBLIC_FEES_CREDIT_CLAIM_PUBLIC!);
  const FEES_TRANSFER_PRIVATE_CREDITS = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_CREDITS!);
  const FEES_TRANSFER_PUBLIC_CREDITS = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_CREDITS!);
  const FEES_TRANSFER_PUBLIC_TO_PRIVATE_CREDITS = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_TO_PRIVATE_CREDITS!);
  const FEES_TRANSFER_PRIVATE_TO_PUBLIC_CREDITS = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_TO_PUBLIC_CREDITS!);
  const FEES_TRANSFER_PRIVATE_ARC21 = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_ARC21!);
  const FEES_TRANSFER_PUBLIC_ARC21 = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_ARC21!);
  const FEES_TRANSFER_PUBLIC_TO_PRIVATE_ARC21 = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PUBLIC_TO_PRIVATE_ARC21!);
  const FEES_TRANSFER_PRIVATE_TO_PUBLIC_ARC21 = parseInt(process.env.NEXT_PUBLIC_FEES_TRANSFER_PRIVATE_TO_PUBLIC_ARC21!);
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
      requestRecordPlaintexts!(CREDIT_PROGRAM)
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

        // sort matched records in original order
        matchedRecords = sortedAmounts.map(sa => matchedRecords[sa.index]);

        resolve(matchedRecords);
      }).catch((err) => {
        reject(err);
      });
    });
  };

  const getMTSPRecords = async (token: ARC21Token, amounts: number[], errorWhenMissing: boolean = true) => {
    return new Promise<{plaintext: string}[]>((resolve, reject) => {
      if (amounts.length === 0) {
        resolve([]);
        return;
      }
      requestRecordPlaintexts!(MTSP_PROGRAM)
      .then((originalRecords) => {
        originalRecords = originalRecords.filter((rec) => !rec.spent && rec.data.amount !== "0u128.private" && rec.data.token_id === token.id);
        let sortedAmounts = amounts
          .map((value, index) => ({ value, index }))
          .sort((a, b) => b.value - a.value);

        let matchedRecords: {plaintext: string}[] = [];
        for (let { value: amount } of sortedAmounts) {
          let match = originalRecords.reduce((acc, rec) => {
            let rec_amount = +rec.data.amount.substring(0, rec.data.amount.length - 12);
            if (rec_amount >= amount) {
              if (!acc || rec_amount > +acc.data.amount.substring(0, acc.data.amount.length - 12)) {
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
              reject({"message": `You don't have enough private ${token.symbol} token`});
            } else {
              matchedRecords.push({plaintext: ""});
            }
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

  const transferCredits = async (tokenId: string, method: string, recipient: string, amount: number, onStatusChange?: StatusChangeCallback) => {
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

    const token = tokens.filter((token) => token.id === tokenId)[0];
    amount = amount * 10**token.decimals;
    const program = tokenId === "" ? CREDIT_PROGRAM : MTSP_PROGRAM;

    let fee = 0;
    if (program == CREDIT_PROGRAM) {
      fee = {
        "transfer_private": FEES_TRANSFER_PRIVATE_CREDITS,
        "transfer_public": FEES_TRANSFER_PUBLIC_CREDITS,
        "transfer_private_to_public": FEES_TRANSFER_PRIVATE_TO_PUBLIC_CREDITS,
        "transfer_public_to_private": FEES_TRANSFER_PUBLIC_TO_PRIVATE_CREDITS
      }[method]!;
    } else {
      fee = {
        "transfer_private": FEES_TRANSFER_PRIVATE_ARC21,
        "transfer_public": FEES_TRANSFER_PUBLIC_ARC21,
        "transfer_private_to_public": FEES_TRANSFER_PRIVATE_TO_PUBLIC_ARC21,
        "transfer_public_to_private": FEES_TRANSFER_PUBLIC_TO_PRIVATE_ARC21
      }[method]!;
    }

    const createTransactionPromise = (() => {
      switch (method) {
        case "transfer_private":
        case "transfer_private_to_public":
          const getRecords = program === MTSP_PROGRAM ? getMTSPRecords(token, privateFee ? [amount, fee!] : [amount])
            : getCreditRecords(privateFee ? [amount, fee!] : [amount]);
          return getRecords.then((records) => {
            let inputs = program === MTSP_PROGRAM ? [recipient, amount + "u128", records[0]] : [records[0], recipient, amount + "u64"];
            const aleoTransaction = Transaction.createTransaction(
              publicKey,
              NETWORK,
              program,
              method,
              inputs,
              fee!,
              privateFee
            );
            if (requestTransaction)
              return requestTransaction(aleoTransaction);
            else
              throw new Error("requestTransaction is not defined");
          });
        case "transfer_public":
        case "transfer_public_to_private":
          let inputs = program === MTSP_PROGRAM ? [tokenId, recipient, amount + "u128"] : [recipient, amount + "u64"];
          return Promise.resolve().then(() => {
            const aleoTransaction = Transaction.createTransaction(
              publicKey,
              NETWORK,
              program,
              method,
              inputs,
              fee!,
              false
            );
            if (requestTransaction)
              return requestTransaction(aleoTransaction);
            else
              throw new Error("requestTransaction is not defined");
          });
        default:
          throw new Error("Invalid method");
      }
    })();

    createTransactionPromise.then((txId) => {
      addTransaction("transferCredits", txId, [], onStatusChange);
    })
    .catch((error) => {
      notify("error", error.message);
      onStatusChange && onStatusChange(false, {hasError: true, message: error.message});
    });
  }

  const transferCreditsToANS = async (tokenId: string, recipient: string, amount: number, password: string, onStatusChange?: StatusChangeCallback) => {
    if (!publicKey) throw new WalletNotConnectedError();
    onStatusChange && onStatusChange(true, {hasError: false, message: "Transferring"});

    if (recipient.indexOf(".") == -1) {
      const message = `Recipient must be a valid ANS`;
      notify("error", message);
      onStatusChange && onStatusChange(false, {hasError: true, message});
      return;
    }

    const token = tokens.filter((token) => token.id === tokenId)[0];
    amount = amount * 10**token.decimals;
    const amounts = privateFee ? [amount, FEES_CREDIT_TRANSFER] : [];

    Promise.all([getCreditRecords(amounts), getNameHash(recipient)])
      .then(([records, nameHash]) => {
        let inputs = [];
        let functionName = "transfer_credits";
        if (tokenId !== "") {
          inputs.push(tokenId);
          functionName = "transfer_token";
        }
        inputs.push(nameHash);
        inputs.push(getFormattedNameInput(password, 2));
        inputs.push(amount + "u64");
        if (privateFee) {
          inputs.push(records[0]);
        } else {
          functionName += "_public";
        }
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          NETWORK,
          TRANSFER_PROGRAM,
          functionName,
          inputs,
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

  const claimCreditsFromANS = async (tokenId: string, record: Record, amount: number, password: string, onStatusChange?: StatusChangeCallback) => {
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