import { Component, type ReactNode } from 'react';

type MapBoundaryProps = { fallback: ReactNode; children: ReactNode };

/** If the map code cannot load (offline on the web), the rest of the form keeps working. */
export class MapBoundary extends Component<MapBoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
