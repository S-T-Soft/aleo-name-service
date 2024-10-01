import {useState} from "react";
import {Status} from "@/types";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import tlds from "@/config/tlds";
import {useANS} from "@/lib/hooks/use-ans";

export default function Transfer({name, transfer, setTriggerRecheck}: React.PropsWithChildren<{
  name: string,
  transfer: CallableFunction,
  setTriggerRecheck: CallableFunction
}>) {
  const tldName = tlds[0].name;
  const {matchTld} = useANS();
  const [transferring, setTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState("Transferring");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");

  const onChange = async (event: any) => {
    setRecipient(event.currentTarget.value);
  };

  const validateAddress = () => {
    if (!recipient || recipient.length == 0) {
      setError("Recipient required");
      return;
    }
    const matchedTld = matchTld(recipient);
    const isAleoAddress = recipient.startsWith("aleo1") && recipient.length > 60;
    if (!matchedTld && !isAleoAddress) {
      setError("Invalid recipient");
      return;
    }
    setError("");
  }

  const handleTransfer = async (event: any) => {
    validateAddress();
    if (error != "") {
      return;
    }
    setError("");
    await transfer(name, recipient, (running: boolean, status: Status) => {
      setTransferring(running);
      setTransferStatus(status.message);
      if (!running) {
        setTriggerRecheck();
      }
    });
  }

  return <>
    {error && <div className={`font-bold align-text-bottom w-full text-red-500 block text-right pr-5 mt-5`}>{error}</div>}
    <div className={`relative flex w-full rounded-full ${!error && "mt-5"}`}>
      <label className="flex w-full items-center ">
        <input
          className={`h-16 w-full appearance-none rounded-full border-2 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine ltr:pr-24 ltr:pl-8 rtl:pl-24 rtl:pr-8 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 sm:ltr:pr-24 sm:rtl:pl-24 xl:ltr:pr-24 xl:rtl:pl-24 ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
          value={recipient}
          placeholder={`Address(aleo***) or Public ANS(***.${tldName})`}
          onChange={onChange}
          onBlur={validateAddress}
          autoComplete="off"
        />
      </label>
      <span
        className="absolute flex h-full w-15 cursor-pointer items-center justify-center text-gray-900 hover:text-gray-900 ltr:right-2 ltr:pr-2 rtl:left-2 rtl:pl-2 dark:text-white ">
        {!transferring && <Button onClick={handleTransfer}>Transfer</Button>}
        {transferring && <Button color={"gray"} disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {transferStatus}</Button>}
      </span>
    </div>
    <div className="h-10 text-center text-base text-gray-500">The transfer operation will clear the avatar and all resolver settings.</div>
  </>
}