import type {NextPageWithLayout, Status} from '@/types';
import {NextSeo} from 'next-seo';
import React, {useEffect, useMemo, useState} from "react";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import {useCredit} from "@/lib/hooks/use-credit";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import Layout from "@/layouts/_layout";
import {WalletMultiButton} from "@/components/WalletMultiButton";
import tlds from "@/config/tlds";
import tokens from "@/config/tokens";
import {useClient} from "@/lib/hooks/use-client";
import {DynamicAddressIcon} from "@/assets/address/DynamicAddressIcon";
import ActiveLink from "@/components/ui/links/active-link";
import {useANS} from "@/lib/hooks/use-ans";

const ToolBoxPage: NextPageWithLayout = () => {
  const NEXT_PUBLIC_EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL!;
  const {transferCredits, transferCreditsToANS} = useCredit();
  const tldName = tlds[0].name;
  const {publicKey} = useWallet();
  const {getAddress} = useClient();
  const {matchTld} = useANS();
  const [transferStatus, setTransferStatus] = useState("Transferring");
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [amount, setAmount] = useState<number>();
  const [password, setPassword] = useState<string>("");
  const [amountError, setAmountError] = useState("");
  const [method, setMethod] = useState<string>("transfer_private");
  const isPrivate = useMemo(() => !recipientAddress.startsWith("aleo"), [recipientAddress]);
  const [transferType, setTransferType] = useState<'aleo' | 'arc21'>('aleo');
  const [tokenId, setTokenId] = useState('');
  const [tokenIdError, setTokenIdError] = useState("");


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (recipient) {
        const matchedTld = matchTld(recipient);
        if (!matchedTld) {
          setRecipientError("Invalid recipient ANS");
          setRecipientAddress("");
          return;
        }
        setLoading(true);
        getAddress(recipient)
          .then((address) => {
            setRecipientAddress(address);
            setRecipientError("");
            if (!address.startsWith('aleo')) {
              // setMethod('transfer_to_ans');
              setRecipientError("Only support public ANS now");
              setRecipientAddress("");
            }
          })
          .catch((error) => {
            setRecipientError("Recipient ANS is not registered");
            setRecipientAddress("");
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setRecipientError("");
        setRecipientAddress("");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [recipient]);

  useEffect(() => {
    if (amount && amount > 0) {
      setAmountError("");
    }
  }, [amount]);

  const handleAmount = (event: any) => {
    const value = parseFloat(event.target.value);
    // make sure the amount is a valid number
    if (isNaN(value)) {
      setAmount(0);
      return false;
    }
    setAmount(Math.floor(value * 1e6) / 1e6);
  }

  const onStatusChange = (running: boolean, status: Status) => {
    setLoading(running);
    setTransferStatus(status.message);
  }

  const handleTransfer = async () => {
    if (!recipient || recipient.length == 0) {
      setRecipientError("Recipient ANS is required");
      return;
    }
    setRecipientError("");
    if (!amount || amount == 0) {
      setAmountError("Amount is required");
      return;
    }
    setAmountError("");
    if (transferType === 'arc21') {
      if (tokenId.length == 0) {
        setTokenIdError("Token ID is required");
        return;
      }
      setTokenIdError("");
    }
    method == 'transfer_to_ans' ?
      await transferCreditsToANS(tokenId,recipient, amount, password, onStatusChange) :
    await transferCredits(tokenId, method, recipientAddress, amount, onStatusChange);
  }

  return (
    <>
      <NextSeo
        title="Toolbox | Aleo Name Service"
        description="Aleo Name Service Toolbox page"
      />
      <div className="w-full pt-8">
        <h2 className="text-4xl font-medium tracking-wider text-gray-900 dark:text-white sm:mb-10 sm:text-2xl text-left">
          ANS Toolbox <span className="text-gray-400 text-xl block xs:inline"> {">"} Transfer to ans names</span>
        </h2>
        <div className="[background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))] rounded-lg pt-5 px-5">
          <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
            <label htmlFor="transferType"
                   className="h-4 leading-4 w-full text-left align-middle mb-2 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Transfer</label>
            <select
              className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 px-4 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 hover:border-teal focus:border-aquamarine sm:px-8"
              id="transferType"
              value={transferType}
              onChange={(event) => {
                setTransferType(event.currentTarget.value as 'aleo' | 'arc21');
                if (event.currentTarget.value === 'aleo') {
                  setTokenId('');
                }
              }}
              autoComplete="off"
            >
              <option value="aleo">Aleo Credits</option>
              <option value="arc21">ARC21 Token</option>
            </select>
          </div>
          
          {transferType === 'arc21' && (
            <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
              <label htmlFor="tokenId"
                     className="h-4 leading-4 w-full text-left align-middle mb-2 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Token</label>
              <select
                className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-600 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-4 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 sm:px-8"
                id="tokenId"
                value={tokenId}
                onChange={(event) => setTokenId(event.currentTarget.value)}
                autoComplete="off"
              >
                {tokens.map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {transferType === 'arc21' && tokenIdError && (
            <div className="text-center text-red-500 text-base mt-2">
              {tokenIdError}
            </div>
          )}
          <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
            <label htmlFor="recipient"
                   className="h-4 leading-4 w-full text-left align-middle mb-2 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Recipient</label>
            <input
              className={`${recipientError ? 'border-red-500' : 'border-gray-600'} flex-1 h-12 w-full appearance-none rounded-full border-2 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-4 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 sm:px-8`}
              id="recipient"
              required={true}
              value={recipient}
              placeholder={`ANS(***.${tldName})`}
              onChange={(event) => setRecipient(event.currentTarget.value.trim())}
              autoComplete="off"
            />
          </div>
          {recipientError && (
            <div className="text-center text-red-500 text-base mt-2">
              {recipientError}
            </div>
          )}
          {recipientAddress && isPrivate && (
            <div className="text-center text-gray-400 text-base mt-2">
              Transfer Aleo Credits to private ANS
            </div>
          )}
          {recipientAddress && !isPrivate && (
            <ActiveLink
              href={`${NEXT_PUBLIC_EXPLORER_URL}${recipientAddress}`}
              target={"_blank"}
              className="cursor-pointer [border:none] rounded-full flex flex-row mt-2 items-center justify-center gap-[5px] z-[2]">
              <div className="!h-[21px] !w-[21px] relative">
                <div
                  className="absolute top-[0.2px] left-[-0.3px] rounded-[50%] bg-gainsboro-200 w-full h-full z-[3]"/>
                <DynamicAddressIcon name="aleo" className="absolute top-[6.5px] left-[6.1px] w-[8.1px] h-[8.7px] z-[4]"/>
              </div>
              <div className="relative text-md leading-[100%] text-left z-[3] truncate text-gray-400">
                {recipientAddress}
              </div>
            </ActiveLink>
          )}
          {recipientAddress && !isPrivate && <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
            <label htmlFor="transfer"
                   className="h-4 leading-4 w-full text-left align-middle mb-2 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Method</label>
              <select
                  className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 px-4 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 hover:border-teal focus:border-aquamarine sm:px-8"
                  id="transfer"
                  value={method}
                  onChange={(event) => setMethod(event.currentTarget.value)}
                  autoComplete="off"
              >
                  <option value="transfer_private">Transfer Private</option>
                  <option value="transfer_public">Transfer Public</option>
                  <option value="transfer_private_to_public">Transfer Private to Public</option>
                  <option value="transfer_public_to_private">Transfer Public to Private</option>
              </select>
          </div>}
          <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
            <label htmlFor="amount"
                   className="h-4 leading-4 w-full text-left align-middle mb-2 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Amount</label>
            <input
              className={`${amountError ? 'border-red-500' : 'border-gray-600'} flex-1 h-12 w-full appearance-none rounded-full border-2 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-4 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 sm:px-8`}
              id="amount"
              required={true}
              value={amount}
              placeholder={"amount in credit"}
              onChange={handleAmount}
              autoComplete="off"
            />
          </div>
          {amountError && (
            <div className="text-center text-red-500 text-base mt-2">
              {amountError}
            </div>
          )}
          {recipientAddress && method == 'transfer_to_ans' && <>
              <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
                  <label htmlFor="password"
                         className="h-4 leading-4 w-full text-left align-middle mb-2 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Password</label>
                  <input
                      className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-4 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 sm:px-8"
                      id="password"
                      required={false}
                      maxLength={32}
                      placeholder={"Optional Password for recipient to withdraw the ACs"}
                      value={password}
                      onChange={(event) => setPassword(event.currentTarget.value.trim())}
                      autoComplete="off"
                  />
              </div>
              {password && <>
              <div className="text-center text-red-300 text-base mt-2">
                {"YOU WILL NOT BE ABLE TO RECOVER THE PASSWORD."}
              </div>
              <div className="text-center text-red-300 text-base">
                {"PLEASE MAKE SURE TO SHARE THE PASSWORD WITH THE RECIPIENT."}
              </div></>
              }
          </>}
          <div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
            <label
              className="h-4 leading-4 w-full text-right align-middle mb-2 mx-2 sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0"></label>
            {!publicKey && <WalletMultiButton>Connect Wallet to Transfer</WalletMultiButton>}
            {publicKey && !loading && <Button onClick={handleTransfer} disabled={!!recipientError}>Transfer</Button>}
            {publicKey && loading && <Button color={"gray"} disabled={true}><RefreshIcon
                className="inline text-aquamarine motion-safe:animate-spin"/> {transferStatus}</Button>}
          </div>
        </div>
      </div>
    </>
  );
};

ToolBoxPage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ToolBoxPage;
