import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {DimensionValue} from 'react-native';

import {colors} from '../theme/colors';

export const Skeleton = ({height, width = '100%', radius = 16}: {height: number; width?: DimensionValue; radius?: number}) => (
  <View style={[styles.block, {height, width, borderRadius: radius}]} />
);

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceMuted,
  },
});
