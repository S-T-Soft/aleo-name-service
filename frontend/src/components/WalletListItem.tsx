import type {CSSProperties, FC, MouseEvent, MouseEventHandler, PropsWithChildren, ReactElement} from 'react';
import React from 'react';
import {DecryptPermission, WalletAdapterNetwork, WalletReadyState} from '@demox-labs/aleo-wallet-adapter-base';
import { Wallet } from '@demox-labs/aleo-wallet-adapter-react';
import {WalletIcon} from "@demox-labs/aleo-wallet-adapter-reactui";

export type ButtonProps = PropsWithChildren<{
    className?: string;
    disabled?: boolean;
    decryptPermission?: DecryptPermission;
    network?: WalletAdapterNetwork;
    endIcon?: ReactElement;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
    startIcon?: ReactElement;
    style?: CSSProperties;
    tabIndex?: number;
}>;

export const Button: FC<ButtonProps> = (props) => {
    return (
        <button
            className={`wallet-adapter-button ${props.className || ''}`}
            disabled={props.disabled}
            style={props.style}
            onClick={props.onClick}
            tabIndex={props.tabIndex || 0}
            type="button"
        >
            {props.startIcon && <i className="wallet-adapter-button-start-icon">{props.startIcon}</i>}
            {props.children}
            {props.endIcon && <i className="wallet-adapter-button-end-icon">{props.endIcon}</i>}
        </button>
    );
};


export interface WalletListItemProps {
    handleClick: MouseEventHandler<HTMLButtonElement>;
    tabIndex?: number;
    wallet: Wallet;
}

export const WalletListItem: FC<WalletListItemProps> = ({ handleClick, tabIndex, wallet }) => {
    return (
        <li>
            <Button onClick={handleClick} startIcon={<WalletIcon wallet={wallet} />} tabIndex={tabIndex}>
                {wallet.adapter.name}
                {wallet.readyState === WalletReadyState.Installed && <span>Detected</span>}
            </Button>
        </li>
    );
};
