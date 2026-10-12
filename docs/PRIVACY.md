# Privacy and public release scope

The public release is **Naka Sigil** (`naka-sigil`). It is assembled from an explicit file allowlist, separately from the surrounding development workspace.

## Included

- Extension runtime source and generated original sigil icons.
- Public snapshot: collection ID/name, block heights, creation time, public block header hash/timestamp, aggregate listing counts/floors, trait definitions, public inscription-to-trait mappings and `[inscription ID, price in sats]` listing pairs, plus numeric `[trait index, last sale price, confirmed height]` history summaries. No seller scripts, return keys, owner addresses or complete raw protocol events are retained.
- Build, snapshot, icon and download-packaging scripts; unit tests; documentation and license.
- The current ready-to-use Chrome ZIP in `release/`, its generated install guide and SHA-256 checksum. Its runtime is byte-identical to the audited build.
- A public-only Chrome manifest key with the public distribution’s existing ID. It grants no access to a private key or account.

## Excluded

- Surrounding repositories and their history/remotes/authors.
- Browser profiles, wallets, addresses belonging to the developer, notes, telemetry and local storage exports.
- Environment files, tokens, private signing keys, cookies, local automation credentials and browser-path configuration.
- Private browser automation integrations, screenshots, logs, OS metadata, `node_modules`, old distribution archives and temporary files.

Public inscription IDs are collection identifiers, not a list of the developer’s holdings. The snapshot contains no owner addresses, seller addresses, credentials or wallet secrets. The collection artwork is not copied into the release.

## Runtime permissions and network

`storage` stores snapshots/settings and up to four comparison inscription IDs locally. Clear removes the comparison list. Number lookup text is not persisted. `alarms` schedules minute checks in Live mode (the new-install default); Fixed mode clears the alarm. Saved explicit modes are preserved. Background API host permissions are `shielded-mint-server-production.up.railway.app` for collection data and `blockstream.info` for block header time. Content scripts match only `ord-dropz.xyz`. Blockstream requests contain only a block height; no NFT lookup, wallet address or ownership data is transmitted. The bundled timestamp works offline. Time requests occur during fixed-height loads or Live updates. A visible popup, Compare or market can trigger a Live check by default. The number itself is not sent; queries and comparison calculations add no API call. Fixed mode pauses automatic requests and rejects latest-refresh messages.

The comparison workspace and standalone demo optionally request NFT thumbnails from `ordinals.com/content/` with no referrer; inscription IDs and ordinary request metadata reach that public host. An offline pixel fallback is supplied. The demo makes no collection API requests or uploads and does not use extension storage.

There are no analytics or telemetry endpoints. Network traffic happens after an explicit fixed-height load or while Live mode has a visible market, Compare or popup. New installs use Live by default; choose Fixed to pause automatic checks. Ordinary HTTP request metadata, including IP address, is visible to the public API operator. The extension cannot control that operator’s retention policy.

## Release checks

Run `npm run privacy` before packaging or publication. The checker rejects unexpected files, symlinks, local paths, credential patterns, private extension identity, and suspicious snapshot fields. It also checks the built runtime and ready-to-use download, requires the current version/block filename, verifies the checksum and generated guide, and rejects ZIP comments, extra fields, trailing bytes and embedded gaps that could carry private metadata. The build omits ZIP extra fields, including local UID/GID information. It never prints matched secret values.

A static scan can verify the release’s known file types and patterns; it cannot prove the absence of every possible hidden encoding or future personal edit. `npm run package:chrome` rebuilds the public download and runs these checks. `npm run release` also creates the allowlisted source ZIP, including the ready-to-use download. Only the current generated install package is retained in `release/`; `dist/` remains ignored by Git. Regenerate release archives only from this directory and repeat the scan after changes. No GitHub submission is performed by these scripts.
