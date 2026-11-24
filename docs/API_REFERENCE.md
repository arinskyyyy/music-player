# SyncRoom API Reference

## Authentication Endpoints
- `POST /api/auth/register` - Register a new listener account.
- `POST /api/auth/login` - Login with username/email and password.
- `POST /api/auth/google` - Verify Google OAuth ID token & authenticate/register user.
- `POST /api/auth/apple` - Verify Apple ID token & authenticate/register user.
- `POST /api/auth/forgot-password` - Request a password reset code.
- `POST /api/auth/reset-password` - Reset password using 6-digit code.
- `GET /api/auth/me` - Get current authenticated user profile.

## Music Endpoints
- `GET /api/music/catalog` - Retrieve curated pixel music catalog.
- `GET /api/music/search` - Search local catalog tracks.
- `GET /api/music/external-search` - Search internet streams (Audius, Deezer, iTunes).
- `GET /api/music/favorites` - Get user saved favorites.
- `POST /api/music/favorites` - Toggle favorite track.
- `GET /api/music/playlists` - List user playlists.
- `POST /api/music/playlists` - Create new playlist.
- `PUT /api/music/playlists/{id}` - Rename playlist.
- `DELETE /api/music/playlists/{id}` - Delete playlist.
- `POST /api/music/playlists/{id}/tracks` - Add track to playlist.
- `DELETE /api/music/playlists/{id}/tracks/{track_id}` - Remove track from playlist.

## User Endpoints
- `GET /api/user/stats` - Retrieve user recent tracks and play counts.
- `POST /api/user/stats` - Update user listening stats.
