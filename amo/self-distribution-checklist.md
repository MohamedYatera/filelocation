# Unlisted release checklist

## Before signing

1. Confirm `manifest.json` has the correct version number.
2. Confirm the extension works in Firefox.
3. Confirm the native helper works on Windows.
4. Make sure `web-ext` is installed:

```powershell
web-ext --version
```

## Build

```powershell
.\scripts\build-extension.ps1
```

## Sign as unlisted

Set your AMO API credentials in the current PowerShell session:

```powershell
$env:AMO_JWT_ISSUER = "your-api-key"
$env:AMO_JWT_SECRET = "your-api-secret"
```

Then run:

```powershell
.\scripts\sign-unlisted.ps1
```

## Distribute to users

Give users:

- the signed `.xpi` file from `web-ext-artifacts`
- the native helper install command:

```powershell
.\scripts\install-native-host.ps1
```

## User install flow

1. Run the native helper installer command.
2. Open Firefox.
3. Open `about:addons`.
4. Click the gear icon.
5. Click `Install Add-on From File`.
6. Select the signed `.xpi`.
