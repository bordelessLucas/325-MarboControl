# Serviços

Esta pasta contém os serviços de integração com APIs externas.

## Controlid API

O serviço `controlidApi.ts` fornece uma interface para comunicação com dispositivos Controlid através da API REST.

### Uso Básico

```typescript
import { createControlidApi } from './services/controlidApi';

const api = createControlidApi('192.168.1.100', 80, 'admin', 'senha');

// Testar conexão
const result = await api.testConnection();
```

Veja `CONTROLID_INTEGRATION.md` para documentação completa.

