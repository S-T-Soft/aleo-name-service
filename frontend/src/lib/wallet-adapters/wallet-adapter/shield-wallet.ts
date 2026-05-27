// @ts-nocheck
import {
  BaseMessageSignerWalletAdapter,
  EventEmitter,
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
import {parseValueToJson} from "@/lib/util";
export interface ShieldWindow extends Window {
  shieldWallet?: any;
  shield?: any;
}

declare const window: ShieldWindow;

export interface ShieldWalletAdapterConfig {
  appName?: string
  isMobile?: boolean
  mobileWebviewUrl?: string
}

export const ShieldWalletName = 'Shield Wallet' as WalletName<'Shield Wallet'>;

export class ShieldWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = ShieldWalletName;
  icon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTI0LjU5NSAyNzguMzc2VjExMy40MDNIMjU2LjIwNlY0MjguNTYyQzI1NS4zMjQgNDI4LjI0OCAxMjQuNTk1IDM4MS41NzggMTI0LjU5NSAyNzguMzc2WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzVfMTUpIi8+CjxwYXRoIGQ9Ik0zODcuODI1IDI3OC4zNzZWMTEzLjQwM0gyNTYuMjE0VjQyOC41NjJDMjU3LjA5NiA0MjguMjQ4IDM4Ny44MjUgMzgxLjU3OCAzODcuODI1IDI3OC4zNzZaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXJfNV8xNSkiLz4KPHBhdGggb3BhY2l0eT0iMC4xIiBkPSJNMjU2LjIwNiA0NDAuNzcxQzI1NS4zMTkgNDQwLjQ1NiAxMTQuNDIgMzg1LjY0NiAxMTQuNDIgMjgyLjQ0NVYxMDMuMjI4SDI1Ni4yMDZWNDQwLjc3MVpNMzk4IDEwMy4yMjhWMjgyLjQ0NUMzOTggMzg1LjYzNSAyNTcuMTMgNDQwLjQ0NSAyNTYuMjE1IDQ0MC43NzFWMTAzLjIyOEgzOThaIiBmaWxsPSJibGFjayIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzVfMTUiIHgxPSIxOTAuNDAyIiB5MT0iMTEzLjQwMyIgeDI9IjE5MC40MDIiIHkyPSI0MjguNTY0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDFfbGluZWFyXzVfMTUiIHgxPSIzMjIuMDE4IiB5MT0iMTEzLjQwMyIgeDI9IjMyMi4wMTgiIHkyPSI0MjguNTY0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3Atb3BhY2l0eT0iMCIvPgo8c3RvcCBvZmZzZXQ9IjEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K';
  readonly supportedTransactionVersions = null;

  private _connecting: boolean;
  private _wallet: any | null;
  private _publicKey: string | null;
  private _isMobile: boolean;
  private _decryptPermission: string;
  private _readyState: WalletReadyState =
    typeof window === 'undefined' || typeof document === 'undefined'
      ? WalletReadyState.Unsupported
      : WalletReadyState.NotDetected;

  constructor({appName = 'sample', isMobile = false, mobileWebviewUrl}: ShieldWalletAdapterConfig = {}) {
    super();
    this._connecting = false;
    this._wallet = null;
    this._publicKey = null;
    this._isMobile = isMobile;
    this.network = 'testnet';
    this._decryptPermission = DecryptPermission.NoDecrypt;

    if (this._readyState !== WalletReadyState.Unsupported) {
      scopePollingDetectionStrategy(() => {
        if (window?.shield || window?.shieldWallet) {
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
      let questId = localStorage.getItem('questId');
      if (questId != null) {
        questId = JSON.parse(questId);
      }
      const url = cbUUID ? `https://${location.host}/quest/coinbase/${questId}?coinbase_uuid=${cbUUID}&next=${location.pathname}` : location.href;
      return `https://shield.app/browser?url=${encodeURIComponent(url)}`;
    }
    return 'https://shield.app';
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

  private _onNetworkChange = () => {
    this.emit('readyStateChange', this._readyState);
  };

  private _onAccountChange = () => {
    this._publicKey = null;
    this.emit('disconnect');
  };

  private _onDisconnect = () => {
    this._wallet = null;
    this._publicKey = null;
    this.emit('disconnect');
  };

  private _setupListeners() {
    if (!this._wallet?.on) return;
    this._wallet.on('networkChanged', this._onNetworkChange);
    this._wallet.on('accountChanged', this._onAccountChange);
    this._wallet.on('disconnect', this._onDisconnect);
  }

  private _cleanupListeners() {
    if (!this._wallet?.off) return;
    this._wallet.off('networkChanged', this._onNetworkChange);
    this._wallet.off('accountChanged', this._onAccountChange);
    this._wallet.off('disconnect', this._onDisconnect);
  }

  private _serializeInput(input: any) {
    if (typeof input === 'string') {
      return input;
    }

    // Shield executeTransaction expects plaintext records as strings.
    // Records produced by requestRecordPlaintexts/requestRecords may carry
    // both parsed helpers (`data`) and the original plaintext form.
    if (typeof input?.recordPlaintext === 'string') {
      return input.recordPlaintext;
    }

    if (typeof input?.plaintext === 'string') {
      return input.plaintext;
    }

    return JSON.stringify(input);
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
        case DecryptPermission.OnChainHistory: {
          try {
            const text = await wallet.decrypt(cipherText, tpk, programId, functionName, index);
            return text?.text ?? text;
          } catch (error: any) {
            throw new WalletDecryptionError(error?.message, error);
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
        return result?.records ?? result;
      } catch (error: any) {
        throw new WalletRecordsError(error?.message, error);
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
        const requestData = {
          program: transaction.transitions[0].program,
          function: transaction.transitions[0].functionName,
          inputs: transaction.transitions[0].inputs,
          fee: transaction.fee,
          privateFee: transaction.feePrivate
        };
        requestData.inputs = requestData.inputs.map((input) => this._serializeInput(input));
        const result = await wallet.executeTransaction({
          ...requestData,
          network: this.network
        });
        if (!result?.transactionId) {
          throw new WalletTransactionError('Could not create transaction');
        }
        return result.transactionId;
      } catch (error: any) {
        throw new WalletTransactionError(error?.message, error);
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
        throw new WalletTransactionError(error?.message, error);
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
        throw new WalletTransactionError(error?.message, error);
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
        throw new WalletTransactionError(error?.message, error);
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
        return result?.status ?? result;
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
        return result?.execution ?? result;
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
        const result = await wallet.requestRecords(program, true);
        const records = result?.records ?? result;
        records.map(record => {
          record.data = parseValueToJson(record.recordPlaintext);
        });
        return records;
      } catch (error: any) {
        throw new WalletRecordsError(error?.message, error);
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
        return result?.transactions ?? result;
      } catch (error: any) {
        throw new WalletRecordsError(error?.message, error);
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
      const wallet = window.shield || window.shieldWallet;
      const isAvailable = wallet.isAvailable ? await wallet.isAvailable() : true;
      if (!isAvailable) throw new WalletConnectionError('The wallet is not available');

      try {
        const n = network == WalletAdapterNetwork.MainnetBeta ? 'mainnet': 'testnet';
        const connectResult = await wallet.connect(n, decryptPermission, programs);
        const publicKey = connectResult?.address || wallet?.publicKey;
        if (!publicKey) {
          throw new WalletConnectionError();
        }
        this._publicKey = publicKey;
        this.network = n;
      } catch (error: any) {
        throw new WalletConnectionError(error?.message, error);
      }

      this._wallet = wallet;
      this._decryptPermission = decryptPermission;
      this._setupListeners();
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
      this._cleanupListeners();

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
        return signature?.signature ?? signature;
      } catch (error: any) {
        throw new WalletSignTransactionError(error?.message, error);
      }
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }
}
