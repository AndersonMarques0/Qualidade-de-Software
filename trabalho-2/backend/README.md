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
```
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
{"region":"SOUTHEAST"}
```
Regiões: `SOUTHEAST` (Sudeste) e `OTHER` (demais regiões).

### Finalizar pedido
`POST /api/orders`
```json
{
 "region":"SOUTHEAST",
 "paymentMethod":"PIX",
 "deliveryAddress":{"postalCode":"01001-000","street":"Praça da Sé","number":"100","neighborhood":"Sé","city":"São Paulo","state":"SP"}
}
```
Para cartão, use `paymentMethod:"CREDIT_CARD"` e informe `cardToken`. O gateway é simulado; `cardToken:"DECLINE"` simula recusa. **Nunca envie dados reais de cartão.**

## 6. Regras de negócio implementadas
- **RN01:** menos de 1 ano: sem desconto; de 1 até menos de 3: Bronze 3%; de 3 até 5 inclusive: Prata 5%; acima de 5: Ouro 10%. O enunciado sobrepõe os limites de 3 anos e não esclarece exatamente 5 anos; esta é a interpretação adotada.
- **RN02:** Sudeste 5% do subtotal; demais regiões 10%.
- **RN03:** cartão e Pix. Integração é simulada.
- **RN04:** `CREATED`, `PROCESSING`, `CONFIRMED`, `CANCELLED`, `DELIVERED`, `FINISHED`. Pedidos recusados permanecem em processamento com prazo de cancelamento de 2 dias; um timer do servidor verifica pedidos expirados a cada minuto e, ao cancelar, devolve as quantidades ao estoque.

## 7. Testes
```bash
npm test
npm run test:coverage
npm run typecheck
npm run build
```
Os testes de integração usam `mongodb-memory-server`, não acessam seu Atlas e não exigem MongoDB instalado localmente.

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
- Não existe painel/usuário administrativo para marcar pedidos como entregues ou finalizados; esses estados estão modelados, mas exigem uma interface administrativa futura.
- O cancelamento automático usa timer em memória; para produção, substitua por worker/cron persistente.
- A baixa de estoque e o registro do pedido não estão em uma transação MongoDB. Em produção, use transação (Atlas em replica set) e compensação de falhas.
- Ainda é recomendável implementar idempotência no checkout para evitar pedidos duplicados em reenvios.

Este projeto é uma base acadêmica de desenvolvimento, não um sistema pronto para pagamentos reais.
