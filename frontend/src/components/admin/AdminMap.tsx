import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { adminService } from '../../services/api';
import { EcosystemBadge, Modal, ModalFooter } from '../ui';
import Button from '../common/Button';

interface MapRegion {
    id: string;
    name: string;
    type: string;
    coordinates: [number, number];
    stats: {
        area: string;
        health: string;
        carbon: string;
    };
    images: string[];
    documents: {
        type: string;
        name: string;
        url: string | null;
    }[];
}

// Component to fix map sizing issues
const MapController = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
};

const AdminMap: React.FC = () => {
    const [regions, setRegions] = useState<MapRegion[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null);
    const [showDataModal, setShowDataModal] = useState(false);

    useEffect(() => {
        loadMapData();
    }, []);

    const loadMapData = async () => {
        try {
            const data = await adminService.getMapData();
            setRegions(data);
        } catch (error) {
            console.error("Failed to load map data");
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'MANGROVE': return '#059669'; // kelp-600
            case 'SEAGRASS': return '#0891b2'; // ocean-600
            case 'SALT_MARSH': return '#4f46e5'; // coastal-600
            default: return '#64748b';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Coastal Ecosystem Map</h2>
                    <p className="text-slate-600 dark:text-slate-400">Interactive view of NCCR monitored regions</p>
                </div>
                <div className="flex gap-2">
                    {['MANGROVE', 'SEAGRASS', 'SALT_MARSH'].map(type => (
                        <div key={type} className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(type) }} />
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                                {type.replace('_', ' ').toLowerCase()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-[600px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg relative z-0">
                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <MapController />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {regions.map((region) => (
                        <CircleMarker
                            key={region.id}
                            center={region.coordinates}
                            pathOptions={{
                                color: getColor(region.type),
                                fillColor: getColor(region.type),
                                fillOpacity: 0.6,
                                weight: 2
                            }}
                            radius={20}
                            eventHandlers={{
                                click: () => setSelectedRegion(region),
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-lg mb-1">{region.name}</h3>
                                    <EcosystemBadge ecosystem={region.type} />
                                    <div className="mt-3 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Area:</span>
                                            <span className="font-medium">{region.stats.area}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Health:</span>
                                            <span className="font-medium text-green-600">{region.stats.health}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Carbon:</span>
                                            <span className="font-medium">{region.stats.carbon}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full mt-3"
                                        onClick={() => {
                                            setSelectedRegion(region);
                                            setShowDataModal(true);
                                        }}
                                    >
                                        View Drone Data
                                    </Button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>

            {/* Drone Data Modal */}
            {showDataModal && selectedRegion && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowDataModal(false)}
                    title={`Drone Data: ${selectedRegion.name}`}
                    size="lg"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Aerial Imagery</h4>
                                {selectedRegion.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt="Aerial view"
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Drone & LiDAR Data</h4>
                                    <div className="space-y-2">
                                        {selectedRegion.documents.filter(d => d.type === 'DRONE_DATA').length > 0 ? (
                                            selectedRegion.documents.filter(d => d.type === 'DRONE_DATA').map((doc, idx) => (
                                                <a
                                                    key={idx}
                                                    href={doc.url || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 hover:border-ocean-500 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">🚁</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{doc.name}</span>
                                                    </div>
                                                    <span className="text-xs text-ocean-600 dark:text-ocean-400 group-hover:underline">Download</span>
                                                </a>
                                            ))
                                        ) : (
                                            <div className="h-16 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center text-slate-500 text-sm">
                                                No drone data available
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Technical Reports</h4>
                                    <div className="space-y-2">
                                        {selectedRegion.documents.filter(d => d.type === 'REPORT').length > 0 ? (
                                            selectedRegion.documents.filter(d => d.type === 'REPORT').map((doc, idx) => (
                                                <a
                                                    key={idx}
                                                    href={doc.url || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 hover:border-ocean-500 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">📄</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{doc.name}</span>
                                                    </div>
                                                    <span className="text-xs text-ocean-600 dark:text-ocean-400 group-hover:underline">View</span>
                                                </a>
                                            ))
                                        ) : (
                                            <div className="h-16 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center text-slate-500 text-sm">
                                                No reports available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-ocean-50 dark:bg-ocean-900/20 rounded-xl border border-ocean-100 dark:border-ocean-800">
                            <h4 className="font-bold text-ocean-900 dark:text-ocean-100 mb-2">Analysis Report</h4>
                            <p className="text-sm text-ocean-800 dark:text-ocean-200">
                                Real-time monitoring active. Showing verification data stored on IPFS.
                            </p>
                        </div>
                    </div>
                    <ModalFooter>
                        <Button onClick={() => setShowDataModal(false)}>Close</Button>
                    </ModalFooter>
                </Modal>
            )}
        </div>
    );
};

export default AdminMap;
