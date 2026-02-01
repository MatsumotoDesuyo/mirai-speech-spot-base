declare module 'react-map-gl/mapbox' {
  import { Component, ForwardRefExoticComponent, RefAttributes } from 'react';
  import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';

  export interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    bearing?: number;
    pitch?: number;
    padding?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  }

  export interface ViewStateChangeEvent {
    viewState: ViewState;
    target: MapboxMap;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface MarkerEvent<T, E> {
    originalEvent: E;
  }

  export interface MapRef {
    getMap(): MapboxMap;
    getCenter(): { lng: number; lat: number };
  }

  export interface MapProps {
    longitude?: number;
    latitude?: number;
    zoom?: number;
    bearing?: number;
    pitch?: number;
    style?: React.CSSProperties;
    mapStyle?: string;
    mapboxAccessToken?: string;
    onMove?: (evt: ViewStateChangeEvent) => void;
    onClick?: (evt: MapMouseEvent) => void;
    onContextMenu?: (evt: MapMouseEvent) => void;
    children?: React.ReactNode;
  }

  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offset?: [number, number];
    onClick?: (evt: MarkerEvent<Marker, MouseEvent>) => void;
    children?: React.ReactNode;
  }

  export interface NavigationControlProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showCompass?: boolean;
    showZoom?: boolean;
    visualizePitch?: boolean;
  }

  export interface GeolocateControlProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    trackUserLocation?: boolean;
    showUserHeading?: boolean;
    showAccuracyCircle?: boolean;
    positionOptions?: PositionOptions;
  }

  export const Map: ForwardRefExoticComponent<MapProps & RefAttributes<MapRef>>;
  export class Marker extends Component<MarkerProps> {}
  export class NavigationControl extends Component<NavigationControlProps> {}
  export class GeolocateControl extends Component<GeolocateControlProps> {}

  export default Map;
  export { ViewStateChangeEvent, MarkerEvent, MapRef };
}
