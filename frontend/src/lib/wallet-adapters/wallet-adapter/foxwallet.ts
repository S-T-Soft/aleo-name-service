import {
    BaseMessageSignerWalletAdapter,
    scopePollingDetectionStrategy,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletSignTransactionError,
    WalletDecryptionNotAllowedError,
    WalletDecryptionError,
    WalletRecordsError,
    DecryptPermission,
    WalletAdapterNetwork,
    AleoTransaction,
    AleoDeployment,
    WalletTransactionError,
} from '@demox-labs/aleo-wallet-adapter-base';
import {LeoWallet, LeoWalletAdapterConfig} from "@demox-labs/aleo-wallet-adapter-leo";

export interface FoxWindow extends Window {
    foxwallet?: {aleo?: LeoWallet};
}

declare const window: FoxWindow;

export const FoxWalletName = 'Fox Wallet' as WalletName<'Fox Wallet'>;

export class FoxWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = FoxWalletName;
    icon = 'data:image/png;base64,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';
    readonly supportedTransactionVersions = null;

    private _connecting: boolean;
    private _wallet: LeoWallet | null;
    private _publicKey: string | null;
    private _decryptPermission: string;
    private _isMobile: boolean;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor({ appName = 'sample', isMobile = false, mobileWebviewUrl } : LeoWalletAdapterConfig = {}) {
        super();
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        this._isMobile = isMobile;
        this._decryptPermission = DecryptPermission.NoDecrypt;

        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window?.foxwallet && window.foxwallet?.aleo) {
                    this._readyState = WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
        }
    }

    get url() {
        if (this._isMobile) {
            let cbUUID = localStorage.getItem('cbUUID');
            if (cbUUID != null) {
                cbUUID = JSON.parse(cbUUID);
            }
            const url = cbUUID ? `https://${location.host}/quest/coinbase?uuid=${cbUUID}&next=${location.href}` : location.href;
            return `https://link.foxwallet.com/dapp?url=${encodeURIComponent(url)}`;
        }
        return 'https://foxwallet.com/download';
    }

    get publicKey() {
        return this._publicKey;
    }

    get decryptPermission() {
        return this._decryptPermission;
    }

    get connecting() {
        return this._connecting;
    }

    get readyState() {
        return this._readyState;
    }

    set readyState(readyState) {
        this._readyState = readyState;
    }

    async decrypt(cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number) {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            switch (this._decryptPermission) {
                case DecryptPermission.NoDecrypt:
                    throw new WalletDecryptionNotAllowedError();

                case DecryptPermission.UponRequest:
                case DecryptPermission.AutoDecrypt:
                case DecryptPermission.OnChainHistory:
                {
                    try {
                        const text = await wallet.decrypt(cipherText, tpk, programId, functionName, index);
                        return text.text;
                    } catch (error: any) {
                        throw new WalletDecryptionError(error?.message || "Permission Not Granted", error);
                    }
                }
                default:
                    throw new WalletDecryptionError();
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecords(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestRecords(program);
                return result.records;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestTransaction(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestTransaction(transaction);
                return result.transactionId;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestExecution(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestExecution(transaction);
                return result.transactionId;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestBulkTransactions(transactions: AleoTransaction[]): Promise<string[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestBulkTransactions(transactions);
                return result.transactionIds;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestDeploy(deployment: AleoDeployment): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestDeploy(deployment);
                return result.transactionId;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async transactionStatus(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.transactionStatus(transactionId);
                return result.status;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async getExecution(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.getExecution(transactionId);
                return result.execution;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecordPlaintexts(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestRecordPlaintexts(program);
                return result.records;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestTransactionHistory(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestTransactionHistory(program);
                return result.transactions;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork, programs?: string[]): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();

            this._connecting = true;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window.foxwallet && window.foxwallet.aleo;

            try {
                await wallet?.connect(decryptPermission, network, programs);
                if (!wallet?.publicKey) {
                    throw new WalletConnectionError();
                }
                this._publicKey = wallet.publicKey!;
            } catch (error: any) {
                throw new WalletConnectionError(error?.message || "Permission Not Granted", error);
            }

            this._wallet = wallet;
            this._decryptPermission = decryptPermission;

            this.emit('connect', this._publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            // wallet.off('disconnect', this._disconnected);

            this._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
                this.emit('error', new WalletDisconnectionError(error?.message, error));
            }
        }

        this.emit('disconnect');
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const signature = await wallet.signMessage(message);
                return signature.signature;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message || "Permission Not Granted", error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }
}