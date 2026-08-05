Write-Host "📦 Instalando dependências..."

npm install

if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

Write-Host "🐳 Subindo PostgreSQL e Redis..."

docker compose -f docker-compose.yml --env-file .env up -d postgres redis

Write-Host "⏳ Aguardando o banco iniciar..."

Start-Sleep -Seconds 10

npm run migration:up

npm run seed:up

Write-Host ""
Write-Host "✅ Setup concluído!"
Write-Host ""
Write-Host "Execute:"
Write-Host "npm run dev"