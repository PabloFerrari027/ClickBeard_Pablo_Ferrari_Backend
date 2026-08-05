#!/usr/bin/env bash
set -e

echo "📦 Instalando dependências..."

npm install

if [ ! -f ".env" ]; then
    cp ".env.example" ".env"
fi

echo "🐳 Subindo PostgreSQL e Redis..."

docker compose -f docker-compose.yml --env-file .env up -d postgres redis

echo "⏳ Aguardando o banco iniciar..."

sleep 10

npm run migration:up

npm run seed:up

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Execute:"
echo "npm run dev"
