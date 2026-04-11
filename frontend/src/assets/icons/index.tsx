import dynamic from 'next/dynamic'
import type { SVGProps } from 'react'

type SvgIconProps = SVGProps<SVGSVGElement>

export const QuestionCircleSVG = dynamic<SvgIconProps>(() => import('./QuestionCircle.svg'));
export const EnvelopeSVG = dynamic<SvgIconProps>(() => import('./Envelope.svg'));
export const GridSVG = dynamic<SvgIconProps>(() => import('./Grid.svg'));
export const OutlinkSVG = dynamic<SvgIconProps>(() => import('./Outlink.svg'));
export const BuildWithAleoDarkSVG = dynamic<SvgIconProps>(() => import('./BuiltWithAleoDark.svg'));
export const ShieldSVG = dynamic<SvgIconProps>(() => import('./Shield.svg'));
export const UnshieldSVG = dynamic<SvgIconProps>(() => import('./Unshield.svg'));
