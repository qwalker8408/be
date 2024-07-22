
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTradingData } from '@/hooks/useTradingData';
import WatchListItem from '@/components/WatchListItem/WatchListItem';

export default function HomeScreen() {
  const { metrics } = useTradingData();

  return (
    <SafeAreaView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Stocks</ThemedText>
      </ThemedView>
      <WatchListItem
        data={{
          id: 'watch-list-saved-1',
          title: "BTC-USD vs ETH-USD",
          subTitle: 'Source: EODHD',
          metrics: metrics
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    gap: 16,
    padding: 32
  },
});
