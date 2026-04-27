# Download Path Switcher

Firefox does not expose a WebExtension API that directly changes the browser's global default download folder. This project uses the workable approach instead:

- the extension stores multiple saved folders
- you check one folder to make it active
- when a Firefox download finishes, a native Windows helper moves the file into the active folder

That gives you the fast "switch between saved destinations" workflow without manually changing Firefox settings every time.

## Quick setup

You must run this command before the extension can move downloads:

```powershell
.\scripts\install-native-host.ps1
```

That command registers the Windows native helper with Firefox for your current Windows user.

After that:

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click `Load Temporary Add-on`.
4. Select [manifest.json](C:/Users/yater/Documents/GitHub/filelocation/manifest.json).
5. Open the extension popup and confirm `Native helper` says `Connected`.

If Firefox still shows `Not installed`, restart Firefox once and check again.

## Project layout

- `manifest.json`: Firefox extension manifest
- `background.js`: listens for completed downloads and calls the native host
- `popup/`: quick switcher UI
- `options/`: manage saved paths
- `native-host/`: Windows native messaging helper
- `scripts/install-native-host.ps1`: registers the native host for the current Windows user

## Firefox APIs used

- `storage` for saving folder presets
- `downloads` for detecting completed downloads
- `nativeMessaging` for handing file moves to a local helper

This matches Mozilla's WebExtension model:

- Firefox extensions can store settings via the `storage` API and provide an options page. Source: MDN `storage` and `Implement a settings page`.
- Firefox extensions can watch downloads, and `downloads.download()` only accepts a filename relative to the default downloads directory, not an arbitrary absolute path. Source: MDN `downloads` and `downloads.download()`.
- Native messaging is the supported way for a Firefox extension to reach local OS resources not exposed by WebExtension APIs. Source: MDN `Native messaging`.

Sources:

- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Implement_a_settings_page
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads
- https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/download
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging

## How to set up the extension

### 1. Register the native helper

Open PowerShell in the repo root and run:

```powershell
.\scripts\install-native-host.ps1
```

This is required. Without it, the extension UI can load, but downloads will not be moved to your selected folder.

The command writes:

- `native-host/location-switcher-host.manifest.json`
- `HKCU\Software\Mozilla\NativeMessagingHosts\com.filelocation.download_path_switcher`

Firefox uses that registry entry to find the local helper process.

### 2. Add the extension to Firefox

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click `Load Temporary Add-on`.
4. Select [manifest.json](C:/Users/yater/Documents/GitHub/filelocation/manifest.json).

This loads the extension temporarily for development.

### 3. Confirm the helper is connected

1. Click the extension icon.
2. Look at `Native helper`.
3. It should say `Connected`.

If it says `Not installed`:

1. Make sure you ran:

```powershell
.\scripts\install-native-host.ps1
```

2. Restart Firefox once.
3. Reload the temporary add-on in `about:debugging`.

### 4. Add your folders

1. Open the extension popup.
2. Click `Manage`.
3. Add one or more absolute Windows paths such as:

```text
C:\Users\yater\Downloads\TestA
C:\Users\yater\Downloads\TestB
```

4. Check the folder you want active.

### 5. Test it

1. Download a file in Firefox.
2. Wait for the download to complete.
3. The helper should move the file into the currently checked folder.
4. The popup's `Last result` section will show success or the error message.

## How to uninstall it

### Remove the extension from Firefox

If it is loaded as a temporary add-on:

1. Open `about:debugging#/runtime/this-firefox`.
2. Find `Download Path Switcher`.
3. Click `Remove`.

If Firefox has been closed already, the temporary add-on is already gone, because temporary add-ons do not survive a browser restart.

### Remove the native helper from Windows

Open PowerShell and run:

```powershell
Remove-Item 'HKCU:\Software\Mozilla\NativeMessagingHosts\com.filelocation.download_path_switcher' -Force
Remove-Item '.\native-host\location-switcher-host.manifest.json' -Force
```

That removes:

- the Firefox registry entry for the helper
- the generated native host manifest file

The source files in this repo stay on disk unless you delete the repo yourself.

## Current constraints

- This is Windows-only as written because the native helper and installer target PowerShell and the Windows registry.
- The extension moves the file after the download completes. It does not rewrite Firefox's own internal download-folder preference.
- If Firefox is set to always ask where to save each file, the file will still download first, then the helper will move it afterward.
- This is loaded as a temporary add-on for development. For long-term use, you would package and sign it for Firefox distribution.
