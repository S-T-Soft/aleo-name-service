import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {StatusChangeCallback, Record, ARC21Token} from "@/types";
import {Transaction, WalletNotConnectedError} from "@demox-labs/aleo-wallet-adapter-base";
import {useTransaction} from "@/lib/hooks/use-transaction";
import React from "react";
import {TypeOptions} from "react-toastify";
import toast from "@/components/ui/toast";
import {useClient} from "@/lib/hooks/use-client";
import {getFormattedNameInput} from "@/lib/util";
import {usePrivateFee} from "@/lib/hooks/use-private-fee";
import tokens from "@/config/tokens";
import env from "@/config/env";
import {useRecords} from "@/lib/hooks/use-records";

export function useCredit() {
  const {addTransaction} = useTransaction();
  const {publicBalance} = useRecords();
  const {getAddress, getNameHash} = useClient();
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
      requestRecordPlaintexts!(env.CREDIT_PROGRAM)
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
      requestRecordPlaintexts!(env.MTSP_PROGRAM)
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
    const program = tokenId === "" ? env.CREDIT_PROGRAM : env.MTSP_PROGRAM;

    let fee = 0;
    if (program == env.CREDIT_PROGRAM) {
      fee = {
        "transfer_private": env.FEES.TRANSFER_PRIVATE_CREDITS,
        "transfer_public": env.FEES.TRANSFER_PUBLIC_CREDITS,
        "transfer_private_to_public": env.FEES.TRANSFER_PRIVATE_TO_PUBLIC_CREDITS,
        "transfer_public_to_private": env.FEES.TRANSFER_PUBLIC_TO_PRIVATE_CREDITS
      }[method]!;
    } else {
      fee = {
        "transfer_private": env.FEES.TRANSFER_PRIVATE_ARC21,
        "transfer_public": env.FEES.TRANSFER_PUBLIC_ARC21,
        "transfer_private_to_public": env.FEES.TRANSFER_PRIVATE_TO_PUBLIC_ARC21,
        "transfer_public_to_private": env.FEES.TRANSFER_PUBLIC_TO_PRIVATE_ARC21
      }[method]!;
    }

    const createTransactionPromise = (() => {
      switch (method) {
        case "transfer_private":
        case "transfer_private_to_public":
          const getRecords =
            program === env.MTSP_PROGRAM
              ? getMTSPRecords(token, privateFee ? [amount, fee!] : [amount])
              : getCreditRecords(privateFee ? [amount, fee!] : [amount]);

          return getRecords.then((records) => {
            if (!records || records.length === 0) {
              throw new Error("No records found");
            }

            let inputs =
              program === env.MTSP_PROGRAM
                ? [recipient, amount + "u128", records[0]]
                : [records[0], recipient, amount + "u64"];

            const aleoTransaction = Transaction.createTransaction(
              publicKey,
              env.NETWORK,
              program,
              method,
              inputs,
              fee!,
              privateFee
            );

            if (requestTransaction) {
              return requestTransaction(aleoTransaction);
            } else {
              throw new Error("requestTransaction is not defined");
            }
          });

        case "transfer_public":
        case "transfer_public_to_private":
          // check public balance
          if (tokenId === "" && publicBalance < amount + fee) {
            const message = `You don't have enough public credits, need at least ${((amount + fee)/1000000).toFixed(2)} ALEO`;
            return Promise.reject(new Error(message)); // 使用 Promise.reject
          }

          let inputs =
            program === env.MTSP_PROGRAM
              ? [tokenId, recipient, amount + "u128"]
              : [recipient, amount + "u64"];

          return Promise.resolve().then(() => {
            const aleoTransaction = Transaction.createTransaction(
              publicKey,
              env.NETWORK,
              program,
              method,
              inputs,
              fee!,
              false
            );

            if (requestTransaction) {
              return requestTransaction(aleoTransaction);
            } else {
              throw new Error("requestTransaction is not defined");
            }
          });

        default:
          return Promise.reject(new Error("Invalid method")); // 使用 Promise.reject
      }
    })();

    createTransactionPromise
      .then((txId) => {
        addTransaction("transferCredits", txId, [], onStatusChange);
      })
      .catch((error) => {
        notify("error", error.message);
        if (onStatusChange) {
          onStatusChange(false, { hasError: true, message: error.message });
        }
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
    let fee = privateFee ? env.FEES.CREDIT_TRANSFER : env.FEES.CREDIT_TRANSFER_PUBLIC;
    const amounts = privateFee ? [amount, fee] : [];

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
        inputs.push(amount + (tokenId !== "" ? "u128" : "u64"));
        if (privateFee) {
          inputs.push(records[0]);
        } else {
          functionName += "_public";
        }
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          env.NETWORK,
          env.TRANSFER_PROGRAM,
          functionName,
          inputs,
          fee,
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

    const fee = record.private ? env.FEES.CREDIT_CLAIM : env.FEES.CREDIT_CLAIM_PUBLIC;

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      env.NETWORK,
      env.TRANSFER_PROGRAM,
      record.private ? "claim_credits_private" : "claim_credits_as_signer",
      [publicKey, record.private ? record.record : record.nameHash, getFormattedNameInput(password, 2), amount + "u64"],
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