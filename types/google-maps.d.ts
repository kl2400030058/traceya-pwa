// Type definitions for Google Maps JavaScript API
declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    setOptions(options: MapOptions): void;
  }

  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLng | LatLngLiteral): void;
    setTitle(title: string): void;
    addListener(event: string, callback: Function): MapsEventListener;
  }

  class InfoWindow {
    constructor(opts?: InfoWindowOptions);
    open(map: Map, anchor?: MVCObject): void;
    setContent(content: string | Node): void;
  }

  class Circle {
    constructor(opts?: CircleOptions);
    setMap(map: Map | null): void;
    setCenter(center: LatLng | LatLngLiteral): void;
    setRadius(radius: number): void;
    addListener(event: string, callback: Function): MapsEventListener;
  }

  namespace visualization {
    class HeatmapLayer {
      constructor(opts?: HeatmapLayerOptions);
      setMap(map: Map | null): void;
      setData(data: MVCArray<LatLng | WeightedLocation> | LatLng[] | WeightedLocation[]): void;
    }
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeId?: string;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    zoomControl?: boolean;
    fullscreenControl?: boolean;
  }

  interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon;
    zIndex?: number;
  }

  interface InfoWindowOptions {
    content?: string | Node;
    position?: LatLng | LatLngLiteral;
  }

  interface CircleOptions {
    center?: LatLng | LatLngLiteral;
    radius?: number;
    map?: Map;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
    clickable?: boolean;
  }

  interface HeatmapLayerOptions {
    data?: MVCArray<LatLng | WeightedLocation> | LatLng[] | WeightedLocation[];
    map?: Map;
    radius?: number;
    opacity?: number;
    maxIntensity?: number;
    dissipating?: boolean;
    gradient?: string[];
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface WeightedLocation {
    location: LatLng;
    weight: number;
  }

  interface Icon {
    url?: string;
    path?: any;
    fillColor?: string;
    fillOpacity?: number;
    strokeWeight?: number;
    strokeColor?: string;
    scale?: number;
    size?: Size;
    scaledSize?: Size;
    origin?: Point;
    anchor?: Point;
    strokeOpacity?: number;
  }

  class Size {
    constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class MVCArray<T> extends Array<T> {
    constructor(array?: T[]);
  }

  class MVCObject {
    constructor();
  }

  interface MapsEventListener {
    remove(): void;
  }

  const MapTypeId: {
    ROADMAP: string;
    SATELLITE: string;
    HYBRID: string;
    TERRAIN: string;
  };

  const SymbolPath: {
    CIRCLE: number;
    FORWARD_CLOSED_ARROW: number;
    FORWARD_OPEN_ARROW: number;
    BACKWARD_CLOSED_ARROW: number;
    BACKWARD_OPEN_ARROW: number;
  };
}

// Extend Window interface to include google property
interface Window {
  google: typeof google;
}