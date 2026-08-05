# ClickBeard

API REST para gerenciamento de agendamentos de barbearia, construída com [NestJS](https://nestjs.com/) e TypeScript.

## Arquitetura

O projeto segue a estrutura modular padrão do NestJS, organizada por domínio:

```text
src/
├── main.ts                  # Bootstrap da aplicação e configuração do Swagger
├── app.module.ts             # Módulo raiz, global
├── modules/
│   ├── auth/                 # Autenticação
│   ├── identity/              # Identidade / usuários
│   ├── barber/                # Cadastro e gestão de barbeiros
│   └── scheduling/            # Agendamento de horários
└── shared/
    ├── config/                # Configuração de ambiente, Postgres, Redis e filas
    ├── database/               # Integração com PostgreSQL via Sequelize
    └── queue/                  # Integração com filas via BullMQ/Redis
```

- Cada domínio de negócio (`auth`, `identity`, `barber`, `scheduling`) vive em seu próprio módulo dentro de `src/modules`, mantendo o código isolado e fácil de evoluir de forma independente.
- `src/shared` concentra as integrações e configurações transversais reutilizadas pelos módulos de domínio: variáveis de ambiente validadas (`class-validator`), conexão com o PostgreSQL (Sequelize) e filas assíncronas com Redis (BullMQ).
- A infraestrutura de apoio (PostgreSQL, Redis e, opcionalmente, a própria aplicação) roda em containers Docker, orquestrados pelo `docker-compose.yml`.
- A documentação interativa da API é gerada automaticamente pelo Swagger e fica disponível em `/docs` quando a aplicação está em execução.

## Tecnologias

- **[NestJS](https://nestjs.com/)** + **TypeScript** — framework e linguagem principais da aplicação.
- **[Sequelize](https://sequelize.org/)** (`sequelize-typescript`) + **PostgreSQL** — ORM e banco de dados relacional.
- **[BullMQ](https://docs.bullmq.io/)** + **Redis** — filas de processamento assíncrono e cache.
- **[Swagger](https://docs.nestjs.com/openapi/introduction)** (`@nestjs/swagger`) — documentação interativa da API.
- **class-validator** / **class-transformer** — validação e transformação de dados (ex.: variáveis de ambiente, DTOs).
- **Jest** + **Supertest** — testes unitários e end-to-end.
- **ESLint** + **Prettier** — padronização e qualidade de código.
- **Commitizen** (`cz-conventional-changelog`) — padronização de mensagens de commit.
- **Docker** / **Docker Compose** — containerização da aplicação e da infraestrutura (PostgreSQL e Redis).

## Scripts

O projeto disponibiliza uma série de scripts para facilitar o gerenciamento da infraestrutura e do ambiente de desenvolvimento.

### Configuração Inicial

#### `npm run setup`

Realiza toda a configuração inicial do ambiente.

#### O que este comando faz

1. Instala todas as dependências do projeto.
2. Cria o arquivo `.env` a partir do `.env.example` (caso ainda não exista).
3. Inicializa os containers do PostgreSQL e Redis.
4. Aguarda o PostgreSQL ficar disponível.
5. Executa todas as migrations.
6. Executa todos os seeders.
7. Finaliza informando que o ambiente está pronto para desenvolvimento.

Após a conclusão basta iniciar a aplicação:

```bash
npm run dev
```

---

### Docker

Todos os comandos utilizam o arquivo:

```text
docker/docker-compose.yml
```

#### `npm run docker:up`

Inicializa toda a infraestrutura definida no Docker Compose.

Utilize este comando quando desejar subir todos os serviços da aplicação.

---

#### `npm run docker:down`

Encerra todos os containers da aplicação mantendo os volumes.

---

#### `npm run docker:restart`

Reinicia todos os containers.

Muito útil após alterações em configurações do Docker.

---

#### `npm run docker:logs`

Exibe os logs de todos os serviços em tempo real.

---

#### `npm run docker:build`

Reconstrói todas as imagens da aplicação.

Utilize este comando sempre que houver alterações no `Dockerfile`.

---

#### `npm run docker:clean`

Remove completamente a infraestrutura Docker.

Este comando:

- encerra os containers;
- remove os volumes;
- remove containers órfãos.

> **Atenção:** todos os dados persistidos do PostgreSQL e Redis serão removidos.

---

### Banco de Dados

Os comandos abaixo controlam apenas o PostgreSQL e o Redis.

---

#### `npm run db:up`

Inicializa somente os containers responsáveis pela persistência de dados.

Serviços iniciados:

- PostgreSQL
- Redis

---

#### `npm run db:down`

Encerra apenas os serviços de banco de dados.

A aplicação permanece inalterada.

---

#### `npm run db:restart`

Reinicia apenas o PostgreSQL e o Redis.

---

#### `npm run db:logs`

Exibe os logs do PostgreSQL e Redis.

Ideal para depuração de problemas de conexão ou inicialização.

---

#### `npm run db:reset`

Remove completamente os volumes do banco de dados e cria uma nova instância.

Fluxo executado:

1. Remove containers e volumes.
2. Inicializa PostgreSQL e Redis.
3. O banco ficará vazio.

Após executar este comando recomenda-se executar novamente:

```bash
npm run migration:up
npm run seed:up
```

ou simplesmente:

```bash
npm run setup
```

---

#### `npm run redis:flush`

Remove todas as chaves armazenadas no Redis.

Este comando é útil durante o desenvolvimento quando for necessário limpar:

- cache;
- filas;
- sessões;
- locks distribuídos.

Não afeta o PostgreSQL.

---

### Migrations

#### `npm run migration:generate`

Cria uma nova migration.

Exemplo:

```bash
npm run migration:generate -- create-users-table
```

---

#### `npm run migration:up`

Executa todas as migrations pendentes.

---

#### `npm run migration:down`

Desfaz a última migration executada.

---

#### `npm run migration:reset`

Remove todas as migrations executadas.

Normalmente utilizado apenas durante o desenvolvimento.

---

### Seeders

#### `npm run seed:up`

Executa todos os seeders.

Utilizado para popular o banco com dados iniciais.

---

#### `npm run seed:down`

Remove todos os dados inseridos pelos seeders.

---

### Fluxo recomendado

#### Primeira execução

```bash
git clone <repository>

cd project

npm run setup

npm run dev
```

---

#### Desenvolvimento diário

Caso a infraestrutura já exista:

```bash
npm run db:up

npm run dev
```

ou, caso toda a aplicação esteja dockerizada:

```bash
npm run docker:up
```

---

#### Reiniciar apenas os bancos

```bash
npm run db:restart
```

---

#### Limpar completamente o ambiente

```bash
npm run docker:clean

npm run setup
```

---
