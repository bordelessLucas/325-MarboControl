import React, { useState, useMemo } from 'react';
import { Tag, MusterStation, HistoryLog } from '../types';
import { PlayIcon, StopIcon, CheckCircleIcon, ExclamationIcon, DownloadIcon } from './icons';

// Add a declaration for the jsPDF library loaded from CDN
declare global {
    interface Window {
        jspdf: any;
    }
}

const HistoryEventItem: React.FC<{ log: HistoryLog }> = ({ log }) => {
    const getEventDetails = () => {
        switch (log.type) {
            case 'simulation-start':
                return {
                    icon: <PlayIcon className="w-6 h-6 text-green-400" />,
                    title: 'Simulado Iniciado',
                    description: `O simulado de emergência começou para este ponto de encontro.`,
                    bgColor: 'bg-green-500/10'
                };
            case 'simulation-end':
                return {
                    icon: <StopIcon className="w-6 h-6 text-red-400" />,
                    title: 'Simulado Finalizado',
                    description: `O simulado de emergência foi encerrado.`,
                    bgColor: 'bg-red-500/10'
                };
            case 'check-in':
                return {
                    icon: <CheckCircleIcon className="w-6 h-6 text-blue-400" />,
                    title: 'Check-in Realizado',
                    description: `${log.tag_name} (${log.tag_number}) chegou ao ponto de encontro.`,
                    bgColor: 'bg-blue-500/10'
                };
            case 'wrong-location-check-in':
                 return {
                    icon: <ExclamationIcon className="w-6 h-6 text-yellow-400" />,
                    title: 'Alerta: Local Incorreto',
                    description: `${log.tag_name} fez check-in aqui, mas seu ponto é ${log.original_muster_station_name || 'outro'}.`,
                    bgColor: 'bg-yellow-500/10'
                };
            default:
                return {
                    icon: null,
                    title: 'Evento Desconhecido',
                    description: '',
                    bgColor: 'bg-gray-700'
                };
        }
    };

    const { icon, title, description, bgColor } = getEventDetails();

    return (
        <li className={`flex items-start space-x-4 p-4 rounded-lg ${bgColor}`}>
            <div className="flex-shrink-0 mt-1">{icon}</div>
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-300">{description}</p>
            </div>
        </li>
    );
};


interface HistoryPageProps {
  tags: Tag[];
  musterStations: MusterStation[];
  historyLogs: HistoryLog[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ tags, musterStations, historyLogs }) => {
  const [activeTab, setActiveTab] = useState<'tag' | 'muster_point'>('muster_point');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(tags.length > 0 ? tags[0].id : null);
  const [selectedMusterPointId, setSelectedMusterPointId] = useState<string | null>(musterStations.length > 0 ? musterStations[0].id : null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD format


  const filteredLogs = useMemo(() => {
    const logsOnSelectedDate = historyLogs.filter(log => {
        if (!selectedDate) return true;
        const logDateStr = new Date(log.timestamp).toLocaleDateString('en-CA');
        return logDateStr === selectedDate;
    });

    if (activeTab === 'tag') {
        return selectedTagId ? logsOnSelectedDate.filter(log => log.tag_id === selectedTagId) : [];
    }
    
    if (activeTab === 'muster_point') {
        return selectedMusterPointId ? logsOnSelectedDate.filter(log => log.muster_station_id === selectedMusterPointId) : [];
    }

    return [];
  }, [activeTab, selectedTagId, selectedMusterPointId, selectedDate, historyLogs]);

  const sortedLogs = useMemo(() => 
    [...filteredLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [filteredLogs]
  );

  const getLogDescription = (log: HistoryLog): string => {
    switch (log.type) {
        case 'simulation-start': return `O simulado de emergência começou.`;
        case 'simulation-end': return `O simulado de emergência foi encerrado.`;
        case 'check-in': return `${log.tag_name} (${log.tag_number}) chegou ao ponto de encontro.`;
        case 'wrong-location-check-in': return `${log.tag_name} fez check-in aqui, mas seu ponto correto é ${log.original_muster_station_name || 'outro'}.`;
        default: return 'Detalhes do evento não especificados.';
    }
  };
  
  const handleDownloadCSV = () => {
    const headers = ["Data/Hora", "Tipo de Evento", "Ponto de Encontro", "Nome do Colaborador", "Nº da Tag", "Detalhes"];
    const rows = sortedLogs.map(log => {
        const row = [
            `"${new Date(log.timestamp).toLocaleString()}"`,
            `"${log.type}"`,
            `"${log.muster_station_name}"`,
            `"${log.tag_name || 'N/A'}"`,
            `"${log.tag_number || 'N/A'}"`,
            `"${getLogDescription(log).replace(/"/g, '""')}"`
        ];
        return row.join(',');
    });
  
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `historico_${activeTab}_${selectedDate}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadPDF = () => {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      console.error("jsPDF not loaded!");
      alert("Erro ao gerar PDF. A biblioteca não foi carregada.");
      return;
    }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
    const title = `Relatório de Histórico - ${new Date(selectedDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
    const selection = activeTab === 'muster_point' 
      ? musterStations.find(s => s.id === selectedMusterPointId)?.name
      : tags.find(t => t.id === selectedTagId)?.name;
  
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Filtro: ${activeTab === 'muster_point' ? 'Ponto de Encontro' : 'Tag'} - ${selection || 'N/A'}`, 14, 30);
  
    doc.autoTable({
      startY: 35,
      head: [['Data/Hora', 'Ponto', 'Evento', 'Detalhes']],
      body: sortedLogs.map(log => [
        new Date(log.timestamp).toLocaleString('pt-BR'),
        log.muster_station_name,
        log.type,
        getLogDescription(log)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 78, 99] }, // Cor ciano escuro
    });
  
    const fileName = `historico_${activeTab}_${selectedDate}.pdf`;
    doc.save(fileName);
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-white">Histórico de Movimentações</h1>

      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('muster_point')}
          className={`py-2 px-4 text-lg font-medium transition-colors ${
            activeTab === 'muster_point'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Histórico por Ponto de Encontro
        </button>
        <button
          onClick={() => setActiveTab('tag')}
          className={`py-2 px-4 text-lg font-medium transition-colors ${
            activeTab === 'tag'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Histórico por Tag
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow flex flex-col">
        {/* FILTERS & ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-700 items-end">
            {/* Selector Dropdown */}
            <div className="lg:col-span-1">
                {activeTab === 'tag' ? (
                     <div>
                        <label htmlFor="tag-select" className="block text-sm font-medium text-gray-300 mb-2">Selecione a Tag</label>
                        <select
                        id="tag-select"
                        value={selectedTagId || ''}
                        onChange={(e) => setSelectedTagId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name} ({tag.tag_number})</option>)}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="muster-point-select" className="block text-sm font-medium text-gray-300 mb-2">Selecione o Ponto de Encontro</label>
                        <select
                        id="muster-point-select"
                        value={selectedMusterPointId || ''}
                        onChange={(e) => setSelectedMusterPointId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {musterStations.map(station => <option key={station.id} value={station.id}>{station.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

             {/* Date Picker */}
            <div className="lg:col-span-1">
                <label htmlFor="date-select" className="block text-sm font-medium text-gray-300 mb-2">Selecione a Data</label>
                <input 
                    type="date" 
                    id="date-select"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Download Buttons */}
            <div className="lg:col-span-1 flex items-center space-x-2">
                <button
                    onClick={handleDownloadPDF}
                    disabled={sortedLogs.length === 0}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    title="Baixar relatório em PDF"
                >
                    <DownloadIcon />
                    <span>PDF</span>
                </button>
                <button
                    onClick={handleDownloadCSV}
                    disabled={sortedLogs.length === 0}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    title="Baixar dados em formato Excel (.csv)"
                >
                    <DownloadIcon />
                    <span>Excel</span>
                </button>
            </div>
        </div>


        <div className="mt-2 flex-grow overflow-y-auto pr-2">
          <ul className="space-y-3">
             {sortedLogs.length > 0 ? (
                sortedLogs.map(log => <HistoryEventItem key={log.id} log={log} />)
            ) : (
              <p className="text-center text-gray-400 mt-8">Nenhum histórico encontrado para a seleção atual.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;