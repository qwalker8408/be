import * as React from 'react'
import {
  Text, View, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { WatchListItemType } from '@/types';
import { Link } from 'expo-router';

function ColorText({
  latest, previous, suffix, prefix,
}: { latest: string, previous: string, suffix?: string, prefix?: string }) {
  const formattedLatest = latest ? `${parseFloat(latest).toFixed(2)}` : '';
  const formattedPrevious = previous ? `${parseFloat(previous).toFixed(2)}` : '';

  return (
    <Text style={{
      color: formattedLatest >= formattedPrevious ? 'green' : 'red',
      fontSize: 12,
    }}
    >
      {prefix || null}
      {formattedLatest}
      {suffix || null}
    </Text>
  );
}

export default function WatchListItem({ data }: { data: WatchListItemType }) {
  let latest = null
  let previous = null

  if (data?.metric?.length === 2) {
    latest = data.metric[0]
    previous = data.metric[1]
  }

  const imageSource = latest?.s === 'BTC-USD'
    ? require('@/assets/images/bitcoin.png')
    : require('@/assets/images/ethereum.png')


  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {latest?.s ? (
          <Image
            source={imageSource}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        ) : <ActivityIndicator size="small" color="#00ff00" />}
        <View style={styles.leftSection}>
          <Link replace href="/charts" style={styles.link}>
            <View>
              <Text style={styles.heading}>{data.title}</Text>
              <Text>{data.subTitle}</Text>
            </View>
          </Link>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.metricWrapper}>
            <ColorText latest={latest?.p || ''} previous={previous?.p || ''} prefix="$" />
            <View style={styles.metricIndicatorRows}>
              <ColorText latest={latest?.dd || ''} previous={previous?.dd || ''} />
              <Text style={styles.verticalDivider}>|</Text>
              <ColorText latest={latest?.dc || ''} previous={previous?.dc || ''} suffix="%" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'white',
    height: 80
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    width: '100%',
    height: '100%'
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  leftSection: {
    width: 'auto',
  },
  rightSection: {
    flexDirection: 'row',
    flex: 1,

  },
  metricWrapper: {
    width: '100%',
    alignItems: 'flex-end',
    fontSize: 8,
    gap: 4,
  },
  metricIndicatorRows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 2,
  },
  link: {
    display: 'flex',
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'grey',
  },
  verticalDivider: {
    color: 'grey',
  },
});
