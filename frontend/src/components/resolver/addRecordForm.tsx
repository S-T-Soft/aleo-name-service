import {useANS} from "@/lib/hooks/use-ans";
import {useMemo, useState} from "react";
import {Status, Record} from "@/types";
import coinsWithIcons from "@/constants/coinsWithIcons.json";
import coinsWithoutIcons from "@/constants/coinsWithoutIcons.json";
import {DynamicAddressIcon} from "@/assets/address/DynamicAddressIcon";
import Button from "@/components/ui/button";
import {RefreshIcon} from "@/components/icons/refresh";
import { getCoderByCoinName } from '@ensdomains/address-encoder'

export const AddRecordForm = ({record, onSuccess}: React.PropsWithChildren<{
  record: Record,
  onSuccess: CallableFunction
}>) => {
  const {setResolverRecord} = useANS();
  const [chooseCoin, setChooseCoin] = useState("");
  const [content, setContent] = useState("");
  const [setting, setSetting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const disable = useMemo(() => {
    return !chooseCoin || content === "" || error != "";
  }, [chooseCoin, content, error])

  const validateCryptoAddress = ({
    coin,
    address,
  }: {
    coin: string
    address: string | undefined
  }) => {
    try {
      if (!address) return 'Address Required'
      const _address = address || ""
      const coinTypeInstance = getCoderByCoinName(coin)
      coinTypeInstance.decode(_address)
      return true
    } catch (e: any) {
      return 'Invalid Address'
    }
  }

  const validateAddress = () => {
    if (!chooseCoin || content === "") {
      setError("");
      return;
    }
    const validate = validateCryptoAddress({coin: chooseCoin, address: content});
    if (validate != true) {
      setError(validate);
    } else {
      setError("")
    }
  }

  const handleSetting = async (event: any) => {
    if (!content || content.length == 0) {
      return;
    }
    validateAddress();
    if (error != "") {
      return;
    }
    await setResolverRecord(record, chooseCoin, content, (running: boolean, status: Status) => {
      setSetting(running);
      setStatus(status.message);
      if (status.message === 'Finalized') {
        setChooseCoin("");
        setContent("");
        onSuccess();
      }
    });
  }

  const coinChange = async (coin: string) => {
    if (chooseCoin !== coin) {
      setChooseCoin(coin);
      setContent("");
      setError("");
    }
  }

  return <div className="w-full mt-5">
    <div className="flex overflow-x-auto mb-5 overflow-y-hidden whitespace-nowrap py-2">
      {coinsWithIcons.map((coin) => (
        <div
          key={coin}
          className={(coin === chooseCoin ? "" : "grayscale") + " w-32 h-15 flex bg-gray-700 rounded-lg p-2 mr-2 hover:bg-gray-600 hover:cursor-pointer hover:-translate-y-0.5 hover:grayscale-0"}
          onClick={() => coinChange(coin)}>
          <span className="inline-block text-center w-6 h-6">
            <DynamicAddressIcon name={coin} showDefault={true} className="w-full h-full"/></span>
          <span className="px-2">{coin.toUpperCase()}</span>
        </div>
      ))}
      {coinsWithoutIcons.map((coin) => (
        <div
          key={coin}
          className={(coin === chooseCoin ? "" : "grayscale") + " w-32 h-15 flex bg-gray-700 rounded-lg p-2 mr-2 hover:bg-gray-600 hover:cursor-pointer hover:-translate-y-0.5 hover:grayscale-0"}
          onClick={() => setChooseCoin(coin)}>
          <span className="px-2">{coin.toUpperCase()}</span>
        </div>
      ))}
    </div>
    {error && <div className={`font-bold align-text-bottom w-full text-red-500 block text-right pr-5`}>{error}</div>}
    <div className="relative flex w-full rounded-full">
      {chooseCoin &&
          <span className="absolute flex h-full w-15 items-center justify-center ltr:pl-2 left-2 dark:text-white">
                  <DynamicAddressIcon name={chooseCoin} showDefault={false} className="w-6 h-6"/>
                  <span className="px-2">{chooseCoin.toUpperCase()}</span>
              </span>}
      <label className="flex w-full items-center ">
        <input
          className={`${error ? "border-red-500": "border-gray-200 dark:border-gray-600"} h-16 w-full appearance-none rounded-full border-2 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine px-24 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500`}
          value={content}
          placeholder={chooseCoin ? `Please enter the ${chooseCoin.toUpperCase()} address` : "Please select a coin first"}
          onChange={(event) => setContent(event.currentTarget.value)}
          onBlur={validateAddress}
          autoComplete="off"
        />
      </label>
      <span
        className="absolute flex h-full w-15 cursor-pointer items-center justify-center text-gray-900 hover:text-gray-900 ltr:right-2 ltr:pr-2 rtl:left-2 rtl:pl-2 dark:text-white ">
                {!setting && <Button className={disable ? "bg-gray-700" : ""} onClick={handleSetting} disabled={disable}>Set</Button>}
        {setting && <Button color={"gray"} disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {status}</Button>}
              </span>
    </div>
  </div>;
}