import React, { useState } from 'react';
import { ConfiguredReader, ReaderManufacturer, ReaderStatus } from '../types';
import Modal from './Modal';
import { PlusCircleIcon } from './icons';
import { createControlidApi } from '../services/controlidApi';

interface SettingsPageProps {
  appName: string;
  setAppName: React.Dispatch<React.SetStateAction<string>>;
  appLogo: string | null;
  setAppLogo: React.Dispatch<React.SetStateAction<string | null>>;
  configuredReaders: ConfiguredReader[];
  setConfiguredReaders: React.Dispatch<React.SetStateAction<ConfiguredReader[]>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ appName, setAppName, appLogo, setAppLogo, configuredReaders, setConfiguredReaders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddReader = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReader: ConfiguredReader = {
      id: `cr-${Date.now()}`,
      name: formData.get('name') as string,
      manufacturer: formData.get('manufacturer') as ReaderManufacturer,
      ip: formData.get('ip') as string,
      port: parseInt(formData.get('port') as string, 10),
      status: 'disconnected',
      username: (formData.get('username') as string) || undefined,
      password: (formData.get('password') as string) || undefined,
    };
    setConfiguredReaders(prev => [...prev, newReader]);
    setIsModalOpen(false);
  };
  
  const handleTestConnection = async (readerId: string) => {
    setConfiguredReaders(prev => prev.map(r => r.id === readerId ? {...r, status: 'testing'} : r));
    
    const reader = configuredReaders.find(r => r.id === readerId);
    if (!reader) return;

    // Se for ControlID, usa a API real
    if (reader.manufacturer === 'ControlID') {
      try {
        const api = createControlidApi(
          reader.ip,
          reader.port,
          reader.username,
          reader.password
        );
        
        const result = await api.testConnection();
        
        setConfiguredReaders(prev => prev.map(r => {
          if (r.id === readerId) {
            return {...r, status: result.success ? 'connected' : 'failed'};
          }
          return r;
        }));

        // Se falhou, mostra o erro no console (pode ser melhorado com um toast/notificação)
        if (!result.success) {
          console.error(`Erro ao conectar com ${reader.name}:`, result.error);
        }
      } catch (error: any) {
        console.error(`Erro ao testar conexão com ${reader.name}:`, error);
        setConfiguredReaders(prev => prev.map(r => {
          if (r.id === readerId) {
            return {...r, status: 'failed'};
          }
          return r;
        }));
      }
    } else {
      // Para outros fabricantes (como Acura), mantém a simulação por enquanto
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% de chance de sucesso
        setConfiguredReaders(prev => prev.map(r => {
          if (r.id === readerId) {
            return {...r, status: success ? 'connected' : 'failed'};
          }
          return r;
        }));
      }, 2000);
    }
  };

  const statusIndicator = (status: ReaderStatus) => {
    switch (status) {
      case 'connected':
        return <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" title="Conectado"></div>;
      case 'failed':
        return <div className="w-3 h-3 rounded-full bg-red-500" title="Falha na conexão"></div>;
      case 'testing':
        return <div className="w-3 h-3 rounded-full bg-yellow-500 animate-spin" title="Testando..."></div>;
      case 'disconnected':
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-500" title="Desconectado"></div>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-white h-full flex flex-col space-y-8">
      <h1 className="text-3xl font-bold">Configurações (Desenvolvedor)</h1>

      {/* Seção de Personalização */}
      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 border-b border-slate-600 pb-2">Personalização</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-gray-300 mb-1">Nome do Software</label>
            <input 
              id="appName"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Logo da Empresa</label>
            <div className="flex items-center space-x-4">
              {appLogo && <img src={appLogo} alt="Logo" className="h-12 w-12 object-contain rounded-md bg-slate-700 p-1" />}
              <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoChange} className="hidden" />
              <label htmlFor="logo-upload" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
                  Fazer Upload
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Seção de Leitores */}
      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
        <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
            <h2 className="text-xl font-semibold">Leitores e Antenas (Conexão Real)</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                <PlusCircleIcon />
                <span>Adicionar Leitor</span>
            </button>
        </div>
        <div className="space-y-3">
          {configuredReaders.map(reader => (
            <div key={reader.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {statusIndicator(reader.status)}
                <div>
                  <p className="font-bold">{reader.name} <span className="text-xs font-normal text-gray-400">({reader.manufacturer})</span></p>
                  <p className="text-sm text-gray-400">{reader.ip}:{reader.port}</p>
                </div>
              </div>
              <button 
                onClick={() => handleTestConnection(reader.id)}
                disabled={reader.status === 'testing'}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1 px-3 rounded-lg text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {reader.status === 'testing' ? 'Testando...' : 'Testar'}
              </button>
            </div>
          ))}
          {configuredReaders.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum leitor configurado.</p>}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Leitor">
        <form onSubmit={handleAddReader} className="space-y-4">
          <input name="name" type="text" placeholder="Nome (Ex: Antena Porta 1)" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
          <select name="manufacturer" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
            <option value="Acura">Acura</option>
            <option value="ControlID">ControlID</option>
          </select>
          <input name="ip" type="text" placeholder="Endereço IP" required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
          <input name="port" type="number" placeholder="Porta (padrão: 80)" defaultValue={80} required className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
          <input name="username" type="text" placeholder="Usuário (opcional, padrão: admin)" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
          <input name="password" type="password" placeholder="Senha (opcional)" className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"/>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Salvar Leitor</button>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
