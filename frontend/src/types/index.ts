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

export interface Record {
  name: string;
  private: boolean;
  isPrimaryName: boolean;
  record?: any;
  nameHash?: string;
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

export interface StatusChangeCallback {
  (loading: boolean, status: Status): void;
}