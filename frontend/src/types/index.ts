import type {NextPage} from 'next';
import type {ReactElement, ReactNode} from 'react';

export type NextPageWithLayout<P = {}> = NextPage<P> & {
  authorization?: boolean;
  getLayout?: (page: ReactElement) => ReactNode;
};

export interface Attachment {
  id: string;
  original: string;
  thumbnail: string;
}

export interface NameHashBalance {
  name: string;
  nameHash: string;
  balance: number;
}

export interface Record {
  name: string;
  private: boolean;
  isPrimaryName: boolean;
  record?: any;
  nameHash?: string;
  balance?: number;
}

export interface Resolver {
  nameHash: string,
  key: string;
  value: string;
  canDelete: boolean;
}

export interface Status {
  hasError: boolean;
  message: string;
}

export interface Statistic {
  totalNames24h: number,
  totalNames: number,
  totalPriNames: number,
  totalNFTOwners: number
}

export interface CouponCard {
  discount_percent: number,
  limit_name_length: number,
  tld: string,
  enable: boolean,
  id: string
  record: any
}

interface Prices {
  [key: number]: number;
}

export interface TLD {
  name: string,
  hash: string,
  registrar: string,
  prices: Prices
}

export interface StatusChangeCallback {
  (loading: boolean, status: Status): void;
}