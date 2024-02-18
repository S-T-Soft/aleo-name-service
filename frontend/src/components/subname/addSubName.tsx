import React, {useEffect, useState} from 'react';
import Button from "@/components/ui/button";
import {useANS} from "@/lib/hooks/use-ans";
import {Status} from "@/types";
import {RefreshIcon} from "@/components/icons/refresh";
import { Record } from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import ToggleSwitch from "@/components/ui/toggle-switch";

const AddSubName = ({record, onSuccess}: React.PropsWithChildren<{
  record: Record,
  onSuccess: CallableFunction
}>) => {
  const {registerSubName} = useANS();
  const {getAddress} = useClient();
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [prevValue, setPrevValue] = useState('');
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    if (inputValue !== "") {
      setChecking(true);
      setAvailable(false);
      getAddress(inputValue + "." + record.name)
        .then((address) => {
          setAvailable(false);
        }).catch((error) => {
          setAvailable(true);
      }).finally(() => {
        setChecking(false);
      });
    } else {
      setAvailable(false);
    }
  }, [inputValue]);

  const handleInput = (event: any) => {
    const value = event.target.value.trim();
    const is_valid = /^[a-z0-9-_]{1,64}$/.test(value);
    if (is_valid || value == "") {
      setInputValue(value);
      setPrevValue(value);
    } else {
      setInputValue(prevValue);
    }
  }

  const handleRegistering = async (event: any) => {
    if (!inputValue || inputValue.length == 0) {
      return;
    }
    await registerSubName(inputValue, record, isPrivate, (running: boolean, status: Status) => {
      setRegistering(running);
      setStatus(status.message);
      if (status.message === 'Finalized') {
        setInputValue("");
        onSuccess();
      }
    });
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row">
        <div className="flex-auto mb-4 md:mb-0 text-gray-400">
          Subnames let you create additional names from your existing name.
        </div>
        <div className="flex-auto md:text-right">
          <Button className="w-full md:w-auto" onClick={() => setShowModal(true)}>New Subname</Button>
        </div>
      </div>
      {showModal && (
        <div
          className="fixed z-50 top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded-lg w-full md:w-3/4 max-w-3xl">
            <h2 className="mb-4 text-white text-center font-bold">Create Subname</h2>
            <div className="flex mb-4 border-2 border-gray-600 md:focus-within:border-aquamarine rounded-full">
              <input
                className="h-16 flex-grow appearance-none rounded-full md:rounded-l-full md:rounded-r-none border-r-0 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine ltr:pl-8 rtl:pr-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500"
                type="text"
                autoComplete={"off"}
                value={inputValue}
                disabled={registering}
                onChange={handleInput}
              />
              <span
                className="hidden md:flex h-16 bg-gray-700 border-l-0 border-gray-600 items-center justify-center py-1 px-3 text-lg text-gray-400 rounded-r-full">.{record.name}</span>
            </div>
            <div className="flex mb-4 text-white justify-end">
              <ToggleSwitch label="Private fee" isToggled={isPrivate} setIsToggled={setIsPrivate} />
            </div>
            <div className="flex flex-col md:flex-row justify-between">
              {!registering && <Button className="w-full mb-2 md:mb-0 md:w-2/5 bg-gray-700 text-white"
                      onClick={() => setShowModal(false)}>
                Cancel
              </Button>}
              {!registering && <Button
                  className={`w-full md:w-2/5 ${(!available) ? 'bg-gray-700' : ''}`}
                  disabled={!available}
                  onClick={handleRegistering}
              >
                {checking ? "Checking..." : "Register"}
              </Button>}
              {registering && <Button color={"gray"} className="w-full md:w-full" disabled={true}><RefreshIcon
            className="inline text-aquamarine motion-safe:animate-spin"/> {status}</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubName;
