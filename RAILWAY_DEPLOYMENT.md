# 🚀 Guia de Deployment no Railway

## Resumo
Este guia explica como fazer o deploy do Acervo TV no Railway com estabilidade 24/7.

---

## 📋 Pré-requisitos
- ✅ Conta no Railway criada (delatimmarlon@gmail.com)
- ✅ Conta no GitHub (para conectar o repositório)
- ✅ Projeto pronto para deploy

---

## 🎯 Passo a Passo - Deployment

### **Passo 1: Conectar Repositório GitHub**

1. Acesse o Railway: https://railway.app
2. Clique em **"Novo projeto"**
3. Escolha **"Repositório GitHub"**
4. Selecione o repositório `acervo_tv_web`
5. Clique em **"Deploy"**

**Tempo:** ~2 minutos

---

### **Passo 2: Configurar Banco de Dados**

1. No Railway, clique em **"+ Add Service"**
2. Escolha **"MySQL"** (ou PostgreSQL)
3. Aguarde a criação (~1 minuto)
4. Copie a connection string

**Tempo:** ~3 minutos

---

### **Passo 3: Configurar Variáveis de Ambiente**

1. No Railway, vá para **"Variables"**
2. Adicione as seguintes variáveis:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=seu_secret_aleatorio_aqui
NODE_ENV=production
VITE_APP_ID=seu_app_id_do_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=seu_nome
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_api_key
VITE_FRONTEND_FORGE_API_KEY=sua_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

**Tempo:** ~5 minutos

---

### **Passo 4: Executar Migrations**

1. No Railway, clique em **"Deployments"**
2. Clique na última deployment
3. Abra o **"Terminal"**
4. Execute: `pnpm db:push`

**Tempo:** ~2 minutos

---

### **Passo 5: Configurar Domínio (Opcional)**

1. No Railway, vá para **"Settings"**
2. Clique em **"Add Domain"**
3. Escolha um domínio customizado ou use o gerado automaticamente

**Tempo:** ~1 minuto

---

## ✅ Verificação Final

Após o deploy, verifique:

- [ ] Site está acessível (https://seu-dominio.railway.app)
- [ ] Login funciona
- [ ] Importação de vídeos funciona
- [ ] Banco de dados está conectado
- [ ] Sem erros no console

---

## 🔧 Troubleshooting

### Erro: "Database connection failed"
**Solução:** Verifique se `DATABASE_URL` está correto em Variables

### Erro: "Build failed"
**Solução:** Verifique os logs no Railway → Deployments → Build Logs

### Site está lento
**Solução:** Aumente o tamanho da instância em Settings → Plan

---

## 📊 Monitoramento

No Railway, você pode:
- Ver logs em tempo real
- Monitorar uso de CPU/Memória
- Ver histórico de deployments
- Configurar alertas

---

## 💰 Custo Estimado

Para 2 horas/dia de uso:
- **Railway:** $0-3/mês (com $5 grátis)
- **Domínio:** ~$10/ano (opcional)
- **Total:** ~$0/mês

---

## 🚀 Próximos Passos

1. Fazer o primeiro deploy
2. Testar todas as funcionalidades
3. Configurar domínio customizado
4. Monitorar performance

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique os logs no Railway
2. Consulte a documentação: https://docs.railway.app
3. Me contacte para ajuda

---

**Documento criado em:** 02/04/2026
**Status:** ✅ Pronto para Deploy
