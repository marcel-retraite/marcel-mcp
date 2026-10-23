<p align="center"><img src="logo.png" width="120" alt="Marcel"></p>

# Marcel — serveur MCP

Calcul fiscal et retraite français, déterministe et sourcé. Chaque résultat porte les règles appliquées (articles du CGI, du CSS), leur version et un `traceId`. Marcel mesure : il ne donne aucun conseil en investissement ni conseil fiscal.

French tax and retirement calculations for AI assistants. Deterministic, sourced, versioned. No financial advice.

## Connexion

Serveur distant, sans clé, transport Streamable HTTP :

```
https://marcel-retraite.fr/mcp
```

Exemple de configuration (clients acceptant une URL distante) :

```json
{
  "mcpServers": {
    "marcel": { "url": "https://marcel-retraite.fr/mcp" }
  }
}
```

Server card : https://marcel-retraite.fr/.well-known/mcp/server-card.json

## Proxy local (stdio)

Ce dépôt est un proxy léger, sans calcul et sans secret. Au démarrage, un serveur MCP stdio se connecte en Streamable HTTP à l'endpoint distant (par défaut `https://marcel-retraite.fr/mcp`, remplaçable avec `MARCEL_MCP_URL`) et relaie `tools/list` et `tools/call`. Les prompts et les ressources sont relayés seulement si le serveur distant les expose. Les résultats sont informatifs, pas un conseil.

### npx

Depuis GitHub, sans clone :

```bash
npx -y github:marcel-retraite/marcel-mcp
```

Exemple pour un client qui lance un processus :

```json
{
  "mcpServers": {
    "marcel": {
      "command": "npx",
      "args": ["-y", "github:marcel-retraite/marcel-mcp"],
      "env": { "MARCEL_MCP_URL": "https://marcel-retraite.fr/mcp" }
    }
  }
}
```

Depuis une copie locale du dépôt :

```bash
npm install
npm run build
npx .
```

`npm install` lance aussi la compilation. `node dist/index.js` démarre le même serveur. La sortie standard est réservée au protocole MCP.

### Docker

```bash
docker build -t marcel-mcp .
docker run -i --rm marcel-mcp
```

`-i` garde stdin ouvert. Pour viser un autre endpoint :

```bash
docker run -i --rm -e MARCEL_MCP_URL=https://marcel-retraite.fr/mcp marcel-mcp
```

## Local proxy (stdio)

This repository is a thin proxy: no calculation logic and no secrets. On startup, a stdio MCP server connects with Streamable HTTP to the remote endpoint (default `https://marcel-retraite.fr/mcp`, override with `MARCEL_MCP_URL`) and forwards `tools/list` and `tools/call`. Prompts and resources are forwarded only when the remote server exposes them. Results are informative, not advice.

### npx

From GitHub, without cloning:

```bash
npx -y github:marcel-retraite/marcel-mcp
```

Example for a client that spawns a process:

```json
{
  "mcpServers": {
    "marcel": {
      "command": "npx",
      "args": ["-y", "github:marcel-retraite/marcel-mcp"],
      "env": { "MARCEL_MCP_URL": "https://marcel-retraite.fr/mcp" }
    }
  }
}
```

From a local checkout:

```bash
npm install
npm run build
npx .
```

`npm install` also builds. `node dist/index.js` starts the same server. Standard output is reserved for the MCP protocol.

### Docker

```bash
docker build -t marcel-mcp .
docker run -i --rm marcel-mcp
```

`-i` keeps stdin open. To target another endpoint:

```bash
docker run -i --rm -e MARCEL_MCP_URL=https://marcel-retraite.fr/mcp marcel-mcp
```

## Outils (11, tous en lecture seule)

| Outil | Ce qu'il calcule |
|---|---|
| `marcel_estimate_pension` | Pension de retraite brute ; net du foyer seulement si un RFR d'avis d'impôt est fourni |
| `simulate_av` | Fiscalité d'un contrat d'assurance-vie : rachat, avance, transmission (CGI 125-0 A, 990 I, 757 B) |
| `simulate_pea` | Fiscalité d'une sortie de PEA (CGI 157) |
| `simulate_cto` | Fiscalité d'un compte-titres ordinaire personnel, une année (CGI 200 A, 158, 150-0 A et D) |
| `simulate_per_sortie` | Fiscalité d'une sortie de PER, en capital ou en rente |
| `simulate_ifi` | IFI : assiette, barème, plafonnement (CGI 964 à 979) |
| `simulate_dutreil` | Transmission d'entreprise : chemins avec et sans pacte Dutreil (CGI 787 B, 790) |
| `acheter_louer` | Acheter ou louer sa résidence principale : écart de patrimoine dans le temps |
| `simulate_cumul` | Cumul emploi-retraite d'un salarié du régime général, règles avant et à partir de 2027 |
| `compare_results` | Écart entre deux scénarios déjà calculés par Marcel |
| `validate_results` | Cohérence de plusieurs résultats Marcel entre eux |

Règles en vigueur : LFSS 2026 (PFU 31,4 %, prélèvements sociaux 18,6 % ; assurance-vie à 17,2 %).

## Limite d'appels

20 requêtes par minute et par adresse IP. Au-delà : HTTP 429, en-tête `Retry-After`, erreur JSON-RPC `-32029`. Détail : https://marcel-retraite.fr/developer#limites

## Documentation

- Développeurs : https://marcel-retraite.fr/developer
- Site : https://marcel-retraite.fr

## Licence

MIT pour le contenu de ce dépôt. Le service distant est fourni par Marcel ; ses résultats sont indicatifs et non contractuels.
