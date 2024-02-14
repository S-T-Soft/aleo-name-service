import {DynamicAddressIcon} from "@/assets/address/DynamicAddressIcon";
import React, {useEffect, useState} from "react";
import {Check} from "@/components/icons/check";
import {Copy} from "@/components/icons/copy";
import Button from "@/components/ui/button";
import {Close} from "@/components/icons/close";
import {AddRecordForm} from "@/components/resolver/addRecordForm";
import {Resolver, Record, Status} from "@/types";
import {useANS} from "@/lib/hooks/use-ans";
import {RefreshIcon} from "@/components/icons/refresh";
import {useBoolean} from "react-use";
import {useClient} from "@/lib/hooks/use-client";
import coinsWithIcons from "@/constants/coinsWithIcons.json";
import coinsWithoutIcons from "@/constants/coinsWithoutIcons.json";


const AddressRecordItem = ({ resolver }: { resolver: Resolver }) => {
  const {unsetResolverRecord} = useANS();
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
    await unsetResolverRecord(resolver.nameHash, resolver.key, (running: boolean, status: Status) => {
      setSetting(running);
      setStatus(status.message);
      if (status.message === 'Finalized') {
        setDeleted(true);
      }
    });
  }

  return deleted ? null : <div className={"bg-gray-700 w-full h-15 flex overflow-hidden rounded-lg p-2 mt-3 hover:bg-gray-600 hover:cursor-pointer hover:-translate-y-0.5"} onClick={copyText}>
    <span className="inline-block text-center w-6 flex-none">
      <DynamicAddressIcon name={resolver.key} showDefault={true}/>
    </span>
    <span className="w-20 flex-none pl-2">{resolver.key.toUpperCase()}</span>
    <span className="text-gray-500 flex-1 truncate">{setting ? status : resolver.value}</span>
    <span className="text-gray-500 px-1">{copied ? <Check className="inline text-green-700"/> : <Copy className="inline"/>}</span>
    {resolver.canDelete && !setting && <span className="rounded-lg text-red-900 px-2 transform hover:bg-red-900 hover:text-white hover:scale-x-2 transition-all duration-300" onClick={removeRecord}>
        <Close className="inline"/>
    </span>}
    {resolver.canDelete && setting && <span className="rounded-lg px-2 transform bg-red-900 text-white scale-x-2">
        <RefreshIcon className="inline text-aquamarine motion-safe:animate-spin"/>
    </span>}
  </div>
}


export default function ResolverView({ record, onlyView = false, ...props }: {record: Record, onlyView: boolean}) {
  const {getResolvers} = useClient();
  const [canAddResolver, setCanAddResolver] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useBoolean(true);
  const [refresh, setRefresh] = useState(0);
  const [addresses, setAddresses] = useState<Resolver[]>([]);

  useEffect(() => {
    if (record) {
      setLoading(true);
      getResolvers(record.name).then((resolvers) => {
        const addressList: Resolver[] = [];
        resolvers.forEach((resolver) => {
          resolver.canDelete = !onlyView;
          // check if resolver.key is in coinsWithIcons and coinsWithoutIcons
          if (coinsWithIcons.includes(resolver.key) || coinsWithoutIcons.includes(resolver.key)) {
            addressList.push(resolver);
          }
        });
        setAddresses(addressList);
      }).finally(() => {
        setLoading(false);
      })
    }
  }, [refresh]);

  const doRefresh = () => {
    setRefresh(refresh + 1);
  }

  return (
    <div className="relative mx-auto w-full max-w-full"
      {...props}
    >
      Address
      {loading && <span className="text-gray-500"> Loading...</span>}
      {!loading && <span className="text-gray-500"> {addresses.length} Records</span>}
      {addresses.map((address) => (
        <AddressRecordItem key={'address-'+address.key} resolver={address}/>
      ))}
      {!onlyView && canAddResolver && <div className="mt-5 border-t-[1px] border-t-gray-500 flex justify-end">
        {!showForm && <Button className="mt-5" onClick={() => setShowForm(true)}>Add Address Record</Button>}
        {showForm && <AddRecordForm name={record.name} onSuccess={doRefresh}/>}
      </div>}
    </div>
  );
}
