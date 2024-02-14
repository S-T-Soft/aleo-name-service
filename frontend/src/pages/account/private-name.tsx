import {useState} from "react";
import {Status} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import Transfer from "@/pages/account/transfer";

export default function PrivateName({name, setTriggerRecheck, convertToPublic, transfer}:
                              React.PropsWithChildren<{
                                name: string,
                                setTriggerRecheck: CallableFunction,
                                convertToPublic: CallableFunction,
                                transfer: CallableFunction
                              }>) {
  const [converting, setConverting] = useState(false);
  const [convertStatus, setConvertStatus] = useState("Converting");

  const handleConvert = async (event: any) => {
    event.preventDefault();
    await convertToPublic(name, (running: boolean, status: Status) => {
      setConverting(running);
      setConvertStatus(status.message);
      if (!running) {
        setTriggerRecheck();
      }
    });
  }

  return <>
    <div className="leading-10">
      Visibility: <span className="rounded-lg bg-gray-700 px-2 py-1">Private</span>
    </div>
    <div className="leading-10 mt-5">
      {!converting && <Button className="mr-10" onClick={handleConvert}>Convert to Public</Button>}
      {converting && <Button color={"gray"} className="mr-10" disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>
    <Transfer name={name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>
  </>;
}