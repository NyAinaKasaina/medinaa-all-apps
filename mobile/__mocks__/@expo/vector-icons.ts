import React from 'react'
import { View } from 'react-native'

const MockIcon = React.forwardRef(({ name, size, color, ...props }: any, ref: any) => {
  return React.createElement(View, { ref, testID: `icon-${name}`, ...props })
})
MockIcon.displayName = 'MockIcon'

const Ionicons = MockIcon as any
Ionicons.glyphMap = {
  medkit: 'medkit',
  medical: 'medical',
  business: 'business',
  person: 'person',
  happy: 'happy',
  flask: 'flask',
  home: 'home',
  flash: 'flash',
  'checkmark-circle': 'checkmark-circle',
  'add-circle-outline': 'add-circle-outline',
}

export { Ionicons }
export default { Ionicons }
