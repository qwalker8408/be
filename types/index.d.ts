export interface WatchListItemType {
  id: string;
  title: string;
  subTitle: string;
  metric: [(CryptoResponseType | null), (CryptoResponseType | null)];
}

export interface CryptoResponseType {
  s: 'ETH-USD' | 'BTC-USD'// ticker code
  p: string /** last price */
  q: string // quantity of the trade
  dc: string // daily change percentage
  dd: string // daily difference price
  t: number // timestamp in milliseconds
}