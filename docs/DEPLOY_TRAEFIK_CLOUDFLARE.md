# Deploy With Traefik And Cloudflare

This setup uses Cloudflare for public DNS/SSL and Traefik as the VPS reverse proxy.

## Production Flow

Browser -> Cloudflare HTTPS -> Traefik on VPS -> Buswy app on Docker network port 9999.

Use Cloudflare SSL/TLS mode `Full (strict)`. Do not use `Flexible`.

## Cloudflare DNS

Create proxied DNS records:

```text
A     your-domain.com       VPS_IP
A     www                   VPS_IP
```

Keep the orange cloud enabled.

## Cloudflare Origin Certificate

In Cloudflare dashboard, open `SSL/TLS > Origin Server > Create Certificate`.

Use hostnames:

```text
your-domain.com
*.your-domain.com
```

Save the files on the VPS:

```text
deploy/traefik/certs/cloudflare-origin.pem
deploy/traefik/certs/cloudflare-origin.key
```

Then copy the example TLS config:

```bash
cp deploy/traefik/dynamic/tls.yml.example deploy/traefik/dynamic/tls.yml
```

## VPS First Run

Create the shared Docker network:

```bash
docker network create proxy
```

Start Traefik:

```bash
cd deploy/traefik
docker compose up -d
```

Set the production domain in `deploy/traefik/dynamic/buswy.yml`:

```yml
http:
  routers:
    buswy:
      rule: Host(`your-domain.com`) || Host(`www.your-domain.com`)
```

Start Buswy from the project root:

```bash
docker compose --env-file .env.production up -d --build
```

## Required Production Env

Set these values in `.env.production` before deploying:

```env
BETTER_AUTH_BASE_URL=https://your-domain.com
BETTER_AUTH_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
APP_INTERNAL_URL=http://127.0.0.1:9999
```

## Windows Local Test

You can test the Traefik routing locally without Cloudflare.

Create the shared Docker network once:

```powershell
docker network create proxy
```

Start Traefik from the project root:

```powershell
docker compose -f deploy/traefik/docker-compose.yml up -d
```

Use a local domain. Add this line to `C:\Windows\System32\drivers\etc\hosts` as Administrator:

```text
127.0.0.1 buswy.localhost www.buswy.localhost
```

For local Traefik testing, keep or set these values in `.env.production`:

```env
BETTER_AUTH_BASE_URL=https://buswy.localhost
BETTER_AUTH_ALLOWED_ORIGINS=https://buswy.localhost,https://www.buswy.localhost
APP_INTERNAL_URL=http://127.0.0.1:9999
```

Start the app:

```powershell
docker compose --env-file .env.production up -d --build
```

Open:

```text
https://buswy.localhost
```

For local testing, Traefik will use its default self-signed certificate unless you provide a local certificate. The browser warning is expected locally.

## Useful Commands

```bash
docker compose logs -f app
docker compose -f deploy/traefik/docker-compose.yml logs -f traefik
docker compose ps
```
