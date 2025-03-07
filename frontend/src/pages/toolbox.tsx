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
import env from "@/config/env";
import {useRouter} from "next/router";

const ToolBoxPage: NextPageWithLayout = () => {
  const router = useRouter();
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
  const [amount, setAmount] = useState<string>();
  const [password, setPassword] = useState<string>("");
  const [amountError, setAmountError] = useState("");
  const [method, setMethod] = useState<string>("transfer_to_ans");
  const isPrivate = useMemo(() => !recipientAddress.startsWith("aleo"), [recipientAddress]);
  const [transferType, setTransferType] = useState<'aleo' | 'arc21'>('aleo');
  const [tokenId, setTokenId] = useState('');
  const [tokenIdError, setTokenIdError] = useState("");

  // Handle URL query parameter
  useEffect(() => {
    if (router.query.recipient && typeof router.query.recipient === "string") {
      setRecipient(router.query.recipient);
    }
  }, [router.query.recipient]);


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
        setTransferStatus("Checking")
        getAddress(recipient)
          .then((address) => {
            setRecipientAddress(address);
            setRecipientError("");
            if (!address.startsWith('aleo')) {
              setMethod('transfer_to_ans');
            }
          })
          .catch((error) => {
            setRecipientError("Recipient ANS is not registered");
            setRecipientAddress("");
          })
          .finally(() => {
            setLoading(false);
            setTransferStatus("Transferring")
          });
      } else {
        setRecipientError("");
        setRecipientAddress("");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [recipient]);

  useEffect(() => {
    const numAmount = parseFloat(amount || "");
    if (numAmount && numAmount > 0) {
      setAmountError("");
    }
  }, [amount]);

  const handleAmount = (event: any) => {
    let inputValue = event.target.value;

    // Allow empty input
    if (!inputValue) {
      setAmount(undefined);
      return;
    }

    // Only allow numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(inputValue)) {
      return false;
    }

    if (inputValue == ".") {
      inputValue = "0."
    }

    setAmount(inputValue);
  }

  const onStatusChange = (running: boolean, status: Status) => {
    setLoading(running);
    setTransferStatus(status.message);
    if (!running && !status.hasError) {
      setRecipient("");
      setAmount(undefined);
      setRecipientError("");
      setAmountError("");
      setPassword("");
    }
  }

  const handleTransfer = async () => {
    if (!recipient || recipient.length == 0) {
      setRecipientError("Recipient ANS is required");
      return;
    }
    let numAmount = parseFloat(amount || "");
    setRecipientError("");
    if (!numAmount || numAmount == 0) {
      setAmountError("Amount is required");
      return;
    }
    numAmount = (numAmount * 1e6) / 1e6;
    setAmountError("");
    if (transferType === 'arc21') {
      if (tokenId.length == 0) {
        setTokenIdError("Token ID is required");
        return;
      }
      setTokenIdError("");
    }
    method == 'transfer_to_ans' ?
      await transferCreditsToANS(tokenId,recipient, numAmount, password, onStatusChange) :
    await transferCredits(tokenId, method, recipientAddress, numAmount, onStatusChange);
  }

  return (
    <>
      <NextSeo
        title="Toolbox | Aleo Name Service"
        description="Aleo Name Service Toolbox page"
      />
      <div className="w-full pt-8">
        <h2 className="text-2xl md:text-4xl font-medium text-white mb-6">Transfer to ANS names</h2>
        <div className="[background:linear-gradient(180deg,_#2e2e2e,_rgba(46,_46,_46,_0))] rounded-lg pt-5 px-5">
          {env.ENABLE_ARC21_TRANSFER && (<div className="flex flex-col mt-3 sm:flex-row sm:mt-6">
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
              <option value="aleo">Aleo Token</option>
              <option value="arc21">ARC21 Token</option>
            </select>
          </div>)}
          
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
          {/* Recipient Input */}
          <div className="mb-6">
            <label htmlFor="recipient" className="block text-gray-300 mb-2 font-medium">
              Recipient
            </label>
            <div className="relative">
              <input
                className={`${recipientError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-aquamarine'} 
                  h-12 w-full appearance-none rounded-full border-2 py-1 text-lg text-white bg-gray-800 
                  outline-none transition-all placeholder:text-gray-500 hover:border-teal px-4 dark:focus:h-16
                  dark:focus:text-5xl dark:focus:text-center`}
                id="recipient"
                required={true}
                value={recipient}
                placeholder={`ANS(***.${tldName})`}
                onChange={(event) => setRecipient(event.currentTarget.value.trim())}
                autoComplete="off"
              />
              {recipient && (
                <button
                  onClick={() => setRecipient('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {recipientError && (
              <div className="text-red-500 text-sm mt-2">
                {recipientError}
              </div>
            )}
            {recipientAddress && isPrivate && (
              <div className="text-gray-400 text-sm mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Transfer to private ANS
              </div>
            )}
            {recipientAddress && !isPrivate && (
              <ActiveLink
                href={`${env.EXPLORER_URL}${recipientAddress}`}
                target={"_blank"}
                className="mt-2 text-sm flex items-center text-gray-400 hover:text-aquamarine transition-colors">
                <div className="mr-2 h-5 w-5 bg-gray-700 rounded-full flex items-center justify-center">
                  <DynamicAddressIcon name="aleo" className="w-2.5 h-2.5" />
                </div>
                <div className="truncate">
                  {recipientAddress}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </ActiveLink>
            )}
          </div>

          {/* Transfer Method */}
          {recipientAddress && !isPrivate && (
            <div className="mb-6">
              <label htmlFor="transfer" className="block text-gray-300 mb-2 font-medium">
                Method
              </label>
              <div className="relative">
                <select
                  className="h-12 w-full appearance-none rounded-full border-2 border-gray-700 py-1 text-lg text-white bg-gray-800
                    outline-none transition-all hover:border-teal focus:border-aquamarine px-4 pr-10"
                  id="transfer"
                  value={method}
                  onChange={(event) => setMethod(event.currentTarget.value)}
                  autoComplete="off"
                >
                  <option value="transfer_to_ans">★ Transfer to ANS name</option>
                  <option value="transfer_private">[To Address] Private to Private</option>
                  <option value="transfer_public">[To Address] Public to Public</option>
                  <option value="transfer_private_to_public">[To Address] Private to Public</option>
                  <option value="transfer_public_to_private">[To Address] Public to Private</option>
                </select>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label htmlFor="amount" className="block text-gray-300 mb-2 font-medium">
              Amount
            </label>
            <div className="relative">
              <input
                className={`${amountError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-aquamarine'} 
                  h-12 w-full appearance-none rounded-full border-2 py-1 text-lg text-white bg-gray-800 
                  outline-none transition-all placeholder:text-gray-500 hover:border-teal px-4 pr-20`}
                id="amount"
                required={true}
                value={amount}
                placeholder="0.00"
                onChange={handleAmount}
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 pointer-events-none">
                ALEO
              </div>
            </div>
            {amountError && (
              <div className="text-red-500 text-sm mt-2">
                {amountError}
              </div>
            )}
          </div>

          {/* Password (if applicable) */}
          {recipientAddress && method == 'transfer_to_ans' && (
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-300 mb-2 font-medium">
                Password
              </label>
              <input
                className="h-12 w-full appearance-none rounded-full border-2 border-gray-700 py-1 text-lg text-white bg-gray-800
                  outline-none transition-all placeholder:text-gray-500 hover:border-teal focus:border-aquamarine px-4"
                id="password"
                required={false}
                maxLength={32}
                type="password"
                placeholder="Optional password for recipient"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value.trim())}
                autoComplete="off"
              />
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="text-red-300 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    PLEASE MAKE SURE TO SHARE THE PASSWORD WITH THE RECIPIENT.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 flex justify-center">
            {!publicKey && <WalletMultiButton>Connect Wallet to Transfer</WalletMultiButton>}
            {publicKey && !loading && <Button className="w-full sm:w-fit" onClick={handleTransfer} disabled={!!recipientError}>Transfer</Button>}
            {publicKey && loading && <Button className="w-full sm:w-fit" color={"gray"} disabled={true}><RefreshIcon
                className="inline text-aquamarine motion-safe:animate-spin"/> {transferStatus} </Button>}
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
