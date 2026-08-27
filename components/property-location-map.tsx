'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useEffect } from 'react'

const markerIcon = L.divIcon({
  className: 'property-marker',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function PropertyLocationMap({ latitude, longitude, address }: { latitude: number; longitude: number; address: string }) {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = '.property-marker span{display:block;width:18px;height:18px;border-radius:999px;background:#d97706;border:4px solid white;box-shadow:0 2px 8px rgba(15,23,42,.35)}'
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  return (
    <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom={false} className="h-full min-h-72 w-full">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  )
}
