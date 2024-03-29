import type {CouponCard, NextPageWithLayout, Record, TLD} from '@/types';
import {NextSeo} from 'next-seo';
import SearchView from "@/components/search/view";
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import React, {useEffect, useState} from "react";
import Button from "@/components/ui/button";
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
import AnchorLink from "@/components/ui/links/anchor-link";
import {WalletMultiButton} from "@/components/WalletMultiButton";
import Layout from "@/layouts/_layout";
import {Check} from "@/components/icons/check";
import tlds from "@/config/tlds";


const NamePage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_FEES_REGISTER = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER!);
  const router = useRouter();
  const {publicKey} = useWallet();
  const {mutate} = useSWRConfig();
  const {transferCredits} = useCredit();
  const {register, calcPrice, getFormattedNameInput, getCouponCards} = useANS();
  const {getAddress} = useClient();
  const {getCreditRecords} = useCredit();
  const {names, publicBalance} = useRecords();
  const [couponCards, setCouponCards] = useState<CouponCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CouponCard | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("Registering");
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [nameInputs, setNameInputs] = useState("");
  const [showAleoTools, setShowAleoTools] = useState(false);
  const [name, setName] = useState("");
  const [tld, setTld] = useState<TLD>(tlds[0]);
  const [price, setPrice] = useState(2);
  const [record, setRecord] = useState("");
  const [feeRecord, setFeeRecord] = useState("");
  const [isPrivate, setIsPrivate] = useState<boolean>(true);

  useEffect(() => {
    if (router.isReady) {
      const {slug} = router.query;
      if (typeof slug === 'string') {
        const matchedTld = tlds.find(tld => slug.endsWith(`.${tld.name}`));

        if (matchedTld) {
          setName(slug.split('.').slice(0, -1).join('.'));
          setTld(matchedTld);
        } else {
          setName(slug);
        }
      }
    }
  }, [router.isReady && router.query]);

  const selectCard = (card: CouponCard) => {
    if (card.enable) {
      if (selectedCard && selectedCard.id == card.id) {
        setSelectedCard(null);
      } else {
        setSelectedCard(card);
      }
    }
  }

  const checkRecords = () => {
    const ans_price = calcPrice(name, tld, selectedCard);
    setPrice(ans_price / 1000000);
    getCreditRecords(isPrivate ? [ans_price, NEXT_PUBLIC_FEES_REGISTER] : [ans_price]).then((records) => {
      if (records) {
        setRecord(records[0].plaintext);
        isPrivate && setFeeRecord(records.length > 1 ? records[1].plaintext : "");
      } else {
        setRecord("");
        setFeeRecord("");
      }
    }).catch((error) => {
      setRecord("");
      setFeeRecord("");
    });
  }

  const toggleAleoTools = () => {
    setShowAleoTools(!showAleoTools);
  }

  useEffect(() => {
    setOwner("");
    setLoading(true);
    const is_valid = /^[a-z0-9-_]{1,64}$/.test(name);
    setIsValid(is_valid);
    if (names?.includes(`${name}.${tld.name}`)) {
      router.push(`/account/${name}.${tld.name}`);
      return;
    }
    if (is_valid) {
      const ans_price = calcPrice(name, tld, selectedCard);
      setPrice(ans_price / 1000000);
      if (couponCards.length > 0) {
        couponCards.forEach((card) => {
          card.enable = card.limit_name_length <= name.length;
          if (!card.enable && selectedCard && selectedCard.id == card.id) {
            setSelectedCard(null);
          }
        });
      }
      if (publicKey) {
        getCouponCards(name, tld).then((cards) => {
          setCouponCards(cards);
          cards.forEach((card) => {
            if (!card.enable && selectedCard && selectedCard.id == card.id) {
              setSelectedCard(null);
            }
          })
          console.log(cards)
        });
      }
      getAddress(`${name}.${tld.name}`)
        .then((address) => {
          setAvailable(false);
          setOwner(address);
        }).catch((error) => {
          // refresh balance
          mutate('getBalance');
          setAvailable(true);
          // @ts-ignore
          setNameInputs(getFormattedNameInput(name, 4));
          if (publicKey) {
            checkRecords();
          } else {
            setRecord("");
            setFeeRecord("");
          }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [name, names, publicKey, triggerRecheck, tld]);

  useEffect(() => {
    if (publicKey) {
      checkRecords();
    }
  }, [isPrivate, publicKey, selectedCard]);

  const handleRegister = async (event: any) => {
    event.preventDefault();
    await register(name, tld, selectedCard, isPrivate, (running: boolean, status: Status) => {
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
        if (!running && !status.hasError) {
          toast(
            {type: "warning",
              message: "Please wait a few minutes for the wallet to synchronize, then refresh the page to register the name"},
            {autoClose: 20000}
          );
        }
      });
    }
  };

  const handleConvertFee = async (event: any) => {
    event.preventDefault();
    if (publicKey) {
      await transferCredits("transfer_public_to_private", publicKey, NEXT_PUBLIC_FEES_REGISTER, (running: boolean, status: Status) => {
        setRegistering(running);
        setStatus(status.message);
        if (!running && !status.hasError) {
          toast(
            {type: "warning",
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
      <div className="w-full pt-8">
        <div className="mb-10">
          <SearchView value={name}/>
        </div>
        <div className="mb-3">
          <div
            className="rounded-lg bg-white shadow-card z-50 mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px] [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))]">
            <div className="relative items-center justify-between gap-4 p-4">
              <div className="items-center ltr:mr-6 rtl:ml-6">
                {isValid && <div>
                    <div className="block text-4xl font-medium tracking-wider text-gray-900 dark:text-white">
                      {name}.{tld.name}
                      {loading && <span className="animate-pulse">...</span>}
                      {!loading && available && <span className="text-green-500 text-sm ml-2">Available</span>}
                      {!loading && !available && <span className="text-red-500 text-sm ml-2">Unavailable</span>}
                    </div>
                  {!loading && available &&
                      <>
                          <div className="mt-3 text-xl tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                              <span className="mr-2">Register Price:</span>
                              {price > 0 && <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300 font-bold">
                                {price} ALEO
                              </span>}
                              {price == 0 && <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300 font-bold">
                                FREE
                              </span>}
                          </div>
                          {couponCards.length > 0 &&
                          <div className="flex justify-left items-center overflow-hidden mt-5">
                            <div className="flex overflow-x-auto pb-2">
                                <div className="flex flex-nowrap">
                                  {couponCards.map((card) => {
                                    const cardContent = (
                                      <div
                                        className={`relative w-32 h-16 max-w-xs overflow-hidden rounded-lg border-2 shadow-md ${
                                          card.enable ? (card.discount_percent > 0 ? 'bg-red-100' : 'bg-white') : 'bg-gray-400'
                                        } py-3 px-5 ${card.enable && "cursor-pointer"}
                                        ${(selectedCard && selectedCard.id == card.id) ? "border-green-500":"border-gray-200"}`}
                                        onClick={() => selectCard(card)}
                                      >
                                        <h5 className={`text-xl font-bold tracking-tight ${
                                          card.discount_percent > 0 ? 'text-red-700' : 'text-gray-900'
                                        }`}>
                                          {card.discount_percent > 0 ? `${card.discount_percent}% OFF` : 'Free Card'}
                                        </h5>
                                        {card.limit_name_length > 1 && <p className="text-3xs-5 text-gray-500">For lengths {card.limit_name_length}+</p>}
                                        {selectedCard && selectedCard.id == card.id && (
                                          <div
                                            className="absolute top-0 right-0 w-6 h-6 bg-green-500 flex justify-center items-center"
                                            style={{clipPath: 'polygon(100% 0, 0 0, 100% 100%)'}}
                                          >
                                            <Check className="text-white w-4 h-4"
                                                   style={{position: 'relative', top: '-0.3rem', right: '-0.3rem'}}/>
                                          </div>

                                        )}
                                      </div>
                                    );

                                    return <div className="inline-block pr-3" key={card.id}>{cardContent}</div>;
                                  })}
                                </div>
                            </div>
                          </div>
                          }
                          <div
                              className="mt-5 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block place-content-center">
                              {publicKey && !registering &&
                                <div className="flex items-center">
                                  {(record == "" && publicBalance > price * 1000000) && <>
                                      <Button className="mr-5" onClick={handleConvert}>Create Record</Button>
                                      <Button className="bg-gray-700 mr-5" disabled={true}>Register</Button>
                                  </>}
                                  {(record != "" && feeRecord == "" && isPrivate && publicBalance - NEXT_PUBLIC_FEES_REGISTER > price * 1000000) && <>
                                      <Button className="mr-5" onClick={handleConvertFee}>Create Fee Record</Button>
                                      <Button className="bg-gray-700 mr-5" disabled={true}>Register</Button>
                                  </>}
                                  {((record != "" && (!isPrivate || feeRecord != "")) || publicBalance <= price * 1000000) &&
                                      <Button className="mr-5" onClick={handleRegister}>Register</Button>}
                                    <ToggleSwitch label="Private fee" isToggled={isPrivate}
                                                  setIsToggled={setIsPrivate}/>
                                </div>
                            }
                            {publicKey && registering &&
                                <Button color="gray" disabled={true}><RefreshIcon className="inline text-aquamarine motion-safe:animate-spin"/> {status}</Button>
                            }
                            {!publicKey && <WalletMultiButton>Connect Wallet to Register</WalletMultiButton>}
                              <div className="mt-5">
                                  <div onClick={toggleAleoTools} className="cursor-pointer block text-xs font-medium uppercase tracking-wider text-gray-900 dark:text-white sm:text-sm">OR REGISTRATION VIA <span className="text-sky-500">aleo.tools</span>{showAleoTools ? " < " : " > "}</div>
                                  <div className={`overflow-hidden transition-max-height duration-500 ${showAleoTools ? 'max-h-120' : 'max-h-0'}`}>
                                    <span className="leading-loose">If registration through the Leo Wallet is not possible, <ActiveLink href="https://aleo.tools/develop" target="_blank" className="text-sky-500 underline">aleo.tools</ActiveLink> is another convenient option for registration. Here are the steps to follow. After clicking the 'Register' button above, the transaction records will be displayed in the confirmation pop-up window, you can copy them to use in aleo.tools</span>
                                    <ol className="list-decimal ml-6 leading-loose">
                                        <li>Open <ActiveLink href="https://aleo.tools/develop" target="_blank" className="text-sky-500 underline">aleo.tools</ActiveLink> in your web browser.</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Program ID</span> Enter <CopyToClipboardText text={tld.registrar} /> and click the search icon</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Private Key</span> Enter your PRIVATE_KEY</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Execute On-Chain</span> Turn on</li>
                                        <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Fee</span> Enter <CopyToClipboardText text="0.37"/></li>
                                        {isPrivate && publicKey &&
                                            <>
                                                <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Private Fee</span> Turn on</li>
                                                <li><span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">Fee Record</span> Enter {feeRecord != ""?<CopyToClipboardText text={feeRecord}/> : ("a record containing at least 0.37 credits")}</li>
                                           </>
                                        }
                                        <li>Expand the <span className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300"> {">"} register_fld</span> function and fill in the following fields</li>
                                        <ol className="list-disc">
                                            <li><span
                                                className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r0</span> Enter <CopyToClipboardText
                                                text={nameInputs}/></li>
                                            <li><span
                                                className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r1</span> Enter <CopyToClipboardText
                                                text={tld.hash}/></li>
                                            <li><span
                                                className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r2</span> Enter {publicKey ?
                                              <CopyToClipboardText
                                                text={publicKey}/> : "the address which will own the name"}</li>
                                            <li><span
                                                className="bg-gray-700 p-0.5 pl-2 pr-2 rounded-lg text-gray-300">r3</span> Enter {record != "" ?
                                              <CopyToClipboardText
                                                text={record}/> : ("a record containing at least " + price + " credits")}
                                            </li>
                                            <li>Click the <span
                                                className="bg-green-700 p-1 pl-2 pr-2 rounded-lg text-white">Run</span> button
                                            </li>
                                        </ol>
                                    </ol>
                                  </div>
                              </div>
                          </div>
                      </>
                  }
                  {!loading && !available &&
                      <div className="mt-3 text-sm tracking-tighter text-gray-600 dark:text-gray-400 sm:block">
                          Owned by
                          <span className="bg-gray-700 ml-2 p-1 pl-2 pr-2 rounded-lg text-gray-300">
                            {owner.length > 60 &&
                                <AnchorLink href={`/names/${owner}`} className="truncate">
                                  {owner}
                                </AnchorLink>}
                            {owner.length < 60 && owner }
                          </span>
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
        {owner.length > 60 && <div className="rounded-lg bg-white p-5 shadow-card z-50 mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px] [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))]">
            <ResolverView record={{ name: `${name}.${tld.name}` } as Record} onlyView={true}/>
        </div>}
      </div>
    </>
  );
};

NamePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default NamePage;
