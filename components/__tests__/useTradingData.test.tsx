import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { TradingDataProvider, useTradingData } from '@/hooks/useTradingData';
import { MMKV } from 'react-native-mmkv';

jest.mock('react-native-mmkv', () => require('__mocks__/MMKV'));

const TestComponent: React.FC = () => {
  const { tradingData } = useTradingData();
  return (
    <>
      <Text testID="tradingDataLength">{tradingData.length}</Text>
    </>
  );
};

describe('useTradingData hook', () => {
  beforeEach(() => {
    const storage = new MMKV();
    storage.clearAll();

    const mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      onopen: jest.fn(),
      onmessage: jest.fn(),
      onclose: jest.fn(),
      onerror: jest.fn(),
    };

    global.WebSocket = jest.fn(() => mockWebSocket) as any;
  });

  it('should initialise websocket and ensure it works', async () => {
    const { findByTestId } = render(
      <TradingDataProvider>
        <TestComponent />
      </TradingDataProvider>
    );

    // Mock WebSocket open event
    const wsInstance = (global.WebSocket as unknown as jest.Mock).mock.instances[0];
    wsInstance.onopen();

    // Mock WebSocket message event
    wsInstance.onmessage({
      data: JSON.stringify({ s: 'BTC-USD', p: '50000', q: '1', dc: '0.5', dd: '250', t: Date.now() })
    } as MessageEvent);

    // Assertions
    const tradingDataLength = await findByTestId('tradingDataLength');

    expect(tradingDataLength.props.children).toBeGreaterThan(0);
  });
});
