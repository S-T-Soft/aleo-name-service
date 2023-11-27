import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import Button, {ButtonProps} from "@/components/ui/button";
import {useWalletModal, WalletConnectButton, WalletModalButton} from "@demox-labs/aleo-wallet-adapter-reactui";
import {useRecords} from "@/lib/hooks/use-records";
import AnchorLink from "@/components/ui/links/anchor-link";

export const WalletMultiButton: FC<ButtonProps> = ({ children, ...props }) => {
    const { publicKey, wallet, disconnect } = useWallet();
    const { primaryName, avatar} = useRecords();
    const { setVisible } = useWalletModal();
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

    if (!wallet) return <WalletModalButton className="bg-[#1253fa]" {...props}>{children}</WalletModalButton>;
    if (!base58) return <WalletConnectButton className="bg-[#1253fa]" {...props}>{children}</WalletConnectButton>;

    return (
        <div className="wallet-adapter-dropdown">
            <Button
              aria-expanded={active}
              className="bg-[#1253fa] hover:bg-sky-500"
              style={{pointerEvents: active ? 'none' : 'auto', ...props.style}}
              onClick={openDropdown}
              {...props}
            >
                {avatar && <img src={avatar} className="inline w-8 h-8 rounded-full mr-2" alt={primaryName}/>}
                <span className="font-bold">{content}</span>
            </Button>
            <ul
              aria-label="dropdown-list"
              className={`wallet-adapter-dropdown-list ${active && 'wallet-adapter-dropdown-list-active'}`}
                ref={ref}
                role="menu"
            >
                {primaryName && <li onClick={closeDropdown} className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:bg-sky-500" role="menuitem">
                    <AnchorLink href={`/account/${primaryName}`}>Profile</AnchorLink>
                </li>}
                <li onClick={copyAddress} className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:bg-sky-500" role="menuitem">
                    {copied ? 'Copied' : 'Copy address'}
                </li>
                <li onClick={openModal} className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:bg-sky-500" role="menuitem">
                    Change wallet
                </li>
                <li onClick={disconnect} className="flex flex-row justify-center border-none outline-none cursor-pointer whitespace-nowrap box-border px-4 py-2 w-full rounded-md hover:bg-sky-500" role="menuitem">
                    Disconnect
                </li>
            </ul>
        </div>
    );
};
