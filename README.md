# Jérémy FROMENT
#### Pictionnary (NodeJS)

Exécutez la commande `npm install` à la racine du projet
Importez la base de données MySql (fichier bdd.sql)

Pour modifier les informations de connexion à la base de données (port, user etc..) modifier dans le fichier server.js la variable infoConnexion : 
`var infoConnexion  = {
    host     : 'localhost',
    user     : 'test',
    password : 'test',
    database : 'pictionnary',
    port     : 8889
};`

Se connecter avec l'utilisateur admin : 
* Email : toto@toto.fr
* Mot de passe : totototo

Pour lancer le serveur, allez à la racine du projet et exécutez `node server.js`
Une fois lancé, le serveur devrait être accessible à l'adresse <http://localhost:1313> ou <http://VOTRE-IP:1313> (pour avoir accés sur un mobile, connecté au même réseau par exemple)
