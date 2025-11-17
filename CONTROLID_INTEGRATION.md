# Integração com API Controlid

Este documento descreve como usar a integração com a API da Controlid no projeto Marbo Control.

## Visão Geral

A integração permite conectar leitores RFID da Controlid ao sistema, permitindo:
- Testar conexões com dispositivos Controlid
- Buscar usuários/tags cadastrados nos leitores
- Monitorar eventos de acesso em tempo real
- Sincronizar dados entre os leitores e o sistema

## Configuração

### 1. Adicionar um Leitor Controlid

1. Acesse a página de **Configurações** (apenas para usuários com perfil "dev")
2. Na seção "Leitores e Antenas", clique em **Adicionar Leitor**
3. Preencha os campos:
   - **Nome**: Nome descritivo do leitor (ex: "Antena Porta Principal")
   - **Fabricante**: Selecione "ControlID"
   - **Endereço IP**: IP do dispositivo Controlid na rede
   - **Porta**: Porta HTTP do dispositivo (padrão: 80)
   - **Usuário**: Usuário para autenticação (opcional, padrão: "admin")
   - **Senha**: Senha para autenticação (opcional)

### 2. Testar Conexão

Após adicionar um leitor, clique no botão **Testar** para verificar se a conexão está funcionando. O sistema irá:
- Autenticar no dispositivo
- Obter informações do dispositivo
- Atualizar o status do leitor (conectado/falha)

## Uso Programático

### Serviço de API

O serviço `ControlidApi` fornece métodos para interagir com a API da Controlid:

```typescript
import { createControlidApi } from './services/controlidApi';

// Criar instância da API
const api = createControlidApi('192.168.1.100', 80, 'admin', 'senha123');

// Testar conexão
const result = await api.testConnection();
if (result.success) {
  console.log('Conexão estabelecida!');
}

// Buscar usuários
const usersResult = await api.getUsers(100, 0);
if (usersResult.success && usersResult.data) {
  console.log('Usuários encontrados:', usersResult.data);
}

// Buscar eventos
const eventsResult = await api.getEvents(50, 0);
if (eventsResult.success && eventsResult.data) {
  console.log('Eventos encontrados:', eventsResult.data);
}
```

### Hooks React

#### useControlidReaders

Hook para buscar tags/usuários dos leitores configurados:

```typescript
import { useControlidReaders } from './hooks/useControlidReaders';

function MyComponent() {
  const { tags, isLoading, error, refreshTags } = useControlidReaders({
    configuredReaders: readers,
    enabled: true,
    pollingInterval: 5000, // Atualiza a cada 5 segundos
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {tags.map(tag => (
        <div key={tag.id}>{tag.name} - {tag.tag_number}</div>
      ))}
    </div>
  );
}
```

#### useControlidEvents

Hook para monitorar eventos em tempo real:

```typescript
import { useControlidEvents } from './hooks/useControlidReaders';

function MyComponent() {
  const { events, isLoading, error } = useControlidEvents({
    configuredReaders: readers,
    enabled: true,
    pollingInterval: 3000, // Atualiza a cada 3 segundos
    onEvent: (event) => {
      console.log('Novo evento:', event);
      // Processar evento (ex: atualizar status de tag)
    },
  });

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>
          {event.timestamp} - {event.pis}
        </div>
      ))}
    </div>
  );
}
```

## Endpoints da API Controlid

A integração utiliza os seguintes endpoints da API Controlid:

- `POST /login.fcgi` - Autenticação
- `GET /get_config.fcgi` - Obter informações do dispositivo
- `GET /get_users.fcgi` - Listar usuários/tags
- `GET /get_events.fcgi` - Listar eventos de acesso
- `GET /get_user.fcgi` - Buscar usuário específico por PIS
- `GET /logout.fcgi` - Encerrar sessão

## Documentação Oficial

Para mais informações sobre a API da Controlid, consulte:
- [Documentação Oficial da API](https://www.controlid.com.br/docs/access-api-pt/)
- [Exemplos de Código](https://github.com/controlid/access-api-examples)

## Notas Importantes

1. **CORS**: Se estiver desenvolvendo localmente, pode ser necessário configurar um proxy ou usar CORS no dispositivo Controlid
2. **Autenticação**: A sessão é gerenciada automaticamente pelo serviço
3. **Polling**: Os hooks usam polling para atualizar dados. Ajuste o intervalo conforme necessário
4. **Erros**: Erros de conexão são tratados e exibidos no console. Considere implementar notificações visuais

## Exemplo de Integração Completa

```typescript
import { useControlidReaders, useControlidEvents } from './hooks/useControlidReaders';
import { ConfiguredReader, Tag } from './types';

function App() {
  const [readers, setReaders] = useState<ConfiguredReader[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Buscar tags dos leitores
  const { tags: controlidTags, refreshTags } = useControlidReaders({
    configuredReaders: readers.filter(r => r.status === 'connected'),
    enabled: true,
    pollingInterval: 5000,
  });

  // Monitorar eventos
  useControlidEvents({
    configuredReaders: readers.filter(r => r.status === 'connected'),
    enabled: true,
    pollingInterval: 3000,
    onEvent: (event) => {
      // Atualizar status das tags baseado nos eventos
      console.log('Evento recebido:', event);
    },
  });

  // Sincronizar tags quando houver atualizações
  useEffect(() => {
    if (controlidTags.length > 0) {
      setTags(prevTags => {
        // Merge lógica aqui
        return controlidTags;
      });
    }
  }, [controlidTags]);

  return (
    // Seu componente
  );
}
```

