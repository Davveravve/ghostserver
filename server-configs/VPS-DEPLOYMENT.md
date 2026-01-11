# Ghost Gaming - VPS Deployment Guide

## Flytta hemsidan från Vercel till VPS

### Varför VPS?
- **Snabbare respons** - Allt på samma maskin (DB + Web + CS2)
- **Inga kalla starter** - Vercel stänger av vid inaktivitet
- **Billigare** - Ingen extra kostnad, använd befintlig VPS
- **Full kontroll** - Inga begränsningar

---

## 1. Installera Node.js på VPS

```bash
# Logga in på VPS
ssh root@46.224.197.229

# Installera Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verifiera
node --version  # v20.x.x
npm --version   # 10.x.x
```

## 2. Installera PM2 (Process Manager)

```bash
npm install -g pm2

# PM2 startar om appen automatiskt vid krasch/omstart
```

## 3. Klona projektet

```bash
# Skapa mapp för web
mkdir -p /var/www
cd /var/www

# Klona från GitHub
git clone https://github.com/Davveravve/ghostserver.git ghost
cd ghost/web
```

## 4. Konfigurera miljövariabler

```bash
# Skapa .env.local
cat > .env.local << 'EOF'
# Database - localhost eftersom DB är på samma maskin
DATABASE_URL="mysql://ghost:GhostServer2024@localhost:3306/ghost_gaming"

# Auth
NEXTAUTH_URL="https://www.ghostservers.site"
NEXTAUTH_SECRET="9oPQqEUNivTzJ8TtFxH7fa8TpKw23rvsJ4Pm8fcL6IQ="

# Steam
STEAM_API_KEY="YOUR_STEAM_API_KEY"

# Plugin
PLUGIN_API_KEY="3NULQW7WPpW3ZquX2WzFVyvWx2y09DQEg+JBA4+JVv4="

# Owner (för admin access)
OWNER_STEAM_ID="YOUR_STEAM_ID"
NEXT_PUBLIC_OWNER_STEAM_ID="YOUR_STEAM_ID"
EOF
```

## 5. Bygg och starta

```bash
# Installera dependencies
npm install

# Generera Prisma client
npx prisma generate

# Kör database migrations
npx prisma db push

# Bygg för production
npm run build

# Starta med PM2
pm2 start npm --name "ghost-web" -- start

# Spara PM2 config (startar vid omstart)
pm2 save
pm2 startup
```

## 6. Nginx Reverse Proxy

```bash
# Installera nginx
apt install nginx

# Skapa config
cat > /etc/nginx/sites-available/ghost << 'EOF'
server {
    listen 80;
    server_name www.ghostservers.site ghostservers.site;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Aktivera
ln -s /etc/nginx/sites-available/ghost /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 7. SSL med Certbot

```bash
# Installera certbot
apt install certbot python3-certbot-nginx

# Skaffa SSL cert
certbot --nginx -d www.ghostservers.site -d ghostservers.site

# Auto-renew är automatiskt
```

## 8. Uppdatera DNS

I Namecheap, ändra:
- **www.ghostservers.site** A record → `46.224.197.229`
- **ghostservers.site** A record → `46.224.197.229`

(Ta bort eventuella CNAME till Vercel)

---

## Användning

### Kommandon
```bash
# Status
pm2 status

# Loggar
pm2 logs ghost-web

# Starta om
pm2 restart ghost-web

# Stoppa
pm2 stop ghost-web
```

### Uppdatera hemsidan
```bash
cd /var/www/ghost/web
git pull
npm install
npm run build
pm2 restart ghost-web
```

### Uppdatera databas (nya tabeller)
```bash
cd /var/www/ghost/web
npx prisma db push
pm2 restart ghost-web
```

---

## Firewall

```bash
# Öppna port 80 och 443
ufw allow 80/tcp
ufw allow 443/tcp
```

---

## Fördelar med VPS

1. **API-anrop till databasen går via localhost** → < 1ms latency
2. **Ingen cold start** → Alltid snabb
3. **Plugin kan anropa API på samma maskin** → Snabbare skin-sync
4. **Enklare deployment** → Git pull + restart

---

## Fallback

Om något går fel, kan du alltid gå tillbaka till Vercel genom att:
1. Ändra DNS tillbaka till Vercel
2. Stoppa PM2: `pm2 stop ghost-web`
