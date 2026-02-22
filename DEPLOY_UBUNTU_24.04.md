# 🚀 Guia de Deploy: My Study Planner (Ubuntu 24.04 LTS)

Este guia explica como realizar o deploy do projeto em um servidor limpo com Ubuntu 24.04, utilizando **PM2** para manter a aplicação rodando e **Nginx** como proxy reverso.

## 1. Atualização e Preparação Inicial

Acesse seu servidor via SSH e atualize os pacotes do sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

Instale as ferramentas essenciais:
```bash
sudo apt install -y curl git build-essential nginx
```

## 2. Instalação do Node.js (Versão 20)

Para rodar o Next.js, precisamos do Node.js recente:

```bash
# Adicionar repositório do NodeSource para o Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar o Node.js
sudo apt install -y nodejs

# Confirmar as versões instaladas
node -v
npm -v
```

## 3. Instalação do PM2

O PM2 é um gerenciador de processos em background que reiniciará sua aplicação automaticamente caso o servidor seja reiniciado ou o app falhe.

```bash
sudo npm install -g pm2
```

## 4. Clonagem e Configuração do Projeto

Escolha um diretório para a aplicação. Por convenção, usamos o `/var/www/`.

```bash
# Criar diretório (substitua 'study-planner' pelo nome desejado)
sudo mkdir -p /var/www/study-planner

# Garantir que seu usuário atual tenha permissão de gravar na pasta
sudo chown -R $USER:$USER /var/www/study-planner

# Acessar o diretório novo
cd /var/www/study-planner

# Clonar o repositório dentro da pasta atual (o . no final é importante)
# git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .

# Instalar as dependências do projeto
npm install
```

## 5. Configuração das Variáveis de Ambiente

Crie o arquivo `.env` para apontar as credenciais e configurações de produção:

```bash
nano .env
```

Cole este template e altere os valores necessários:

```env
DATABASE_URL="file:./dev.db"
N8N_WEBHOOK_URL="https://seu-n8n.dominio.com/webhook/gerar-plano"
JWT_SECRET="GERAR_UMA_CHAVE_ALEATORIA_MUITO_SEGURA_E_LONGA"
NODE_ENV="production"
```
*(Para salvar e sair do `nano`: pressione `Ctrl + O`, `Enter` e depois `Ctrl + X`)*

## 6. Preparação do Banco de Dados e Build

Vamos configurar o Prisma para nosso banco de dados SQLite e construir a aplicação compilada pelo Next.js:

```bash
# Gerar o cliente Prisma e aplicar as tabelas iniciais
npx prisma generate
npx prisma migrate deploy

# Compilar a aplicação para produção
npm run build
```

## 7. Iniciando a Aplicação (PM2)

Inicie o projeto usando o PM2 para que ele rode na porta 3000 em background e de forma resiliente:

```bash
pm2 start npm --name "study-planner" -- start

# Salvar o estado atual da lista de processos do PM2
pm2 save

# Configurar o PM2 para iniciar no boot do sistema operacional
pm2 startup
```
*(Execute o último comando. O PM2 irá gerar uma linha com `sudo env PATH...`. Copie e cole essa linha gerada no seu terminal e aperte Enter).*

## 8. Configuração do Proxy Reverso (Nginx)

> [!WARNING] 
> **Você usa um Painel de Servidor (como aaPanel, cPanel, CyberPanel)?**
> Se sim, **Pule esta seção inteira e a Seção 10 (SSL)**!
> Ferramentas como o aaPanel gerenciam os arquivos do Nginx e seus Certificados SSL nativamente nas próprias pastas do sistema interno. Alterar via terminal usando o passo-a-passo abaixo causará **Erro 502 Bad Gateway e colisão do Certbot** na sua URL.
> Nestes casos, vá no site do seu aaPanel -> `Website` -> Selecione o Domínio -> Abra as configurações -> Selecione `Reverse Proxy` -> e roteie a `Target URL` para `http://127.0.0.1:3000`. Depois, na aba SSL do próprio painel, ative o botão do "Let's Encrypt".

**Abaixo estão as instruções estritas apenas para Servidores Vazios e "Crus" sem interface gráfica web:**

Precisamos do Nginx para expor o servidor na porta 80 (HTTP padrão) redirecionando para nossa porta de aplicação interna 3000.

Crie um arquivo para o site:

```bash
sudo nano /etc/nginx/sites-available/studyplanner
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com; # ou preencha com o IP púbico do seu VPS

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Repassa o IP real do cliente para o app Next.js
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Ative a configuração criando um link simbólico:

```bash
sudo ln -s /etc/nginx/sites-available/studyplanner /etc/nginx/sites-enabled/

# Verificar se não há erros de sintaxe nos blocos e recarregar serviço
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Configuração do Firewall (UFW)

No Ubuntu, usamos frequentemente o UFW. Libere as portas necessárias para receber acessos remotos com segurança:

```bash
sudo ufw allow "Nginx Full"
sudo ufw allow OpenSSH
# Habilitar o UFW se estiver inativo
sudo ufw enable
```

---

## 🔒 Dica Extra: Segurança e Atualização de Tokens (.env)

O Next.js injeta seu segredo de autenticação (`JWT_SECRET`) do `.env` na Engine de Borda (Middlewares) apenas durante a **geração da Build**.

Isso significa que se um dia você for hackeado e precisar trocar a chave `JWT_SECRET` dentro do arquivo `.env` do VPS, o servidor **não irá** ler a chavé nova num reinício de PM2 sem ser reconstruído. Após trocar o segredo local, não esqueça:
```bash
npm run build
pm2 restart all
```

## 🔒 Dica Extra: Certificado SSL Gratuito (HTTPS)

Para uma aplicação segura nas requisições do sistema via token e Web APIs modernas, ative o HTTPS usando o utilitário Let's Encrypt / `Certbot`:

```bash
# Instala o programa
sudo apt install -y certbot python3-certbot-nginx

# Solicita o certificado e altera o Nginx automaticamente para direcionar o tráfego HTTP para HTTPS
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```
