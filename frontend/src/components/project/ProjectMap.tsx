import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { StatusBadge, EcosystemBadge } from '../ui';

// Fix Leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ProjectMapProps {
    projects: any[];
    onProjectSelect: (project: any) => void;
}

const ProjectMap: React.FC<ProjectMapProps> = ({ projects, onProjectSelect }) => {
    // Default center (India center roughly)
    const center: [number, number] = [20.5937, 78.9629];
    const zoom = 5;

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 z-0 relative">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {projects.map((project) => (
                    <Marker
                        key={project.id}
                        position={[project.latitude, project.longitude]}
                        eventHandlers={{
                            click: () => onProjectSelect(project),
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                                <div className="flex gap-2 mb-2">
                                    <StatusBadge status={project.status} />
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{project.location}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold">{project.areaHectares} ha</span>
                                    <EcosystemBadge ecosystem={project.ecosystemType} />
                                </div>
                                <button
                                    className="mt-3 w-full py-1.5 bg-ocean-600 text-white rounded text-sm hover:bg-ocean-700 transition-colors"
                                    onClick={() => onProjectSelect(project)}
                                >
                                    View Details
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default ProjectMap;
