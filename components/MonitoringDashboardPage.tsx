import React from 'react';
import { MusterStation, Tag } from '../types';
import { UsersIcon, MapPinIcon } from './icons';

const SummaryCard = ({ title, value, icon, colorClass }: { title: string, value: number, icon: React.ReactNode, colorClass: string }) => (
    <div className="bg-slate-900 p-4 rounded-lg shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const MonitoringPointCard: React.FC<{ station: MusterStation, tags: Tag[], onClick: () => void }> = ({ station, tags, onClick }) => {
    const presentCount = tags.filter(t => t.status === 'present' && t.current_muster_station_id === station.id).length;

    return (
        <div onClick={onClick} className="bg-green-600/20 border border-green-500 text-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-green-600/30 transition-colors">
            <div className="flex items-center space-x-2 mb-3">
                <MapPinIcon className="w-5 h-5" />
                <h3 className="font-bold">{station.name}</h3>
            </div>
            <div className="flex justify-between items-end">
                <span className="text-sm">Presentes:</span>
                <span className="text-3xl font-bold">{presentCount}</span>
            </div>
             <hr className="my-2 border-white/10" />
             <p className="text-xs text-center text-green-300">Monitoramento Ativo</p>
        </div>
    );
};

const MonitoringDashboardPage = ({ stations, tags, onStationClick }: { stations: MusterStation[], tags: Tag[], onStationClick: (station: MusterStation) => void }) => {
    const monitoringStations = stations.filter(s => s.operation_mode === 'monitoring');
    const presentInMonitoring = tags.filter(t => monitoringStations.some(s => s.id === t.current_muster_station_id));

    const totalPresent = presentInMonitoring.length;
    const totalPeople = tags.length;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Total de Pessoas (Sistema)" value={totalPeople} icon={<UsersIcon />} colorClass="bg-blue-500/80" />
                <SummaryCard title="Presentes (Monitoramento)" value={totalPresent} icon={<UsersIcon />} colorClass="bg-green-500/80" />
            </div>

            {/* Monitoring Points Section */}
            <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Monitoramento Contínuo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monitoringStations.map(station => (
                        <MonitoringPointCard
                            key={station.id}
                            station={station}
                            tags={tags}
                            onClick={() => onStationClick(station)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MonitoringDashboardPage;