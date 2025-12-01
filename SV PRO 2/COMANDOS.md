# Comandos para Rodar o Sistema SV no Mac

## Pré-requisitos
- Node.js (v18 ou superior) ✅
- MongoDB ✅
- npm (vem com Node.js) ✅

## Passo a Passo

### 1. Iniciar o MongoDB (se não estiver rodando)

```bash
# Verificar se o MongoDB está rodando
mongosh

# Se não estiver rodando, iniciar o serviço:
brew services start mongodb-community

# Ou executar diretamente (em um terminal separado):
mongod --config /opt/homebrew/etc/mongod.conf
```

### 2. Configurar o Backend

```bash
# Navegar para a pasta do backend
cd backend

# Instalar dependências (se ainda não instalou)
npm install

# Criar arquivo .env (opcional - o sistema usa valores padrão)
# Criar arquivo .env com:
# MONGODB_URI=mongodb://localhost:27017/sv_system
# PORT=4000
# JWT_SECRET=supersecret

# Rodar o backend
npm run dev
```

O backend estará rodando em: `http://localhost:4000`

### 3. Configurar o Frontend (em outro terminal)

```bash
# Navegar para a pasta do frontend
cd frontend

# Instalar dependências (se ainda não instalou)
npm install

# Rodar o frontend
npm run dev
```

O frontend estará rodando em: `http://localhost:5173` (ou outra porta que o Vite indicar)

### 4. Acessar o Sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000

## Comandos Úteis

### Parar os serviços
- **Backend/Frontend:** `Ctrl + C` no terminal
- **MongoDB:** `brew services stop mongodb-community`

### Ver logs do MongoDB
```bash
# Ver logs do MongoDB
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

### Resetar o banco de dados
```bash
# Conectar ao MongoDB
mongosh

# Usar o banco de dados
use sv_system

# Deletar todas as coleções (cuidado!)
db.dropDatabase()
```

### Popular dados de teste (via API)
1. Faça login como mantenedor/admin
2. Acesse: Visão Geral → Popular dados de teste
3. Ou via curl:
```bash
curl -X POST http://localhost:4000/api/admin/seed/londrina \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## Estrutura de Portas

- **Frontend:** 5173 (Vite padrão)
- **Backend:** 4000
- **MongoDB:** 27017

## Troubleshooting

### Erro: "Cannot connect to MongoDB"
```bash
# Verificar se o MongoDB está rodando
brew services list | grep mongodb

# Reiniciar o MongoDB
brew services restart mongodb-community
```

### Erro: "Port already in use"
```bash
# Ver qual processo está usando a porta 4000
lsof -i :4000

# Matar o processo
kill -9 PID_DO_PROCESSO
```

### Erro: "Module not found"
```bash
# Reinstalar dependências
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## Scripts Disponíveis

### Backend
- `npm run dev` - Inicia o servidor backend

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção

