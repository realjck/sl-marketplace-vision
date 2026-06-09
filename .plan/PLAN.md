# SL MARKETPLACE VISION

Outil permettant d'afficher ses ventes Second Life sous forme de graphes à partir de fichiers CSV.

L'interface doit être en **anglais**.

Il s'agit d'une application Single Page de type DashBoard. L'utilisateur peut y glisser-déposer des fichiers CSV (voir fichier @exemple.csv pour la structure) dans une drop zone.

Pour le style graphique, se référer à @maquette.png, pour le framework prévoir React et Recharts ou Tremor pour l'affichage des graphes, react-dropzone, PapaParse pour le CSV, ... (à voir ce que tu connais d'autre sinon)

## Fonctionnement

L'utilisateur dépose ses fichiers CSV dans la drop zone (possibilités de plusieurs fichiers à la fois). Les données sont récupérées depuis le CSV et enregistrées en IndexedDB. Si un des fichiers a une erreur ou n'est pas formatté correctement, indiquer l'erreur dans une zone prévue à cet effet, ou sinon indiquer le nombre de transactions chargées.

L'utilisateur peut filtrer les résultats de deux manières :

- par produit : Par défaut, tous les produits sont sélectionnés. Prévoir une liste déroulante dans laquelle l'on peut cocher / décocher les produits qui doivent être pris en compte (en haut de liste prévoir "ALL" pour tout cocher / décocher)

- par Date Range : l'utilisateur peut sélectionner une plage de dates de début et de fin. Le graph affichera la plage demandée. Il y aura également un sélecteur rapide (all, last year, last month)

## Organisation de l'écran

Le design de dashboard pleine page sera divisé en plusieurs zones fluides :

### En haut à gauche : la Dropzone en pointillée avec une icone de fichier, on peut aussi cliquer pour aller chercher les fichier avec l'explorer.

### En haut au milieu : La zone de contrôle.

On a ici Le filtre pour le date range et les boutons sélection rapide. On a aussi le Filtre par produit (décrits plus haut)

### En haut à droite : L'affichage du CA et du nombre de ventes

On affichera les données dans des petites vignettes stylisées, avec le chiffre d'affaires, montant net, nombre de ventes. Ceci sera calculé en fonction des filtres choisis.

### En bas sur toute la largeur : la zone de graphs

On pourra ici choisir entre 3 types de graphiques :

- Le Graphique Principal : L'évolution (Aire lissée / Area Chart) cf @maquette.png. Permettre de basculer entre le chiffre d'affaires (L$) et le volume (nombre d'objets vendus)

- La répartition du catalogue : Le Top Articles (Barres horizontales / Horizontal Bar Chart). Les barres horizontales représentent les articles, et l'on peut basculer entre la vue en volume ou bien en CA. Les barres sont classées de la plus importante à la moints importante.

- La détection des tendances : Le Calendrier de chaleur (Heatmap). C'est un tableau quadrillé (7 jours de la semaine en lignes, 24 heures de la journée en colonnes) où les cases sont plus ou moins foncées selon le volume de ventes.

### A prévoir également : un bouton préférences.

Ce bouton aura pour l'instant juste une seule utilité : vider les données de l'IndexedDb (reset data, avec une modale de confirmation)

On y ajoutera d'autres fonctionnalités ensuite.
