import React, {useState} from "react";
import {Status, Record} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import {useCredit} from "@/lib/hooks/use-credit";
import toast from "@/components/ui/toast";

export default function ClaimCredits({record}: React.PropsWithChildren<{
  record: Record
}>) {
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState("Claiming");
  const [claimingWithPass, setClaimingWithPass] = useState(false);
  const [statusPass, setStatusPass] = useState("Claiming");
  const [showModel, setShowModal] = useState(false);
  const [amount, setAmount] = useState<number|undefined>(undefined);
  const [password, setPassword] = useState<string>("");
  const {claimCreditsFromANS} = useCredit();

  const handleClaim = async (event: any) => {
    event.preventDefault();
    await claimCreditsFromANS(record, record.balance, "", (running: boolean, status: Status) => {
      setClaiming(running);
      setStatus(status.message);
    });
  }

  const handleAmount = (event: any) => {
    const value = parseFloat(event.target.value);
    // make sure the amount is a valid number
    if (isNaN(value)) {
      setAmount(0);
      return false;
    }
    setAmount(Math.floor(value * 1e6) / 1e6);
  }

  const handleClaimWithPass = async (event: any) => {
    event.preventDefault();
    // ensure password is not empty and amount is gt 0
    if (password.length == 0 || !amount || amount <= 0) {
      toast(
        {
          type: "error",
          message: "Please enter a valid amount and password"
        }
      );
      return;
    }
    setShowModal(false);
    setClaimingWithPass(true);
    await claimCreditsFromANS(record, amount * 1000000, password, (running: boolean, status: Status) => {
      setClaimingWithPass(running);
      setStatusPass(status.message);
    });
  }

  return <>
    <div className="leading-10 mt-5">
      <span className="mr-4">Balance:</span>
      <span className="rounded-lg bg-gray-700 px-2 py-1 mr-4">{record && record.balance / 1000000} ACs</span>
      {record && !claiming && record.balance > 0 &&
          <Button className="mr-4" onClick={handleClaim}>Withdraw</Button>}
      {record && claiming && <Button color={"gray"} className="mr-4" disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {status} </Button>}
      {record && !claimingWithPass && <Button className="mr-4" onClick={() => setShowModal(true)}> Withdraw with Password </Button>}
      {record && claimingWithPass && <Button color={"gray"} className="mr-4" disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {statusPass} </Button>}
    </div>
    {showModel && <div
          className="fixed z-50 top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 p-4 rounded-lg w-full md:w-3/4 max-w-3xl">
            <h2 className="mb-4 text-white text-center font-bold">Withdraw with Password</h2>
            <div className="flex mb-4 border-2 border-gray-600 md:focus-within:border-aquamarine rounded-full">
                <input
                    className="h-16 flex-grow appearance-none rounded-full md:rounded-l-full md:rounded-r-none border-r-0 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 dark:hover:border-teal dark:focus:border-aquamarine ltr:pl-8 rtl:pr-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500"
                    type="text"
                    autoComplete={"off"}
                    value={amount}
                    onChange={handleAmount}
                />
                <span
                    className="hidden md:flex h-16 bg-gray-700 border-l-0 border-gray-600 items-center justify-center py-1 px-3 text-lg text-gray-400 rounded-r-full">ACs</span>
            </div>
            <div className="flex mb-4 rounded-full">
                <input
                    className="h-16 flex-grow appearance-none border-2 rounded-full py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 dark:hover:border-teal dark:focus:border-aquamarine ltr:pl-8 rtl:pr-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500"
                    type="text"
                    autoComplete={"off"}
                    placeholder={"Password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </div>
            <div className="flex flex-col md:flex-row justify-between">
                <Button className="w-full mb-2 md:mb-0 md:w-2/5 bg-gray-700 text-white"
                        onClick={() => setShowModal(false)}>
                    Cancel
                </Button>
                <Button className={`w-full md:w-2/5`} onClick={handleClaimWithPass}>
                    Withdraw
                </Button>
            </div>
        </div>
    </div>}
  </>
}