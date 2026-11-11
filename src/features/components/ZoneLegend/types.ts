import type { PhaseZone } from '@/engine/phases';

export default interface ZoneLegendProps {
  /** The zones to list, in place order. */
  zones: readonly PhaseZone[];
}
