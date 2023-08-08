import type {NextPageWithLayout} from '@/types';
import {NextSeo} from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import SearchView from "@/components/search/view";
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {useEffect, useState} from "react";
import Button from "@/components/ui/button";
import {WalletMultiButton} from "@demox-labs/aleo-wallet-adapter-reactui/";
import { padArray, splitStringToBigInts } from '@/lib/util';
import * as process from "process";
import ActiveLink from "@/components/ui/links/active-link";
import CopyToClipboardText from "@/components/copy_to_clipboard";
import {RefreshIcon} from "@/components/icons/refresh";
import {useANS} from "@/lib/hooks/use-ans";


const NamePage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
  const NEXT_PUBLIC_PROGRAM = process.env.NEXT_PUBLIC_PROGRAM;
  const router = useRouter();
  const {wallet, publicKey} = useWallet();
  const {register} = useANS();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("Registering");
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [nameInputs, setNameInputs] = useState([0, 0, 0, 0]);
  const [showAleoTools, setShowAleoTools] = useState(false);

  let {slug} = router.query;

  // check if slug is valid
  if (typeof slug === 'string' && slug.endsWith('.ans')) {
    slug = slug.split('.')[0];
  } else if (typeof slug !== 'string') {
    slug = "";
  }

  const toggleAleoTools = () => {
    setShowAleoTools(!showAleoTools);
  }

  useEffect(() => {
    setLoading(true);
    const is_valid = /^[a-z0-9-_]{1,64}$/.test(slug as string);
    setIsValid(is_valid);
    if (is_valid) {
      fetch(`${NEXT_PUBLIC_API_URL}/address/${slug}.ans`)
        .then((response) => response.json())
        .then((data) => {
          setAvailable(false);
          setOwner(data.address);
        }).catch((error) => {
          setAvailable(true);
          const nameInputs = padArray(splitStringToBigInts(slug as string), 4);
          // @ts-ignore
          setNameInputs(nameInputs);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [slug, publicKey, triggerRecheck]);

  const handleRegister = async (event: any) => {
    event.preventDefault();
    await register(slug as string, (running: boolean, status: string) => {
      setRegistering(running);
      setStatus(status);
      if (!running) {
        setTriggerRecheck(triggerRecheck + 1);
      }
    });
  };

  return (
    <>
      <NextSeo
        title="Aleo Name Service | Getting Started"
        description="Aleo Name Service"
      />
      <div className="mx-auto w-full px-4 pt-8 pb-14 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 xl:px-10 2xl:px-0">
        <div className="mb-10">
          <SearchView value={slug}/>
        </div>
        <div className="mb-3">
          <div
            className="rounded-lg bg-white shadow-card dark:bg-light-dark z-50 mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px]">
            <div className="relative items-center justify-between gap-4 p-4">
              <div className="items-center ltr:mr-6 rtl:ml-6">
                {isValid && <div>
                    <div className="block text-2xl font-medium tracking-wider text-gray-900 dark:text-white">
                      {slug}.ans
                      {loading && <span className="animate-pulse">...</span>}
                      {!loading && available && <span className="text-green-500 text-sm ml-2">Available</span>}
                      {!loading && !available && <span className="text-red-500 text-sm ml-2">Unavailable</span>}
                    </div>
                  {!loading && available &&
                      <>
                          <div className="mt-3 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                              Register price: <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300 font-bold">5 ALEO</span>
                          </div>
                          <div
                              className="mt-3 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block place-content-center">
                            {publicKey && !registering &&
                                <Button className="bg-sky-500" onClick={handleRegister}>Register</Button>
                            }
                            {publicKey && registering &&
                                <Button className="bg-sky-500" disabled={true}><RefreshIcon className="inline motion-safe:animate-spin"/> {status}</Button>
                            }
                            {!publicKey && <WalletMultiButton className="bg-sky-500">Connect Wallet to
                                Register</WalletMultiButton>}
                              <div className="mt-5">
                                  <div onClick={toggleAleoTools} className="cursor-pointer block text-xs font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:text-sm">REGISTRATION VIA <span className="text-sky-500">aleo.tools</span>{showAleoTools ? " < " : " > "}</div>
                                  <div className={`overflow-hidden transition-max-height duration-500 ${showAleoTools ? 'max-h-96' : 'max-h-0'}`}>
                                    <span>If registration through the Leo Wallet is not possible, <ActiveLink href="https://aleo.tools/develop" target="_blank" className="text-sky-500 underline">aleo.tools</ActiveLink> is another convenient option for registration. Here are the steps to follow. After clicking the 'Register' button above, the transaction records will be displayed in the confirmation pop-up window, you can copy them to use in aleo.tools</span>
                                    <ol className="list-decimal ml-6">
                                        <li>Open <ActiveLink href="https://aleo.tools/develop" target="_blank" className="text-sky-500 underline">aleo.tools</ActiveLink> in your web browser.</li>
                                        <li>In the 'Program ID' field, enter <CopyToClipboardText text={NEXT_PUBLIC_PROGRAM} /> and click the search icon</li>
                                        <li>Provide your PRIVATE_KEY in the corresponding 'Private Key' field</li>
                                        <li>Switch to the 'Execute On-Chain' mode</li>
                                        <li>Enter <CopyToClipboardText text="3.8"/> in the "Fee" field</li>
                                        <li>In the 'Fee Record' field, enter a record that contains at least 3.8 credits.</li>
                                        <li>Expand the 'register' function and fill in the following fields</li>
                                        <ol className="list-disc">
                                            <li>data1: Enter <CopyToClipboardText text={nameInputs[0] + 'u128'}/></li>
                                            <li>data2: Enter <CopyToClipboardText text={nameInputs[1] + 'u128'}/></li>
                                            <li>data3: Enter <CopyToClipboardText text={nameInputs[2] + 'u128'}/></li>
                                            <li>data4: Enter <CopyToClipboardText text={nameInputs[3] + 'u128'}/></li>
                                            <li>r1: Enter {publicKey?<CopyToClipboardText text={publicKey}/>:"the address which will own the name"}</li>
                                            <li>r2: Enter a record containing at least 5 credits.</li>
                                            <li>Click the "Run" button</li>
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
                        <span className="text-red-500">{slug}</span> is not a valid domain name
                    </span>
                </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

NamePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default NamePage;
