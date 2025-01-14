import type { FC, ReactNode } from 'react';
import React, { useState } from 'react';
import { WalletModal } from './WalletModal';
import {WalletModalProps, WalletModalContext} from "@demox-labs/aleo-wallet-adapter-reactui";

export interface WalletModalProviderProps extends WalletModalProps {
    children: ReactNode;
}

export const WalletModalProvider: FC<WalletModalProviderProps> = ({ children, ...props }) => {
    const [visible, setVisible] = useState(false);

    return (
        <WalletModalContext.Provider
            value={{
                visible,
                setVisible,
            }}
        >
            {children}
            {visible && <WalletModal {...props} />}
        </WalletModalContext.Provider>
    );
};
