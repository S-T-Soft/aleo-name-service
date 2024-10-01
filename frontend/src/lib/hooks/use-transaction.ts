import React, {useEffect, useState} from "react";
import {StatusChangeCallback} from "@/types";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {useRecords} from "@/lib/hooks/use-records";
import {TypeOptions} from "react-toastify";
import toast from "@/components/ui/toast";

interface AnsTransaction {
  method: string;
  id: string;
  params: any[];
  onStatusChange?: StatusChangeCallback;
}


export function useTransaction() {
  const {refreshRecords, syncPrimaryName} = useRecords();
  const {transactionStatus} = useWallet();
  const [transactions, setTransactions] = useState<AnsTransaction[]>([]);

  const notify = React.useCallback((type: TypeOptions, message: string) => {
    toast({ type, message });
  }, []);

  const getTransactionStatus = async (tx: AnsTransaction) => {
    let status = "Pending";
    if (transactionStatus) {
      transactionStatus(tx.id).then(status => {
        tx.onStatusChange && tx.onStatusChange(true, {hasError: false, message: status});
        console.log(tx.id, status);
        // if tx.id no tin transactions, return
        if (!transactions.find((t) => t.id === tx.id)) return;
        if (status === "Failed" || status === "Reject") {
          setTransactions(transactions.filter((t) => t.id !== tx.id));
          tx.onStatusChange && tx.onStatusChange(false, {hasError: true, message: status});
        } else if (status === "Finalized") {
          setTransactions(transactions.filter((t) => t.id !== tx.id));

          switch (tx.method) {
            case "transfer":
            case "convertToPublic":
            case "register":
            case "registerSubdomain":
            case "convertToPrivate":
              refreshRecords("manual");
              break;
            case "setPrimaryName":
            case "unsetPrimaryName":
              syncPrimaryName();
              break;
            case "setResolverRecord":
            case "unsetResolverRecord":
              break;
          }

          tx.onStatusChange && tx.onStatusChange(false, {hasError: false, message: status});
          notify("success", `Transaction ${tx.method} Success`);
        }
      }).catch(error => {
        console.error(error);
      })
    } else {
      tx.onStatusChange && tx.onStatusChange(true, {hasError: false, message: status});
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    // Clear the previous timer at the start of the effect
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    // Only set a new timer if there are transactions
    if (transactions.length > 0) {
      intervalId = setInterval(() => {
        transactions.forEach((tx) => {
          getTransactionStatus(tx);
        });
      }, 2_000);
    }

    // Clear the timer when the component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactions]);

  const addTransaction = (method: string, id: string, params: any[], onStatusChange?: StatusChangeCallback) => {
    setTransactions([...transactions, {method, id, params, onStatusChange}]);
  }

  return {addTransaction}
}