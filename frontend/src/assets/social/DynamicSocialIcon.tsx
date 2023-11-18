/* eslint-disable @typescript-eslint/naming-convention */
import dynamic from 'next/dynamic'

import { QuestionCircleSVG } from '@/assets/icons'
import {useState} from "react";

export const socialIconTypes = {
  'com.discord': dynamic(() => import('./SocialDiscord.svg')),
  'com.discourse': dynamic(() => import('./SocialDiscourseColour.svg')),
  'com.github': dynamic(() => import('./SocialGithub.svg')),
  'com.medium': dynamic(() => import('./SocialMedium.svg')),
  'com.twitter': dynamic(() => import('./SocialTwitter.svg')),
  'com.youtube': dynamic(() => import('./SocialYoutube.svg')),
  'org.telegram': dynamic(() => import('./SocialTelegram.svg')),
  'xyz.mirror': dynamic(() => import('./SocialMirrorColour.svg')),
  email: dynamic(() => import('@/assets/icons').then((m) => m.EnvelopeSVG)),
}

export const socialIconColors = {
  'com.discord': '#5A57DD',
  'com.discourse': undefined,
  'com.github': '#000000',
  'com.medium': '#000000',
  'com.twitter': '#F5F5F5',
  'com.youtube': '#FF0000',
  'org.telegram': '#2BABEE',
  'xyz.mirror': undefined,
  email: '#000000',
}

export const DynamicSocialIcon = ({
  name,
  showDefault = true,
  fill,
  ...props
}: {
  name: keyof typeof socialIconTypes | string
  showDefault?: boolean
  fill?: string
}) => {
  const [hover, setHover] = useState(false);

  if (name in socialIconTypes) {
    const key = name as keyof typeof socialIconTypes
    const Icon = socialIconTypes[key] as any
    const fillOrigin = fill == undefined ? socialIconColors[key] : fill;
    const fillHover = socialIconColors[key];
    return <Icon
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ fill: hover ? fillHover : fillOrigin }}
      {...props} />
  }
  if (showDefault) {
    return <QuestionCircleSVG {...props} />
  }
  return null
}
