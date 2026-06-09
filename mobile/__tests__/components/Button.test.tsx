import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Button from '@/components/ui/Button'

it('renders label and calls onPress', () => {
  const onPress = jest.fn()
  render(<Button label="Test" onPress={onPress} />)
  fireEvent.press(screen.getByText('Test'))
  expect(onPress).toHaveBeenCalledTimes(1)
})

it('does not call onPress when disabled', () => {
  const onPress = jest.fn()
  render(<Button label="Test" onPress={onPress} disabled />)
  fireEvent.press(screen.getByText('Test'))
  expect(onPress).not.toHaveBeenCalled()
})

it('shows ActivityIndicator when loading', () => {
  render(<Button label="Test" onPress={() => {}} loading />)
  expect(screen.queryByText('Test')).toBeNull()
})
