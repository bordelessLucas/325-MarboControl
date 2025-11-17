import React, { useState, useMemo } from 'react';
import { Tag, MusterStation } from '../types';
import { SearchIcon, PlusCircleIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from './icons';
import Modal from './Modal';

interface TagManagementPageProps {
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  musterStations: MusterStation[];
  setMusterStations: React.Dispatch<React.SetStateAction<MusterStation[]>>;
}

const TagManagementPage: React.FC<TagManagementPageProps> = ({ tags, setTags, musterStations, setMusterStations }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'byMusterPoint'>('all');
  const [modalTag, setModalTag] = useState<Tag | 'new' | null>(null); // 'new' for add, object for edit
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMusterStationId, setSelectedMusterStationId] = useState<string | null>(null);

  const filteredTags = useMemo(() =>
    tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.tag_number.toLowerCase().includes(searchTerm.toLowerCase())
    ), [tags, searchTerm]);

  const handleSaveTag = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modalTag) return;

    const formData = new FormData(e.currentTarget);
    const tagData = {
      tag_number: formData.get('tag_number') as string,
      name: formData.get('name') as string,
      job_title: formData.get('job_title') as string,
      muster_station_id: (formData.get('muster_station_id') as string) || null,
    };

    if (modalTag === 'new') {
      const newTag: Tag = {
        id: `t-${Date.now()}`,
        status: 'absent',
        ...tagData
      };
      setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setTags(prev => prev.map(t => t.id === modalTag.id ? { ...t, ...tagData } : t));
    }
    setModalTag(null);
  };
  
  const handleExpectedCountChange = (stationId: string, newCountStr: string) => {
    const newCount = parseInt(newCountStr, 10);
    setMusterStations(prevStations =>
      prevStations.map(station =>
        station.id === stationId
          ? { ...station, expected_count: isNaN(newCount) ? 0 : newCount }
          : station
      )
    );
  };

  const handleRemoveTagFromStation = (tagId: string) => {
    setTags(prev => prev.map(t => t.id === tagId ? {...t, muster_station_id: null} : t));
  };
  
  const handleAddTagToStation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagId = formData.get('tag_id') as string;
    if (tagId && selectedMusterStationId) {
        setTags(prev => prev.map(t => t.id === tagId ? {...t, muster_station_id: selectedMusterStationId} : t));
        e.currentTarget.reset();
    }
  };

  const selectedMusterStation = useMemo(() => 
    musterStations.find(s => s.id === selectedMusterStationId), 
  [musterStations, selectedMusterStationId]);

  const unassignedTags = useMemo(() => 
    tags.filter(t => t.muster_station_id === null), 
  [tags]);

  const TabButton = ({ tabName, currentTab, setTab, children }: { tabName: 'all' | 'byMusterPoint', currentTab: string, setTab: (tab: 'all' | 'byMusterPoint') => void, children: React.ReactNode }) => (
    <button
      onClick={() => setTab(tabName)}
      className={`py-2 px-4 text-lg font-medium transition-colors ${
        currentTab === tabName
          ? 'border-b-2 border-blue-500 text-blue-400'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-white">Gerenciar Pessoal e Tags</h1>

      {/* FIX: Added missing children props to TabButton components to provide text labels for tabs. */}
      <div className="flex border-b border-gray-700 mb-6">
        <TabButton tabName="all" currentTab={activeTab} setTab={setActiveTab}>Todos os Colaboradores</TabButton>
        <TabButton tabName="byMusterPoint" currentTab={activeTab} setTab={setActiveTab}>Por Ponto de Encontro</TabButton>
      </div>

      {activeTab === 'all' && (
        <>
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input type="text" placeholder="Pesquisar por nome ou tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setModalTag('new')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
              <PlusCircleIcon />
              <span>Adicionar</span>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto bg-slate-800 p-4 rounded-lg">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr className="border-b border-slate-600">
                  <th className="p-3">Nome</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Nº da Tag</th>
                  <th className="p-3">Ponto de Encontro</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map(tag => {
                    const station = musterStations.find(s => s.id === tag.muster_station_id);
                    return (
                        <tr key={tag.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="p-3">{tag.name}</td>
                            <td className="p-3 text-gray-400">{tag.job_title}</td>
                            <td className="p-3"><span className="bg-slate-600 text-xs font-semibold px-2 py-1 rounded-full">{tag.tag_number}</span></td>
                            <td className="p-3 text-gray-400">{station ? station.name : 'N/A'}</td>
                            <td className="p-3 text-center">
                                <button onClick={() => setModalTag(tag)} className="text-blue-400 hover:text-blue-300"><PencilIcon className="w-5 h-5" /></button>
                            </td>
                        </tr>
                    )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'byMusterPoint' && (
        <div className="flex-grow overflow-y-auto pr-2">
          {selectedMusterStation ? (
            // Detail View
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <button onClick={() => setSelectedMusterStationId(null)} className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 mb-4">
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Voltar para todos os pontos</span>
                </button>
                 <div className="flex flex-wrap justify-between items-center mb-3 border-b border-slate-600 pb-3 gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedMusterStation.name}</h3>
                    {selectedMusterStation.operation_mode === 'automatic' && (
                        <div className="flex items-center gap-2">
                            <label htmlFor={`expected-${selectedMusterStation.id}`} className="text-sm font-medium text-gray-300">Esperado:</label>
                            <input type="number" id={`expected-${selectedMusterStation.id}`} value={selectedMusterStation.expected_count} onChange={(e) => handleExpectedCountChange(selectedMusterStation.id, e.target.value)} className="w-20 bg-slate-700 border border-slate-600 rounded-md py-1 px-2 text-white text-center" min="0"/>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-300 mb-2">Pessoal Atribuído</h4>
                        <div className="space-y-2">
                            {tags.filter(t => t.muster_station_id === selectedMusterStationId).map(tag => (
                                <div key={tag.id} className="bg-slate-700 p-2 rounded-md flex justify-between items-center">
                                    <p className="text-white">{tag.name} <span className="text-gray-400 text-sm">({tag.tag_number})</span></p>
                                    <button onClick={() => handleRemoveTagFromStation(tag.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-300 mb-2 mt-4">Adicionar Colaborador</h4>
                        <form onSubmit={handleAddTagToStation} className="flex gap-2">
                            <select name="tag_id" defaultValue="" required className="flex-grow w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white">
                                <option value="" disabled>Selecione um colaborador não atribuído...</option>
                                {unassignedTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name} ({tag.tag_number})</option>)}
                            </select>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar</button>
                        </form>
                    </div>
                </div>
            </div>
          ) : (
            // List View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {musterStations.map(station => {
                const assignedCount = tags.filter(t => t.muster_station_id === station.id).length;
                return (
                  <div key={station.id} onClick={() => setSelectedMusterStationId(station.id)} className="bg-slate-800 p-4 rounded-lg border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors">
                    <h3 className="text-lg font-bold text-white truncate">{station.name}</h3>
                    <p className="text-sm text-gray-400">
                        {assignedCount} colaborador(es) atribuído(s)
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={!!modalTag} onClose={() => setModalTag(null)} title={modalTag === 'new' ? "Adicionar Colaborador" : "Editar Colaborador"}>
        <form onSubmit={handleSaveTag} className="space-y-4">
          <input name="name" type="text" placeholder="Nome Completo" required defaultValue={modalTag !== 'new' && modalTag ? modalTag.name : ''} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
          <input name="job_title" type="text" placeholder="Cargo" required defaultValue={modalTag !== 'new' && modalTag ? modalTag.job_title : ''} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
          <input name="tag_number" type="text" placeholder="Número da Tag" required defaultValue={modalTag !== 'new' && modalTag ? modalTag.tag_number : ''} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white" />
          <select name="muster_station_id" defaultValue={modalTag !== 'new' && modalTag ? modalTag.muster_station_id || '' : ''} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
            <option value="">Nenhum Ponto de Encontro</option>
            {musterStations.map(station => (
              <option key={station.id} value={station.id}>{station.name}</option>
            ))}
          </select>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
        </form>
      </Modal>
    </div>
  );
};

export default TagManagementPage;