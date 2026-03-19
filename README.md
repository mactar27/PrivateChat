# PrivateChat

Une application de messagerie privée moderne et sécurisée construite avec Next.js, TypeScript et MySQL.

## 📺 Démonstration
https://github.com/mactar27/PrivateChat/blob/main/Test.mp4

## 🌟 Fonctionnalités

### Messagerie
- **Chat en temps réel** avec WebSockets
- **Conversations privées et de groupe**
- **Partage de fichiers** (images, documents, audio)
- **Statuts de messages** (envoyé, livré, lu)
- **Notifications push** pour les nouveaux messages

### Appels Audio/Vidéo
- **Appels vidéo 1-à-1** avec WebRTC
- **Appels audio** de haute qualité
- **Contrôle des permissions** (caméra, micro)
- **Interface intuitive** pour les appels

### Sécurité & Authentification
- **Authentification sécurisée** avec bcrypt
- **Gestion des sessions** avec tokens
- **Protection des données** utilisateur
- **Interface d'inscription/connexion**

### Interface Utilisateur
- **Design moderne** avec Tailwind CSS
- **Mode sombre/clair** automatique
- **Interface responsive** pour mobile/desktop
- **Composants UI** de haute qualité avec Radix UI

## 🛠️ Stack Technique

### Frontend
- **Next.js 16** - Framework React full-stack
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling moderne
- **Radix UI** - Composants accessibles
- **Lucide React** - Icônes
- **React Hook Form** - Gestion des formulaires
- **SWR** - Gestion des données

### Backend & Base de données
- **MySQL** - Base de données relationnelle
- **Socket.io** - WebSockets pour le temps réel
- **WebRTC (Simple Peer)** - Appels audio/vidéo
- **bcrypt** - Hashage des mots de passe

### Développement
- **ESLint** - Linting du code
- **PostCSS** - Processing CSS
- **pnpm** - Gestion des paquets

## 📋 Prérequis

- Node.js 18+ 
- MySQL 8.0+
- pnpm (recommandé) ou npm

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone https://github.com/mactar27/PrivateChat.git
cd PrivateChat
```

### 2. Installer les dépendances
```bash
pnpm install
```

### 3. Configurer la base de données
Créez une base de données MySQL et exécutez le script de création :

```sql
-- Créer la base de données
CREATE DATABASE privatechat;

-- Utiliser la base de données
USE privatechat;

-- Exécuter le script de création des tables
SOURCE scripts/001-create-tables.sql;
```

### 4. Configurer les variables d'environnement
Créez un fichier `.env.local` à la racine du projet :

```env
# Base de données MySQL
DATABASE_URL="mysql://username:password@localhost:3306/privatechat"

# Clé secrète pour les sessions
NEXTAUTH_SECRET="votre-clé-secrète-a-generer"

# URL de l'application
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Lancer l'application
```bash
# Mode développement
pnpm dev

# Mode production
pnpm build
pnpm start
```

L'application sera disponible sur `http://localhost:3000`

## 📁 Structure du Projet

```
PrivateChat/
├── app/                    # Pages Next.js
│   ├── (auth)/            # Pages d'authentification
│   ├── api/               # Routes API
│   ├── settings/          # Page des paramètres
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React
│   ├── chat/             # Composants de chat
│   ├── ui/               # Composants UI réutilisables
│   └── ...               # Autres composants
├── lib/                   # Bibliothèques utilitaires
│   ├── auth.ts           # Configuration authentification
│   ├── db/               # Accès base de données
│   ├── types.ts          # Types TypeScript
│   └── utils.ts          # Fonctions utilitaires
├── public/               # Assets statiques
├── scripts/             # Scripts SQL
└── styles/              # Fichiers CSS
```

## 🗄️ Schéma de la Base de Données

L'application utilise 7 tables principales :

- **users** - Informations des utilisateurs
- **conversations** - Conversations privées et de groupe
- **conversation_participants** - Participants aux conversations
- **messages** - Messages envoyés
- **message_attachments** - Pièces jointes des messages
- **sessions** - Sessions d'authentification
- **user_contacts** - Contacts et blocages

## 🔧 Configuration

### Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion MySQL | `mysql://user:pass@localhost:3306/db` |
| `NEXTAUTH_SECRET` | Clé secrète pour les tokens | `votre-clé-secrète` |
| `NEXTAUTH_URL` | URL de l'application | `http://localhost:3000` |

### Personnalisation

#### Thème et Couleurs
Le thème utilise Tailwind CSS. Vous pouvez modifier les couleurs dans `tailwind.config.js`.

#### Base de Données
Le schéma peut être modifié en éditant les scripts SQL dans le dossier `scripts/`.

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Docker
```bash
# Construire l'image
docker build -t privatechat .

# Lancer le conteneur
docker run -p 3000:3000 privatechat
```

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous license MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens Utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Radix UI](https://www.radix-ui.com/)
- [Documentation Socket.io](https://socket.io/docs/)

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository GitHub.

---

**Développé avec ❤️ par [mactar27](https://github.com/mactar27)**
