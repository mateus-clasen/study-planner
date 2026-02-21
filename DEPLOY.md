# 🚀 Guia de Deploy: My Study Planner (AlmaLinux 9.7)

Este guia explica como hospedar o projeto em seu servidor doméstico AlmaLinux, utilizando **PM2** para manter o processo rodando e **Nginx** como Proxy Reverso.

## 1. Preparação do Servidor

Acesse seu servidor via SSH e instale as dependências básicas:

```bash
# Atualizar sistema
sudo dnf update -y

# Instalar Node.js 20 (ou superior) via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Instalar Git
sudo dnf install -y git

# Instalar PM2 globalmente
sudo npm install -g pm2
```

## 2. Clonagem e Instalação

Escolha uma pasta (ex: `/var/www/study-planner`) e clone o projeto:

```bash
sudo mkdir -p /var/www/study-planner
sudo chown $USER:$USER /var/www/study-planner
cd /var/www/study-planner

# Clone o seu repositório (ou copie os arquivos)
# git clone <seu-repo> .

# Instalar dependências
npm install
```

## 3. Configuração de Ambiente

Crie o arquivo `.env` de produção:

```bash
nano .env
```

Cole o conteúdo abaixo (ajuste conforme necessário):

```env
DATABASE_URL="file:./dev.db"
N8N_WEBHOOK_URL="https://seu-n8n.dominio.com/webhook/gerar-plano"
JWT_SECRET="GERAR_UMA_CHAVE_ALEATORIA_LONGA_AQUI"
NODE_ENV="production"
```

Gere o banco de dados e prepare o build:

```bash
# Gerar Prisma Client e migrar banco
npx prisma generate
npx prisma migrate deploy

# Gerar o Build do Next.js
npm run build
```

## 4. Manter o Sistema Rodando (PM2)

Use o PM2 para garantir que o site reinicie sozinho se o servidor cair:

```bash
# Iniciar o projeto
pm2 start npm --name "study-planner" -- start

# Configurar para iniciar no boot do sistema
pm2 save
pm2 startup
# (Siga o comando sudo que o PM2 vai imprimir na tela)
```

## 5. Configuração do NGINX (Proxy Reverso)

Crie um arquivo de configuração para o site:

```bash
sudo nano /etc/nginx/conf.d/studyplanner.conf
```

Configuração sugerida:

```nginx
server {
    listen 80;
    server_name seu-dominio.com; # Ou o IP do servidor

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Teste e reinicie o Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Firewall (AlmaLinux)

Se o site não abrir, libere as portas no firewall:

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

### 💡 Dicas Importantes:
- **N8N**: Lembre-se que o workflow no N8N deve estar com o botão **"Active"** ligado para receber as requisições de produção.
- **SSL**: Para HTTPS, recomendo usar o `certbot`: `sudo dnf install certbot python3-certbot-nginx -y && sudo certbot --nginx`.
- **.env e Segurança**: O Next.js "embute" a chave `JWT_SECRET` dentro do sistema no momento em que você roda o `npm run build`. Se você alterar a senha/segredo no arquivo `.env` no futuro, **obrigatoriamente** rode o `npm run build` e reinicie o PM2 novamente para a alteração valer.
