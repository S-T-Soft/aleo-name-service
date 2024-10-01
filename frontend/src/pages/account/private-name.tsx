import {useState} from "react";
import {Status, Record} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import Transfer from "@/pages/account/transfer";
import ClaimCredits from "@/pages/account/claim-credits";
import Avatar from "@/components/resolver/avatar";

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
      <span className="mr-4">Avatar: </span>
      <Avatar record={record} onlyView={false}/>
    </div>
    <div className="leading-10">
      Visibility: <span className="rounded-lg bg-gray-700 px-2 py-1">Private</span>
    </div>
    <div className="leading-10 mt-5">
      {!converting && <Button className="mr-10" onClick={handleConvert}>Convert to Public</Button>}
      {converting && <Button color={"gray"} className="mr-10" disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>
    {record && <ClaimCredits record={record}/>}
    {record && <Transfer name={record.name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>}
  </>;
}