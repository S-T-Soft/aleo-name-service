import {useState, useRef, SyntheticEvent} from 'react';
import { SearchIcon } from '@/components/icons/search';
import Button from "@/components/ui/button";
import {useRouter} from "next/router";
import tlds from "@/config/tlds";


type SearchFromProps = {
  placeholder?: string;
};

export function SearchFrom({ placeholder = 'Search for a name...' }: SearchFromProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);


  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!search) {
      setError('Please enter a search term');
      return false;
    }
    // search should only be 0-9,a-z,-,_, and 1-64 characters
    if (!/^[0-9a-z-_]{1,64}$/i.test(search)) {
      setError('A valid ANS name should be 1-64 characters and only contain 0-9,a-z,-,_');
      return false;
    }
    setError('');
    setSearch("");
    // redirect to /name/{search}
    await router.push(`/name/${search}.${tlds[0].name}`);
  }

  const onSearch = async (event: any) => {
    setSearch(event.currentTarget.value);
  };

  return (
    <div className="relative" ref={ref} >
      <form
        className="relative flex w-full rounded-full"
        noValidate
        onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
          await handleSubmit(event);
        }}
        role="search"
      >
        <label className="flex w-full items-center ">
          <input
            className="h-16 w-full appearance-none rounded-full border-2 border-gray-200 py-1 text-lg tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 hover:border-teal focus:border-aquamarine ltr:pr-24 ltr:pl-8 rtl:pl-24 rtl:pr-8 dark:border-gray-600 dark:bg-light-dark dark:text-white dark:placeholder:text-gray-500 dark:hover:border-teal dark:focus:border-aquamarine sm:ltr:pr-24 sm:rtl:pl-24 xl:ltr:pr-24 xl:rtl:pl-24"
            placeholder={placeholder}
            value={search}
            onChange={onSearch}
            autoComplete="off"
          />
        </label>
        <span className="absolute flex h-full w-15 cursor-pointer items-center justify-center text-gray-900 hover:text-gray-900 ltr:right-4 ltr:pr-2 rtl:left-4 rtl:pl-2 dark:text-white sm:w-14 sm:ltr:pr-3 sm:rtl:pl-3 xl:w-16">
          <Button type="submit">
            <SearchIcon className="h-5 w-5 text-black" />
          </Button>
        </span>
      </form>
      {error && (
        <div className="h-10 text-center text-red-500 text-base">
          {error}
        </div>
        )}
    </div>
  );
}

export default function SearchView({ ...props }) {
  return (
    <div
      className="relative mx-auto w-full max-w-full xs:w-[480px] sm:w-[600px] lg:w-[900px]"
      {...props}
    >
      <SearchFrom />
    </div>
  );
}
