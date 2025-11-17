
import React, { useState, useMemo } from 'react';
import { MusterStation, Tag } from '../types';
import Modal from './Modal';
import { ExclamationIcon, SearchIcon } from './icons';

const DetailCard = ({ title, value, colorClass, onClick, isActive }: { title: string, value: number, colorClass: string, onClick?: () => void, isActive?: boolean }) => (
    <div 
        className={`flex-1 p-3 rounded-md text-center ${colorClass} ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${isActive ? 'ring-2 ring-white' : ''} transition-all`}
        onClick={onClick}
    >
        <p className="text-sm text-white/80">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const PersonRow: React.FC<{ tag: Tag, statusOverride?: 'present' | 'absent' }> = ({ tag, statusOverride }) => {
    const status = statusOverride || tag.status;
    const isPresent = status === 'present';
    const bgColor = isPresent ? 'bg-green-500/20' : 'bg-red-500/20';
    const borderColor = isPresent ? 'border-green-500' : 'border-red-500';
    const statusColor = isPresent ? 'text-green-400' : 'text-red-400';
    const circleColor = isPresent ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${borderColor} ${bgColor}`}>
            <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${circleColor} flex items-center justify-center text-white font-bold text-sm`}>
                    {tag.tag_number}
                </div>
                <div>
                    <p className="font-semibold text-white">{tag.name}</p>
                    <p className="text-xs text-gray-400">{tag.job_title}</p>
                </div>
            </div>
            <p className={`font-bold text-sm ${statusColor}`}>{isPresent ? 'Presente' : 'Ausente'}</p>
        </div>
    );
};

const WrongLocationPersonRow: React.FC<{ tag: Tag, originalStationName: string | undefined }> = ({ tag, originalStationName }) => {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-500 bg-yellow-500/20">
            <div className="flex items-center space-x-3">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">
                    {tag.tag_number}
                </div>
                <div>
                    <p className="font-semibold text-white">{tag.name}</p>
                    <p className="text-xs text-yellow-300">Ponto Correto: {originalStationName || 'N/A'}</p>
                </div>
            </div>
            <p className="font-bold text-sm text-yellow-400">Local Incorreto</p>
        </div>
    );
};

type FilterType = 'all' | 'present' | 'absent' | 'wrong_location';

const MusterPointDetailModal = ({ station, tags, onClose, allStations }: { station: MusterStation, tags: Tag[], onClose: () => void, allStations: MusterStation[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    
    const {
        associatedTags,
        wrongLocationTags,
        presentTags,
        absentTags,
        presentCount,
        absentCount
    } = useMemo(() => {
        const associated = tags.filter(t => t.muster_station_id === station.id);
        const wrongLocation = tags.filter(t => t.current_muster_station_id === station.id && t.muster_station_id !== station.id);
        const present = associated.filter(t => t.status === 'present');
        const absent = associated.filter(t => t.status === 'absent');
        
        return {
            associatedTags: associated,
            wrongLocationTags: wrongLocation,
            presentTags: present,
            absentTags: absent,
            presentCount: present.length + wrongLocation.length,
            absentCount: absent.length
        };
    }, [station, tags]);
    
    const filteredAndSearchedTags = useMemo(() => {
        let list: { tag: Tag; type: FilterType }[] = [];
        if (activeFilter === 'all' || activeFilter === 'present') {
            list.push(...presentTags.map(t => ({ tag: t, type: 'present' as FilterType })));
        }
        if (activeFilter === 'all' || activeFilter === 'absent') {
            list.push(...absentTags.map(t => ({ tag: t, type: 'absent' as FilterType })));
        }
        if (activeFilter === 'all' || activeFilter === 'wrong_location') {
             list.push(...wrongLocationTags.map(t => ({ tag: t, type: 'wrong_location' as FilterType })));
        }
        
        if (!searchTerm) return list;

        return list.filter(item => 
            item.tag.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.tag.tag_number.includes(searchTerm)
        );
    }, [activeFilter, searchTerm, presentTags, absentTags, wrongLocationTags]);


    return (
        <Modal isOpen={!!station} onClose={onClose} title={station.name} size="5xl">
            <div className="flex flex-col space-y-4 max-h-[75vh]">
                {/* Summary Cards and Search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex gap-3">
                         <DetailCard title="Esperado" value={station.expected_count} colorClass="bg-slate-700" onClick={() => setActiveFilter('all')} isActive={activeFilter === 'all'} />
                        <DetailCard title="Presentes" value={presentCount} colorClass="bg-green-600/80" onClick={() => setActiveFilter('present')} isActive={activeFilter === 'present'} />
                        <DetailCard title="Ausentes" value={absentCount} colorClass="bg-red-600/80" onClick={() => setActiveFilter('absent')} isActive={activeFilter === 'absent'} />
                        {wrongLocationTags.length > 0 && <DetailCard title="Local Errado" value={wrongLocationTags.length} colorClass="bg-yellow-600/80" onClick={() => setActiveFilter('wrong_location')} isActive={activeFilter === 'wrong_location'} />}
                    </div>
                     <div className="relative flex-shrink-0 md:w-1/3">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </span>
                        <input type="text" placeholder="Pesquisar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
               
                {/* Personnel List */}
                <div className="flex-grow overflow-y-auto space-y-2 pr-2 bg-slate-900/50 p-4 rounded-lg">
                    {filteredAndSearchedTags.length === 0 && <p className="text-sm text-gray-500 text-center py-8">Nenhum colaborador encontrado para os filtros selecionados.</p>}
                    
                    {filteredAndSearchedTags.map(({ tag, type }) => {
                        if (type === 'wrong_location') {
                            const originalStation = allStations.find(s => s.id === tag.muster_station_id);
                            return <WrongLocationPersonRow key={tag.id} tag={tag} originalStationName={originalStation?.name} />;
                        }
                        return <PersonRow key={tag.id} tag={tag} statusOverride={type === 'present' ? 'present' : 'absent'} />;
                    })}
                </div>
            </div>
        </Modal>
    );
};

export default MusterPointDetailModal;
