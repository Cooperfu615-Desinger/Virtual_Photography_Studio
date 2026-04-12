# Firebase Favorites Rules

Use these Firestore rules for Virtual Photography Studio Favorites sync.

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
