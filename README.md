# Download Path Switcher

Download Path Switcher is a Windows-only Firefox extension that lets you save multiple download folders, choose one as active, and automatically move completed Firefox downloads into that folder.

Firefox does not expose a normal WebExtension API to directly set an arbitrary absolute Windows download folder. This project uses the supported workaround:

- the extension watches completed downloads
- the extension stores your saved folder list and active folder
- a local Windows native helper moves the finished file into the active folder

Image files are never auto-moved by the extension. They stay wherever you save them in Firefox. For other file types, if you want files saved through Firefox's `Save As` dialog to stay exactly where you chose, set your normal Firefox default download folder in the extension's `Routing behavior` section. The extension will then only auto-move files that first land in that default folder.

## What you must install

This project has two parts:

1. The Firefox extension
2. The Windows native helper

The extension alone is not enough. You must also register the native helper on Windows.

## Quick local test setup

Open PowerShell in the repo root and run:

```powershell
.\scripts\install-native-host.ps1
```

Then open Firefox and load the extension temporarily:

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on`
3. Select [manifest.json](C:/Users/yater/Documents/GitHub/filelocation/manifest.json)

Open the extension popup and confirm `Native helper` says `Connected`.

## Permanent install path

For a permanent install in regular Firefox, you need a signed `.xpi`.

This repo is prepared for the Firefox `unlisted` self-distribution path:

- Mozilla signs the extension
- the extension is not publicly listed on AMO
- you install the signed `.xpi` from file in Firefox

## Exact websites you will use

### AMO Developer Hub

Use this to create your developer account and manage submissions:

- https://addons.mozilla.org/developers/

### AMO API credentials

Use this to generate your API key and secret for `web-ext sign`:

- https://addons.mozilla.org/developers/addon/api/key/

### Firefox Extension Workshop documentation

Official signing and distribution overview:

- https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/

Official self-distribution guide:

- https://extensionworkshop.com/documentation/publish/self-distribution/

Official install-from-file guide:

- https://extensionworkshop.com/documentation/publish/install-self-distributed

## One-time setup for publishing

### 1. Install `web-ext`

Run:

```powershell
npm install --global web-ext
web-ext --version
```

### 2. Create your AMO developer account

1. Go to https://addons.mozilla.org/developers/
2. Sign in with a Mozilla account
3. Accept the developer agreement if prompted

### 3. Create AMO API credentials

1. Go to https://addons.mozilla.org/developers/addon/api/key/
2. Create an API key and secret
3. Keep both values

You will use them with the signing script.

## Files added for release

- [web-ext-config.mjs](C:/Users/yater/Documents/GitHub/filelocation/web-ext-config.mjs): tells `web-ext` what to package and what to exclude
- [scripts/build-extension.ps1](C:/Users/yater/Documents/GitHub/filelocation/scripts/build-extension.ps1): builds the extension package
- [scripts/sign-unlisted.ps1](C:/Users/yater/Documents/GitHub/filelocation/scripts/sign-unlisted.ps1): signs the extension for unlisted self-distribution
- [amo/reviewer-notes.md](C:/Users/yater/Documents/GitHub/filelocation/amo/reviewer-notes.md): reviewer notes to paste into AMO if needed
- [amo/self-distribution-checklist.md](C:/Users/yater/Documents/GitHub/filelocation/amo/self-distribution-checklist.md): release checklist

## Exact commands to build and sign

### 1. Build the package

From the repo root:

```powershell
.\scripts\build-extension.ps1
```

This creates the extension package in `web-ext-artifacts`.

### 2. Set your AMO credentials in PowerShell

Use your real values:

```powershell
$env:AMO_JWT_ISSUER = "your-api-key"
$env:AMO_JWT_SECRET = "your-api-secret"
```

### 3. Sign for unlisted distribution

Run:

```powershell
.\scripts\sign-unlisted.ps1
```

That submits the extension to Mozilla for unlisted signing and downloads the signed `.xpi` into `web-ext-artifacts`.

## Exact submission flow

You have two valid ways to submit the unlisted version.

### Option A: recommended here, use the signing script

1. Create your AMO API credentials
2. Run:

```powershell
.\scripts\build-extension.ps1
$env:AMO_JWT_ISSUER = "your-api-key"
$env:AMO_JWT_SECRET = "your-api-secret"
.\scripts\sign-unlisted.ps1
```

3. Wait for Mozilla signing/validation to complete
4. The signed `.xpi` will be placed in `web-ext-artifacts`

### Option B: website upload

1. Go to https://addons.mozilla.org/developers/
2. Click `Submit a New Add-on`
3. Choose `On your own`
4. Upload the built package from `web-ext-artifacts`
5. If asked for source/reviewer details, use [amo/reviewer-notes.md](C:/Users/yater/Documents/GitHub/filelocation/amo/reviewer-notes.md)
6. Download the signed `.xpi` after signing completes

## Install the signed extension permanently

Once you have the signed `.xpi`:

### 1. Install the native helper on Windows

In PowerShell at the repo root:

```powershell
.\scripts\install-native-host.ps1
```

### 2. Install the signed `.xpi` in Firefox

1. Open Firefox
2. Open `about:addons`
3. Click the gear icon
4. Click `Install Add-on From File`
5. Select the signed `.xpi`
6. Accept the install prompt

### 3. Confirm it works

1. Open the extension popup
2. Confirm `Native helper` shows `Connected`
3. Click `Manage`
4. In `Routing behavior`, set your Firefox default download folder if you want manual `Save As` locations to be left alone
5. Add folder paths such as:

```text
C:\Users\yater\Downloads\TestA
C:\Users\yater\Downloads\TestB
```

6. Check one folder as active, or leave all saved folders unchecked to use Firefox's default location without removing them
7. Download a file in Firefox
8. Confirm the file is moved into the selected folder

## Updating the extension later

For every new release:

1. Increase the version in [manifest.json](C:/Users/yater/Documents/GitHub/filelocation/manifest.json)
2. Rebuild:

```powershell
.\scripts\build-extension.ps1
```

3. Re-sign:

```powershell
.\scripts\sign-unlisted.ps1
```

4. Distribute the new signed `.xpi`

## How to uninstall

### Remove the Firefox extension

If installed from file:

1. Open `about:addons`
2. Find `Download Path Switcher`
3. Click `Remove`

### Remove the native helper

Run:

```powershell
.\scripts\uninstall-native-host.ps1
```

That removes:

- `HKCU\Software\Mozilla\NativeMessagingHosts\com.filelocation.download_path_switcher`
- `native-host/location-switcher-host.manifest.json`

## Current manifest/release choices

This repo has already been adjusted for modern AMO submission:

- fixed extension ID is present
- built-in Firefox data transmission declaration is present
- minimum Firefox version is set to `140.0`
- packaging excludes local helper scripts and docs from the signed extension archive

## Firefox APIs used

- `storage`
- `downloads`
- `nativeMessaging`

## Sources

- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/downloads
- https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/download
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings
- https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
- https://extensionworkshop.com/documentation/publish/submitting-an-add-on/
- https://extensionworkshop.com/documentation/publish/self-distribution/
- https://extensionworkshop.com/documentation/publish/install-self-distributed
- https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/
- https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
