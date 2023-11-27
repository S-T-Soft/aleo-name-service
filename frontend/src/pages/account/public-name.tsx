import {useState} from "react";
import {Status, Record} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import Transfer from "@/pages/account/transfer";
import Avatar from "@/components/resolver/avatar";


export default function PublicName({
                             record,
                             setTriggerRecheck,
                             convertToPrivate,
                             setPrimaryName,
                             unsetPrimaryName,
                             transfer
                           }:
                             React.PropsWithChildren<{
                               record: Record,
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
    await convertToPrivate(record.name, (running: boolean, status: Status) => {
      setConverting(running);
      setConvertStatus(status.message);
      if (!running) {
        setTriggerRecheck();
      }
    });
  }

  const handleSetting = async (event: any) => {
    event.preventDefault();
    if (record.isPrimaryName) {
      await unsetPrimaryName((running: boolean, status: Status) => {
        setSetting(running);
        setSettingStatus(status.message);
        if (!running) {
          setTriggerRecheck();
        }
      });
    } else {
      await setPrimaryName(record.name, (running: boolean, status: Status) => {
        setSetting(running);
        setSettingStatus(status.message);
        if (!running) {
          setTriggerRecheck();
        }
      });
    }
  }

  return <>
    <div className="leading-10 mb-5 flex items-center">
      <span className="mr-4">Avatar: </span>
      <Avatar record={record} onlyView={false}/>
    </div>

    <div className="leading-10 mb-5">
      <span className="mr-4">Visibility: </span>
      <span className="rounded-lg bg-gray-700 px-2 py-1">Public</span>
    </div>
    <div className="leading-10">
      <span className="mr-4">Primary Name:</span>
      {record && record.isPrimaryName && !setting && <Button className="bg-sky-500 mr-4" onClick={handleSetting}>Unset Primary</Button>}
      {record && record.isPrimaryName && setting && <Button className="bg-sky-500 mr-4" disabled={true}><RefreshIcon
          className="inline motion-safe:animate-spin"/> {settingStatus}</Button>}
      {record && !record.isPrimaryName && !setting && <Button className="bg-sky-500 mr-4" onClick={handleSetting}>Set Primary</Button>}
      {record && !record.isPrimaryName && setting && <Button className="bg-sky-500 mr-4" disabled={true}><RefreshIcon
          className="inline motion-safe:animate-spin"/> {settingStatus}</Button>}

      {!converting && <Button className="bg-sky-500 mr-4" onClick={handleConvert}>Convert to Private</Button>}
      {converting && <Button className="bg-sky-500 mr-4" disabled={true}><RefreshIcon
          className="inline motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>
    {record && <Transfer name={record.name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>}
  </>;
}