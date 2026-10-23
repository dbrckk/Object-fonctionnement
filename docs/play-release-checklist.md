# Mise en ligne Android — points de contrôle

## Faits implémentés en version 0.48

- Les dépendances Capacitor, Android et le plugin App passent à la version 8.
- Le build native génère un projet Android propre (non versionné) et vérifie `compileSdkVersion=36` et `targetSdkVersion=36`.
- La CI construit un APK de test et un Android App Bundle de type release.
- Le bundle est **non signé tant que les secrets privés ne sont pas configurés**. Ce fichier ne peut pas être téléversé sur Play Console.
- L'AAB peut être signé côté GitHub Actions **sans divulguer le keystore** dès que les 4 secrets suivants sont enregistrés sur le dépôt :
  - `PLAY_UPLOAD_KEYSTORE_BASE64` : contenu du fichier `.jks` encodé en base64
  - `PLAY_UPLOAD_KEYSTORE_PASSWORD` : mot de passe du keystore
  - `PLAY_UPLOAD_KEY_ALIAS` : alias de la clé
  - `PLAY_UPLOAD_KEY_PASSWORD` : mot de passe de la clé
- La CI signale explicitement l'artefact comme signé ou non signé.
- Les politiques de confidentialité et crédits sont présents dans l'APK et peuvent être consultés dans l'application hors ligne.
- Les fichiers `docs/index.html` et `docs/privacy.html` sont prêts pour GitHub Pages.
- Le workflow génère des images et de vraies captures d'écran pour la fiche Play.

## Étapes qui exigent encore une intervention

1. **Politique de confidentialité publiée** : https://auroral-drive-8h58f6y.shipstatic.com/privacy.html (déploiement permanent, sans échéance de suppression). Utiliser cette URL dans Play Console ; vérifier son ouverture depuis le téléphone et la conserver disponible lors des mises à jour.
2. **Créer et conserver la clé de signature d'importation**. Elle est indispensable pour la publication ; ne jamais l'envoyer dans le chat, le dépôt ou un ticket public. Garder une copie sûre. Ajouter les 4 secrets dans `GitHub > Settings > Secrets and variables > Actions`.
3. Relancer le workflow, puis contrôler l'artefact `object-fonctionnement-v048-signed-play-aab`. Un artefact marqué `UNSIGNED` est impropre à la distribution.
4. Créer l'application dans Play Console avec l'identifiant exact `com.dbrckk.objectfonctionnement` et le nom définitif. Cet identifiant est destiné à rester stable sur les futures mises à jour.
5. Importer les descriptions et ressources de `docs/play-store-listing.md`. Vérifier les règles de la fiche et corriger les éventuelles captures présentant un défaut.
6. Remplir la déclaration **Sécurité des données** en vérifiant le manifeste Android effectif, les composants intégrés et la manière dont les données sont conservées en local. Ne pas déclarer de collecte ou de partage sans audit.
7. Compléter la **classification du contenu**, le **public cible**, l'**accès à l'application**, la déclaration de **publicité** et les coordonnées publiques exigées.
8. Tester **l'AAB installé par Google Play** via un test interne. Vérifier le lancement, toutes les simulations, la reprise après mise en arrière-plan, le bouton Retour, les gestes 3D et les pages légales.
9. En cas de compte développeur personnel créé après le 13 novembre 2023, respecter le test fermé avec **12 testeurs opt-in pendant 14 jours consécutifs** avant la demande de production.
10. Vérifier la compatibilité **16 Ko** (si des bibliothèques natives sont incluses) et le rapport pré-lancement Google Play. Corriger les anomalies bloquantes avant de demander la publication.

## Informations et contrôles essentiels

- Google Play exige **l'API 36** pour les nouvelles applications Android classiques depuis le 31 août 2026.
- `assembleDebug` reste destiné au test local. `bundleRelease` produit l'AAB.
- Conserver l'identifiant de package et l'accès à la clé d'importation.
- Le refus d'une politique, d'un accès ou d'un formulaire Play ne prouve pas un bug de l'application : ces démarches appartiennent au compte développeur et doivent être traitées dans Play Console.
