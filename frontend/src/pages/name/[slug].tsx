import type {NextPageWithLayout, Record} from '@/types';
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import SearchView from "@/components/search/view";
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import React, {useEffect, useState} from "react";
import Button from "@/components/ui/button";
import {WalletMultiButton} from "@demox-labs/aleo-wallet-adapter-reactui/";
import * as process from "process";
import ActiveLink from "@/components/ui/links/active-link";
import CopyToClipboardText from "@/components/copy_to_clipboard";
import {RefreshIcon} from "@/components/icons/refresh";
import {useANS} from "@/lib/hooks/use-ans";
import {Status} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import ToggleSwitch from "@/components/ui/toggle-switch";
import {useRecords} from "@/lib/hooks/use-records";
import {useSWRConfig} from "swr";
import {useCredit} from "@/lib/hooks/use-credit";
import Head from "next/head";
import ResolverView from "@/components/resolver/view";
import toast from "@/components/ui/toast";


const NamePage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_REGISTRAR_PROGRAM = process.env.NEXT_PUBLIC_REGISTRAR_PROGRAM;
  const router = useRouter();
  const {publicKey} = useWallet();
  const {mutate} = useSWRConfig();
  const {transferCredits} = useCredit();
  const {register, calcPrice, getFormattedNameInput} = useANS();
  const {getAddress} = useClient();
  const {getCreditRecord} = useCredit();
  const {names, publicBalance} = useRecords();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("Registering");
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [nameInputs, setNameInputs] = useState(['', '', '', '']);
  const [showAleoTools, setShowAleoTools] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(2);
  const [record, setRecord] = useState("");
  const [isPrivate, setIsPrivate] = useState<boolean>(true);

  useEffect(() => {
    if (router.isReady) {
      const {slug} = router.query;
      if (typeof slug === 'string' && slug.endsWith('.ans')) {
        setName(slug.split('.').slice(0, -1).join('.'))
      } else if (typeof slug === 'string') {
        setName(slug);
      }
    }
  }, [router.isReady && router.query]);

  const toggleAleoTools = () => {
    setShowAleoTools(!showAleoTools);
  }

  useEffect(() => {
    setOwner("");
    setLoading(true);
    const is_valid = /^[a-z0-9-_]{1,64}$/.test(name);
    setIsValid(is_valid);
    if (names?.includes(name + ".ans")) {
      router.push(`/account/${name}.ans`);
      return;
    }
    if (is_valid) {
      const ans_price = calcPrice(name);
      setPrice(ans_price / 1000000);
      getAddress(name)
        .then((address) => {
          setAvailable(false);
          setOwner(address);
        }).catch((error) => {
          // refresh balance
          mutate('getBalance');
          setAvailable(true);
          // @ts-ignore
          setNameInputs(getFormattedNameInput(name));
          if (publicKey) {
            getCreditRecord(ans_price, 1).then((record) => {
              if (record) {
                setRecord(record.plaintext);
              } else {
                setRecord("");
              }
            }).catch((error) => {
              setRecord("");
            });
          } else {
            setRecord("");
          }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [name, names, publicKey, triggerRecheck]);

  const handleRegister = async (event: any) => {
    event.preventDefault();
    await register(name, isPrivate, (running: boolean, status: Status) => {
      setRegistering(running);
      setStatus(status.message);
      if (!running) {
        setTriggerRecheck(triggerRecheck + 1);
      }
    });
  };

  const handleConvert = async (event: any) => {
    event.preventDefault();
    if (publicKey) {
      await transferCredits("transfer_public_to_private", publicKey, price, (running: boolean, status: Status) => {
        setRegistering(running);
        setStatus(status.message);
        if (!running) {
          toast(
            {type: "success",
              message: "Please wait a few minutes for the wallet to synchronize, then refresh the page to register the name"},
            {autoClose: 20000}
          );
        }
      });
    }
  };

  return (
    <>
      <Head>
        <title>{`${name} | Search | Aleo Name Service`}</title>
      </Head>
      <NextSeo
        title={`${name} | Search | Aleo Name Service`}
        description="Aleo Name Service search page"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <div className="mb-10">
          <SearchView value={name}/>
        </div>
        <div className="mb-3">
          <div
            className="rounded-lg bg-white shadow-card dark:bg-light-dark z-50 mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px]">
            <div className="relative items-center justify-between gap-4 p-4">
              <div className="items-center ltr:mr-6 rtl:ml-6">
                {isValid && <div>
                    <div className="block text-2xl font-medium tracking-wider text-gray-900 dark:text-white">
                      {name}.ans
                      {loading && <span className="animate-pulse">...</span>}
                      {!loading && available && <span className="text-green-500 text-sm ml-2">Available</span>}
                      {!loading && !available && <span className="text-red-500 text-sm ml-2">Unavailable</span>}
                    </div>
                  {!loading && available &&
                      <>
                          <div className="mt-3 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                              Register price: <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300 font-bold">{price} ALEO</span>
                          </div>
                          <div
                              className="mt-3 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block place-content-center">
                            {publicKey && !registering &&
                                <div className="flex items-center">
                                  {(record == "" && publicBalance > price * 1000000) && <>
                                      <Button className="bg-sky-500 mr-5" onClick={handleConvert}>Create Record</Button>
                                      <Button className="bg-gray-700 mr-5" disabled={true}>Register</Button>
                                  </>}
                                  {(record != "" || publicBalance <= price * 1000000) &&
                                      <Button className="bg-sky-500 mr-5" onClick={handleRegister}>Register</Button>}
                                    <ToggleSwitch label="Private fee" isToggled={isPrivate} setIsToggled={setIsPrivate} />
                                </div>
                            }
                            {publicKey && registering &&
                                <Button className="bg-sky-500" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {status}</Button>
                            }
                            {!publicKey && <WalletMultiButton className="bg-sky-500">Connect Wallet to
                                Register</WalletMultiButton>}
                              <div className="mt-5">
                                  <div onClick={toggleAleoTools} className="cursor-pointer block text-xs font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:text-sm">OR REGISTRATION VIA <span className="text-sky-500">aleo.tools</span>{showAleoTools ? " < " : " > "}</div>
                                  <div className={`overflow-hidden transition-max-height duration-500 ${showAleoTools ? 'max-h-120' : 'max-h-0'}`}>
                                    <span className="leading-loose">If registration through the Leo Wallet is not possible, <ActiveLink href="https://aleo.tools/develop" target="_blank" className="text-sky-500 underline">aleo.tools</ActiveLink> is another convenient option for registration. Here are the steps to follow. After clicking the 'Register' button above, the transaction records will be displayed in the confirmation pop-up window, you can copy them to use in aleo.tools</span>
                                    <ol className="list-decimal ml-6 leading-loose">
                                        <li>Open <ActiveLink href="https://aleo.tools/develop" target="_blank" className="text-sky-500 underline">aleo.tools</ActiveLink> in your web browser.</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Program ID</span> Enter <CopyToClipboardText text={NEXT_PUBLIC_REGISTRAR_PROGRAM} /> and click the search icon</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Private Key</span> Enter your PRIVATE_KEY</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Execute On-Chain</span> Turn on</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Fee</span> Enter <CopyToClipboardText text="0.37"/></li>
                                        {isPrivate && publicKey &&
                                            <>
                                                <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Private Fee</span> Turn on</li>
                                                <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Fee Record</span> Enter a record that contains at least 0.37 credits.</li>
                                           </>
                                        }
                                        <li>Expand the <span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300"> {">"} register_fld</span> function and fill in the following fields</li>
                                        <ol className="list-disc">
                                            <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r0</span> Enter <CopyToClipboardText text={'[' + nameInputs.join(",") + ']'}/></li>
                                            <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r1</span> Enter {publicKey?<CopyToClipboardText text={publicKey}/> : "the address which will own the name"}</li>
                                            <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r2</span> Enter {record != ""?<CopyToClipboardText text={record}/> : ("a record containing at least " + price + " credits")}.</li>
                                            <li>Click the <span className="bg-green-700 p-1 pl-2 pr-2 rounded-lg text-white">Run</span> button</li>
                                        </ol>
                                    </ol>
                                  </div>
                              </div>
                          </div>
                      </>
                  }
                  {!loading && !available &&
                      <div className="mt-3 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                          Owned by <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300">{owner}</span>
                      </div>
                  }
                </div>}
                {!isValid && <div>
                    <span className="block text-lg font-medium tracking-wider text-gray-900 dark:text-white">
                        <span className="text-red-500">{name}</span> is not a valid domain name
                    </span>
                </div>}
              </div>
            </div>
          </div>
        </div>
        {owner.length > 60 &&
            <div className="rounded-lg bg-white p-5 shadow-card dark:bg-light-dark z-50 mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px]">
                <ResolverView record={{ name: name + ".ans" } as Record} onlyView={true}/>
            </div>}
      </div>
    </>
  );
};

NamePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default NamePage;
