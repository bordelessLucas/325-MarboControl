
import React from 'react';
import { MusterStation, Tag } from '../types';
import { UsersIcon, MapPinIcon, PlayIcon, StopIcon } from './icons'; 

const SummaryCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
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

const MusterPointCard: React.FC<{ station: MusterStation, tags: Tag[], onClick: () => void, isSimulationActive: boolean }> = ({ station, tags, onClick, isSimulationActive }) => {
    const presentCount = tags.filter(t => t.status === 'present' && t.current_muster_station_id === station.id).length;
    const absentCount = tags.filter(t => t.muster_station_id === station.id && t.status === 'absent').length;
    
    const isComplete = presentCount === station.expected_count && absentCount === 0 && station.expected_count > 0;

    let cardColor = 'bg-slate-700';
    if (isSimulationActive) {
        cardColor = isComplete ? 'bg-blue-600' : 'bg-red-600';
    }

    return (
        <div onClick={onClick} className={`${cardColor} text-white p-4 rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-all duration-300`}>
            <div className="flex items-center space-x-2 mb-3">
                <MapPinIcon className="w-5 h-5" />
                <h3 className="font-bold">{station.name}</h3>
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Esperado:</span><span>{station.expected_count}</span></div>
                <div className="flex justify-between"><span>Presentes:</span><span>{presentCount}</span></div>
                {isSimulationActive && <div className="flex justify-between"><span>Ausentes:</span><span>{absentCount}</span></div>}
            </div>
            {isSimulationActive && (
                <>
                    <hr className="my-2 border-white/20" />
                    <p className="text-xs text-center">{isComplete ? 'Todos chegaram!' : `${absentCount} ausente(s)`}</p>
                </>
            )}
        </div>
    )
}

interface DashboardPageProps {
  stations: MusterStation[];
  tags: Tag[];
  onStationClick: (station: MusterStation) => void;
  isSimulationActive: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ stations, tags, onStationClick, isSimulationActive, onStartSimulation, onStopSimulation }) => {
    const automaticStations = stations.filter(s => s.operation_mode === 'automatic');
    const associatedTags = tags.filter(t => automaticStations.some(s => s.id === t.muster_station_id));

    const totalPeople = associatedTags.length;
    const totalPresent = isSimulationActive ? associatedTags.filter(t => t.status === 'present' && t.current_muster_station_id).length : 0;
    const totalAbsent = totalPeople - totalPresent;
    
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard title="Total de Pessoas" value={totalPeople} icon={<UsersIcon />} colorClass="bg-blue-500/80" />
                <SummaryCard title="Presentes" value={isSimulationActive ? totalPresent : '—'} icon={<UsersIcon />} colorClass="bg-green-500/80" />
                {isSimulationActive && <SummaryCard title="Ausentes" value={totalAbsent} icon={<UsersIcon />} colorClass="bg-red-500/80" />}
                
                <div className={`flex items-center justify-center ${isSimulationActive ? 'lg:col-start-4' : 'lg:col-start-3 lg:col-span-2'}`}>
                    {!isSimulationActive ? (
                        <button onClick={onStartSimulation} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors text-lg">
                            <PlayIcon />
                            <span>Iniciar Simulado</span>
                        </button>
                    ) : (
                         <button onClick={onStopSimulation} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors text-lg">
                            <StopIcon />
                            <span>Parar Simulado</span>
                        </button>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Pontos de Encontro (Emergência)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {automaticStations.map(station => (
                        <MusterPointCard
                            key={station.id}
                            station={station}
                            tags={tags}
                            onClick={() => onStationClick(station)}
                            isSimulationActive={isSimulationActive}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
