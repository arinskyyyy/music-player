# SyncRoom WebSocket Protocol

Endpoint: `/ws/rooms/{room_code}?username={username}`

## Server -> Client Events
- `ROOM_STATE_INIT`: Complete room state sent to newly connected listener.
- `LISTENERS_UPDATE`: Roster of online listeners and host identifier.
- `HOST_UPDATE`: Broadcast when leadership is transferred or migrated.
- `SYNC_PLAY`: Broadcast when host starts playback with server time.
- `SYNC_PAUSE`: Broadcast when host pauses playback with current time.
- `SYNC_SEEK`: Broadcast when host seeks to a new timestamp.
- `SYNC_CHANGE_TRACK`: Broadcast when host switches currently playing track.
- `SYNC_UPDATE_QUEUE`: Broadcast when queue is modified.
- `SYNC_WALLPAPER`: Broadcast when host changes background pixel art.
- `KICKED`: Direct notification to listener removed by room host.
- `ERROR`: Warning when non-host attempts restricted actions.

## Client -> Server Actions
- `PLAY`: Start playback at specified `current_time`.
- `PAUSE`: Pause playback at specified `current_time`.
- `SEEK`: Jump to timestamp in seconds.
- `CHANGE_TRACK`: Select a new track dictionary.
- `UPDATE_QUEUE`: Update array of queued tracks.
- `GIVE_LEADERSHIP`: Transfer host status to `target_name`.
- `KICK_USER`: Disconnect listener `target_name`.
- `CHANGE_WALLPAPER`: Change room visual wallpaper.
