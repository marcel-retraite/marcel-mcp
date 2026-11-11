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

## Outils (45, tous en lecture seule)

Quatorze outils forment le périmètre principal. Les trente et un outils étendus, listés après, donnent des résultats indicatifs.

| Outil | Ce qu'il calcule |
|---|---|
| `marcel_estimate_pension` | Pension de retraite brute ; net du foyer seulement si un RFR d'avis d'impôt est fourni |
| `simulate_av` | Fiscalité d'un contrat d'assurance-vie : rachat, avance, transmission (CGI 125-0 A, 990 I, 757 B) |
| `simulate_pea` | Fiscalité d'une sortie de PEA (CGI 157) |
| `simulate_cto` | Fiscalité d'un compte-titres ordinaire personnel, une année (CGI 200 A, 158, 150-0 A et D) |
| `simulate_per_sortie` | Fiscalité d'une sortie de PER, en capital ou en rente |
| `simulate_ifi` | IFI : assiette, barème, plafonnement (CGI 964 à 979) |
| `simulate_dutreil` | Transmission d'entreprise : chemins avec et sans pacte Dutreil (CGI 787 B ; art. 790, 50 % des droits si pleine propriété et donateur de moins de 70 ans) |
| `simulate_donation` | Droits de donation (CGI 777, 779, 790). Réponse identique à la route |
| `simulate_demembrement` | Usufruit et nue-propriété (CGI 669), droits sur la nue-propriété. Réponse identique à la route |
| `acheter_louer` | Acheter ou louer sa résidence principale : écart de patrimoine dans le temps |
| `simulate_cumul` | Cumul emploi-retraite d'un salarié du régime général, règles avant et à partir de 2027 |
| `compare_results` | Écart entre deux scénarios déjà calculés par Marcel |
| `validate_results` | Cohérence de plusieurs résultats Marcel entre eux |
| `optimiser_patrimoine` | Marcel Patrimoine porte sur la transmission globale d'un patrimoine : donation, succession, démembrement et comparaison d'options, chiffrées à partir d'un même profil. Estimation indicative, pas un conseil en investissement. Entrées : âge et situation du foyer, enfants, plusieurs biens immobiliers avec leur crédit, titres de société, enveloppes d'épargne dont le PER, dettes, valeur à transmettre et donations antérieures. Chaque champ du profil est optionnel ; la réponse contient les scénarios chiffrés, les scénarios écartés, les sujets non couverts, les champs manquants et les avertissements. Elle porte un traceId, le même pour un même profil et une même version de règles, et sa rulesVersion. |

### Outils étendus (résultats indicatifs)

| Outil | Calcul |
|---|---|
| `marcel_financial_twin` | Projeter un profil patrimonial complet |
| `marcel_find_gap` | Mesurer l'écart avec un revenu cible à la retraite |
| `marcel_compare_scenarios` | Comparer des scénarios patrimoniaux |
| `marcel_revenue_at_retirement` | Calculer le revenu net à la retraite par source |
| `marcel_simulate_decision` | Mesurer l'effet d'une décision sur la trajectoire |
| `simulate_rachat` | Calculer un rachat de trimestres |
| `simulate_per` | Calculer la déduction d'un versement PER |
| `compare_remuneration` | Comparer les rémunérations d'un dirigeant de SASU |
| `compare_chemin` | Comparer des chemins de sortie de trésorerie |
| `compare_allocation` | Comparer un même actif dans plusieurs enveloppes |
| `registre_reglementaire` | Lire une règle du registre à une date |
| `simulate_pv_immo_ir` | Calculer une plus-value immobilière des particuliers |
| `simulate_sci_ir_vs_is` | Comparer une SCI à l'IR et à l'IS |
| `simulate_marchand_biens` | Calculer une opération de marchand de biens |
| `simulate_immo_espagne` | Comparer deux détentions d'un bien en Espagne |
| `simulate_sci_multi` | Répartir la fiscalité d'une SCI entre associés |
| `simulate_mere_fille` | Comparer trois chemins de remontée d'un dividende |
| `simulate_cession_titres_vs_actifs` | Comparer la cession des titres et des actifs |
| `simulate_obo` | Calculer le financement d'un OBO |
| `simulate_donation_partage` | Calculer une donation-partage |
| `simulate_succession` | Calculer des droits de succession |
| `compare_transmission` | Comparer trois modes de transmission |
| `simulate_immo_portugal` | Comparer deux détentions d'un bien au Portugal |
| `simulate_immo_belgique` | Comparer deux détentions d'un bien en Belgique |
| `simulate_immo_grece` | Comparer deux détentions d'un bien en Grèce |
| `simulate_immo_italie` | Comparer deux détentions d'un bien en Italie |
| `simulate_immo_saint_barth` | Comparer deux détentions d'un bien à Saint-Barthélemy |
| `simulate_immo_uk` | Comparer deux détentions d'un bien au Royaume-Uni |
| `simulate_apport_cession` | Calculer un apport-cession |
| `simulate_remuneration_per` | Comparer quatre rémunérations de dirigeant avec PER |
| `simulate_av_strategie` | Calculer des rachats partiels d'assurance-vie |

Règles en vigueur : LFSS 2026 (PFU 31,4 %, prélèvements sociaux 18,6 % ; assurance-vie à 17,2 %).

## Limite d'appels

20 requêtes par minute et par adresse IP. Au-delà : HTTP 429, en-tête `Retry-After`, erreur JSON-RPC `-32029`. Détail : https://marcel-retraite.fr/developer#limites

## Documentation

- Développeurs : https://marcel-retraite.fr/developer
- Site : https://marcel-retraite.fr

## Licence

MIT pour le contenu de ce dépôt. Le service distant est fourni par Marcel ; ses résultats sont indicatifs et non contractuels.
