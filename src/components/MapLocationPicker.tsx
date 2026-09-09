'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGoogleMapsLoaded } from '@/lib/useGoogleMapsLoaded';
import { mapStyles } from '@/lib/mapStyles';
import { MapPin, Navigation, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LocationResult {
  lat: number;
  lng: number;
  addressLine?: string;
  placeId?: string;
  localityName?: string;
  cityName?: string;
}

interface MapLocationPickerProps {
  initialLat?: number | string;
  initialLng?: number | string;
  onLocationSelect: (location: LocationResult) => void;
  className?: string;
}

export default function MapLocationPicker({
  initialLat,
  initialLng,
  onLocationSelect,
  className = '',
}: MapLocationPickerProps) {
  const isMapsLoaded = useGoogleMapsLoaded();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = Number(initialLat);
    const lng = Number(initialLng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return null;
  });

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reverse Geocoding helper
  const reverseGeocode = useCallback(
    (lat: number, lng: number, placeIdFromSearch?: string) => {
      if (!geocoderRef.current && (window as any).google?.maps) {
        geocoderRef.current = new (window as any).google.maps.Geocoder();
      }

      const geocoder = geocoderRef.current;
      if (!geocoder) {
        onLocationSelect({ lat, lng, placeId: placeIdFromSearch });
        return;
      }

      setGeocoding(true);
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any, status: any) => {
          setGeocoding(false);
          if (status === 'OK' && results && results[0]) {
            const topResult = results[0];
            const address = topResult.formatted_address;
            const placeId = placeIdFromSearch || topResult.place_id;

            let localityName = '';
            let cityName = '';

            // Extract locality & city from address components
            for (const component of topResult.address_components) {
              if (
                component.types.includes('sublocality') ||
                component.types.includes('sublocality_level_1') ||
                component.types.includes('neighborhood')
              ) {
                localityName = component.long_name;
              }
              if (component.types.includes('locality')) {
                cityName = component.long_name;
              }
            }

            setSelectedAddress(address);
            onLocationSelect({
              lat: parseFloat(lat.toFixed(6)),
              lng: parseFloat(lng.toFixed(6)),
              addressLine: address,
              placeId,
              localityName,
              cityName,
            });
          } else {
            onLocationSelect({
              lat: parseFloat(lat.toFixed(6)),
              lng: parseFloat(lng.toFixed(6)),
              placeId: placeIdFromSearch,
            });
          }
        }
      );
    },
    [onLocationSelect]
  );

  // Update marker & map position
  const setMapMarkerPosition = useCallback(
    (lat: number, lng: number, pan = true, shouldGeocode = true, placeId?: string) => {
      setCurrentCoords({ lat, lng });

      if (mapInstanceRef.current && pan) {
        mapInstanceRef.current.panTo({ lat, lng });
      }

      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition({ lat, lng });
      }

      if (shouldGeocode) {
        reverseGeocode(lat, lng, placeId);
      }
    },
    [reverseGeocode]
  );

  // Auto-detect GPS coordinates
  const handleDetectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device');
      return;
    }

    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));
        setGpsDetecting(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(17);
        }
        setMapMarkerPosition(lat, lng, true, true);
      },
      (error) => {
        setGpsDetecting(false);
        console.warn('GPS location detection failed:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [setMapMarkerPosition]);

  // Initialize Google Maps once loaded
  useEffect(() => {
    if (!isMapsLoaded || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    const google = (window as any).google;

    // Default center: Pune (18.5204, 73.8567) or provided coords
    const initialCenter = currentCoords || { lat: 18.5204, lng: 73.8567 };

    const map = new google.maps.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: currentCoords ? 17 : 14,
      styles: mapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy', // Better mobile touch interaction
    });

    mapInstanceRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();

    // Draggable Marker
    const marker = new google.maps.Marker({
      position: initialCenter,
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#6366f1',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 6,
      },
    });

    markerInstanceRef.current = marker;

    // Marker Drag End Listener
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        setMapMarkerPosition(lat, lng, false, true);
      }
    });

    // Map Tap/Click Listener
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMapMarkerPosition(lat, lng, false, true);
      }
    });

    // Google Places Autocomplete
    if (searchInputRef.current && google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'formatted_address', 'place_id', 'name', 'address_components'],
      });
      autocomplete.bindTo('bounds', map);
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        map.setZoom(17);
        setMapMarkerPosition(lat, lng, true, true, place.place_id);
        if (place.formatted_address) {
          setSelectedAddress(place.formatted_address);
        }
      });
    }

    // If no initial coordinates were provided, trigger GPS detection automatically on first mount
    if (!currentCoords) {
      handleDetectGPS();
    } else {
      // Reverse geocode existing initial coordinates
      reverseGeocode(initialCenter.lat, initialCenter.lng);
    }
  }, [isMapsLoaded]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Search & Locate Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4 text-indigo-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search society, building, street, or landmark..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={gpsDetecting}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-3 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition active-press shadow-sm"
          title="Detect Current GPS Location"
        >
          {gpsDetecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          ) : (
            <Navigation className="h-4 w-4 text-indigo-400" />
          )}
          <span className="hidden sm:inline">Current GPS</span>
        </button>
      </div>

      {/* Interactive Google Map Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
        {!isMapsLoaded && (
          <div className="flex h-[360px] sm:h-[420px] w-full flex-col items-center justify-center gap-2 bg-slate-900/60 p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-xs font-semibold text-slate-300">Loading Google Maps...</p>
            <p className="text-[11px] text-slate-500">
              Initializing Places and Geocoding APIs
            </p>
          </div>
        )}

        <div
          ref={mapContainerRef}
          className={`h-[360px] sm:h-[420px] w-full transition-opacity duration-300 ${
            isMapsLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Floating Instruction / Status Chip on Map */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3.5 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur-md border border-slate-800 shadow-md">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            <span>Tap anywhere on the map or drag the pin to position</span>
          </div>
        </div>

        {/* Bottom Floating GPS Floating Action Button on mobile */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={gpsDetecting}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 hover:bg-indigo-500 transition active-press border border-indigo-400/40"
            title="Snap to Current GPS"
          >
            {gpsDetecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Selected Location Summary Info Card */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Selected Map Pin Location</span>
                {geocoding && (
                  <span className="flex items-center gap-1 text-[10px] text-indigo-300">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    resolving address...
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {selectedAddress || 'Address will automatically update as you move the pin on the map.'}
              </p>
            </div>
          </div>

          {currentCoords && (
            <div className="hidden sm:flex flex-col items-end text-[11px] text-slate-400 shrink-0 font-mono">
              <span>Lng: {currentCoords.lng.toFixed(4)}</span>
              <span>Lat: {currentCoords.lat.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
