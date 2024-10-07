import type {CouponCard, NextPageWithLayout, Record, TLD} from '@/types';
import {NextSeo} from 'next-seo';
import SearchView from "@/components/search/view";
import {useRouter} from 'next/router'
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import React, {useEffect, useMemo, useState} from "react";
import Button from "@/components/ui/button";
import * as process from "process";
import {RefreshIcon} from "@/components/icons/refresh";
import {useANS} from "@/lib/hooks/use-ans";
import {Status} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import ToggleSwitch from "@/components/ui/toggle-switch";
import {useRecords} from "@/lib/hooks/use-records";
import useSWR, {useSWRConfig} from "swr";
import {useCredit} from "@/lib/hooks/use-credit";
import Head from "next/head";
import ResolverView from "@/components/resolver/view";
import toast from "@/components/ui/toast";
import AnchorLink from "@/components/ui/links/anchor-link";
import {WalletMultiButton} from "@/components/WalletMultiButton";
import Layout from "@/layouts/_layout";
import {Check} from "@/components/icons/check";
import tlds from "@/config/tlds";

import {usePrivateFee} from "@/lib/hooks/use-private-fee";


const NamePage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_FEES_REGISTER = parseInt(process.env.NEXT_PUBLIC_FEES_REGISTER!);
  const COUPON_CARD_START_HEIGHT = parseInt(process.env.NEXT_PUBLIC_COUPON_CARD_START_HEIGHT!);
  const MINT_START_HEIGHT = parseInt(process.env.NEXT_PUBLIC_MINT_START_HEIGHT!);
  const router = useRouter();
  const {publicKey} = useWallet();
  const {mutate} = useSWRConfig();
  const {transferCredits} = useCredit();
  const {register, calcPrice, getCouponCards, matchTld} = useANS();
  const {getLatestHeight} = useClient();
  const {getAddress} = useClient();
  const {getCreditRecords} = useCredit();
  const {names} = useRecords();
  const [couponCards, setCouponCards] = useState<CouponCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<CouponCard | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("Registering");
  const [triggerRecheck, setTriggerRecheck] = useState(0);
  const [name, setName] = useState("");
  const [tld, setTld] = useState<TLD>(tlds[0]);
  const [price, setPrice] = useState<number>(2);
  const [record, setRecord] = useState("");
  const [feeRecord, setFeeRecord] = useState("");
  const [resolverRecordCount, setResolverRecordCount] = useState(0);
  const {privateFee, setPrivateFee} = usePrivateFee();
  const {data: latestHeight} = useSWR('getLatestHeight', () => getLatestHeight(), {refreshInterval: (l) => {
    return l > MINT_START_HEIGHT ? 100000000000 : 3000;
    }});

  const needCreateRecord = useMemo(() => {
    return record == "" && privateFee && price > 0;
  }, [record, privateFee, price]);

  const needCreateFeeRecord = useMemo(() => {
    return (record != "" || price == 0) && feeRecord == "" && privateFee;
  }, [record, feeRecord, privateFee, price]);

  const canPublicMint = useMemo(() => {
    return (latestHeight || 0) >= MINT_START_HEIGHT;
  }, [latestHeight]);

  const canCouponMint = useMemo(() => {
    return (latestHeight || 0) >= COUPON_CARD_START_HEIGHT;
  }, [latestHeight]);

  const canRegister = useMemo(() => {
    if (canPublicMint) {
      // stop swr getLatestHeight
      mutate("getLatestHeight");
    }
    return canPublicMint || (canCouponMint && selectedCard);
  }, [selectedCard, canPublicMint, canCouponMint]);

  const ansRecord = useMemo(() => {
    return {
      name: `${name}.${tld.name}` as string,
      private: owner.length > 60
    } as Record
  }, [name]);

  useEffect(() => {
    if (router.isReady) {
      const {slug} = router.query;
      if (typeof slug === 'string') {
        const matchedTld = matchTld(slug);
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
    let amount = [];
    if (ans_price > 0) {
      amount.push(ans_price)
    }
    if (privateFee) {
      amount.push(NEXT_PUBLIC_FEES_REGISTER)
    }
    if (amount.length == 0) {
      setRecord("");
      setFeeRecord("");
      return;
    }
    getCreditRecords(amount, false).then((records) => {
      if (ans_price > 0) {
        setRecord(records[0].plaintext);
        privateFee && setFeeRecord(records[1].plaintext);
      } else {
        setFeeRecord(records[0].plaintext);
      }
    }).catch((error) => {
      setRecord("");
      setFeeRecord("");
    });
  }

  useEffect(() => {
    setOwner("");
    setLoading(true);
    if (name == "") {
      setIsValid(false);
      return;
    }
    if (names?.includes(`${name}.${tld.name}`)) {
      router.push(`/account/${name}.${tld.name}`);
      return;
    }
    const is_valid = /^([a-z0-9-_]{1,64}\.)*[a-z0-9-_]{1,64}$/.test(name);
    is_valid && getAddress(`${name}.${tld.name}`)
      .then((address) => {
        setIsValid(true);
        setAvailable(false);
        setOwner(address);
      }).catch((error) => {
        const is_valid = /^[a-z0-9-_]{1,64}$/.test(name);
        setIsValid(is_valid);
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
              if (cards.length === 0) {
                setSelectedCard(null);
              } else if (selectedCard && !cards.some(card => card.enable && card.id === selectedCard.id)) {
                setSelectedCard(null);
              }
            });
          }
          // refresh balance
          mutate('getBalance');
          setAvailable(true);
          // @ts-ignore
          if (publicKey) {
            checkRecords();
          } else {
            setRecord("");
            setFeeRecord("");
          }
        }
    }).finally(() => {
      setLoading(false);
    });
  }, [name, names, publicKey, triggerRecheck, tld]);

  useEffect(() => {
    if (publicKey) {
      checkRecords();
    }
    // setShowAleoTool(!selectedCard);
  }, [privateFee, publicKey, selectedCard]);

  const handleRegister = async (event: any) => {
    event.preventDefault();
    await register(name, tld, selectedCard, privateFee, (running: boolean, status: Status) => {
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
      await transferCredits("", "transfer_public_to_private", publicKey, price, (running: boolean, status: Status) => {
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
      await transferCredits("", "transfer_public_to_private", publicKey, NEXT_PUBLIC_FEES_REGISTER, (running: boolean, status: Status) => {
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
                            {price > 0 &&
                                <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300 font-bold">
                                {price} {privateFee ? "Private" : "Public"} Credits
                              </span>}
                            {price == 0 &&
                                <span className="bg-gray-700 p-1 pl-2 pr-2 rounded-lg text-gray-300 font-bold">
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
                                            className={`relative w-32 h-20 max-w-xs overflow-hidden rounded-lg border-2 shadow-md ${
                                              card.enable ? (card.discount_percent > 0 ? 'bg-red-100' : 'bg-white') : 'bg-gray-400'
                                            } py-3 px-5 ${card.enable && "cursor-pointer"}
                                        ${(selectedCard && selectedCard.id == card.id) ? "border-green-500" : "border-gray-200"}`}
                                            onClick={() => selectCard(card)}
                                          >
                                          <h5 className={`text-xl font-bold tracking-tight ${
                                              card.discount_percent > 0 ? 'text-red-700' : 'text-gray-900'
                                        }`}>
                                          {card.discount_percent > 0 ? `${100 - card.discount_percent}% OFF` : 'Free Card'}
                                        </h5>
                                            <p className="text-3xs-5 text-gray-500">For lengths <span className="font-bold">{card.limit_name_length}+</span></p>
                                            <p className="text-3xs-5 text-gray-500">Can use <span className="text-red-400 font-bold">{card.count}</span> times</p>
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
                                  {(needCreateRecord && canRegister) && <>
                                      <Button className="mr-5" onClick={handleConvert}>Prepare Record</Button>
                                  </>}
                                  {(needCreateFeeRecord && canRegister) && <>
                                      <Button className="mr-5" onClick={handleConvertFee}>Prepare Fee Record</Button>
                                  </>}
                                  {(!needCreateRecord && !needCreateFeeRecord && canRegister) &&
                                      <Button className="mr-5" onClick={handleRegister}>Register</Button>}
                                  {(needCreateRecord || needCreateFeeRecord || !canRegister) &&
                                      <Button className="bg-gray-700 mr-5" disabled={true}>
                                        { canPublicMint ? 'Register' : (!canCouponMint && selectedCard) ? `Coupon Register in ${COUPON_CARD_START_HEIGHT - (latestHeight || 0)} blocks` : `Public register in ${MINT_START_HEIGHT - (latestHeight || 0)} blocks`}
                                      </Button>}
                                    <ToggleSwitch label="Private fee" isToggled={privateFee}
                                                  setIsToggled={setPrivateFee}/>
                                </div>
                            }
                            {publicKey && registering &&
                                <Button color="gray" disabled={true}><RefreshIcon className="inline text-aquamarine motion-safe:animate-spin"/> {status}</Button>
                            }
                            {!publicKey && <WalletMultiButton>Connect Wallet to Register</WalletMultiButton>}
                            {publicKey && needCreateRecord && canRegister && <div className="mt-5">
                                You need <span className="underline">{price} Private Credits</span> to pay for the domain register fee, but currently,
                                you do not have enough Private Credits. <br/>
                                Please click on <span className="rounded-full bg-teal text-black p-1">Prepare Record</span> to convert your Public Credits into Private Credits.<br/>
                                Alternatively, you can manually perform this conversion within your wallet.<br/>
                                After the operation, you will need to wait a few minutes for the wallet to synchronize.<br/>
                                Once you refresh this page and see that the <span className="rounded-full bg-teal text-black p-1">Register</span> button has become clickable,
                                you can proceed with the registration.
                            </div>}
                            {publicKey && needCreateFeeRecord && canRegister && <div className="mt-5">
                                You need <span className="underline">0.11 Private Credits</span> for the gas fee,
                                but you currently lack sufficient Private Credits.<br/>
                                Please select <span className="rounded-full bg-teal text-black p-1">Prepare Fee Record</span> to convert Public
                                Credits into Private Credits, or manually make this conversion in your wallet. <br/>
                                After this, please wait a few minutes for wallet synchronization. <br/>
                                Refresh this page, and if the <span className="rounded-full bg-teal text-black p-1">Register</span> button is clickable,
                                you're ready to register.<br/>
                                Alternatively, you may opt to disable the <span className="rounded-full bg-teal text-black p-1">Private Fee</span> option for a simpler process.
                            </div>}
                            {publicKey && !privateFee && <div className="mt-5">
                                Please be aware that by disabling the "Private Fee" option,
                                  your Aleo address will be exposed in the transaction records.
                            </div>}
                            {publicKey && !canPublicMint && canCouponMint && <div className="mt-5 text-red-400">
                                Note: Only open for registration with a coupon card.
                            </div>}
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
        {isValid && !available && <div className={`${resolverRecordCount < 1 && 'hidden'} rounded-lg bg-white p-5 shadow-card z-50 mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px] [background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))]`}>
            <ResolverView record={ansRecord} onlyView={true} setResolverRecordCount={setResolverRecordCount}/>
        </div>}
      </div>
    </>
  );
};

NamePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default NamePage;
