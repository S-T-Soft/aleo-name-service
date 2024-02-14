import type {NextPageWithLayout, Status} from '@/types';
import {NextSeo} from 'next-seo';
import {useState} from "react";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import {useCredit} from "@/lib/hooks/use-credit";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import Layout from "@/layouts/_layout";
import {WalletMultiButton} from "@/components/WalletMultiButton";
import tlds from "@/config/tlds";

const ToolBoxPage: NextPageWithLayout = () => {
  const {transferCredits} = useCredit();
  const tldName = tlds[0].name;
  const {publicKey} = useWallet();
  const [transferStatus, setTransferStatus] = useState("Transferring");
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [amount, setAmount] = useState<number>();
  const [amountError, setAmountError] = useState("");
  const [method, setMethod] = useState<string>("transfer_private");

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
    await transferCredits(method, recipient, amount, (running: boolean, status: Status) => {
      setLoading(running);
      setTransferStatus(status.message);
    });
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
          <div className="flex flex-col mt-6 sm:flex-row">
            <label htmlFor="transfer" className="h-4 leading-4 w-full text-left align-middle mb-4 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Method</label>
            <select
              className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 px-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 hover:border-teal focus:border-aquamarine"
              id="transfer"
              value={method}
              placeholder={`Public ANS(***.${tldName})`}
              onChange={(event) => setMethod(event.currentTarget.value)}
              autoComplete="off"
            >
              <option value="transfer_private">Private</option>
              <option value="transfer_public">Public</option>
              <option value="transfer_private_to_public">privateToPublic</option>
              <option value="transfer_public_to_private">publicToPrivate</option>
            </select>
          </div>
          <div className="flex flex-col mt-6 sm:flex-row">
            <label htmlFor="recipient" className="h-4 leading-4 w-full text-left align-middle mb-4 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Recipient</label>
            <input
              className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500"
              id="recipient"
              required={true}
              value={recipient}
              placeholder={`Public ANS(***.${tldName})`}
              onChange={(event) => setRecipient(event.currentTarget.value)}
              autoComplete="off"
            />
          </div>
          {recipientError && (
            <div className="text-center text-red-500 text-base">
              {recipientError}
            </div>
            )}
          <div className="flex flex-col mt-6 sm:flex-row">
            <label htmlFor="amount" className="h-4 leading-4 w-full text-left align-middle mb-4 mx-2 sm:text-right sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0">Amount</label>
            <input
              className="flex-1 h-12 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500"
              id="amount"
              required={true}
              value={amount}
              placeholder={"amount in credit"}
              onChange={(event) => setAmount(+event.currentTarget.value)}
              autoComplete="off"
            />
          </div>
          {amountError && (
            <div className="text-center text-red-500 text-base">
              {amountError}
            </div>
            )}
          <div className="flex flex-col mt-6 sm:flex-row">
            <label className="h-4 leading-4 w-full text-right align-middle mb-4 mx-2 sm:h-12 sm:leading-[3rem] sm:inline sm:w-32 sm:mb-0"></label>
            {!publicKey && <WalletMultiButton>Connect Wallet to Transfer</WalletMultiButton>}
            {publicKey && !loading && <Button onClick={handleTransfer}>Transfer</Button>}
            {publicKey && loading && <Button color={"gray"} disabled={true}><RefreshIcon className="inline text-aquamarine motion-safe:animate-spin"/> {transferStatus}</Button>}
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
