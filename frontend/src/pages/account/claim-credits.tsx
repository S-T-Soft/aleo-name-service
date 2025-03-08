import React, {useState} from "react";
import {Status, Record} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import {useCredit} from "@/lib/hooks/use-credit";
import toast from "@/components/ui/toast";
import env from "@/config/env";

export default function ClaimCredits({record}: React.PropsWithChildren<{
  record: Record
}>) {
  const [claimingWithPass, setClaimingWithPass] = useState(false);
  const [statusPass, setStatusPass] = useState("Claiming");
  const [showModel, setShowModal] = useState(false);
  const [amount, setAmount] = useState<number|undefined>(undefined);
  const [password, setPassword] = useState<string>("");
  const {claimCreditsFromANS} = useCredit();

  const handleAmount = (event: any) => {
    let inputValue = event.target.value;

    // Allow empty input
    if (!inputValue) {
      setAmount(undefined);
      return;
    }

    // Only allow numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(inputValue)) {
      return false;
    }

    if (inputValue == ".") {
      inputValue = "0."
    }

    setAmount(inputValue);
  }

  const handleClaimWithPass = async (event: any) => {
    event.preventDefault();
    // ensure amount is gt 0
    if (!amount || amount <= 0) {
      toast(
        {
          type: "error",
          message: "Please enter a valid amount"
        }
      );
      return;
    }
    setShowModal(false);
    setClaimingWithPass(true);
    await claimCreditsFromANS("", record, amount * 1000000, password, (running: boolean, status: Status) => {
      setClaimingWithPass(running);
      setStatusPass(status.message);
      if (!running && !status.hasError) {
        setAmount(undefined);
        setPassword("");
      }
    });
  }

  return env.ENABLE_CREDIT_TRANSFER && <>
    <div className="leading-10 mt-5 flex flex-row items-center justify-between sm:justify-start">
      <span className="sm:mr-4">Balance:</span>
      <span className="rounded-lg bg-gray-700 px-4">{record && record.balance / 1000000} ALEO</span>
      <div className="hidden sm:flex ml-4">
      {record && !claimingWithPass && <Button className="mr-4" onClick={() => setShowModal(true)}> Withdraw </Button>}
      {record && claimingWithPass && <Button color={"gray"} className="mr-4" disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {statusPass} </Button>}
      </div>
    </div>
    <div className="mt-5">
      <div className="leading-10 flex flex-row items-center justify-end sm:hidden">
        {record && !claimingWithPass &&
            <Button fullWidth={true} onClick={() => setShowModal(true)}> Withdraw </Button>}
        {record && claimingWithPass &&
            <Button fullWidth={true} color={"gray"} disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {statusPass} </Button>}
      </div>
    </div>
    {showModel && <div
          className="fixed z-50 top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 p-4 rounded-lg w-full md:w-3/4 max-w-3xl">
            <h2 className="mb-4 text-white text-center font-bold">Withdraw ALEO</h2>
            <div className="relative mb-4">
              <input
                className={`border-gray-700 focus:border-aquamarine
                  h-12 w-full appearance-none rounded-full border-2 py-1 text-lg text-white bg-gray-800 
                  outline-none transition-all placeholder:text-gray-500 hover:border-teal px-4 pr-20`}
                id="amount"
                required={true}
                type="number"
                value={amount}
                placeholder="0.00"
                onChange={handleAmount}
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 pointer-events-none">
                ALEO
              </div>
            </div>
            <div className="flex mb-4 rounded-full">
                <input
                    className={`border-gray-700 focus:border-aquamarine
                      h-12 w-full appearance-none rounded-full border-2 py-1 text-lg text-white bg-gray-800 
                      outline-none transition-all placeholder:text-gray-500 hover:border-teal px-4 pr-20`}
                    type="text"
                    autoComplete={"off"}
                    placeholder={"Leave empty if no password"}
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