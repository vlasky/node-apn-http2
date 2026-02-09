# Changelog

## [1.4.0] - 2025-02-05

### Breaking Changes

This release adds comprehensive input validation. Code that previously worked with invalid inputs will now throw errors. Review your code if you:

- **Set invalid property values**: All setters now validate inputs and throw on invalid values (e.g., non-integer `badge`, empty strings, invalid `priority` values)
- **Used the `action` property**: Removed; use `actionLocKey` for the standard `action-loc-key` field
- **Relied on silent failures**: Invalid `pushType`, `priority`, `collapseId` (>64 bytes), or `id` (non-UUID) values now throw
- **Omitted `topic`**: Now required for all notifications (was previously optional)
- **Had empty aps payloads**: Notifications without alert, badge, sound, or content-available now throw
- **Relied on push type warnings**: Auto-detection failures now throw errors instead of logging warnings (except when using `rawPayload`)

**Migration**: Most code will work unchanged. If you encounter new errors, they indicate issues that would have caused Apple to reject the notification anyway.

### Added
- **Connection timeout**: New `connectionTimeout` option (default 30s) prevents indefinite hangs when connecting to APNs
- **Payload size validation**: Notifications validated against Apple's size limits (4KB standard, 5KB for VoIP)
- **Device token validation**: Validates hexadecimal string format before sending
- **Concurrency limiting**: Respects APNs server's SETTINGS_MAX_CONCURRENT_STREAMS limit
- **ExpiredProviderToken handling**: If the JWT auth token expires mid-batch, automatically refreshes and retries (previously all remaining requests in the batch would fail)

### Changed
- **Comprehensive input validation**: All setters now validate their inputs and throw descriptive errors
  - `alert`: Validates non-empty string or object input; top-level arrays are rejected, and object field values must be non-empty strings or arrays of non-empty strings
  - `badge`: Validates non-negative integer; throws on non-number types
  - `sound`: Validates non-empty string or APSSound dictionary (name required, critical 0/1, volume 0-1); rejects arrays
  - `contentAvailable`, `mutableContent`: Now throw on invalid values (only accept true/false/1/0)
  - `topic`, `collapseId`, `id`, `mdm`, `category`, `threadId`: Validate non-empty strings
  - `expiry`: Validates non-negative integer
  - `priority`: Validates value is 1, 5, or 10
  - `pushType`: Validates against supported Apple push types (including `liveactivity` and `location`)
  - `locArgs`, `titleLocArgs`, `urlArgs`: Now allow empty arrays (per Apple docs)
  - `requestTimeout`: Validates positive number
- **collapseId**: Now enforces Apple's 64-byte limit
- **id (apns-id)**: Now validates UUID format
- **keyId/teamId**: Now validates 10-character alphanumeric format (case-insensitive)
- **Push type detection**: Now throws an error when push type cannot be auto-detected for standard payloads; rawPayload still warns
- **Setters accept null/undefined**: All setters accept null or undefined to clear values; internally standardized on undefined
- **Ping interval**: Changed from 10 minutes to 1 hour per Apple best practices

### Fixed
- **Badge zero handling**: `badge = 0` now correctly detected as visible content (previously treated as falsy)
- **Warning deduplication**: Push type warnings no longer repeat on multiple headers() calls
- **Payload 'aps' key conflict**: Now throws error if custom payload contains 'aps' key
- **Device token validation**: Validates non-empty hexadecimal format without enforcing a fixed token length
- **Error response parsing**: Non-JSON APNs error bodies no longer cause `send()` to throw during result mapping

### Removed
- **`action` property**: Removed non-standard `action` field from APSAlert; use `actionLocKey` for the standard `action-loc-key` field

## [1.3.0] - 2025-06-27

### Added
- Enhanced automatic detection of `apns-push-type` for alert and background notifications
- MDM notification support with automatic push type detection
- Push type validation for supported Apple push types (alert, background, voip, complication, fileprovider, mdm, pushtotalk, liveactivity, location)
- Better error messages when push type cannot be determined automatically

### Changed
- Updated jsonwebtoken to v9.0.2
- Updated TypeScript to v5.8.3
- Minimum Node.js version updated to 14.17.0

## [1.2.2] - 2021-04-08

### Changed
- Updated jsonwebtoken to v8.5.1
- Updated TypeScript to v4.2.4

## [1.2.1] - 2019-12-15

### Added
- Support for the `apns-push-type` attribute, required for iOS 13 (Vlad Lasky)
- HTTP/2 ping every 10 minutes to keep session alive (Peter Verhage)
- Connection check before creating requests to avoid excessive listeners (Peter Verhage)

### Fixed
- Correct `apns-priority` attribute value

## [1.2.0] - 2017-11-27

### Fixed
- Return potential error response body as object instead of string

## [1.1.0] - 2017-11-22

### Added
- Option to hide "ExperimentalWarning: The http2 module is an experimental API" message

## [1.0.1] - 2017-11-16

### Fixed
- Base64 encoded p8 token string not being correctly identified as a string

## [1.0.0] - 2017-11-13

### Changed
- Returned promise from `.send()` is now compatible with node-apn
