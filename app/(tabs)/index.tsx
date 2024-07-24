
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTradingData } from '@/hooks/useTradingData';
import WatchListItem from '@/components/WatchListItem/WatchListItem';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { subscribedTickers, getMetric, lastUpdate } = useTradingData();

  return (
    <SafeAreaView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Stocks</ThemedText>
      </ThemedView>
      <View style={styles.watchListWrapper}>
        {subscribedTickers.map(ticker => (
          <WatchListItem
            key={ticker}
            data={{
              id: ticker,
              title: ticker.split('-').join(''),
              subTitle: 'Source: EODHD',
              metric: getMetric(ticker)
            }}
          />
        ))}
        <View style={styles.timeWrapper}>
          <Text style={styles.timeWrapperText}>
            Last Update: {lastUpdate ? format(lastUpdate, `dd MMM yyyy 'at' HH:mm:ss`) : ''}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    gap: 16,
    padding: 32
  },
  watchListWrapper: {
    gap: 16
  },
  timeWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    paddingRight: 16
  },
  timeWrapperText: {
    fontSize: 10
  }
});
