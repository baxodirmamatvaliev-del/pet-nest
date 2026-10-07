# PetNest backend deployment

## Required runtime variables

- `PORT_API=3002`
- `MONGO_PROD`
- `SECRET_TOKEN`
- `CLIENT_URLS`

`CLIENT_URLS` accepts comma-separated frontend origins without paths.

## Docker

```bash
docker build -t pet-nest .

docker run --name pet-nest \
  -p 3002:3002 \
  --env-file .env.production \
  -v pet-nest-uploads:/app/uploads \
  pet-nest
```

Check API and MongoDB readiness at `http://localhost:3002/health`.
