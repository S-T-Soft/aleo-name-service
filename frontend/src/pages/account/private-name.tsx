import React, {useState} from "react";
import {Status, Record} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import Transfer from "@/pages/account/transfer";
import ClaimCredits from "@/pages/account/claim-credits";
import Avatar from "@/components/resolver/avatar";
import {UnshieldSVG} from "@/assets/icons";

export default function PrivateName({record, setTriggerRecheck, convertToPublic, transfer}:
                              React.PropsWithChildren<{
                                record: Record,
                                setTriggerRecheck: CallableFunction,
                                convertToPublic: CallableFunction,
                                transfer: CallableFunction
                              }>) {
  const [converting, setConverting] = useState(false);
  const [convertStatus, setConvertStatus] = useState("Converting");

  const handleConvert = async (event: any) => {
    event.preventDefault();
    await convertToPublic(record.name, (running: boolean, status: Status) => {
      setConverting(running);
      setConvertStatus(status.message);
      if (!running) {
        setTriggerRecheck();
      }
    });
  }

  return <>
    <div className="leading-10 mb-5 flex items-center">
      <span className="mr-4 hidden md:flex">Avatar: </span>
      <Avatar record={record} onlyView={false}/>
    </div>
    <div className="leading-10 mb-5 flex flex-row items-center justify-between sm:justify-start">
      <span className="mr-4">Visibility: </span>
      <span className="rounded-lg bg-gray-700 px-5 sm:mr-4">Private</span>
      {!converting && <Button className="hidden sm:flex" onClick={handleConvert}>
          <UnshieldSVG className="h-6 inline" /> Convert to Public
      </Button>}
      {converting && <Button className="hidden sm:flex" color={"gray"} disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>
    <div className="sm:hidden">
      {!converting &&
          <Button fullWidth={true} onClick={handleConvert}>
            <UnshieldSVG className="h-6 inline" /> Convert to Public
          </Button>}
      {converting &&
          <Button fullWidth={true} color={"gray"} disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>
    {record && <ClaimCredits record={record}/>}
    {record && <Transfer name={record.name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>}
  </>;
}