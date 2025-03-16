import React, {useState} from "react";
import {Status, Record} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import Transfer from "@/pages/account/transfer";
import Avatar from "@/components/resolver/avatar";
import ClaimCredits from "@/pages/account/claim-credits";
import {ShieldSVG} from "@/assets/icons";


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
      <span className="mr-4 hidden md:flex">Avatar: </span>
      <Avatar record={record} onlyView={false}/>
    </div>

    <div className="leading-10 mb-5 flex flex-row items-center justify-between sm:justify-start">
      <span className="mr-4">Visibility: </span>
      <span className="rounded-lg bg-gray-700 px-5 sm:mr-4">Public</span>
    </div>

    <div className="leading-10 mb-5 flex-row items-center justify-start hidden sm:flex">
      <span className="sm:mr-4">Primary Name:</span>
      {record && record.isPrimaryName && !setting && <Button onClick={handleSetting}>Unset Primary</Button>}
      {record && record.isPrimaryName && setting && <Button color={"gray"} disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {settingStatus}</Button>}
      {record && !record.isPrimaryName && !setting && <Button onClick={handleSetting}>Set Primary</Button>}
      {record && !record.isPrimaryName && setting && <Button color={"gray"} disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {settingStatus}</Button>}
      {!converting && <Button className="ml-5" onClick={handleConvert}>
          <ShieldSVG className="h-6 inline" /> Convert to Private
      </Button>}
      {converting &&  <Button className="ml-5" color={"gray"} disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>

    <div className="sm:hidden">
      {record && record.isPrimaryName && !setting &&
          <Button fullWidth={true} onClick={handleSetting}>Unset Primary</Button>}
      {record && record.isPrimaryName && setting &&
          <Button fullWidth={true} color={"gray"} disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {settingStatus}</Button>}
      {record && !record.isPrimaryName && !setting &&
          <Button fullWidth={true} onClick={handleSetting}>Set Primary</Button>}
      {record && !record.isPrimaryName && setting &&
          <Button fullWidth={true} color={"gray"} disabled={true}><RefreshIcon
          className="inline text-aquamarine motion-safe:animate-spin"/> {settingStatus}</Button>}
      {!converting &&
          <Button className="w-full mt-5" onClick={handleConvert}>
              <ShieldSVG className="h-6 inline" />  Convert to Private
          </Button>}
      {converting &&
          <Button className="w-full mt-5" color={"gray"} disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {convertStatus}</Button>}
    </div>

    {record && <ClaimCredits record={record}/>}
    {record && <Transfer name={record.name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>}
  </>;
}