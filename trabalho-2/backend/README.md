# Bookstore Backend

API REST para o caso de uso **Efetuar Pedido**, com Node.js, TypeScript, Express, MongoDB Atlas e Mongoose. Projeto intencionalmente simples: sem Docker e sem Swagger.

## Requisitos
- Node.js 20+
- npm
- Conta e cluster MongoDB Atlas

## 1. MongoDB Atlas
1. Crie uma conta/projeto em https://www.mongodb.com/atlas.
2. Crie um cluster gratuito (M0).
3. Em **Database Access**, crie um usuário e senha para a aplicação.
4. Em **Network Access**, permita o IP público atual da sua máquina.
5. No cluster, clique **Connect > Drivers > Node.js** e copie a URI.
6. Inclua o nome do banco `bookstore` antes dos parâmetros da URI. Exemplo:
`mongodb+srv://USUARIO:SENHA@cluster.xxxxx.mongodb.net/bookstore`
Codifique caracteres especiais da senha para URL. Não publique a URI.

## 2. Variáveis de ambiente
```bash
cp .env.example .env
```
Edite `.env`:
```env
PORT=3333
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster.xxxxx.mongodb.net/bookstore
JWT_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=1d
ORDER_JOB_INTERVAL_MS=5000
```
`ORDER_JOB_INTERVAL_MS` (opcional, padrão 5000) é o intervalo da rotina que cancela pedidos vencidos e avança os estados dos pedidos.

Gere uma chave com `openssl rand -base64 48`. Nunca versione `.env`.

## 3. Instalar e executar
```bash
npm install
npm run dev
```
API: `http://localhost:3333/api`. Teste: `curl http://localhost:3333/api/health`.

## 4. Criar livros de teste
No Atlas, abra **Browse Collections** e crie a coleção `books` com um documento:
```json
{"title":"Clean Code","author":"Robert C. Martin","price":89.90,"stock":10}
```
Crie outros documentos conforme necessário. As coleções de clientes, carrinhos e pedidos são criadas pelo Mongoose.

## 5. Endpoints
Prefixo `/api`:
| Método | Endpoint | Autenticação | Finalidade |
|---|---|---|---|
| GET | `/health` | Não | Health check |
| POST | `/auth/register` | Não | Cadastro |
| POST | `/auth/login` | Não | Login |
| GET | `/books` | Não | Listar livros |
| GET | `/books/:id` | Não | Consultar livro |
| GET | `/cart` | Sim | Consultar carrinho |
| POST | `/cart/items` | Sim | Adicionar livro |
| PATCH | `/cart/items/:bookId` | Sim | Alterar quantidade |
| DELETE | `/cart/items/:bookId` | Sim | Remover livro |
| GET | `/banks` | Não | Listar bancos |
| POST | `/banks` | Sim | Cadastrar banco |
| GET | `/cards` | Sim | Listar cartões do cliente |
| POST | `/cards` | Sim | Cadastrar cartão (número fictício de 16 dígitos) |
| GET | `/account` | Sim | Consultar saldo da conta bancária |
| POST | `/account/deposit` | Sim | Depositar dinheiro na conta (simulação) |
| POST | `/orders/preview` | Sim | Simular total antes da compra |
| POST | `/orders` | Sim | Efetuar pedido |
| GET | `/orders` | Sim | Listar pedidos |
| GET | `/orders/:id` | Sim | Consultar pedido |

### Cadastro
`POST /api/auth/register`
```json
{"name":"Maria Silva","email":"maria@example.com","password":"senha12345"}
```
### Login
`POST /api/auth/login`
```json
{"email":"maria@example.com","password":"senha12345"}
```
Envie o token recebido nas rotas protegidas: `Authorization: Bearer SEU_TOKEN`.

### Adicionar item ao carrinho
`POST /api/cart/items`
```json
{"bookId":"ID_DO_LIVRO","quantity":2}
```

### Prévia do pedido
`POST /api/orders/preview`
```json
{"state":"SP"}
```
A região do frete é definida pelo estado de entrega. A API aceita tanto a **sigla (UF)** quanto o **nome completo** do estado, normalizando a entrada: SP, RJ, MG e ES são Sudeste (frete 5%); os demais estados, 10%. Por compatibilidade, a prévia ainda aceita `{"region":"SOUTHEAST"}` ou `{"region":"OTHER"}`.

### Finalizar pedido
`POST /api/orders`

O checkout exige o cabeçalho `Idempotency-Key` (entre 16 e 128 caracteres). Gere uma chave por tentativa lógica de compra e reutilize a mesma chave ao reenviar aquela mesma operação. Isso evita criar outro pedido ou debitar o saldo novamente em reenvios.

Exemplo:
```bash
curl -X POST http://localhost:3333/api/orders \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"PIX","deliveryAddress":{"postalCode":"01001-000","street":"Praça da Sé","number":"100","neighborhood":"Sé","city":"São Paulo","state":"SP"}}'
```

Para cartão, use `paymentMethod:"CREDIT_CARD"` e informe `cardId` (cartão cadastrado em `/cards`). **Nunca envie dados reais de cartão.**

No checkout a região é sempre calculada a partir de `deliveryAddress.state`; qualquer `region` enviado é ignorado.

### Banco simulado (saldo)
Pix e cartão são autorizados pelo banco simulado com a mesma regra: **saldo da conta >= valor da compra → autorizado** (o valor é debitado); caso contrário → **recusado** (saldo intacto).
```bash
# dar dinheiro ao cliente (valor em reais, até 2 casas decimais)
curl -X POST http://localhost:3333/api/account/deposit -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" -d '{"amount":150.00}'
curl http://localhost:3333/api/account -H "Authorization: Bearer SEU_TOKEN"
```
Cliente sem conta tem saldo 0. O saldo é guardado em centavos (inteiro) e o débito é atômico: duas compras simultâneas nunca gastam o mesmo saldo duas vezes.

## 6. Regras de negócio implementadas
- **RN01:** menos de 1 ano: sem desconto; de 1 até antes de 3 anos: Bronze 3%; de 3 até 5 anos, inclusive: Prata 5%; acima de 5 anos: Ouro 10%. Portanto, exatamente 5 anos ainda pertence ao perfil Prata.
- **RN02:** Sudeste 5% do subtotal; demais regiões 10%.
- **RN03:** cartão e Pix. Integração é simulada: o banco autoriza se `saldo >= valor da compra`.
- **Tempo de vínculo:** calculado por calendário (anos completos + fração), não por 365,25 dias. Assim "1 ano" exato já é Bronze e "5 anos" exatos é Prata.
- **RN04:** `CREATED`, `PROCESSING`, `CONFIRMED`, `CANCELLED`, `DELIVERED`, `FINISHED`.
  - Pagamento recusado: o pedido permanece em `PROCESSING` com prazo de cancelamento de 48h (contado a partir da recusa). Com 48h ou mais, é cancelado e as quantidades voltam ao estoque.
  - Uma rotina do servidor roda a cada `ORDER_JOB_INTERVAL_MS` e move cada pedido **um passo** por execução: `CONFIRMED → DELIVERED → FINISHED` e `CANCELLED → FINISHED`. Todo pedido termina em `FINISHED`.

## 7. Testes
```bash
npm test
npm run test:coverage
npm run typecheck
npm run build
```
Os testes de integração usam `MongoMemoryReplSet` (replica set em memória), necessário para exercitar as transações do checkout. Eles não acessam o MongoDB Atlas. Na primeira execução, `mongodb-memory-server` pode precisar baixar o binário do MongoDB.

| Arquivo | Casos de teste |
|---|---|
| `tests/integration/cart-order.test.ts` | CT01–CT03: quantidades inválidas, 1 livro e quantidades maiores que 1; testa 25 unidades disponíveis (LSV) e 30 solicitadas com apenas 25 em estoque (LSI) |
| `tests/unit/pricing.test.ts` | CT04–CT09: regras puras de faixa de relacionamento, limites de 1, 3 e 5 anos, regiões e percentuais de frete |
| `tests/integration/pricing-order.test.ts` | CT04–CT09: valida as mesmas regras pela prévia do pedido e pela entrada HTTP |
| `tests/integration/payment.test.ts` | CT10–CT13: cartão e Pix com saldo suficiente ou insuficiente |

Os testes de tempo são determinísticos: `pricing.test.ts` usa uma data de referência fixa (`2026-11-23`) e verifica as datas de aniversário e os dias imediatamente anteriores/posteriores, sem esperar anos reais.

## 8. Organização
- `config`: variáveis e conexão.
- `domain`: regras de negócio, enums e erros.
- `models`: schemas Mongoose.
- `repositories`: persistência.
- `services`: regras e orquestração dos casos de uso.
- `controllers`: camada HTTP.
- `routes`: endpoints.
- `middlewares`: autenticação e erros.
- `validators`: validação com Zod.
- `tests`: testes unitários e integração.

## Limitações conhecidas
- Pagamento e frete não estão conectados a provedores reais.
- Entrega e finalização são simuladas pela rotina automática (não há integração com transportadora).
- A rotina usa timer em memória; para produção, substitua por worker/cron persistente. Com mais de uma instância da API as atualizações são condicionais (idempotentes), então não duplicam efeitos.
- `POST /account/deposit` permite a qualquer cliente autenticado criar saldo (é uma simulação). Em produção, o saldo vem do banco real.
- O checkout e o cancelamento utilizam transações MongoDB para manter estoque, pedido, saldo simulado e carrinho consistentes. O MongoDB Atlas deve operar em replica set (clusters Atlas oferecem esse suporte).
- O pagamento continua simulado dentro do mesmo MongoDB. Uma integração com banco/adquirente externo exige fluxo de compensação (por exemplo, Saga), pois uma transação MongoDB não abrange outro sistema.

Este projeto é uma base acadêmica de desenvolvimento, não um sistema pronto para pagamentos reais.
