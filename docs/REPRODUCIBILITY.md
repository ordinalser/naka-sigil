# Reproduce the calculation

[English](#one-block-one-formula) · [中文](#中文)

## One block, one formula

Naka Sigil v0.10.3 uses the rules published **2026-10-08**: [main announcement](https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694) and [zero-listing supplement](https://x.com/Ob1_Wan_Satoshi/status/2108032971617997133). The implementation and boundary tests are [rules.js](../src/lib/rules.js) and [rules.test.js](../test/rules.test.js). These links identify the supported rule revision; they do not certify the official quarterly result.

Total = base **100%** + each trait bonus + highest applicable number bonus, capped at **400%**. Trait price / collection floor thresholds are inclusive: **1.25× → +25%, 1.5× → +50%, 2× → +75%, 3× → +100%**. Number tiers are exclusive upper bounds: **Sub10 +200%, Sub100 +100%, Sub1K +50%**, highest only. Integer cross multiplication avoids floating-point threshold errors.

After sale removes **only that NFT's listing**, recalculates collection/trait floors, and records that hypothetical sale as the latest sale for its traits. A trait with no remaining listings and at least 20 catalog pieces receives +100%; smaller traits use latest-sale evidence. Unresolved evidence remains a range. Each comparison column starts from the same original snapshot, independently; selecting multiple NFTs does not simulate buying them together.

The minimum filter uses the **lower endpoint**: 250–350% passes 250%, fails 300%. No collection floor after a sale means **Unavailable**, not 0% or 400%. Unlisted NFTs use their holding formula and are not included among sale candidates. All totals include the base; before-sale references are formula values, not current earnings. Listed NFTs earn no rewards. Quarterly measurement height and eligibility remain unverified.

## Three bundled examples

Open [demo/naka-sigil-demo.html](../demo/naka-sigil-demo.html) from a downloaded source folder in a browser; no installation, key, wallet connection, local server or API request is needed. NFT thumbnails are optional requests to the public inscription content host; a pixel fallback appears offline. The demo is explicitly a **bundled snapshot**, not a live listing feed. The same JavaScript engines drive the demo and installed extension.

At **block 971,025**, collection floor **150,000 sats**, the default examples are:

| Shielded number | Snapshot ask (sats) | Before-sale formula | After sale | Changes that raise bonuses |
| --- | ---: | ---: | ---: | --- |
| 1758 | 176,900 | 100% | 325% | Ape +0 → +25%; Red Stripe Tee +0 → +100%; Blue Krusty Clown Mohawk +0 → +100% (last two zero-listed, supply ≥20) |
| 1565 | 178,000 | 100% | 300% | Red Jersey +0 → +100%; White Crazy +0 → +75%; 8 Bit Glasses +0 → +25% |
| 1706 | 179,800 | 100% | 275% | Orange Stripe Tee +0 → +100% (zero-listed, supply ≥20); Red Skinbyrd +0 → +75% |

The collection floor stays 150,000 sats in each independent example. Input changes without a bonus change are still marked. Snapshot prices exclude fees and are not current quotes. Reproduce the values with the shared modules, or query these numbers in the popup/workspace while the bundled snapshot is selected.

## Verification

Run `npm test` then `npm run package:chrome`. The suite covers inclusive thresholds, number boundaries, caps, zero-listing supply and sale evidence, floor recalculation, input immutability, independent comparison order, conservative ranges, corrupt selection recovery, and simultaneous tab additions capped at four. Packaging validates all catalog items, unchanged public extension identity, explicit file allowlists, canonical icons, archive bytes and private-data patterns. The download's **SHA-256** is in [release/SHA256SUMS](../release/SHA256SUMS).

This proves consistency with the implemented assumptions, not unpublished official eligibility or future market behavior. See [RULES_AUDIT.md](RULES_AUDIT.md) for evidence limitations and [PRIVACY.md](PRIVACY.md) for data scope.

## 中文

v0.10.3 使用 **2026-10-08** 发布的[主规则](https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694)与[零挂单补充规则](https://x.com/Ob1_Wan_Satoshi/status/2108032971617997133)。总权重 = 基础 **100%** + 特征加成 + 最高编号加成，封顶 **400%**。特征比值门槛含等号：**1.25×/+25%、1.5×/+50%、2×/+75%、3×/+100%**；编号严格小于 **10/+200%、100/+100%、1000/+50%**，仅取最高档。门槛使用整数交叉相乘判断。

成交后仅移除该枚挂单，重新计算集合与特征地板，并把该假设成交作为相关特征的最新成交依据。零挂单且目录数量至少20的特征加100%；更小特征使用最新成交依据。证据不足保留区间。比较中的每列从同一个原始快照独立计算，不是同时购买多枚的组合结果。

筛选按**区间下限**判断：250–350%通过250%门槛，不通过300%。成交后集合地板不存在则显示**无法计算**。未挂单藏品显示持有公式值，不进入成交候选。总权重均含基础；成交前公式值不是当前收益。挂单期间奖励为零；季度测量高度和奖励资格尚未核实。

下载源码后直接用浏览器打开 **demo/naka-sigil-demo.html**；无需安装插件、API key、钱包、服务器或 API 请求。缩略图可选地读取公开铭文内容，离线时显示像素备用图。演示明确标注为内置快照，复用插件计算代码，不是实时挂单。

上表三例均为**区块971,025、集合地板150,000聪**，分别独立成交：编号1758，挂价176,900聪，100%→325%，Body新增25%，Outfit和Hair各新增100%；编号1565，挂价178,000聪，100%→300%，Outfit新增100%、Hair新增75%、Eyes新增25%；编号1706，挂价179,800聪，100%→275%，Outfit新增100%、Hair新增75%。各情景集合地板保持150,000聪。输入改变但加成未变也会标注。价格不含费用，不是当前报价。

执行 **npm test** 与 **npm run package:chrome**。测试覆盖门槛、编号边界、封顶、零挂单及成交依据、地板重算、输入不可变、比较独立性、区间保守筛选、损坏选择恢复和多页签并发最多四枚。打包验证所有藏品、公开版ID、文件白名单、图标、压缩包字节与隐私模式。安装包 **SHA-256** 见 [release/SHA256SUMS](../release/SHA256SUMS)。这验证的是既定规则假设下的一致性，不验证未公布的资格规则或未来市场；局限见 [RULES_AUDIT.md](RULES_AUDIT.md)，隐私范围见 [PRIVACY.md](PRIVACY.md)。


## Block mode in Compare / 比较页的区块模式

The installed Compare page uses the same **Live / Fixed block** mode as the popup and market; neither mode offers a manual refresh control. In Live mode, a visible Compare tab keeps the shared automatic checks running, and new blocks replace the data on every surface. In Fixed block mode nothing updates automatically. Filtering, selection and image enlargement do not call the collection API. The no-install demo never updates; its bundled snapshot is labeled as such.

插件比较页与弹窗、市场页共用**实时 / 指定区块**模式，均不设置手动更新入口。实时模式下，比较页可见时同样会维持自动检查，新区块到来时所有页面一起更新；指定区块模式不自动更新。筛选、选择和放大图片都不请求集合 API。免安装演示不会更新，并明确标注为内置快照。
