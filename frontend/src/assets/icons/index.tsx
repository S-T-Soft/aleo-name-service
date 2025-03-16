import dynamic from 'next/dynamic'

export const QuestionCircleSVG = dynamic(() => import('./QuestionCircle.svg'));
export const EnvelopeSVG = dynamic(() => import('./Envelope.svg'));
export const GridSVG = dynamic(() => import('./Grid.svg'));
export const OutlinkSVG = dynamic(() => import('./Outlink.svg'));
export const BuildWithAleoDarkSVG = dynamic(() => import('./BuiltWithAleoDark.svg'));
export const ShieldSVG = dynamic(() => import('./Shield.svg'));
export const UnshieldSVG = dynamic(() => import('./Unshield.svg'));