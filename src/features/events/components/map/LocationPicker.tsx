import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
    latitude: number;
    longitude: number;
    location: string;
    onLocationChange: (data: {
        latitude: number;
        longitude: number;
        location: string;
    }) => void;
}

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
}

// Fix for default marker icon in Leaflet with Vite
const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Componente para manejar clicks en el mapa
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export const LocationPicker = ({ latitude, longitude, location, onLocationChange }: LocationPickerProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [position, setPosition] = useState<LatLng>(new LatLng(latitude, longitude));
    const searchTimeoutRef = useRef<NodeJS.Timeout>();

    // Búsqueda de direcciones con debounce
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        // Limpiar timeout anterior
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Hacer búsqueda después de 500ms de no escribir
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=cl&limit=5`
                );
                const data = await response.json();
                setSearchResults(data);
                setShowResults(true);
            } catch (error) {
                console.error('Error searching location:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Actualizar ubicación desde coordenadas (reverse geocoding)
    const updateLocationFromCoords = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            onLocationChange({
                latitude: lat,
                longitude: lng,
                location: address,
            });
            setSearchQuery(address);
        } catch (error) {
            console.error('Error getting address:', error);
            onLocationChange({
                latitude: lat,
                longitude: lng,
                location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            });
        }
    };

    // Manejar selección de resultado de búsqueda
    const handleSelectResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setPosition(new LatLng(lat, lng));
        setSearchQuery(result.display_name);
        setShowResults(false);

        onLocationChange({
            latitude: lat,
            longitude: lng,
            location: result.display_name,
        });
    };

    // Manejar click en el mapa
    const handleMapClick = (lat: number, lng: number) => {
        setPosition(new LatLng(lat, lng));
        updateLocationFromCoords(lat, lng);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#c9c4d8' }}>
                📍 Ubicación del Evento
            </label>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Busca una dirección (ej: Teatro Universidad de Concepción)"
                    style={{
                        width: '100%',
                        padding: '12px 40px 12px 12px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#f0f0f5',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#9b6ef0';
                        searchResults.length > 0 && setShowResults(true);
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                        setTimeout(() => setShowResults(false), 200);
                    }}
                />

                {isSearching && (
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '3px solid rgba(255,255,255,0.12)',
                            borderTop: '3px solid #9b6ef0',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                    </div>
                )}

                {/* Resultados de búsqueda */}
                {showResults && searchResults.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#14121f',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    }}>
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                onMouseDown={() => handleSelectResult(result)}
                                style={{
                                    padding: '12px',
                                    cursor: 'pointer',
                                    borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ fontSize: '14px', color: '#e6e6f0' }}>
                                    {result.display_name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mapa interactivo */}
            <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                height: '300px',
            }}>
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    key={`${position.lat}-${position.lng}`}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position} icon={customIcon} />
                    <MapClickHandler onLocationSelect={handleMapClick} />
                </MapContainer>
            </div>

            <p style={{
                fontSize: '12px',
                color: '#7c7790',
                marginTop: '8px',
                fontStyle: 'italic',
            }}>
                💡 Tip: Busca una dirección arriba o haz click en el mapa para seleccionar la ubicación
            </p>

            <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
        </div>
    );
};