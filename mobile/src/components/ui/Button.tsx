import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native'
import theme from '@/theme/theme'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => {
        const dynamicStyles: ViewStyle[] = [
          viewStyles.base,
          viewStyles[variant as keyof typeof viewStyles],
        ]
        if (fullWidth) dynamicStyles.push(viewStyles.fullWidth)
        if (pressed || isDisabled) dynamicStyles.push(viewStyles.pressed)
        if (style) dynamicStyles.push(style)
        return dynamicStyles
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? theme.colors.textOnPrimary
              : theme.colors.primary
          }
        />
      ) : (
        <Text
          style={[
            textStyles.label,
            textStyles[`${variant}Label` as keyof typeof textStyles],
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const viewStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
})

const textStyles = StyleSheet.create({
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  primaryLabel: {
    color: theme.colors.textOnPrimary,
  },
  secondaryLabel: {
    color: theme.colors.primaryDark,
  },
  outlineLabel: {
    color: theme.colors.primary,
  },
  ghostLabel: {
    color: theme.colors.primary,
  },
})
