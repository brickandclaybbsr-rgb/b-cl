# ⚠️ CRITICAL — Google Play signing keys. DO NOT DELETE THIS FOLDER.

This folder exists because the original `b-clay.jks` upload key was deleted
from `C:\Users\surya\Downloads\B&CL Android\` with no backup anywhere,
forcing a multi-day Google Play "upload key reset." That must never happen
again — so these files are committed to git and pushed to GitHub, which
means they survive even if this machine, this folder, or your Downloads
folder is wiped. **Still also copy this whole folder to Google Drive and a
USB drive today.** Git is a safety net, not a substitute for a real backup.

---

## ✅ THE KEY THAT MATTERS — `upload-key.jks`

This is your **current, active** Google Play upload key (generated 26 Jul 2026
after the reset). It went live **28 Jul 2026, ~11:34 AM IST**. Every future
app release must be signed with this key.

| | |
|---|---|
| File | `upload-key.jks` |
| Store password | `BrickAndClay@2026` |
| Key alias | `upload` |
| Key password | `BrickAndClay@2026` |
| SHA-1 | `72:24:43:1F:E4:F9:CC:04:C6:05:74:8B:CB:E5:94:25:76:15:7F:F0` |
| SHA-256 | `B0:9A:00:6E:48:73:94:58:5E:4C:C6:15:2C:B7:88:40:E9:42:1B:F3:09:E8:F5:33:97:BE:16:25:F7:55:E2:C3` |

`android/app/build.gradle` already points at a copy of this file at
`android/app/upload-key.jks` for local builds — that copy is convenience only;
**this folder is the source of truth / backup.** If the local copy is ever
lost, restore it from here (or `git checkout` this file) before building.

`UPLOAD-KEY-certificate.pem` in this folder is the exported public certificate
for this same key — that's what gets submitted to Play Console during a key
reset, kept here for reference.

---

## ❌ DEAD KEYS — kept only for historical reference, do NOT use

- **`b-clay.jks`** — the ORIGINAL upload key. SHA-1 `D5:C9:C8:CD:ED:71:C4:1E:4A:6F:B5:9D:39:C7:8C:74:F7:10:92:78`.
  **This file is permanently lost** (deleted, not recoverable — checked every
  drive and the Recycle Bin). This is *why* `upload-key.jks` above exists.

- **`old-unused-signing.keystore`** / **`old-unused-signing-key-info.txt`** —
  a PWABuilder-generated key (alias `my-key-alias`, SHA-1 `E7:BF:31:FB:B2:AC:
  6F:81:4E:A2:C3:7E:26:14:35:01:0F:DD:8E:2A`) that was briefly tried as a
  replacement but is **NOT** what Google has on file. Not currently in use.
  Kept only so nobody rediscovers it and gets confused about which key is real.

---

## If you ever need to reset the upload key again

1. Generate a new keystore with `keytool -genkeypair` (ask Claude/a developer
   to do this — same process as before).
2. Export its certificate: `keytool -export -rfc -keystore <file> -alias <alias> -file cert.pem`
3. Play Console → your app → **Test and release → Setup → App integrity →
   Play app signing → Request upload key reset** → reason "lost key" →
   upload `cert.pem`.
4. Wait ~1–2 business days for Google's approval email.
5. Update `android/app/build.gradle`'s `signingConfigs.release` to point at
   the new keystore/alias/passwords, and **update this README** with the new
   details — replace the old key's fingerprint under "DEAD KEYS" above.
6. **Immediately back up the new keystore here AND to Drive/USB.**
