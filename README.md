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
| `compare_certified` | Écart entre deux scénarios déjà calculés par Marcel |
| `validate_results` | Cohérence de plusieurs résultats Marcel entre eux |

Règles en vigueur : LFSS 2026 (PFU 31,4 %, prélèvements sociaux 18,6 % ; assurance-vie à 17,2 %).

## Limite d'appels

20 requêtes par minute et par adresse IP. Au-delà : HTTP 429, en-tête `Retry-After`, erreur JSON-RPC `-32029`. Détail : https://marcel-retraite.fr/developer#limites

## Documentation

- Développeurs : https://marcel-retraite.fr/developer
- Site : https://marcel-retraite.fr

## Licence

MIT pour le contenu de ce dépôt. Le service distant est fourni par Marcel ; ses résultats sont indicatifs et non contractuels.
