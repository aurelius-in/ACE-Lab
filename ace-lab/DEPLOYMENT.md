# Deployment (server)

## Docker

Build and run locally:

```bash
# from ace-lab/ace-lab
docker build -t ace-server -f server/Dockerfile .
docker run -p 4000:4000 --rm ace-server
```

Or with compose (server + frontend preview):

```bash
# from ace-lab/ace-lab
docker compose up --build
```

## Render.com

- Use Docker deploy; point to `server/Dockerfile`
- Set `PORT=4000` environment variable (Render injects it by default)

## Fly.io

- Create a simple `fly.toml` mapping 4000; deploy using Dockerfile

## Heroku

- Container registry deploy (Dockerfile)
- Set `PORT` config var if needed (Heroku injects)
