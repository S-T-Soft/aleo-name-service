import { JSONRPCClient } from 'json-rpc-2.0';
import * as process from "process";

const API_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PROGRAM = process.env.NEXT_PUBLIC_PROGRAM!;

export async function getHeight(): Promise<number> {
  const client = getClient();
  const height = await client.request('getHeight', {});
  return height;
}

export async function getTransactionsForProgram(programId: string, functionName: string): Promise<any> {
  const client = getClient();
  const transaction = await client.request('transactionsForProgram', {
      programId,
      functionName,
      "page": 0,
      "maxTransactions": 1000
  });
  return transaction;
}

export async function getAleoTransactionsForProgram(programId: string, functionName: string, page = 0, maxTransactions = 1000): Promise<any> {
  const client = getClient();
  const result = await client.request('aleoTransactionsForProgram', {
      programId,
      functionName,
      page,
      maxTransactions
  });
  
  return result;
}

export async function getTransaction(transactionId: string): Promise<any> {
  const transactionUrl = `${API_URL}/aleo/transaction`;
  const response = await fetch(`${transactionUrl}/${transactionId}`);
  if (!response.ok) {
    throw new Error('Transaction not found');
  }
  const transaction = await response.json();
  return transaction;
}

export async function getSettingsStatus(): Promise<number> {
  const transactions = await getTransactionsForProgram(PROGRAM, 'update_toggle_settings');
  const transactionIds = transactions.map((transactionId: any) => transactionId.transaction_id);
  if (transactionIds.length === 0) {
    return 5;
  }

  const transaction = await getTransaction(transactionIds[transactionIds.length - 1]);
  const status: string = transaction.execution.transitions[0].inputs[0].value;
  return parseInt(status.slice(0, status.indexOf('u32')));
}

export async function getMintBlock(): Promise<{ block: number }> {
  const transactionMetadata = await getAleoTransactionsForProgram(PROGRAM, 'set_mint_block');
  if (transactionMetadata.length === 0) {
    return { block: 0 };
  }

  const transaction = transactionMetadata[transactionMetadata.length - 1].transaction;
  const block = parseInt(transaction.execution.transitions[0].inputs[0].value.slice(0, -4));
  return { block };
}

export const getClient = () => {
  const client = new JSONRPCClient((jsonRPCRequest: any) =>
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ ...jsonRPCRequest })
    }).then((response: any) => {
      if (response.status === 200) {
        // Use client.receive when you received a JSON-RPC response.
        return response.json().then((jsonRPCResponse: any) => client.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    })
  );
  return client;
};

export async function getJSON(url: string): Promise<any> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}