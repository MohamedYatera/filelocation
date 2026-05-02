# Reviewer notes for AMO

Extension name: Download Path Switcher

Primary function:

- Lets the user save multiple Windows download folders.
- Lets the user mark one folder as active.
- Lets the user configure Firefox's normal default download folder so manual `Save As` locations can be left untouched.
- When a Firefox download completes, the extension sends the completed local file path and the selected target directory to a local Windows native messaging host.
- The native host moves the file into the selected directory.

Why `nativeMessaging` is required:

- Firefox WebExtensions do not provide an API to set an arbitrary absolute Windows download path directly.
- Firefox exposes download events, but filesystem access to arbitrary local folders is handled through a local native host.

Data flow:

- No data is sent to any remote server.
- The extension sends only two values to the local native host:
  - `sourcePath`: the completed download's local path from Firefox
  - `targetDirectory`: the Windows folder selected by the user
- The host runs locally on the user's Windows machine and moves the file.
- If the user configures a Firefox default download folder in the extension settings, the extension only moves files that first land in that folder. Files saved manually somewhere else through Firefox's `Save As` dialog are left where the user chose.

Windows-only behavior:

- This add-on is intended for desktop Firefox on Windows.
- It relies on a PowerShell-based native messaging host and a per-user Windows registry entry.

Native host installation:

- The native host is not bundled inside the signed extension package.
- It is installed by the user locally with:

```powershell
.\scripts\install-native-host.ps1
```

Native host files in the source repo:

- `native-host/location-switcher-host.ps1`
- `native-host/location-switcher-host.cmd`
- `scripts/install-native-host.ps1`

How to test:

1. Install the native host on Windows with:

```powershell
.\scripts\install-native-host.ps1
```

2. Install the signed extension.
3. Open the popup and confirm the native helper status shows `Connected`.
4. Add two Windows folders in the options page, for example:
   - `C:\Users\<user>\Downloads\TestA`
   - `C:\Users\<user>\Downloads\TestB`
5. Mark `TestA` active.
6. Download a file in Firefox.
7. After download completion, confirm the file is moved into `TestA`.
8. Mark `TestB` active.
9. Download another file.
10. Confirm the second file is moved into `TestB`.

Expected limitation:

- The extension does not modify Firefox's built-in global download-folder preference.
- It moves files after download completion.
