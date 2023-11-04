import {useState} from "react";
import {Status} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import Transfer from "@/pages/account/transfer";

export default function PublicName({
                             name,
                             isPrimaryName,
                             setTriggerRecheck,
                             convertToPrivate,
                             setPrimaryName,
                             unsetPrimaryName,
                             transfer
                           }:
                             React.PropsWithChildren<{
                               name: string,
                               isPrimaryName: boolean,
                               setTriggerRecheck: CallableFunction,
                               convertToPrivate: CallableFunction,
                               setPrimaryName: CallableFunction,
                               unsetPrimaryName: CallableFunction,
                               transfer: CallableFunction
                             }>) {
  const [converting, setConverting] = useState(false);
  const [convertStatus, setConvertStatus] = useState("Converting");
  const [setting, setSetting] = useState(false);
  const [settingStatus, setSettingStatus] = useState("Setting");

  const handleConvert = async (event: any) => {
    event.preventDefault();
    await convertToPrivate(name, (running: boolean, status: Status) => {
      setConverting(running);
      setConvertStatus(status.message);
      if (!running) {
        setTriggerRecheck();
      }
    });
  }

  const handleSetting = async (event: any) => {
    event.preventDefault();
    if (isPrimaryName) {
      await unsetPrimaryName((running: boolean, status: Status) => {
        setSetting(running);
        setSettingStatus(status.message);
        if (!running) {
          setTriggerRecheck();
        }
      });
    } else {
      await setPrimaryName(name, (running: boolean, status: Status) => {
        setSetting(running);
        setSettingStatus(status.message);
        if (!running) {
          setTriggerRecheck();
        }
      });
    }
  }

  return <>
    <div className="leading-10">
      Visibility: <span className="rounded-lg bg-gray-700 px-2 py-1">Public</span>
    </div>
    <div className="leading-10 mt-5">
      Primary Name:
      {isPrimaryName && !setting && <Button className="bg-sky-500 ml-10" onClick={handleSetting}>Unset Primary</Button>}
      {isPrimaryName && setting && <Button className="bg-sky-500 ml-10" disabled={true}><RefreshIcon
          className="inline motion-safe:animate-spin"/> {settingStatus}</Button>}
      {!isPrimaryName && !setting && <Button className="bg-sky-500 ml-10" onClick={handleSetting}>Set Primary</Button>}
      {!isPrimaryName && setting && <Button className="bg-sky-500 ml-10" disabled={true}><RefreshIcon
          className="inline motion-safe:animate-spin"/> {settingStatus}</Button>}

      {!converting && <Button className="bg-sky-500 ml-10" onClick={handleConvert}>Convert to Private</Button>}
      {converting && <Button className="bg-sky-500 ml-10" disabled={true}><RefreshIcon
          className="inline motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>
    <Transfer name={name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>
  </>;
}