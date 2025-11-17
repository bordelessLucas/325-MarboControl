

import React, { useState, useMemo, useEffect } from 'react';
import { Tag, MusterStation, HistoryLog, Reader, Page, ReaderShape, CircleShapeConfig, RectangleShapeConfig, UserRole, ConfiguredReader } from './types';
import { UsersIcon, MapIcon, TagIcon, HistoryIcon, SettingsIcon, DashboardIcon, SearchIcon, PlusCircleIcon, WifiIcon, MapPinIcon, EyeIcon, LogoutIcon } from './components/icons';
import HistoryPage from './components/HistoryPage';
import Modal from './components/Modal';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import MonitoringDashboardPage from './components/MonitoringDashboardPage';
import MusterPointDetailModal from './components/MusterPointDetailModal';
import SettingsPage from './components/SettingsPage';
import TagManagementPage from './components/TagManagementPage';


// Mock Data - In a real app, this would come from an API
const INITIAL_STATIONS: MusterStation[] = [
    { id: 'ms1', name: 'Baleeira - Boreste', location: { x: 200, y: 150 }, expected_count: 5, operation_mode: 'automatic', auto_alert_enabled: true },
    { id: 'ms2', name: 'Baleeira - Bombordo', location: { x: 500, y: 300 }, expected_count: 4, operation_mode: 'automatic', auto_alert_enabled: true },
    { id: 'ms3', name: 'Helideck', location: { x: 700, y: 100 }, expected_count: 3, operation_mode: 'automatic', auto_alert_enabled: false },
    { id: 'ms4', name: 'Drill floor - Bombordo', location: { x: 100, y: 400 }, expected_count: 0, operation_mode: 'monitoring', auto_alert_enabled: false },
    { id: 'ms5', name: 'Drill floor - Boreste', location: { x: 300, y: 450 }, expected_count: 0, operation_mode: 'monitoring', auto_alert_enabled: false },
];

const INITIAL_TAGS: Tag[] = [
    // Boreste (5)
    { id: 't1', tag_number: '001', name: 'Victor', job_title: 'Engenheiro Chefe', status: 'absent', muster_station_id: 'ms1' },
    { id: 't2', tag_number: '002', name: 'Silva', job_title: 'Operadora de Rádio', status: 'absent', muster_station_id: 'ms1' },
    { id: 't3', tag_number: '003', name: 'Islan', job_title: 'Médico', status: 'absent', muster_station_id: 'ms1' },
    { id: 't4', tag_number: '004', name: 'Luiz', job_title: 'Piloto', status: 'absent', muster_station_id: 'ms1' },
    { id: 't5', tag_number: '005', name: 'Ingrid', job_title: 'Técnica', status: 'absent', muster_station_id: 'ms1' },
    // Bombordo (4)
    { id: 't9', tag_number: '009', name: 'Carlos', job_title: 'Mergulhador', status: 'absent', muster_station_id: 'ms2' },
    { id: 't10', tag_number: '010', name: 'Mariana', job_title: 'Geóloga', status: 'absent', muster_station_id: 'ms2' },
    { id: 't11', tag_number: '011', name: 'Pedro', job_title: 'Técnico de Segurança', status: 'absent', muster_station_id: 'ms2' },
    { id: 't12', tag_number: '012', name: 'Sofia', job_title: 'Cozinheira', status: 'absent', muster_station_id: 'ms2' },
    // Helideck (3)
    { id: 't6', tag_number: '006', name: 'Dário', job_title: 'Supervisor', status: 'absent', muster_station_id: 'ms3' },
    { id: 't7', tag_number: '007', name: 'Eliane', job_title: 'Enfermeira', status: 'absent', muster_station_id: 'ms3' },
    { id: 't8', tag_number: '008', name: 'Arthur', job_title: 'Comandante', status: 'absent', muster_station_id: 'ms3' },
    // Drill Floor (monitoring)
    { id: 't13', tag_number: '013', name: 'Rafael', job_title: 'Sondador', status: 'present', muster_station_id: 'ms4', current_muster_station_id: 'ms4' },
    { id: 't14', tag_number: '014', name: 'Joana', job_title: 'Sondadora', status: 'present', muster_station_id: 'ms5', current_muster_station_id: 'ms5' },
    // Unassigned
    { id: 't15', tag_number: '015', name: 'Bruno', job_title: 'Eletricista', status: 'absent', muster_station_id: null },
];

const INITIAL_HISTORY: HistoryLog[] = [];

const INITIAL_READERS: Reader[] = [
    { id: 'r1', name: 'Antena Helideck', location: { x: 700, y: 100 }, shapeConfig: { shape: 'circle', radius: 75 } },
    { id: 'r2', name: 'Antena Boreste', location: { x: 200, y: 150 }, shapeConfig: { shape: 'circle', radius: 100 } },
];

// --- COMPONENTS ---

interface MapEditorProps {
    stations: MusterStation[];
    setStations: React.Dispatch<React.SetStateAction<MusterStation[]>>;
    readers: Reader[];
    setReaders: React.Dispatch<React.SetStateAction<Reader[]>>;
    mapImageUrl: string | null;
    setMapImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

const MapEditor: React.FC<MapEditorProps> = ({ stations, setStations, readers, setReaders, mapImageUrl, setMapImageUrl }) => {
    const [stationModalOpen, setStationModalOpen] = useState(false);
    const [readerModalOpen, setReaderModalOpen] = useState(false);
    const [placementMode, setPlacementMode] = useState<'station' | 'reader' | null>(null);
    const [lastClickCoords, setLastClickCoords] = useState<{ x: number; y: number } | null>(null);
    const mapContainerRef = React.useRef<HTMLDivElement>(null);
    const [readerShape, setReaderShape] = useState<ReaderShape>('circle');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMapImageUrl(URL.createObjectURL(file));
        }
    };
    
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!placementMode || !mapContainerRef.current) return;

        const rect = mapContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setLastClickCoords({ x, y });

        if (placementMode === 'station') {
            setStationModalOpen(true);
        } else if (placementMode === 'reader') {
            setReaderShape('circle'); // Reset to default when opening
            setReaderModalOpen(true);
        }
        setPlacementMode(null); // Reset mode after click
    };
    
    const handleAddStation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!lastClickCoords) return;
        
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const expected_count_str = formData.get('expected_count') as string;
        const operation_mode = formData.get('operation_mode') as 'automatic' | 'monitoring';
        
        const expected_count = operation_mode === 'automatic' ? parseInt(expected_count_str, 10) : 0;

        if (name) {
            const newStation: MusterStation = {
                id: `ms-${Date.now()}`,
                name,
                expected_count,
                operation_mode,
                auto_alert_enabled: formData.get('auto_alert_enabled') === 'on',
                location: lastClickCoords
            };
            setStations(prev => [...prev, newStation]);
            setStationModalOpen(false);
        }
    };

    const handleAddReader = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!lastClickCoords) return;
    
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const shape = formData.get('shape') as ReaderShape;
    
        let shapeConfig: CircleShapeConfig | RectangleShapeConfig;
    
        if (shape === 'circle') {
            const radius = parseInt(formData.get('radius') as string, 10);
            if (radius <= 0) return;
            shapeConfig = { shape: 'circle', radius };
        } else { // rectangle
            const width = parseInt(formData.get('width') as string, 10);
            const height = parseInt(formData.get('height') as string, 10);
            const rotation = parseInt(formData.get('rotation') as string, 10) || 0;
            if (width <= 0 || height <= 0) return;
            shapeConfig = { shape: 'rectangle', width, height, rotation };
        }
    
        if (name) {
            const newReader: Reader = {
                id: `r-${Date.now()}`,
                name,
                location: lastClickCoords,
                shapeConfig,
            };
            setReaders(prev => [...prev, newReader]);
            setReaderModalOpen(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-white h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-4">Editor de Mapa</h1>
            <div className="flex items-center space-x-4 mb-4">
                <input type="file" id="map-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                <label htmlFor="map-upload" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors">Carregar Mapa</label>
                <button onClick={() => setPlacementMode('station')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
                    <MapPinIcon />
                    <span>Adicionar Ponto de Encontro</span>
                </button>
                 <button onClick={() => setPlacementMode('reader')} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
                    <WifiIcon />
                    <span>Adicionar Antena/Leitor</span>
                </button>
            </div>
            <div ref={mapContainerRef} onClick={handleMapClick} className="flex-grow bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-crosshair overflow-hidden relative" style={{ backgroundImage: `url(${mapImageUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
                {!mapImageUrl && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Faça o upload de uma imagem do mapa para começar.</div>}
                {stations.map(station => (
                    <div key={station.id} style={{ left: station.location.x - 12, top: station.location.y - 24 }} className="absolute text-blue-400" title={station.name}>
                        <MapPinIcon className="w-6 h-6" />
                    </div>
                ))}
                 {readers.map(reader => {
                    const style: React.CSSProperties = {
                        position: 'absolute',
                        borderColor: 'rgba(0, 188, 212, 0.7)',
                        backgroundColor: 'rgba(0, 188, 212, 0.2)',
                    };

                    if (reader.shapeConfig.shape === 'circle') {
                        const { radius } = reader.shapeConfig;
                        style.left = reader.location.x - radius;
                        style.top = reader.location.y - radius;
                        style.width = radius * 2;
                        style.height = radius * 2;
                        style.borderRadius = '50%';
                        style.borderWidth = '2px';
                    } else { // rectangle
                        const { width, height, rotation } = reader.shapeConfig;
                        style.left = reader.location.x - width / 2;
                        style.top = reader.location.y - height / 2;
                        style.width = width;
                        style.height = height;
                        style.transform = `rotate(${rotation}deg)`;
                        style.borderWidth = '2px';
                    }

                    return <div key={reader.id} style={style} title={reader.name}></div>;
                })}
            </div>

            {/* Station Modal */}
            <Modal isOpen={stationModalOpen} onClose={() => setStationModalOpen(false)} title="Adicionar Ponto de Encontro">
                <form onSubmit={handleAddStation} className="space-y-4">
                    <input name="name" type="text" placeholder="Nome do Ponto" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Modo de Operação</label>
                        <select name="operation_mode" defaultValue="automatic" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                            <option value="automatic">Automático (Contagem de Emergência)</option>
                            <option value="monitoring">Monitoramento (Controle de Área)</option>
                        </select>
                    </div>
                    {/* These fields will be dependent on operation_mode */}
                    <input name="expected_count" type="number" placeholder="Nº de Pessoas Esperadas" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    <div className="flex items-center">
                        <input name="auto_alert_enabled" type="checkbox" id="auto_alert" className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" />
                        <label htmlFor="auto_alert" className="ml-2 block text-sm text-gray-300">Habilitar Alerta Automático</label>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar</button>
                </form>
            </Modal>

             {/* Reader Modal */}
             <Modal isOpen={readerModalOpen} onClose={() => setReaderModalOpen(false)} title="Adicionar Antena/Leitor">
                <form onSubmit={handleAddReader} className="space-y-4">
                    <input name="name" type="text" placeholder="Nome da Antena" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Formato da Área</label>
                        <select name="shape" value={readerShape} onChange={e => setReaderShape(e.target.value as ReaderShape)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                            <option value="circle">Círculo</option>
                            <option value="rectangle">Retângulo</option>
                        </select>
                    </div>
                    {readerShape === 'circle' ? (
                        <input name="radius" type="number" placeholder="Raio (em pixels)" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                    ) : (
                        <>
                            <input name="width" type="number" placeholder="Largura (em pixels)" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                            <input name="height" type="number" placeholder="Altura (em pixels)" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                            <input name="rotation" type="number" placeholder="Rotação (em graus, opcional)" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
                        </>
                    )}
                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar</button>
                </form>
            </Modal>
        </div>
    );
};


const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<UserRole | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
    const [musterStations, setMusterStations] = useState<MusterStation[]>(INITIAL_STATIONS);
    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(INITIAL_HISTORY);
    const [readers, setReaders] = useState<Reader[]>(INITIAL_READERS);
    const [mapImageUrl, setMapImageUrl] = useState<string | null>('/map-placeholder.png'); // Default placeholder
    const [selectedMusterStation, setSelectedMusterStation] = useState<MusterStation | null>(null);
    
    // Settings state
    const [appName, setAppName] = useState('Marbo Control');
    const [appLogo, setAppLogo] = useState<string | null>('/logo-placeholder.svg');
    const [configuredReaders, setConfiguredReaders] = useState<ConfiguredReader[]>([]);


    const [isSimulationActive, setIsSimulationActive] = useState(false);
    const simulationIntervalRef = React.useRef<number | null>(null);

    const emergencyStations = useMemo(() => musterStations.filter(s => s.operation_mode === 'automatic'), [musterStations]);
    const emergencyTags = useMemo(() => tags.filter(t => emergencyStations.some(s => s.id === t.muster_station_id)), [tags, emergencyStations]);

    const startSimulation = () => {
        const simulationStartTime = new Date().toISOString();
        const startLogs: HistoryLog[] = emergencyStations.map(station => ({
            id: `h-${Date.now()}-start-${station.id}`,
            timestamp: simulationStartTime,
            type: 'simulation-start',
            muster_station_id: station.id,
            muster_station_name: station.name,
        }));
        setHistoryLogs(prev => [...prev, ...startLogs]);

        setTags(currentTags =>
            currentTags.map(tag => ({ ...tag, status: 'absent', current_muster_station_id: null }))
        );
        setIsSimulationActive(true);

        const absentEmergencyTags = [...emergencyTags].sort(() => 0.5 - Math.random());

        let i = 0;
        simulationIntervalRef.current = window.setInterval(() => {
            if (i < absentEmergencyTags.length) {
                const tagToUpdate = absentEmergencyTags[i];
                const isWrongLocation = Math.random() < 0.15; // 15% chance to go to the wrong station
                
                let targetStationId = tagToUpdate.muster_station_id;
                let targetStation = musterStations.find(s => s.id === targetStationId);

                if (isWrongLocation && tagToUpdate.muster_station_id) {
                    const otherStations = emergencyStations.filter(s => s.id !== tagToUpdate.muster_station_id);
                    if (otherStations.length > 0) {
                        targetStation = otherStations[Math.floor(Math.random() * otherStations.length)];
                        targetStationId = targetStation.id;
                    }
                }

                if (targetStationId && targetStation) {
                    setTags(currentTags =>
                        currentTags.map(t =>
                            t.id === tagToUpdate.id
                                ? { ...t, status: 'present', current_muster_station_id: targetStationId }
                                : t
                        )
                    );

                    const originalStation = musterStations.find(s => s.id === tagToUpdate.muster_station_id);
                    const logType = isWrongLocation && targetStationId !== tagToUpdate.muster_station_id ? 'wrong-location-check-in' : 'check-in';
                    
                    const newLog: HistoryLog = {
                        id: `h-${Date.now()}-${tagToUpdate.id}`,
                        timestamp: new Date().toISOString(),
                        type: logType,
                        muster_station_id: targetStationId,
                        muster_station_name: targetStation.name,
                        tag_id: tagToUpdate.id,
                        tag_name: tagToUpdate.name,
                        tag_number: tagToUpdate.tag_number,
                        original_muster_station_name: logType === 'wrong-location-check-in' ? originalStation?.name : undefined
                    };
                    setHistoryLogs(prev => [...prev, newLog]);
                }
                
                i++;
            } else {
                if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            }
        }, 1500);
    };

    const stopSimulation = () => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        setIsSimulationActive(false);

        const simulationEndTime = new Date().toISOString();
        const endLogs: HistoryLog[] = emergencyStations.map(station => ({
            id: `h-${Date.now()}-end-${station.id}`,
            timestamp: simulationEndTime,
            type: 'simulation-end',
            muster_station_id: station.id,
            muster_station_name: station.name,
        }));
        setHistoryLogs(prev => [...prev, ...endLogs]);

        setTags(INITIAL_TAGS); 
    };
    
    useEffect(() => {
      return () => {
        if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
        }
      };
    }, []);

    const handleLogin = (role: UserRole) => {
        setIsAuthenticated(role);
        setCurrentPage('dashboard');
    };

    const handleLogout = () => {
        setIsAuthenticated(null);
    }

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage stations={musterStations} tags={tags} onStationClick={setSelectedMusterStation} isSimulationActive={isSimulationActive} onStartSimulation={startSimulation} onStopSimulation={stopSimulation} />;
            case 'monitoring_dashboard':
                return <MonitoringDashboardPage stations={musterStations} tags={tags} onStationClick={setSelectedMusterStation} />;
            case 'map':
                return <MapEditor stations={musterStations} setStations={setMusterStations} readers={readers} setReaders={setReaders} mapImageUrl={mapImageUrl} setMapImageUrl={setMapImageUrl}/>;
            case 'tags':
                return <TagManagementPage tags={tags} setTags={setTags} musterStations={musterStations} setMusterStations={setMusterStations} />;
            case 'history':
                return <HistoryPage tags={tags} musterStations={musterStations} historyLogs={historyLogs} />;
            case 'settings':
                return <SettingsPage appName={appName} setAppName={setAppName} appLogo={appLogo} setAppLogo={setAppLogo} configuredReaders={configuredReaders} setConfiguredReaders={setConfiguredReaders} />;
            default:
                return <DashboardPage stations={musterStations} tags={tags} onStationClick={setSelectedMusterStation} isSimulationActive={isSimulationActive} onStartSimulation={startSimulation} onStopSimulation={stopSimulation} />;
        }
    }

    const NavItem = ({ page, icon, children }: { page: Page, icon: React.ReactNode, children: React.ReactNode }) => (
        <button onClick={() => setCurrentPage(page)} className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors ${currentPage === page ? 'bg-blue-600/30 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
            {icon}
            <span className="font-medium">{children}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-slate-800">
            <aside className="w-64 bg-slate-900 text-white p-4 flex flex-col space-y-2 border-r border-slate-700">
                <div className="flex items-center space-x-2 p-3 mb-4">
                    {appLogo ? <img src={appLogo} alt="Logo" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 bg-slate-700 rounded-md"></div>}
                    <h1 className="text-xl font-bold">{appName}</h1>
                </div>

                {/* FIX: Added missing children props to NavItem components. */}
                <NavItem page="dashboard" icon={<DashboardIcon />}>Dashboard de Emergência</NavItem>
                <NavItem page="monitoring_dashboard" icon={<EyeIcon />}>Monitoramento</NavItem>
                <NavItem page="tags" icon={<TagIcon />}>Gerenciar Pessoal</NavItem>
                <NavItem page="history" icon={<HistoryIcon />}>Histórico</NavItem>

                <div className="pt-4 mt-auto border-t border-slate-700 space-y-2">
                    {isAuthenticated === 'dev' && (
                        <>
                            <NavItem page="map" icon={<MapIcon />}>Editor de Mapa</NavItem>
                            <NavItem page="settings" icon={<SettingsIcon />}>Configurações</NavItem>
                        </>
                    )}
                     <button onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors hover:bg-gray-700 text-gray-400">
                        <LogoutIcon />
                        <span className="font-medium">Sair</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderPage()}
            </main>
            {selectedMusterStation && (
                <MusterPointDetailModal 
                    station={selectedMusterStation}
                    tags={tags}
                    onClose={() => setSelectedMusterStation(null)}
                    allStations={musterStations}
                />
            )}
        </div>
    );
}

export default App;