import { Ionicons } from '@expo/vector-icons';
import { format, addMinutes, startOfHour, startOfDay, addHours } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View, Dimensions, Pressable } from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useTradingData } from '@/hooks/useTradingData';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import WatchListItem from '@/components/WatchListItem/WatchListItem';
import { graphColors } from '@/constants/Graph'
import Svg, { Rect, Text as TextSVG } from 'react-native-svg';
import { CryptoResponseType } from '@/types';

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#F2F2F2",
  color: (opacity = 1) => `black`,
  strokeWidth: 2, // optional, default 3
  propsForDots: {
    r: "0.5",
    strokeWidth: "2",
    stroke: "#000000"
  },
  propsForLabels: {
    fontSize: 10
  }
};

export default function Charts() {
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: true, value: 0 })
  const { tradingDataNewest, subscribedTickers, getMetric, lastUpdate } = useTradingData()
  const [selectedInterval, setSelectedInterval] = useState<'1D' | '1H'>('1H')
  const [visibleTickers, setVisibleTickers] = useState<('BTC-USD' | 'ETH-USD')[]>(subscribedTickers)
  console.log('selectedInterval', selectedInterval);
  const [labels, setLabels] = useState<string[]>([])
  const [intervals, setIntervals] = useState<Date[] | []>([])
  const [priceRange, setPriceRange] = useState<{
    data: number[],
    color: () => string
  }[]>([])
  const [maxChartPrice, setMaxChartPrice] = useState(0)
  const [minChartPrice, setMinChartPrice] = useState(0)

  const getIntervals = useCallback((interval: '1D' | '1H') => {
    const now = new Date();
    if (interval === '1D') {
      const startOfCurrentDay = startOfDay(now);

      const intervalsTemp = []
      for (let i = 0; i < 24; i++) {
        const intervalStart = addHours(startOfCurrentDay, i);
        intervalsTemp.push(intervalStart);
      }
      setIntervals(intervalsTemp)
    } else {
      const startOfCurrentHour = startOfHour(now);

      const intervalsTemp = []
      for (let i = 0; i < 60; i++) {
        const intervalStart = addMinutes(startOfCurrentHour, i);
        intervalsTemp.push(intervalStart);
      }
      setIntervals(intervalsTemp)
    }

  }, [])

  // 1 - set the intervals and update the labels
  useEffect(() => {
    getIntervals(selectedInterval)
  }, [getIntervals, selectedInterval]);

  useEffect(() => {
    const formattedLabels = intervals.map((el, index) => {
      if (selectedInterval === '1H') {
        return index % 15 === 0 ? format(el, 'HH:mm:ss') : ''
      }
      return index % 3 === 0 ? format(el, 'HH') : ''
    });
    setLabels(formattedLabels);
  }, [intervals, selectedInterval]);

  const handleTickerVisibility = (selectedItem: 'BTC-USD' | 'ETH-USD') => {
    setVisibleTickers(prevState => {
      if (prevState.includes(selectedItem)) {
        return prevState.filter(el => el !== selectedItem)
      }
      return [...prevState, selectedItem]
    })
  }

  const getPriceRange = useCallback((ticker: 'BTC-USD' | 'ETH-USD') => {
    if (!visibleTickers.includes(ticker)) {
      return null;
    }
    const pricesAtInterval = intervals.reduce((acc: number[], interval: Date) => {
      const filteredArray = tradingDataNewest.filter(td => td.s === ticker)
      const found = filteredArray.find(td => {
        const tradingDate = new Date(td.t);
        const endDate = selectedInterval === '1H' ? addMinutes(interval, 1) : addHours(interval, 1);
        return tradingDate >= interval && tradingDate < endDate;
      });
      if (found) {
        acc.push(parseFloat(found.p));
      }
      return acc;
    }, []);

    const now = new Date();
    const colors = intervals.map((interval, index) => {
      return interval > now ? 'rgba(255, 255, 255, 0)' : graphColors[ticker]; // Orange with transparency for future points
    });

    return {
      data: pricesAtInterval,
      color: (opacity = 1, index: number) => colors[index] || graphColors[ticker]
    };
  }, [intervals, selectedInterval, tradingDataNewest, visibleTickers]);

  useEffect(() => {
    const priceRangeSets = visibleTickers.map((ticker) => getPriceRange(ticker)).filter(Boolean);
    setPriceRange(priceRangeSets);
  }, [getPriceRange, intervals, selectedInterval, tradingDataNewest, visibleTickers])

  const sortedPrices = useMemo(() => {
    if (visibleTickers.length === 1) {
      return tradingDataNewest.filter(td => td.s === visibleTickers[0]).sort((a, b) => {
        return parseFloat(b.p) - parseFloat(a.p)
      })
    }
    return tradingDataNewest.sort((a, b) => {
      return parseFloat(b.p) - parseFloat(a.p)
    })
  }, [tradingDataNewest, visibleTickers])

  useEffect(() => {
    if (visibleTickers) {
      // @ts-expect-error
      const maxPrice = sortedPrices?.at(0) ? parseFloat(sortedPrices?.at(0)?.p) * 1.001 : 0;
      // @ts-expect-error
      const minPrice = sortedPrices?.at(0) ? parseFloat(sortedPrices?.at(0)?.p) * 0.999 : 0; // Adjusted to add buffer below the min price
      console.log('maxPrice', maxPrice);
      console.log('minPrice', minPrice);
      setMaxChartPrice(maxPrice)
      setMinChartPrice(minPrice)

    }
  }, [minChartPrice, sortedPrices, visibleTickers])


  console.log('priceRange', priceRange);

  return (
    <SafeAreaView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Charts</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        {(priceRange.length && labels.length) ? (
          <LineChart
            style={{
              padding: 0
            }}
            data={{
              labels: labels,
              datasets: [
                ...priceRange,
                {
                  data: [maxChartPrice || 0],
                  withDots: false,
                },
                {
                  data: [minChartPrice || 0],
                  withDots: false,
                },
              ]
            }}
            width={screenWidth}
            height={400}
            chartConfig={chartConfig}
            yAxisLabel="$"
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            yLabelsOffset={0}
            fromZero={false}
            minY={minChartPrice}
            maxY={maxChartPrice}
            yAxisInterval={1}
            bezier
          />
        ) : <View style={{ height: 400 }} />}
      </ThemedView>
      <View style={styles.watchListWrapper}>
        {subscribedTickers.map(ticker => (
          <View
            key={ticker}
            style={styles.customWatchListWrapper}
          >
            <View style={{ height: '100%', width: 4, backgroundColor: graphColors[ticker] }}></View>
            <View style={{ width: '90%' }}>
              <WatchListItem
                data={{
                  id: ticker,
                  title: ticker.split('-').join(''),
                  subTitle: 'Source: EODHD',
                  metric: getMetric(ticker)
                }}
              />
            </View>
            <Pressable
              style={styles.hideButton}
              onPress={() => handleTickerVisibility(ticker)}>
              <View>
                {visibleTickers.includes(ticker)
                  ? <Ionicons name='eye' />
                  : <Ionicons name='eye-off' />
                }
              </View>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.buttonWrapper}>
        <Pressable
          style={[
            styles.button,
            selectedInterval === '1H' ? styles.selectedButton : null,
          ]}
          onPress={() => setSelectedInterval('1H')} >
          <Text style={styles.buttonTextStyle}>1H</Text>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            selectedInterval === '1D' ? styles.selectedButton : null,
          ]}
          onPress={() => setSelectedInterval('1D')}>
          <Text style={styles.buttonTextStyle}>1D</Text>
        </Pressable>
      </View>
      <View style={styles.seperator} />
      <View style={styles.timeWrapper}>
        <Text style={styles.timeWrapperText}>
          Last Update: {lastUpdate ? format(lastUpdate, `dd MMM yyyy 'at' HH:mm:ss`) : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextStyle: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold'
  },
  selectedButton: {
    backgroundColor: 'lightgrey'
  },
  buttonWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
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
    height: 400,
    gap: 8,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row'
  },
  timeWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    padding: 16
  },
  timeWrapperText: {
    fontSize: 10
  },
  watchListWrapper: {
    gap: 16
  },
  customWatchListWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  hideButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 80,
    flex: 1,
    backgroundColor: 'white'
  },
  seperator: {
    height: 1,
    width: '100%',
    backgroundColor: 'darkgrey'
  }
});
