declare module 'wawoff2' {
  /** WOFF2 to TTF. */
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>;
  const wawoff2: { decompress: typeof decompress };
  export default wawoff2;
}
