import type {NextPageWithLayout, Status} from '@/types';
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {useEffect, useMemo, useState} from "react";
import Button from "@/components/ui/button";
import * as process from "process";
import {useRecords} from "@/lib/hooks/use-records";
import {RefreshIcon} from "@/components/icons/refresh";
import {useANS} from "@/lib/hooks/use-ans";
import {useClient} from "@/lib/hooks/use-client";


function Transfer({name, transfer, setTriggerRecheck}: React.PropsWithChildren<{name: string, transfer: CallableFunction, setTriggerRecheck: CallableFunction}>) {
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState("Transferring");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");

  const onChange = async (event: any) => {
    setRecipient(event.currentTarget.value);
  };

  const handleTransfer = async (event: any) => {
    if (!recipient || recipient.length == 0) {
      setError("Recipient address is required");
      return;
    }
    setError("");
    await transfer(name, recipient,(running: boolean, status: Status) => {
      setTransferring(running);
      setTransferStatus(status.message);
      if (!running) {
        setTriggerRecheck();
      }
    });
  }

  return <><div className="relative flex w-full rounded-full mt-5">
      <label className="flex w-full items-center ">
        <input
          className="h-16 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-sky-900 focus:border-sky-500 ltr:pr-24 ltr:pl-8 rtl:pl-24 rtl:pr-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 dark:hover:border-sky-900 dark:focus:border-sky-500 sm:ltr:pr-24 sm:rtl:pl-24 xl:ltr:pr-24 xl:rtl:pl-24"
          value={recipient}
          placeholder={"Address(aleo***) or Public ANS(***.ans)"}
          onChange={onChange}
          autoComplete="off"
        />
      </label>
      <span className="absolute flex h-full w-15 cursor-pointer items-center justify-center text-gray-900 hover:text-gray-900 ltr:right-2 ltr:pr-2 rtl:left-2 rtl:pl-2 dark:text-white ">
        {!transferring && <Button className="bg-sky-500" onClick={handleTransfer}>Transfer</Button>}
        {transferring && <Button className="bg-sky-500" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {transferStatus}</Button>}
      </span>
    </div>
    {error && (
      <div className="h-10 text-center text-red-500 text-base">
        {error}
      </div>
      )}</>
}

function PrivateName({name, setTriggerRecheck, convertToPublic, transfer}:
                       React.PropsWithChildren<{name: string,
                         setTriggerRecheck: CallableFunction,
                         convertToPublic: CallableFunction,
                         transfer: CallableFunction}>) {
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
      {!converting && <Button className="bg-sky-500 mr-10" onClick={handleConvert}>Convert to Public</Button>}
      {converting && <Button className="bg-sky-500 mr-10" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {convertStatus}</Button>}
      <Button className="bg-gray-700" disabled={true}>Register Subdomain</Button>
    </div>
    <Transfer name={name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>
  </>;
}

function PublicName({name, isPrimaryName, setTriggerRecheck, convertToPrivate, setPrimaryName, unsetPrimaryName, transfer}:
                      React.PropsWithChildren<{name: string,
                        isPrimaryName: boolean,
                        setTriggerRecheck: CallableFunction,
                        convertToPrivate: CallableFunction,
                        setPrimaryName: CallableFunction,
                        unsetPrimaryName: CallableFunction,
                        transfer: CallableFunction}>) {
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
      {isPrimaryName && setting && <Button className="bg-sky-500 ml-10" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {settingStatus}</Button>}
      {!isPrimaryName && !setting && <Button className="bg-sky-500 ml-10" onClick={handleSetting}>Set Primary</Button>}
      {!isPrimaryName && setting && <Button className="bg-sky-500 ml-10" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {settingStatus}</Button>}
    </div>
    <div className="leading-10 mt-5">
      {!converting && <Button className="bg-sky-500 mr-10" onClick={handleConvert}>Convert to Private</Button>}
      {converting && <Button className="bg-sky-500 mr-10" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {convertStatus}</Button>}
      <Button className="bg-gray-700 mr-10" disabled={true}>Register Subdomain</Button>
      <Button className="bg-gray-700" disabled={true}>Add Resolver</Button>
    </div>
    <Transfer name={name} transfer={transfer} setTriggerRecheck={setTriggerRecheck}/>
  </>;
}

const ManageNamePage: NextPageWithLayout = () => {
  const router = useRouter();
  const {publicKey} = useWallet();
  const {getAddress} = useClient();
  const {convertToPrivate, convertToPublic, setPrimaryName, unsetPrimaryName, transfer} = useANS();
  const {records} = useRecords();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [isMine, setIsMine] = useState(true);
  const [isPrimaryName, setIsPrimaryName] = useState(false);
  const [name, setName] = useState("");

  let {slug} = router.query;

  useEffect(() => {
    if (typeof slug === 'string' && slug.endsWith('.ans')) {
      setName(slug.split('.')[0])
    }
  }, [slug]);

  useEffect(() => {
    if (!loading && name && name.length > 0) {
      if (available || !isMine) {
        router.push(`/name/${name}.ans`);
      }
    }
  }, [loading, isMine, name]);

  useEffect(() => {
    // Only do the check if the name is valid and the public key is available
    if (publicKey && !loading && name && name.length > 0) {
      setLoading(true);
      getAddress(name)
        .then((address) => {
          setAvailable(false);
          const isPrivate = address.startsWith("Private");
          if (!isPrivate) {
            setIsPrimaryName(records?.find((rec) => rec.name === name)?.isPrimaryName || false);
          }
          setIsPrivate(isPrivate);
          setIsMine(address === publicKey || (isPrivate && (records || []).some((rec) => rec.name === name)));
        }).catch((error) => {
        setAvailable(true);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [records, name, publicKey, triggerRecheck]);

  return (
    <>
      <NextSeo
        title="Aleo Name Service | Getting Started"
        description="Aleo Name Service"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 lg:px-8 xl:px-10 2xl:px-0">
        <h2 className="mb-6 text-lg font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          Manage <span className="text-sky-500">{name}.ans</span>
          {isPrimaryName && <span className="bg-green-700 mx-3 px-2 py-1 rounded-lg text-lg sm:text-xl">PrimaryName</span>}
        </h2>
        <div className="mb-3">
          <div
            className="rounded-lg bg-white shadow-card dark:bg-light-dark z-50 mx-auto w-full max-w-full">
            <div className="relative items-center justify-between gap-4 p-4">
              {loading ? (
                <span>Loading...</span>
              ) : available || !isMine ? (
                <span>Redirecting...</span>
              ) : isPrivate ? (
                <PrivateName
                  name={name}
                  setTriggerRecheck={() => {setTriggerRecheck(triggerRecheck + 1)}}
                  convertToPublic={convertToPublic}
                  transfer={transfer}
                />
              ) : (
                <PublicName
                  name={name}
                  isPrimaryName={isPrimaryName}
                  setTriggerRecheck={() => {setTriggerRecheck(triggerRecheck + 1)}}
                  convertToPrivate={convertToPrivate}
                  setPrimaryName={setPrimaryName}
                  unsetPrimaryName={unsetPrimaryName}
                  transfer={transfer}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

ManageNamePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ManageNamePage;
