import { QuestionCircleSVG } from '@/assets/icons'

import { DynamicAddressIconName, dynamicAddressIcons } from './dynamicAddressIcons'

export const DynamicAddressIcon = ({
  name,
  showDefault = true,
  ...props
}: {
  name: DynamicAddressIconName | string
  showDefault?: boolean
}) => {
  if (name.toLowerCase() in dynamicAddressIcons) {
    const key = name.toLowerCase() as DynamicAddressIconName
    const Icon = dynamicAddressIcons[key] as any
    return <Icon {...props} />
  }
  if (showDefault) {
    return <QuestionCircleSVG {...props} />
  }
  return null
}
