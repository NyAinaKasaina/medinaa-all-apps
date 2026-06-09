import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import theme from '@/theme/theme'
import { getTypeConfig } from './TypeBadge'

interface EntityMapPinProps {
  type?: string
  selected?: boolean
}

export default function EntityMapPin({ type, selected = false }: EntityMapPinProps) {
  const cfg = getTypeConfig(type)
  return (
    <View
      style={[
        styles.pin,
        { backgroundColor: selected ? theme.colors.primary : cfg.color },
        selected && styles.selected,
      ]}
    >
      <Ionicons name={cfg.icon} size={selected ? 16 : 12} color={theme.colors.surface} />
      <View style={[styles.tail, { borderTopColor: selected ? theme.colors.primary : cfg.color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  selected: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tail: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
})
