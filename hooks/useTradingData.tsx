import React, { createContext, useEffect, useMemo, useState, ReactNode, useContext, useCallback, useRef } from 'react';
import { CryptoResponseType } from '@/types';
import { MMKV } from 'react-native-mmkv';
import throttle from 'lodash.throttle';
import { atom, useAtom, useAtomValue } from 'jotai';
import * as Network from 'expo-network';

type subscribedTicker = 'BTC-USD' | 'ETH-USD'
type latestCryptoObj = CryptoResponseType
type prevCryptoObj = CryptoResponseType
type getMetricType = (cryptoPair: subscribedTicker) => [latestCryptoObj: latestCryptoObj, prevCryptoObj: prevCryptoObj]
export interface TradingDataType {
  tradingDataNewest: CryptoResponseType[] | []
  subscribedTickers: (subscribedTicker)[]
  tradingData: CryptoResponseType[] | []
  getMetric: getMetricType
  lastUpdate: Date | null
}

const { getNetworkStateAsync } = Network

const storage = new MMKV();
const tradingDataAtom = atom<CryptoResponseType[] | []>([])
const websocketAtom = atom(new WebSocket(`wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${process.env.EXPO_PUBLIC_EODHD_API_TOKEN}`))
const subscribedTickersAtom = atom<(subscribedTicker)[]>(['BTC-USD', 'ETH-USD'])
const TradingDataContext = createContext(null as unknown as TradingDataType)


const { Provider } = TradingDataContext

const TradingDataProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(true)
  console.log('%c⧭ isConnected', 'color: #917399', isConnected);
  const [tradingData, setTradingData] = useAtom(tradingDataAtom)
  console.log('tradingData count', tradingData.length);
  // NOTE this is probably a BE request upon load but leave it for now
  const subscribedTickers = useAtomValue(subscribedTickersAtom)
  const [websocket, setWebsocket] = useAtom(websocketAtom)
  const [latestStorageId, setLatestStorageId] = useState<string | null>(null);

  const getNetworkStatus = useCallback(async () => {
    const status = await getNetworkStateAsync();
    setIsConnected(!!status.isConnected);
    if (!status.isConnected) {
      websocket.close();
    }
  }, [websocket]);

  const tradingDataNewest = useMemo(() => tradingData.slice().reverse(), [tradingData]);
  const lastUpdate = useMemo(() => {
    if (tradingDataNewest[0]?.t) {
      return new Date(tradingDataNewest[0]?.t)
    }
    return null
  }, [tradingDataNewest])

  const getMetric = useCallback((ticker: subscribedTicker) => {
    if (tradingDataNewest.length) {
      const cryptoIndex = tradingDataNewest.findIndex(el => el.s === ticker);
      const latestUSD = cryptoIndex !== -1 ? tradingDataNewest[cryptoIndex] : null;
      const previousUSD = tradingDataNewest.slice(cryptoIndex + 1).find(el => el.s === ticker);
      if (latestUSD && previousUSD) {
        return [latestUSD, previousUSD];
      }
      return null;
    }
    return null;
  }, [tradingDataNewest]) as getMetricType

  useEffect(() => {
    const allStorages = storage.getAllKeys();
    if (allStorages.length) {
      console.log('allStorages', allStorages);
      const latestKey = allStorages.map((el) => parseInt(`${el.split('-').at(-1)}`)).sort((a, b) => a - b).at(-1);
      console.log('latestKey', latestKey);
      setLatestStorageId(`trading-data-${latestKey}`);
      const storedData = allStorages.flatMap((el) => {
        const item = storage.getString(el);
        if (item) {
          return JSON.parse(item);
        }
      });
      console.log('storedData length', storedData.length);
      setTradingData(storedData);
      return;
    }
    setLatestStorageId('trading-data-0');
    storage.set('trading-data-0', JSON.stringify([]));
  }, [setTradingData]);

  useEffect(() => {
    websocket.onopen = () => {
      console.log('opened')
      const message = JSON.stringify({
        action: "subscribe",
        symbols: subscribedTickers.join(','),
      });
      websocket.send(message);
    };
    if (latestStorageId) {
      websocket.onmessage = throttle((event: WebSocketMessageEvent) => {
        // Response data type for cryptocurrencies
        // s: ticker code
        // p: last price
        // q: quantity of the trade
        // dc: daily change percentage
        // dd: daily difference price
        // t: timestamp in milliseconds

        // if reaching the 6 mb limit then start removing the old, but at what rate to ensure you don't receive errors in saving

        const data = JSON.parse(event.data) as CryptoResponseType;
        if (latestStorageId && 'p' in data) {
          setTradingData((prevState) => [...prevState, data]);
          console.log('caching');
          const lastKnownCacheObject = storage.getString(latestStorageId);
          if (lastKnownCacheObject) {
            const fileSizeBits = lastKnownCacheObject.length * 2 * 16;
            const fileSizeBytes = fileSizeBits / (8 * 1024);
            console.log('fileSizeBytes', fileSizeBytes);
            if (tradingData.length > 10000) {
              setTradingData([])
              storage.clearAll()
            }
            if (fileSizeBytes > 5900 && fileSizeBytes < 6000) {
              const newIndex = latestStorageId.split('-').at(-1);
              if (newIndex) {
                storage.set(`trading-data-${parseInt(newIndex) + 1}`, JSON.stringify([...tradingData, data]));
                setLatestStorageId(`trading-data-${newIndex}`);
              }
            } else {
              storage.set(latestStorageId, JSON.stringify([...tradingData, data]));
            }
          }
        }
      }, 1000);

      websocket.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        setWebsocket(new WebSocket(
          `wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${process.env.EXPO_PUBLIC_EODHD_API_TOKEN}`,
        ))
      };

      websocket.onerror = (error) => {
        console.log('WebSocket error', error);
        websocket.close();
      };

      return () => websocket.close();
    }
  }, [latestStorageId, setTradingData, setWebsocket, subscribedTickers, tradingData, websocket]);

  useEffect(() => {
    const interval = setInterval(() => {
      getNetworkStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [getNetworkStatus]);

  return (
    <Provider
      value={{
        lastUpdate,
        tradingDataNewest,
        subscribedTickers,
        tradingData,
        getMetric,
      }}>
      {children}
    </Provider>
  )
}

const useTradingData = () => {
  const context = useContext(TradingDataContext)

  if (!context) {
    throw new Error('hook should be used with the trading data context')
  }

  return context
}

export { useTradingData, TradingDataProvider };
