import {DynamicAddressIcon} from "@/assets/address/DynamicAddressIcon";
import React, {useEffect, useState} from "react";
import {Check} from "@/components/icons/check";
import {Copy} from "@/components/icons/copy";
import Button from "@/components/ui/button";
import {Close} from "@/components/icons/close";
import {AddRecordForm} from "@/components/resolver/addRecordForm";
import {useRecords} from "@/lib/hooks/use-records";
import {Resolver, Record, Status} from "@/types";
import {useANS} from "@/lib/hooks/use-ans";
import {RefreshIcon} from "@/components/icons/refresh";
import {OutlinkSVG} from "@/assets/icons";


const AddressRecordItem = ({ resolver }: { resolver: Resolver }) => {
  const {unsetResolver} = useANS();
  const [copied, setCopied] = useState(false);
  const [setting, setSetting] = useState(false);
  const [status, setStatus] = useState("");
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
      if (copied) {
          const timer = setTimeout(() => {
              setCopied(false);
          }, 2000);

          return () => {
              clearTimeout(timer);
          };
      }
  }, [copied]);

  const copyText = () => {
      navigator.clipboard.writeText(resolver.value);
      setCopied(true);
  };

  const removeRecord = async (event: any) => {
    event.preventDefault();
    await unsetResolver(resolver.nameHash, resolver.key, (running: boolean, status: Status) => {
      setSetting(running);
      setStatus(status.message);
      if (status.message === 'Finalized') {
        setDeleted(true);
      }
    });
  }

  return deleted ? null : <div className={"bg-gray-700 w-full h-15 flex overflow-hidden rounded-lg p-2 mt-3 hover:bg-gray-600 hover:cursor-pointer hover:-translate-y-0.5"} onClick={copyText}>
    <span className="inline-block text-center w-6 flex-none">
      {resolver.isCustomResolver && <OutlinkSVG />}
      {!resolver.isCustomResolver && <DynamicAddressIcon name={resolver.key} showDefault={true}/>}
    </span>
    <span className={(resolver.isCustomResolver ? 'w-24': 'w-20') + " flex-none pl-2"}>{resolver.key.toUpperCase()}</span>
    <span className="text-gray-500 flex-1 truncate">{setting ? status : resolver.value}</span>
    <span className="text-gray-500 px-1">{copied ? <Check className="inline text-green-700"/> : <Copy className="inline"/>}</span>
    {resolver.canRemove && !setting && <span className="rounded-lg text-red-900 px-2 transform hover:bg-red-900 hover:text-white hover:scale-x-2 transition-all duration-300" onClick={removeRecord}>
        <Close className="inline"/>
    </span>}
    {setting && <span className="rounded-lg px-2 transform bg-red-900 text-white scale-x-2">
        <RefreshIcon className="inline motion-safe:animate-spin"/>
    </span>}
  </div>
}


export default function ResolverView({ record, ...props }: {record: Record}) {
  const {resolvers} = useRecords();
  const [canAddResolver, setCanAddResolver] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addresses, setAddresses] = useState<Resolver[]>([]);

  useEffect(() => {
    const addresses1 = resolvers[record?.nameHash || ''] || [];
    setAddresses(addresses1);
    setCanAddResolver(addresses1.length < 1 || !addresses1[0].isCustomResolver);
  }, [resolvers]);

  return (
    <div className="relative mx-auto w-full max-w-full"
      {...props}
    >
      Address <span className="text-gray-500">{addresses.length} Records</span>
      {addresses.map((address) => (
        <AddressRecordItem key={'address-'+address.key} resolver={address}/>
      ))}
      {canAddResolver && <div className="mt-5 border-t-[1px] border-t-gray-500 flex justify-end">
        {!showForm && <Button className="bg-sky-500 mt-5" onClick={() => setShowForm(true)}>Add Address Resolver</Button>}
        {showForm && <AddRecordForm name={record.name}/>}
      </div>}
    </div>
  );
}
