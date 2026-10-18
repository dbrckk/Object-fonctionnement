# Object Fonctionnement

Application Android éducative consacrée au fonctionnement et à l'utilisation des objets du quotidien.

## Démarrage

Projet Capacitor + Vite, hors ligne, sans compte ni publicité. Exécuter `npm install`, `npm run check`, `npm run build`. Pour Android : `npm run android:sync` puis ouvrir `android/` avec Android Studio (après `npx cap add android`).

## Sources et licences

ColorFigures (https://april-zhu.com/colorfigures) est une référence de présentation : objets isométriques interactifs en fichiers HTML autonomes. Les éléments tiers ne sont pas copiés sans vérification de leur licence. Le ZIP de référence est disponible à https://april-zhu.com/colorfigures/colorfigures.zip. Les illustrations incluses dans ce dépôt sont originales.

## Fonctionnalités v0.1

- Catalogue d'objets accessible hors ligne
- Recherche et filtres par catégories
- Fiches comprenant description, principe de fonctionnement, étapes d'utilisation et avertissements
- Démonstrations interactives simples (états marche/arrêt et progression)
- Favoris conservés localement
- Mise en page adaptée aux smartphones Android

Pour ajouter un objet, étendre la collection `OBJECTS` dans `src/main.js`.
