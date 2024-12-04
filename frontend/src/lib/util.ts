import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const FIELD_MODULUS = 8444461749428370424248824938781546531375899335154063827935233455917409239040n;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isIOS(){
  if (typeof window === 'undefined') return false;
  return /iPhone/gi.test(window.navigator.platform) || /Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints>0
}

export function isAndroid(){
  if (typeof window === 'undefined') return false;
  return /Android/gi.test(window.navigator.userAgent)
}

export function isMobile(){
  return isIOS() || isAndroid()
}

export function safeParseInt(value: string): number {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? 0 : parsedValue;
}

export function stringToBigInt(input: string, reverse: boolean = false): bigint {
  const encoder = new TextEncoder();
  const encodedBytes = encoder.encode(input);
  reverse && encodedBytes.reverse();

  let bigIntValue = BigInt(0);
  for (let i = 0; i < encodedBytes.length; i++) {
    const byteValue = BigInt(encodedBytes[i]);
    const shiftedValue = byteValue << BigInt(8 * i);
    bigIntValue = bigIntValue | shiftedValue;
  }

  return bigIntValue;
}

function bigIntToString(bigIntValue: bigint, reverse: boolean = false) {
  const bytes = [];
  let tempBigInt = bigIntValue;

  while (tempBigInt > BigInt(0)) {
    const byteValue = Number(tempBigInt & BigInt(255));
    bytes.push(byteValue);
    tempBigInt = tempBigInt >> BigInt(8);
  }

  reverse && bytes.reverse();

  const decoder = new TextDecoder();
  const asciiString = decoder.decode(Uint8Array.from(bytes));
  return asciiString;
}

export function splitStringToBigInts(input: string): bigint[] {
  const encoder = new TextEncoder(); // Create a new TextEncoder instance
  const inputBytes = encoder.encode(input); // Encode the input string as bytes
  const chunkSize = 16; // Chunk size to split the string in bytes
  const numChunks = Math.ceil(inputBytes.length / chunkSize);
  const bigInts: bigint[] = [];

  for (let i = 0; i < numChunks; i++) {
    const chunkStart = i * chunkSize;
    const chunkEnd = chunkStart + chunkSize;
    const chunk = inputBytes.slice(chunkStart, chunkEnd);
    let bigIntValue = BigInt(0);
    for (let i = 0; i < chunk.length; i++) {
      const byteValue = BigInt(chunk[i]);
      const shiftedValue = byteValue << BigInt(8 * i);
      bigIntValue = bigIntValue | shiftedValue;
    }
    bigInts.push(bigIntValue);
  }

  return bigInts;
}

export function stringToFields(input: string, numFieldElements = 4) {
  const bigIntValue = stringToBigInt(input, true);
  const fieldElements = [];
  let remainingValue = bigIntValue;
  for (let i = 0; i < numFieldElements; i++) {
    const fieldElement = remainingValue % FIELD_MODULUS;
    fieldElements.push(fieldElement.toString() + "field");
    remainingValue = remainingValue / FIELD_MODULUS;
  }
  if (remainingValue !== BigInt(0)) {
    throw new Error("String is too big to be encoded.");
  }
  return fieldElements;
}

export function fieldsToString(fields: bigint[]) {
  let bigIntValue = BigInt(0);
  let multiplier = BigInt(1);
  for (const fieldElement of fields) {
    bigIntValue += fieldElement * multiplier;
    multiplier *= FIELD_MODULUS;
  }
  return bigIntToString(bigIntValue, true);
}

export function joinBigIntsToString(bigInts: bigint[]): string {
  let result = '';

  for (let i = 0; i < bigInts.length; i++) {
    const chunkString = bigIntToString(bigInts[i]);
    result += chunkString;
  }

  return result;
}

export function padArray(array: bigint[], length: number): bigint[] {
  const paddingLength = length - array.length;
  if (paddingLength <= 0) {
    return array; // No padding needed
  }

  const padding = Array(paddingLength).fill(BigInt(0));
  const paddedArray = array.concat(padding);
  return paddedArray;
}

export function getFormattedNameInput(name: string, length: number): string {
  const nameInputs = padArray(splitStringToBigInts(name), length);
  return `[${nameInputs.map(i => i + 'u128').join(",")}]`;
}

export function getFormattedU128Input(str: string): string {
  const bint = stringToBigInt(str);
  return `${bint}u128`;
}

export function getFormattedFieldsInput(text: string, length: number): string {
  const fields = stringToFields(text, length);
  return `[${fields.join(",")}]`;
}

export function parseStringToBigIntArray(input: string): bigint[] {
  const bigIntRegex = /([0-9]+)u128/g;
  const matches = input.match(bigIntRegex);

  if (!matches) {
    return [];
  }

  const bigInts = matches.map((match) => BigInt(match.slice(0, -4)));
  return bigInts;
}
