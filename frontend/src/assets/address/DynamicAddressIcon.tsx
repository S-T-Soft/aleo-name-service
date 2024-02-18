import { QuestionCircleSVG } from '@/assets/icons'

import { DynamicAddressIconName, dynamicAddressIcons } from './dynamicAddressIcons'

export const DynamicAddressIcon = ({
  name,
  showDefault = true,
  className = "",
  ...props
}: {
  name: DynamicAddressIconName | string
  className: string
  showDefault?: boolean
}) => {
  if (name.toLowerCase() in dynamicAddressIcons) {
    const key = name.toLowerCase() as DynamicAddressIconName
    const Icon = dynamicAddressIcons[key] as any
    return <Icon className={className} {...props} />
  }
  if (showDefault) {
    return <QuestionCircleSVG className={className} {...props} />
  }
  return null
}
