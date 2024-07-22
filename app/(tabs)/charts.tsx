import { format, addMinutes, startOfHour, startOfDay, addHours } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View, Dimensions, Pressable } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useTradingData } from '@/hooks/useTradingData';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import WatchListItem from '@/components/WatchListItem/WatchListItem';


const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  propsForDots: {
    r: "0.5",
    strokeWidth: "0",
    stroke: "#fff"
  },
  propsForLabels: {
    fontSize: 10
  }
};

export default function Charts() {
  const { tradingData, metrics } = useTradingData()
  console.log('tradingData length on charts', tradingData.length);
  const [selectedInterval, setSelectedInterval] = useState('1H')
  console.log('selectedInterval', selectedInterval);
  const [labels, setLabels] = useState<string[]>([])
  const [intervals, setIntervals] = useState<Date[] | []>([])
  const [priceRange, setPriceRange] = useState<{
    data: number[],
    color: () => string
  }[]>([])
  console.log('%c⧭ priceRange', 'color: #ffa280', priceRange);


  // 2 - then trigger the chart to update with values
  useEffect(() => {
    const now = new Date();

    if (selectedInterval === '30M') {
      let lastKnownPrice = 0;
      const pricesBTC = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.filter(td => td.s === 'BTC-USD').find(item => {
          const tradingDataDate = new Date(item.t);
          if (tradingDataDate >= interval && tradingDataDate < addMinutes(interval, 1)) {
            return true;
          }
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const pricesETH = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.filter(td => td.s === 'ETH-USD').find(item => {
          const date = new Date(item.t);
          console.log('date', date);
          return date >= interval && date < addMinutes(interval, 1);
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const formattedLabels = intervals.map((el, index) => {
        return index % 12 === 0 ? format(el, 'HH:mm') : '';
      });
      setLabels(formattedLabels);
      setPriceRange([
        {
          data: pricesBTC,
          color: () => 'orange'
        },
        {
          data: pricesETH,
          color: () => 'white'
        }
      ]);
    }
    if (selectedInterval === '1H') {
      let lastKnownPrice = 0;
      const pricesBTC = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.find(item => {
          const tradingDataDate = new Date(item.t);
          if (tradingDataDate >= interval && tradingDataDate < addMinutes(interval, 1) && item.s === 'BTC-USD') {
            return true;
          }
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const pricesETH = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.find(item => {
          const date = new Date(item.t);
          return date >= interval && date < addMinutes(interval, 1) && item.s === 'ETH-USD';
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const formattedLabels = intervals.map((el, index) => {
        return index % 15 === 0 ? format(el, 'HH:mm') : '';
      });
      setLabels(formattedLabels);
      setPriceRange([
        {
          data: pricesBTC,
          color: () => 'orange'
        },
        {
          data: pricesETH,
          color: () => 'white'
        },
      ]);
    }
    if (selectedInterval === '1D') {
      const now = new Date();

      let lastKnownPrice = 0;
      const pricesBTC = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.find(item => {
          const tradingDataDate = new Date(item.t);
          if (tradingDataDate >= interval && tradingDataDate < addMinutes(interval, 1) && item.s === 'BTC-USD') {
            return true;
          }
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const pricesETH = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.find(item => {
          const date = new Date(item.t);
          console.log('date', date);
          return date >= interval && date < addMinutes(interval, 1) && item.s === 'ETH-USD';
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const formattedLabels = intervals.map((el, index) => {
        return index % 6 === 0 ? `${format(el, 'HH:mm')}` : '';
      });
      setLabels(formattedLabels);
      setPriceRange([
        {
          data: pricesBTC,
          color: () => 'orange'
        },
        {
          data: pricesETH,
          color: () => 'white'
        }
      ]);
    }
  }, [intervals, selectedInterval, tradingData])

  // 1 - set the intervals first
  useEffect(() => {
    if (selectedInterval === '1D') {
      const now = new Date();
      const startOfCurrentDay = startOfDay(now);

      const intervalsTemp = []
      for (let i = 0; i < 24; i++) {
        const intervalStart = addHours(startOfCurrentDay, i);
        intervalsTemp.push(intervalStart);
      }
      setIntervals(intervalsTemp)

      let lastKnownPrice = 0;
      const pricesBTC = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.filter(td => td.s === 'BTC-USD').find(item => {
          const tradingDataDate = new Date(item.t);
          if (tradingDataDate >= interval && tradingDataDate < addHours(interval, 1)) {
            return true;
          }
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const pricesETH = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.filter(td => td.s === 'ETH-USD').find(item => {
          const date = new Date(item.t);
          console.log('date', date);
          return date >= interval && date < addMinutes(interval, 1);
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const formattedLabels = intervals.map((el, index) => {
        return index % 12 === 0 ? format(el, 'HH:mm') : '';
      });
      setLabels(formattedLabels);
      setPriceRange([
        {
          data: pricesBTC,
          color: () => 'orange'
        },
        {
          data: pricesETH,
          color: () => 'white'
        }
      ]);
    }
    if (selectedInterval === '1H') {
      const now = new Date();
      const startOfCurrentHour = startOfHour(now);

      const intervalsTemp = []
      for (let i = 0; i < 60; i++) {
        const intervalStart = addMinutes(startOfCurrentHour, i);
        intervalsTemp.push(intervalStart);
      }
      setIntervals(intervalsTemp)

      let lastKnownPrice = 0;
      const pricesBTC = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.find(item => {
          const tradingDataDate = new Date(item.t);
          if (tradingDataDate >= interval && tradingDataDate < addMinutes(interval, 1) && item.s === 'BTC-USD') {
            return true;
          }
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const pricesETH = intervals.map(interval => {
        if (interval > now) {
          return 0;
        }
        const priceAtInterval = tradingData.find(item => {
          const date = new Date(item.t);
          return date >= interval && date < addMinutes(interval, 1) && item.s === 'ETH-USD';
        });
        if (priceAtInterval) {
          lastKnownPrice = parseFloat(priceAtInterval.p);
          return lastKnownPrice;
        }
        return lastKnownPrice;
      });

      const formattedLabels = intervals.map((el, index) => {
        return index % 15 === 0 ? format(el, 'HH:mm') : '';
      });
      setLabels(formattedLabels);
      setPriceRange([
        {
          data: pricesBTC,
          color: () => 'orange'
        },
        {
          data: pricesETH,
          color: () => 'white'
        },
      ]);
    }
    if (selectedInterval === '30M') {
      const now = new Date();
      const startOfCurrentHour = startOfHour(now);

      const intervalsTemp = []
      for (let i = 0; i < 30; i++) {
        const intervalStart = addMinutes(startOfCurrentHour, i);
        intervalsTemp.push(intervalStart);
      }
      setIntervals(intervalsTemp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradingData, selectedInterval]);

  const data = useMemo(() => ({
    labels: labels,
    datasets: priceRange,
    legend: ["BTC-USD vs ETH-USD"] // optional
  }), [labels, priceRange]);



  console.log('labels', labels);
  console.log('priceRange', priceRange);
  return (
    <SafeAreaView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Charts</ThemedText>
      </ThemedView>
      <WatchListItem
        data={{
          id: 'watch-list-saved-1',
          title: "BTC-USD vs ETH-USD",
          subTitle: 'Source: EODHD',
          metrics: metrics
        }}
      />
      <ThemedView style={styles.stepContainer}>
        {(priceRange.length && labels.length) ? (
          <LineChart
            data={data}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            yAxisLabel="$"
            withVerticalLines={false}
            withHorizontalLines={false}
            withVerticalLabels={true}
            yLabelsOffset={0}
          />
        ) : null}
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Select Interval</ThemedText>
      </ThemedView>
      <View style={styles.buttonWrapper}>
        <Pressable onPress={() => setSelectedInterval('1D')}>
          <View style={styles.button}>
            {selectedInterval === '1D' && <Text style={styles.buttonStyle}>^</Text>}
            <Text style={styles.buttonStyle}>Today</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setSelectedInterval('1H')}>
          <View style={styles.button}>
            {selectedInterval === '1H' && <Text style={styles.buttonStyle}>^</Text>}
            <Text style={styles.buttonStyle}>Last hour</Text>
          </View>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 100,
    backgroundColor: 'black',
    borderRadius: 16,
  },
  buttonStyle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 20
  },
  indicatorWrapper: {
    justifyContent: 'center'
  },
  summaryWrapper: {
    display: 'flex',
    flexDirection: 'row'
  },
  titleContainer: {
    flexDirection: 'column',
    gap: 16,
    padding: 32
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row'
  }
});
