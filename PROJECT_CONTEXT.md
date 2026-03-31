# Acervo TV - Contexto Completo do Projeto

## 📋 Resumo Executivo

**Projeto:** Acervo TV - Catálogo de Conteúdo Televisivo
**Objetivo:** Sistema web para importação, catalogação e gerenciamento de vídeos televisivos
**Status:** ✅ Funcional e em produção
**Domínio:** https://acervotv-dxwledug.manus.space
**Versão Atual:** 80f39d91

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Banco de Dados:** MySQL/TiDB (gerenciado pelo Manus)
- **Autenticação:** OAuth Manus (Google, Microsoft, Facebook, Apple)
- **Hospedagem:** Manus (incluído)

### Estrutura de Diretórios
```
/home/ubuntu/acervo_tv_web/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principais (Home.tsx, Admin.tsx)
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── ImportPanel.tsx      # Drag & drop para importação
│   │   │   ├── AdminPanel.tsx       # Painel de administração
│   │   │   ├── ThemeToggle.tsx      # Toggle escuro/claro
│   │   │   └── VideoForm.tsx        # Formulário de vídeos
│   │   ├── contexts/         # React contexts (ThemeContext)
│   │   ├── hooks/            # Custom hooks (useAuth)
│   │   ├── lib/trpc.ts       # Cliente tRPC
│   │   └── index.css         # Estilos globais (Century Gothic)
│   └── index.html            # HTML principal
├── server/                    # Backend Node.js
│   ├── routers.ts            # Procedures tRPC
│   ├── db.ts                 # Query helpers
│   ├── auth.logout.test.ts   # Testes de autenticação
│   ├── import.test.ts        # Testes de importação
│   ├── video.test.ts         # Testes de vídeos
│   └── _core/                # Framework interno (não editar)
├── drizzle/
│   └── schema.ts             # Schema do banco de dados
├── shared/
│   └── const.ts              # Constantes compartilhadas
└── todo.md                   # Rastreamento de tarefas
```

---

## 🎯 Funcionalidades Implementadas

### 1. **Importação de Vídeos** ✅
- **Fluxo:** Drag & drop → Diálogos sequenciais (HD, Canal, Tipo) → Importação
- **Validação:** Formato PROGRAMA DD-MM-YYYY.mp4
- **Armazenamento:** Banco de dados MySQL
- **Testes:** 8 testes de validação de nome de arquivo

### 2. **Catálogo de Vídeos** ✅
- **Busca:** Por nome do programa
- **Filtros:** Canal, Tipo de Programa, Número do HD, Data (De/Até)
- **Paginação:** 50 itens por página
- **Ordenação:** Por programa, data, canal ou data de criação

### 3. **Painel de Administração** ✅
- **Gerenciamento de Usuários:** Criar, editar, deletar
- **Permissões:** Sistema de roles (admin/user)
- **Convites:** Enviar convites para novos usuários
- **Senhas Mestras:** Proteção adicional para admins

### 4. **Exportação em PDF** ✅
- **Conteúdo:** Lista de vídeos com filtros aplicados
- **Formato:** PDF com cabeçalho e rodapé

### 5. **Tema Escuro/Claro** ✅
- **Toggle:** Botão de lua/sol no header
- **Persistência:** Salvo em localStorage
- **Fonte:** Century Gothic como padrão

### 6. **Autenticação OAuth** ✅
- **Provedores:** Google, Microsoft, Facebook, Apple
- **Logout:** Botão "Sair" com redirecionamento para login
- **Sessão:** Automática após 3 minutos de inatividade

---

## 📊 Schema do Banco de Dados

### Tabelas Principais

**users**
- id (PK)
- openId, name, email, loginMethod
- role (enum: admin | user)
- masterPassword (opcional, para admins)
- createdAt, updatedAt, lastSignedIn

**videos**
- id (PK)
- programName, broadcastDate, channel
- hdNumber, programType
- createdBy (FK → users.id)
- createdAt, updatedAt

**userPermissions**
- id (PK)
- userId (FK → users.id)
- permissionLevel (enum: view | edit | admin)
- grantedBy (FK → users.id)
- createdAt

**userInvitations**
- id (PK)
- email, token
- createdBy (FK → users.id)
- expiresAt, acceptedAt

**programSchedule**
- id (PK)
- programName, daysOfWeek (JSON)
- expectedFrequency

**importAlerts**
- id (PK)
- programName, alertType
- details (JSON)
- createdAt

---

## 🔧 Procedimentos tRPC Disponíveis

### Auth Router
- `auth.me` - Obter usuário atual
- `auth.logout` - Fazer logout
- `auth.setMasterPassword` - Definir senha mestra

### Video Router
- `video.create` - Criar novo vídeo
- `video.getById` - Obter vídeo por ID
- `video.update` - Atualizar vídeo
- `video.delete` - Deletar vídeo
- `video.search` - Buscar vídeos com filtros
- `video.getAllForExport` - Obter todos para exportação PDF

### User Router
- `user.list` - Listar usuários
- `user.create` - Criar novo usuário
- `user.update` - Atualizar usuário
- `user.delete` - Deletar usuário

### Import Router
- `import.validateFilename` - Validar nome de arquivo

---

## 🐛 Bugs Corrigidos

| Bug | Solução | Status |
|-----|---------|--------|
| Botão "Importar" desabilitado sem feedback | Adicionado alerta visual para campos obrigatórios | ✅ |
| Fluxo de importação confuso | Refatorado com diálogos sequenciais (HD, Canal, Tipo) | ✅ |
| Erro FORBIDDEN no painel admin | Usuário promovido para role admin | ✅ |
| Botão "Sair" não funcionava | Adicionado redirecionamento com window.location.href | ✅ |
| Erro de useAuth duplicado | Removido import duplicado no Admin.tsx | ✅ |
| 11 erros de TypeScript | Corrigidos todos os erros de tipo | ✅ |

---

## 📝 Validações Implementadas

### Validação de Nome de Arquivo
```
Padrão: PROGRAMA DD-MM-YYYY.mp4
Exemplos válidos:
- Jornal Nacional 31-03-2026.mp4
- Novela das 8 15-01-2020.mp4
- Globo Esporte 01-12-2024.mp4

Validações:
✅ Formato correto (espaço entre programa e data)
✅ Data válida (dia 01-31, mês 01-12, ano 4 dígitos)
✅ Extensão .mp4
✅ Sem caracteres especiais inválidos
```

### Validação de Campos Obrigatórios
- Número do HD: Inteiro positivo
- Canal: String não vazia (máx 100 caracteres)
- Tipo de Programa: Enum (Telejornal, Novela, Série, Variedade)
- Programa: String não vazia (máx 255 caracteres)
- Data: Formato DD/MM/YYYY

---

## 🧪 Testes Automatizados

**Total:** 23 testes passando

### server/import.test.ts (8 testes)
- ✅ Validação de formato correto
- ✅ Rejeição de formatos inválidos
- ✅ Validação de dia (01-31)
- ✅ Validação de mês (01-12)
- ✅ Tratamento de espaços e maiúsculas

### server/video.test.ts (14 testes)
- ✅ Criar vídeo
- ✅ Buscar vídeos com filtros
- ✅ Atualizar vídeo
- ✅ Deletar vídeo
- ✅ Validações de entrada

### server/auth.logout.test.ts (1 teste)
- ✅ Logout limpa cookie de sessão

---

## 🚀 Como Executar Localmente

```bash
# Instalar dependências
cd /home/ubuntu/acervo_tv_web
pnpm install

# Executar servidor de desenvolvimento
pnpm dev

# Executar testes
pnpm test

# Build para produção
pnpm build
```

---

## 🔐 Variáveis de Ambiente

Gerenciadas automaticamente pelo Manus:
- `DATABASE_URL` - Conexão com banco de dados
- `JWT_SECRET` - Chave para assinar cookies
- `VITE_APP_ID` - ID da aplicação OAuth
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL` - URL do portal de login
- `OWNER_OPEN_ID`, `OWNER_NAME` - Informações do proprietário
- `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` - APIs internas

---

## 📋 Tarefas Pendentes (Próximas Melhorias)

- [ ] Reutilização automática de HD/Canal por programa
- [ ] Validação de duplicatas (mesmo programa + data)
- [ ] Dashboard de estatísticas (total vídeos, programas, espaço)
- [ ] Histórico de importações (quem, quando, quantos)
- [ ] Notificações em tempo real para alertas
- [ ] Busca avançada com filtros complexos
- [ ] Integração com S3 para armazenamento de vídeos

---

## 🎨 Design & Branding

- **Fonte Principal:** Century Gothic (Raleway fallback)
- **Tema:** Suporta claro e escuro
- **Cores:** Definidas em `client/src/index.css`
- **Componentes UI:** shadcn/ui (Button, Card, Dialog, Input, etc)

---

## 📞 Contato & Suporte

**Projeto:** acervo_tv_web
**Domínio:** https://acervotv-dxwledug.manus.space
**Versão Atual:** 80f39d91
**Última Atualização:** 31/03/2026

Para continuar desenvolvendo:
1. Acesse https://manus.im
2. Faça login
3. Abra o projeto "acervo_tv_web"
4. Clique em "Preview" para ver o site
5. Faça as alterações desejadas

---

## 🔍 Checklist de Verificação

Antes de fazer alterações, verifique:
- [ ] Todos os 23 testes passam (`pnpm test`)
- [ ] Sem erros de TypeScript (`pnpm tsc --noEmit`)
- [ ] Servidor rodando sem erros (`pnpm dev`)
- [ ] Banco de dados acessível
- [ ] Autenticação OAuth funcionando
- [ ] Botão "Sair" redireciona para login
- [ ] Importação com diálogos sequenciais funcionando
- [ ] Tema escuro/claro alternando corretamente

---

**Documento criado em:** 31/03/2026
**Versão:** 1.0
**Status:** ✅ Completo e Funcional
