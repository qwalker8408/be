import React, { createContext, useEffect, useMemo, useState, ReactNode, useContext } from 'react';
import { CryptoResponseType } from '@/types';
import { MMKV } from 'react-native-mmkv';
import throttle from 'lodash.throttle';

export interface TradingDataType {
  tradingData: CryptoResponseType[] | []
  metrics: [[CryptoResponseType, CryptoResponseType], [CryptoResponseType, CryptoResponseType]]
}

const storage = new MMKV();

const TradingDataContext = createContext(null as unknown as TradingDataType)


const { Provider } = TradingDataContext

const TradingDataProvider = ({ children }: { children: ReactNode }) => {
  const [tradingData, setTradingData] = useState<CryptoResponseType[] | []>([])
  const [metrics, setMetrics] = useState([])
  console.log('%c⧭ tradingData length', 'color: #ffcc00', tradingData.length);
  const [latestStorageId, setLatestStorageId] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState(new WebSocket(
    `wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${process.env.EXPO_PUBLIC_EODHD_API_TOKEN}`,
  ))
  console.log('latestStorageId', latestStorageId);

  const tickerInformation = useMemo(() => tradingData.slice().reverse(), [tradingData]);

  const latestBitcoinInfo = useMemo(() => {
    if (tickerInformation.length) {
      const btcUSDIndex = tickerInformation.findIndex(el => el.s === 'BTC-USD');
      const latestBtcUSD = btcUSDIndex !== -1 ? tickerInformation[btcUSDIndex] : null;
      const previousBtcUSD = tickerInformation.slice(btcUSDIndex + 1).find(el => el.s === 'BTC-USD');
      if (latestBtcUSD && previousBtcUSD) {
        return [latestBtcUSD, previousBtcUSD];
      }
      return null;
    }
    return null;
  }, [tickerInformation]);

  const latestEthereumInfo = useMemo(() => {
    if (tickerInformation.length) {
      const ethUSDIndex = tickerInformation.findIndex(el => el.s === 'ETH-USD');
      const latestEthUSD = ethUSDIndex !== -1 ? tickerInformation[ethUSDIndex] : null;
      const previousEthUSD = tickerInformation.slice(ethUSDIndex + 1).find(el => el.s === 'ETH-USD');
      if (latestEthUSD && previousEthUSD) {
        return [latestEthUSD, previousEthUSD];
      }
      return null;
    }
    return null;
  }, [tickerInformation]);

  useEffect(() => {
    if (latestEthereumInfo && latestBitcoinInfo) {
      // @ts-expect-error will complete the types for this
      setMetrics([latestBitcoinInfo, latestEthereumInfo])
    }
  }, [latestBitcoinInfo, latestEthereumInfo, setMetrics])

  useEffect(() => {
    // storage.clearAll()
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
        symbols: "ETH-USD,BTC-USD",
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
        ));
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error', error);
        websocket.close();
      };

      // https://stackoverflow.com/questions/77950038/failed-websocket-is-closed-before-the-connection-is-established-on-xcode-simu
      // TODO - a bug occurs here for some reason on ios, to reenact, comment out then comment back in while its running
      return () => websocket.close();
    }
  }, [latestStorageId, tradingData, websocket]);

  return (
    <Provider
      value={{
        metrics,
        tradingData
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
