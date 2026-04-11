import { QuestionCircleSVG } from '@/assets/icons'
import type { SVGProps } from 'react'

import { DynamicAddressIconName, dynamicAddressIcons } from './dynamicAddressIcons'

export const DynamicAddressIcon = ({
  name,
  showDefault = true,
  className = "",
  ...props
}: {
  name: DynamicAddressIconName | string
  className?: string
  showDefault?: boolean
} & SVGProps<SVGSVGElement>) => {
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
