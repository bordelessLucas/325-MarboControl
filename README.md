<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Marbo Control

Sistema interativo 2D para monitoramento em tempo real da localização e presença de pessoal em pontos de encontro (muster stations) em ambientes offshore e onshore.

## Funcionalidades

- Dashboard de emergência com monitoramento em tempo real
- Gerenciamento de pontos de encontro e estações
- Gerenciamento de pessoal e tags RFID
- Histórico de eventos e check-ins
- Editor de mapa interativo
- **Integração com leitores Controlid** (RFID)

## Integração com Controlid

O sistema suporta integração com leitores RFID da Controlid. Veja a [documentação completa da integração](CONTROLID_INTEGRATION.md) para mais detalhes.

### Configuração Rápida

1. Acesse **Configurações** (perfil dev)
2. Adicione um leitor Controlid com IP, porta e credenciais
3. Teste a conexão
4. Os dados serão sincronizados automaticamente

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (se aplicável)
3. Run the app:
   ```bash
   npm run dev
   ```

## Documentação

- [Integração Controlid](CONTROLID_INTEGRATION.md) - Guia completo de integração com leitores Controlid
- [Documentação da API Controlid](https://www.controlid.com.br/docs/access-api-pt/) - Documentação oficial da API
