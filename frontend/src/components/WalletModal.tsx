import type { FC, MouseEvent } from 'react';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { WalletAdapterNetwork, WalletName, WalletReadyState } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet, Wallet } from '@demox-labs/aleo-wallet-adapter-react';
import {useWalletModal} from "@demox-labs/aleo-wallet-adapter-reactui";
import {createPortal} from "react-dom";
import {WalletListItem} from "./WalletListItem";

export interface WalletModalProps {
    className?: string;
    container?: string;
}

export const WalletModal: FC<WalletModalProps> = ({ className = '', container = 'body', decryptPermission, network, programs }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { wallets, select, connect, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    const [fadeIn, setFadeIn] = useState(false);
    const [portal, setPortal] = useState<Element | null>(null);

    const [installedWallets, otherWallets] = useMemo(() => {
        const installed: Wallet[] = [];
        const notDetected: Wallet[] = [];
        const loadable: Wallet[] = [];

        for (const wallet of wallets) {
            if (wallet.readyState === WalletReadyState.NotDetected) {
                notDetected.push(wallet);
            } else if (wallet.readyState === WalletReadyState.Loadable) {
                loadable.push(wallet);
            } else if (wallet.readyState === WalletReadyState.Installed) {
                installed.push(wallet);
            }
        }

        return [installed, [...loadable, ...notDetected]];
    }, [wallets]);

    const hideModal = useCallback(() => {
        setFadeIn(false);
        setTimeout(() => setVisible(false), 150);
    }, [setVisible]);

    const handleClose = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            hideModal();
        },
        [hideModal]
    );

    const handleWalletClick = useCallback(
        (event: MouseEvent, walletName: WalletName) => {
            select(walletName);
            handleClose(event);
        },
        [select, handleClose]
    );

    const handleTabKey = useCallback(
        (event: KeyboardEvent) => {
            const node = ref.current;
            if (!node) return;

            // here we query all focusable elements
            const focusableElements = node.querySelectorAll('button');
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const firstElement = focusableElements[0]!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const lastElement = focusableElements[focusableElements.length - 1]!;

            if (event.shiftKey) {
                // if going backward by pressing tab and firstElement is active, shift focus to last focusable element
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else {
                // if going forward by pressing tab and lastElement is active, shift focus to first focusable element
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        },
        [ref]
    );

    useLayoutEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                hideModal();
            } else if (event.key === 'Tab') {
                handleTabKey(event);
            }
        };

        // Get original overflow
        const { overflow } = window.getComputedStyle(document.body);
        // Hack to enable fade in animation after mount
        setTimeout(() => setFadeIn(true), 0);
        // Prevent scrolling on mount
        document.body.style.overflow = 'hidden';
        // Listen for keydown events
        window.addEventListener('keydown', handleKeyDown, false);

        return () => {
            // Re-enable scrolling when component unmounts
            document.body.style.overflow = overflow;
            window.removeEventListener('keydown', handleKeyDown, false);
        };
    }, [hideModal, handleTabKey]);

    useLayoutEffect(() => setPortal(document.querySelector(container)), [container]);

    useLayoutEffect(() => {
        if (wallet) {
            connect(decryptPermission || "NO_DECRYPT", network || WalletAdapterNetwork.TestnetBeta, programs ?? []).catch((e) => {console.log({e})});
        }
    }, [wallet])

    return (
        portal &&
        createPortal(
            <div
                aria-labelledby="wallet-adapter-modal-title"
                aria-modal="true"
                className={`wallet-adapter-modal ${fadeIn && 'wallet-adapter-modal-fade-in'} ${className}`}
                ref={ref}
                role="dialog"
            >
                <div className="wallet-adapter-modal-container">
                    <div className="wallet-adapter-modal-wrapper">
                        <button onClick={handleClose} className="wallet-adapter-modal-button-close">
                            <svg width="14" height="14">
                                <path d="M14 12.461 8.3 6.772l5.234-5.233L12.006 0 6.772 5.234 1.54 0 0 1.539l5.234 5.233L0 12.006l1.539 1.528L6.772 8.3l5.69 5.7L14 12.461z" />
                            </svg>
                        </button>
                        <h1 className="wallet-adapter-modal-title">Connect a wallet on Aleo to continue</h1>
                        <ul className="wallet-adapter-modal-list">
                            {installedWallets.map((wallet) => (
                                <WalletListItem
                                    key={wallet.adapter.name}
                                    handleClick={(event) => handleWalletClick(event, wallet.adapter.name)}
                                    wallet={wallet}
                                />
                            ))}
                            {otherWallets.map((wallet) => (
                                <WalletListItem
                                    key={wallet.adapter.name}
                                    handleClick={(event) =>
                                        handleWalletClick(event, wallet.adapter.name)
                                    }
                                    wallet={wallet}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="wallet-adapter-modal-overlay" onMouseDown={handleClose} />
            </div>,
            portal
        )
    );
};
