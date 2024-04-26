import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import Button, {ButtonProps} from "@/components/ui/button";
import {useWalletModal, WalletConnectButton, WalletModalButton} from "@demox-labs/aleo-wallet-adapter-reactui";
import {useRecords} from "@/lib/hooks/use-records";
import AnchorLink from "@/components/ui/links/anchor-link";
import {DynamicSocialIcon} from "@/assets/social/DynamicSocialIcon";
import ToggleSwitch from "@/components/ui/toggle-switch";

import {usePrivateFee} from "@/lib/hooks/use-private-fee";

const socialLinks = [
  {
    icon: "com.twitter",
    link: "https://x.com/aleonames"
  },
  {
    icon: "com.discord",
    link: "https://discord.gg/uvWJehUmyK"
  },
  {
    icon: "com.youtube",
    link: "https://www.youtube.com/@aleonames"
  }
];

export const WalletMultiButton: FC<ButtonProps> = ({ children, ...props }) => {
    const { publicKey, wallet, disconnect } = useWallet();
    const { primaryName, avatar} = useRecords();
    const { setVisible } = useWalletModal();
    const {privateFee, setPrivateFee} = usePrivateFee();
    const [copied, setCopied] = useState(false);
    const [active, setActive] = useState(false);
    const ref = useRef<HTMLUListElement>(null);

    const base58 = useMemo(() => publicKey?.toString(), [publicKey]);
    const content = useMemo(() => {
        if (primaryName) return primaryName;
        if (!wallet || !base58) return null;
        return base58.slice(0, 5) + '....' + base58.slice(-5);
    }, [wallet, base58, primaryName]);

    const copyAddress = useCallback(async () => {
        if (base58) {
            await navigator.clipboard.writeText(base58);
            setCopied(true);
            setTimeout(() => setCopied(false), 400);
        }
    }, [base58]);

    const openDropdown = useCallback(() => {
        setActive(true);
    }, []);

    const closeDropdown = useCallback(() => {
        setActive(false);
    }, []);

    const openModal = useCallback(() => {
        setVisible(true);
        closeDropdown();
    }, [setVisible, closeDropdown]);

    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const node = ref.current;

            // Do nothing if clicking dropdown or its descendants
            if (!node || node.contains(event.target as Node)) return;

            closeDropdown();
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, closeDropdown]);

    if (!wallet) return <WalletModalButton className="!bg-aquamarine !text-black !font-normal" {...props}>{children}</WalletModalButton>;
    if (!base58) return <WalletConnectButton className="!bg-aquamarine !text-black !font-normal" {...props}>{children}</WalletConnectButton>;

    return (
        <div className="wallet-adapter-dropdown">
            <Button
              aria-expanded={active}
              style={{pointerEvents: active ? 'none' : 'auto', ...props.style}}
              onClick={openDropdown}
              {...props}
            >
                {avatar && (
                    <div className="inline-block relative mr-2">
                      <img src={avatar} className="inline w-8 h-8 rounded-full mr-2" alt={primaryName}/>
                      <img src={wallet.adapter.icon} alt={`${wallet.adapter.name}`} className="inline w-4 h-4 rounded-full absolute top-0 right-0"/>
                    </div>
                  )}
                {!avatar && (
                    <div className="inline-block relative mr-2">
                      <img src={wallet.adapter.icon} alt={`${wallet.adapter.name}`} className="inline w-8 h-8 rounded-full mr-2"/>
                    </div>
                  )}
                <span className="font-bold">{content}</span>
            </Button>
          <ul
            aria-label="dropdown-list"
            className={`w-full wallet-adapter-dropdown-list ${active && 'wallet-adapter-dropdown-list-active'}`}
            ref={ref}
            role="menu"
          >
            {primaryName && <li onClick={closeDropdown}
                                className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:text-aquamarine"
                                role="menuitem">
                <AnchorLink href={`/account/${primaryName}`}>Profile</AnchorLink>
            </li>}
            <li onClick={copyAddress}
                className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:text-aquamarine"
                role="menuitem">
              {copied ? 'Copied' : 'Copy address'}
            </li>
            <li onClick={openModal}
                className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:text-aquamarine"
                role="menuitem">
              Change wallet
            </li>
            <li onClick={disconnect}
                className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:text-aquamarine text-red-400"
                role="menuitem">
              Disconnect
            </li>
            <li>
              <hr/>
            </li>
            <li
              className="flex flex-row justify-between border-none outline-none whitespace-nowrap box-border px-4 py-2 w-full rounded-md"
            >
              <span>Private Fee</span>
              <ToggleSwitch isToggled={privateFee} setIsToggled={setPrivateFee}/>
            </li>
            <li>
              <hr/>
            </li>
            <li
              className="flex flex-row justify-center border-none outline-none whitespace-nowrap box-border px-4 py-2 w-full rounded-md"
              role="menuitem">
              {socialLinks.map((item, index) => (
                <a href={item.link} target="_blank" rel="noopener noreferrer" key={index} className="px-2">
                  <DynamicSocialIcon name={item.icon} fill="rgb(107 114 128 / var(--tw-text-opacity))" className="h-8"/>
                </a>
              ))}
            </li>
          </ul>
        </div>
    );
};
