import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';

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
  name_hash?: string;
}