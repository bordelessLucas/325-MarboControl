import { useState, useEffect, useCallback } from 'react';
import { ConfiguredReader, Tag } from '../types';
import { createControlidApi, ControlidUser } from '../services/controlidApi';

interface UseControlidReadersOptions {
  configuredReaders: ConfiguredReader[];
  enabled?: boolean;
  pollingInterval?: number; // em milissegundos
}

interface UseControlidReadersResult {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  refreshTags: () => Promise<void>;
}

/**
 * Hook para buscar tags/usuários dos leitores Controlid configurados
 */
export function useControlidReaders({
  configuredReaders,
  enabled = true,
  pollingInterval = 5000, // 5 segundos por padrão
}: UseControlidReadersOptions): UseControlidReadersResult {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTagsFromReaders = useCallback(async () => {
    if (!enabled || configuredReaders.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allUsers: ControlidUser[] = [];
      const controlidReaders = configuredReaders.filter(
        r => r.manufacturer === 'ControlID' && r.status === 'connected'
      );

      // Busca usuários de todos os leitores Controlid conectados
      for (const reader of controlidReaders) {
        try {
          const api = createControlidApi(
            reader.ip,
            reader.port,
            reader.username,
            reader.password
          );

          const result = await api.getUsers(100, 0);
          
          if (result.success && result.data) {
            // Adiciona informações do leitor aos usuários
            const usersWithReader = result.data.map(user => ({
              ...user,
              readerId: reader.id,
              readerName: reader.name,
            }));
            allUsers.push(...usersWithReader);
          }
        } catch (err: any) {
          console.error(`Erro ao buscar usuários do leitor ${reader.name}:`, err);
        }
      }

      // Converte os usuários da Controlid para o formato de Tag do sistema
      const convertedTags: Tag[] = allUsers.map((user, index) => {
        // Usa o PIS como tag_number, ou gera um ID se não houver
        const tagNumber = user.pis || user.id?.toString() || `tag-${index}`;
        
        return {
          id: `controlid-${user.id || index}`,
          tag_number: tagNumber,
          name: user.name || `Usuário ${user.id || index}`,
          job_title: user.registration || 'Não especificado',
          status: 'absent', // Status inicial, será atualizado pelos eventos
          muster_station_id: null, // Precisa ser mapeado manualmente ou por configuração
        };
      });

      setTags(convertedTags);
    } catch (err: any) {
      setError(`Erro ao buscar tags: ${err.message}`);
      console.error('Erro ao buscar tags dos leitores:', err);
    } finally {
      setIsLoading(false);
    }
  }, [configuredReaders, enabled]);

  // Busca inicial
  useEffect(() => {
    if (enabled) {
      fetchTagsFromReaders();
    }
  }, [enabled, fetchTagsFromReaders]);

  // Polling para atualizar tags periodicamente
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchTagsFromReaders();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enabled, pollingInterval, fetchTagsFromReaders]);

  return {
    tags,
    isLoading,
    error,
    refreshTags: fetchTagsFromReaders,
  };
}

/**
 * Hook para buscar eventos recentes dos leitores Controlid
 */
export function useControlidEvents({
  configuredReaders,
  enabled = true,
  pollingInterval = 3000, // 3 segundos para eventos
  onEvent?: (event: any) => void,
}: {
  configuredReaders: ConfiguredReader[];
  enabled?: boolean;
  pollingInterval?: number;
  onEvent?: (event: any) => void;
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!enabled || configuredReaders.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allEvents: any[] = [];
      const controlidReaders = configuredReaders.filter(
        r => r.manufacturer === 'ControlID' && r.status === 'connected'
      );

      for (const reader of controlidReaders) {
        try {
          const api = createControlidApi(
            reader.ip,
            reader.port,
            reader.username,
            reader.password
          );

          const result = await api.getEvents(50, 0);
          
          if (result.success && result.data) {
            const eventsWithReader = result.data.map(event => ({
              ...event,
              readerId: reader.id,
              readerName: reader.name,
            }));
            allEvents.push(...eventsWithReader);
          }
        } catch (err: any) {
          console.error(`Erro ao buscar eventos do leitor ${reader.name}:`, err);
        }
      }

      // Ordena eventos por timestamp (mais recentes primeiro)
      allEvents.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      setEvents(allEvents);

      // Chama callback para novos eventos
      if (onEvent && allEvents.length > 0) {
        allEvents.forEach(event => onEvent(event));
      }
    } catch (err: any) {
      setError(`Erro ao buscar eventos: ${err.message}`);
      console.error('Erro ao buscar eventos dos leitores:', err);
    } finally {
      setIsLoading(false);
    }
  }, [configuredReaders, enabled, onEvent]);

  useEffect(() => {
    if (enabled) {
      fetchEvents();
    }
  }, [enabled, fetchEvents]);

  useEffect(() => {
    if (!enabled || pollingInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchEvents();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enabled, pollingInterval, fetchEvents]);

  return {
    events,
    isLoading,
    error,
    refreshEvents: fetchEvents,
  };
}

