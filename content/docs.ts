// SPDX-License-Identifier: GPL-3.0-or-later
// The /docs and /docs/api pages, as Markdown (the subset in lib/markdown.ts).

export const GUIDE = `## Install

1. Download the latest \`rosu-vX.Y.Z-win64.exe\` from the [changelog](/changelog) or GitHub Releases. Put it in its own folder: Rosu keeps its working folders next to the exe.
2. Windows SmartScreen may say "unknown publisher" the first time, because the exe is not code-signed. Choose **More info → Run anyway**. You can check the download against the \`.sha256\` file published next to it.
3. On first start, Rosu creates \`Packs/\`, \`Output/\`, \`Library/\`, \`data/\` and \`logs/\` beside the exe. You can point each one somewhere else in **Settings**.

## The everyday flow

1. **Drop packs into \`Packs/\`.** Rosu reads \`.zip\`, \`.7z\` and \`.tar\` archives as well as loose \`.osz\` files. Every archive is security-checked before extraction (size caps, zip-bomb and path-traversal guards).
2. **Dashboard → Unpack Archives.** The beatmap sets land in \`Output/\`. Rosu records every set and which pack it came from.
3. **Copy to Library.** \`Library/\` is your permanent, deduplicated collection: one \`.osz\` per beatmap set, whatever pack it arrived in.
4. **Import to osu!.** Send the new sets to osu!lazer or osu!(stable) in one click. Each client can be turned on or off in Settings, and a turned-off client disappears from the whole app.
5. **Or let downloads come in by themselves:** **Settings → Watch a folder** (say, Downloads) adds every new \`.osz\` that lands there to the Library. Your files are never moved or deleted.

## Finding things

- **Search** ranks by artist, title and set name, and understands filters such as \`star>5 mode=mania key=7 bpm>=180 length<3:00 mapper=name\`. The **Filters** panel builds the same queries visually.
- **★ Saved** keeps a search under a name; **◀ ▶** step back and forward through recent searches; **▦ Gallery** shows the results as cover art; **Export…** writes them to CSV or JSON (the JSON feeds the [share card](/tools/share-card) and [Rosu Wrapped](/tools/wrapped)).
- **Where** shows where each set lives: 🎮 osu!lazer · 🕹️ osu!(stable) · 💾 Library · ☁️ Drive.
- Double-click a set for **Map Details**: every difficulty with its star rating, and a skillset radar for osu!mania.
- The **Packs** tab lists every pack series and flags the numbers you are missing.

## Shortcuts

One-click flows, each run as a job in the queue (live progress, cancel at any time):

- Transfer sets between osu!lazer and osu!(stable), skipping what the target already has.
- Save everything a client has installed into the Library.
- Export {Library, Drive-backed, a client, everything} to zip or 7z, optionally split into volumes and uploaded to Drive with a share link.
- **Prune** to reclaim disk space (videos, large images). There is a per-set preview first, everything removed goes to the Recycle Bin, and you can restore it later.
- **Remove from osu!**: take sets out of a client, optionally saving them to the Library first.
- **Browse Drive backup**: see everything in your Drive backup and restore chosen sets.
- **Move Library…**: move the Library to another folder or drive; every file is checked before Rosu switches over.
- **Same song, different sets…**: Rosu listens to each set's audio (with Chromaprint's \`fpcalc\`) and groups the sets that are the same song — re-encodes, re-uploads, TV-size cuts. You choose which to keep; the rest go to the Recycle Bin.

## Google Drive backup

**Settings → Drive → Connect** signs in with your Google account using the minimal \`drive.file\` permission, so Rosu can only ever see files it created. Backups upload only what is new, as chunk archives (1 GB by default) or one file per set. Several PCs can back up into the same Drive; the backup browser shows them all.

## When something breaks

- **Settings → Report a problem** sends a short report, with an optional screenshot, to the maintainer and shows you a private link to follow its status.
- **Settings → Send anonymous crash reports** (off by default): if something crashes, Rosu sends only the error type and the code locations involved. Details are on the [privacy page](/privacy).
- The **Logs** tab shows what Rosu did, line by line.

Rosu is free and open source (GPL-3.0-or-later), and unofficial: it is not affiliated with or endorsed by ppy Pty Ltd or osu!.`

/** The guide in Turkish (menu names are the app's Turkish labels). */
export const GUIDE_TR = `## Kurulum

1. En son \`rosu-vX.Y.Z-win64.exe\` dosyasını [sürüm notlarından](/changelog) ya da GitHub Releases'tan indirin. Kendi klasörüne koyun: Rosu çalışma klasörlerini exe'nin yanında tutar.
2. Windows SmartScreen ilk seferde "bilinmeyen yayımcı" diyebilir; exe kod imzalı değildir. **Ek bilgi → Yine de çalıştır**'ı seçin. İndirdiğiniz dosyayı yanında yayımlanan \`.sha256\` dosyasıyla doğrulayabilirsiniz.
3. İlk açılışta Rosu exe'nin yanına \`Packs/\`, \`Output/\`, \`Library/\`, \`data/\` ve \`logs/\` klasörlerini oluşturur. Her birini **Ayarlar**'dan başka bir yere yönlendirebilirsiniz.

## Günlük akış

1. **Paketleri \`Packs/\` klasörüne bırakın.** Rosu \`.zip\`, \`.7z\` ve \`.tar\` arşivlerini ve tek tek \`.osz\` dosyalarını okur. Her arşiv açılmadan önce güvenlik kontrolünden geçer (boyut sınırları, zip bombası ve yol aşımı korumaları).
2. **Panel → Arşivleri Aç.** Beatmap setleri \`Output/\` klasörüne çıkar. Rosu her seti ve hangi paketten geldiğini kaydeder.
3. **Library'e Kopyala.** \`Library/\` kalıcı, kopyasız koleksiyonunuzdur: hangi paketle gelirse gelsin her beatmap seti için tek bir \`.osz\`.
4. **osu!'ya Aktar.** Yeni setleri tek tıkla osu!lazer'e ya da osu!(stable)'a gönderin. Her istemci Ayarlar'dan açılıp kapatılabilir; kapatılan istemci uygulamanın her yerinden kaybolur.
5. **Ya da indirmeler kendiliğinden gelsin:** **Ayarlar → Bir klasörü izle** (örneğin İndirilenler), oraya düşen her yeni \`.osz\` dosyasını Library'ye ekler. Dosyalarınız asla taşınmaz ya da silinmez.

## Bir şey bulmak

- **Müzik Ara** sanatçı, başlık ve set adına göre sıralar; \`star>5 mode=mania key=7 bpm>=180 length<3:00 mapper=ad\` gibi filtreleri anlar. **Filtreler** paneli aynı sorguları görsel olarak kurar.
- **★ Kayıtlı** bir aramayı adıyla saklar; **◀ ▶** son aramalar arasında ileri geri gider; **▦ Galeri** sonuçları kapak görselleriyle gösterir; **Dışa aktar…** onları CSV ya da JSON olarak yazar (JSON, [paylaşım kartını](/tools/share-card) ve [Rosu Wrapped](/tools/wrapped)'i besler).
- **Konum** sütunu her setin nerede olduğunu gösterir: 🎮 osu!lazer · 🕹️ osu!(stable) · 💾 Library · ☁️ Drive.
- **Map detayları** için bir sete çift tıklayın: yıldız puanıyla her zorluk ve osu!mania için bir beceri radarı.
- **Arşivler** sekmesi her paket serisini listeler ve eksik numaraları işaretler.

## Kısayollar

Tek tıklık akışlar; her biri kuyrukta bir iş olarak çalışır (canlı ilerleme, istediğiniz an iptal):

- Setleri osu!lazer ile osu!(stable) arasında aktarın; hedefte olanlar atlanır.
- Bir istemcide kurulu olan her şeyi Library'ye kaydedin.
- {Library, Drive yedekli olanlar, bir istemci, her şey} seçeneklerini zip ya da 7z olarak dışa aktarın; isterseniz parçalara bölüp paylaşım bağlantısıyla Drive'a yükleyin.
- **Alan Tasarrufu (Prune)** ile disk alanı kazanın (videolar, büyük görseller). Önce set başına önizleme gelir, kaldırılan her şey Geri Dönüşüm Kutusu'na gider ve sonradan geri yükleyebilirsiniz.
- **osu!'dan Kaldır…**: setleri bir istemciden çıkarın; isterseniz önce Library'ye kaydedin.
- **Drive Yedeğine Göz At…**: Drive yedeğinizdeki her şeyi görün ve seçtiğiniz setleri geri yükleyin.
- **Library'yi Taşı…**: Library'yi başka bir klasöre ya da sürücüye taşıyın; Rosu geçiş yapmadan önce her dosya kontrol edilir.
- **Aynı şarkı, farklı setler…**: Rosu her setin sesini dinler (Chromaprint'in \`fpcalc\` aracıyla) ve aynı şarkı olan setleri gruplar — yeniden kodlamalar, yeniden yüklemeler, TV-size kısaltmalar. Hangilerini tutacağınızı siz seçersiniz; gerisi Geri Dönüşüm Kutusu'na gider.

## Google Drive yedeği

**Ayarlar → Google Drive yedeği → Google Drive'a Bağlan**, Google hesabınızla en dar \`drive.file\` izniyle oturum açar; böylece Rosu yalnızca kendi oluşturduğu dosyaları görebilir. Yedekler yalnızca yeni olanı yükler; parça arşivleri (varsayılan 1 GB) ya da set başına bir dosya olarak. Birden fazla bilgisayar aynı Drive'a yedekleyebilir; yedek tarayıcısı hepsini gösterir.

## Bir şeyler bozulduğunda

- **Ayarlar → Sorun bildir**, isteğe bağlı bir ekran görüntüsüyle birlikte kısa bir bildirimi geliştiriciye gönderir ve durumunu takip etmeniz için size özel bir bağlantı gösterir.
- **Ayarlar → Anonim çökme raporları gönder** (varsayılan kapalı): bir şey çökerse Rosu yalnızca hata türünü ve ilgili kod konumlarını gönderir. Ayrıntılar [gizlilik sayfasında](/privacy).
- **Loglar** sekmesi Rosu'nun ne yaptığını satır satır gösterir.

Rosu ücretsiz ve açık kaynaktır (GPL-3.0-or-later) ve resmî değildir: ppy Pty Ltd ya da osu! ile bağlantılı değildir ve onlar tarafından desteklenmez.`

/** The guide in Japanese (the app itself is English/Turkish; menu names stay in English). */
export const GUIDE_JA = `## インストール

1. 最新の \`rosu-vX.Y.Z-win64.exe\` を [更新履歴](/changelog) または GitHub Releases からダウンロードし、専用のフォルダに置きます。Rosu は作業用フォルダを exe の隣に作ります。
2. exe はコード署名されていないため、初回は Windows SmartScreen が「不明な発行元」と表示することがあります。**詳細情報 → 実行** を選んでください。ダウンロードしたファイルは、隣に公開されている \`.sha256\` ファイルで確認できます。
3. 初回起動時に \`Packs/\`、\`Output/\`、\`Library/\`、\`data/\`、\`logs/\` が exe の隣に作られます。それぞれ **Settings** で別の場所に変更できます。

## ふだんの流れ

1. **パックを \`Packs/\` に入れます。** \`.zip\`、\`.7z\`、\`.tar\` のアーカイブと、単体の \`.osz\` を読み込みます。展開前にすべてのアーカイブを安全チェックします（サイズ上限、zip 爆弾・パストラバーサル対策）。
2. **Dashboard → Unpack Archives。** ビートマップセットが \`Output/\` に展開されます。Rosu はすべてのセットと、どのパックから来たかを記録します。
3. **Copy to Library。** \`Library/\` は重複のない、あなたの恒久的なコレクションです。どのパックから来ても、1 セットにつき 1 つの \`.osz\`。
4. **Import to osu!。** 新しいセットをワンクリックで osu!lazer または osu!(stable) へ送ります。クライアントは Settings でそれぞれオン・オフでき、オフにしたクライアントはアプリ全体から消えます。
5. **ダウンロードを自動で取り込むこともできます：** **Settings → Watch a folder**（たとえばダウンロードフォルダ）に新しく届いた \`.osz\` を Library に追加します。あなたのファイルが移動・削除されることはありません。

## 探す

- **Search** はアーティスト、タイトル、セット名で並べ替え、\`star>5 mode=mania key=7 bpm>=180 length<3:00 mapper=名前\` のようなフィルタも使えます。**Filters** パネルで同じ条件を画面上で組み立てられます。
- **★ Saved** で検索に名前をつけて保存、**◀ ▶** で最近の検索を行き来、**▦ Gallery** で結果をカバーアートで表示、**Export…** で CSV または JSON に書き出せます（JSON は [シェアカード](/tools/share-card) と [Rosu Wrapped](/tools/wrapped) に使えます）。
- **Where** は各セットの場所を表示します：🎮 osu!lazer · 🕹️ osu!(stable) · 💾 Library · ☁️ Drive。
- セットをダブルクリックすると **Map Details**：全難易度のスター数と、osu!mania ではスキルセットのレーダーチャート。
- **Packs** タブはすべてのパックシリーズを一覧にし、足りない番号に印をつけます。

## Shortcuts

ワンクリックの作業で、どれもキューのジョブとして動きます（進捗をリアルタイムに表示、いつでもキャンセル可）：

- osu!lazer と osu!(stable) の間でセットを転送（転送先にあるものはスキップ）。
- クライアントにインストールされているものをすべて Library に保存。
- {Library、Drive にあるもの、クライアント、すべて} を zip または 7z でエクスポート。分割して共有リンク付きで Drive にアップロードすることもできます。
- **Prune** でディスク容量を節約（動画や大きな画像）。まずセットごとのプレビューがあり、削除したものはごみ箱へ送られ、あとで元に戻せます。
- **Remove from osu!**：クライアントからセットを取り除きます。先に Library に保存することもできます。
- **Browse Drive backup**：Drive のバックアップの中身を見て、選んだセットを復元します。
- **Move Library…**：Library を別のフォルダやドライブへ移動します。Rosu が切り替える前に、すべてのファイルを確認します。
- **Same song, different sets…**：Rosu が各セットの音声を（Chromaprint の \`fpcalc\` で）聴き、同じ曲のセットをまとめます — 再エンコード、再アップロード、TV サイズ版など。どれを残すかはあなたが選び、残りはごみ箱へ送られます。

## Google Drive へのバックアップ

**Settings → Drive → Connect** で、最小限の \`drive.file\` 権限を使って Google アカウントにサインインします。Rosu が見られるのは自分で作ったファイルだけです。バックアップは新しいものだけを、チャンクアーカイブ（既定で 1 GB）またはセットごとのファイルとしてアップロードします。複数の PC が同じ Drive にバックアップでき、バックアップブラウザにはそのすべてが表示されます。

## 困ったときは

- **Settings → Report a problem** で、スクリーンショット（任意）付きの短い報告をメンテナーに送れます。報告の状況を追える非公開リンクが表示されます。
- **Settings → Send anonymous crash reports**（既定はオフ）：クラッシュしたとき、エラーの種類と関係するコードの位置だけを送ります。詳しくは [プライバシーのページ](/privacy) をご覧ください。
- **Logs** タブでは、Rosu が行ったことを 1 行ずつ確認できます。

Rosu は無料のオープンソース（GPL-3.0-or-later）で、非公式です。ppy Pty Ltd および osu! とは提携・承認関係にありません。`

export const API = `This page documents the public endpoints the Rosu desktop app talks to. They are open source and stable; additive changes only.

## \`POST /api/report\`

A bug report or message, from the desktop app or the web form. Send JSON with \`Content-Type: application/json\`.

- \`title\` (required, ≤ 200 chars) and \`description\` (required, ≤ 5000 chars)
- \`contact\`: optional e-mail address (≤ 200 chars)
- \`app_version\`, \`os\`, \`lang\` (\`en\` / \`tr\`): light diagnostics
- \`token\`: the desktop app's shared token (desktop path only; checked in constant time)
- \`hp\`: honeypot, always empty from a real client
- \`image_b64\`, \`image_mime\` (\`image/png|jpeg|gif|webp|bmp\`), \`image_name\`: optional screenshot, at most 3 MB decoded. The server checks the magic bytes and generates its own file name.
- \`ack_email\`: optional \`true\` to ask for a one-time confirmation e-mail (web form, when enabled)

The desktop path is recognised by \`User-Agent: Rosu/<version>\` plus the token. The web path needs a Cloudflare Turnstile token (\`turnstileToken\`).

Response:

\`\`\`json
{ "ok": true, "id": 123, "status_url": "https://rosu-web.vercel.app/report/status/…" }
{ "ok": false, "error": "rate_minute" }
\`\`\`

Errors: \`missing_fields\`, \`bad_json\`, \`captcha\`, \`unauthorized\`, \`rate_minute\`, \`rate_day\`, \`rate_global\`, \`too_large\` (HTTP 413), \`server\`. Treat anything without \`ok: true\` as a failure. \`status_url\` (since v1.3.0) is the reporter's private tracking page; only a hash of it is stored.

## \`POST /api/crash\`

Opt-in crash fingerprint from the desktop app (\`User-Agent: Rosu/<version>\` + \`token\`).

\`\`\`json
{ "exc_type": "zipfile.BadZipFile", "message": "…", "frames": ["rosu/library.py:copy_to_library", "zipfile.py:open"],
  "app_version": "1.8.0", "os": "Windows 11", "token": "…" }
\`\`\`

The server clips and scrubs the message (paths and e-mail addresses), keeps only \`module:function\` frames, and computes the fingerprint itself. Body ≤ 32 KB. Response: \`{ "ok": true, "fingerprint": "…" }\`.

## \`GET /api/latest-version\`

The latest published desktop release, used by the in-app update check. It is CDN-cached.

\`\`\`json
{ "ok": true, "version": "1.8.0", "tag": "v1.8.0", "name": "Rosu v1.8.0 — …",
  "published_at": "…", "url": "https://github.com/Kerevizodunu2000/rosu/releases/tag/v1.8.0",
  "download_url": "https://github.com/…/rosu-v1.8.0-win64.exe", "sha256_url": "…", "notes": "…" }
\`\`\`

## \`GET /api/health\`

\`{ "ok": true, "db": "ok" }\` for uptime monitors. \`db\` is \`"down"\` when the database does not answer.`

/** The guide for a site language. */
export const GUIDES = { en: GUIDE, tr: GUIDE_TR, ja: GUIDE_JA } as const
