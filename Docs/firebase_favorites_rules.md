# Firebase Favorites Rules

The version-controlled source of truth for Favorites access is `firestore.rules` at the repository root. `firebase.json` includes that file in Firebase deployment configuration.

Deploy rule changes with:

```bash
firebase deploy --only firestore:rules
```

Current rules:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isAllowedUser(userId) {
      return request.auth != null
        && request.auth.uid == userId
        && request.auth.token.email == "cooperfu.615@gmail.com";
    }

    match /users/{userId}/favorites/{favoriteId} {
      allow read, create, update, delete: if isAllowedUser(userId);
    }
  }
}
```

Current app data path:

```txt
users/{uid}/favorites/{promptId}
```

Only Favorites are synced to Firestore. Feed still uses browser local storage.
