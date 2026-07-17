/**
 * Rosu — bug-report / contact endpoint (Google Apps Script Web App).
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Receives a JSON POST from the Rosu desktop app's "Report a problem" form and
 * appends one row to a Google Sheet, saving any attached screenshot to a Drive
 * folder. This is the whole backend — no server, no database service, no bill.
 *
 * The Sheet is "our database"; this Web App is "our website" (the /exec URL).
 * Both live under the rosu.app@gmail.com Google account and are free.
 *
 * Deploy: Deploy > New deployment > Web app,
 *   Execute as:      Me (rosu.app@gmail.com)
 *   Who has access:  Anyone
 * Then copy the /exec URL into rosu/report.py (REPORT_ENDPOINT). See README.md.
 */

// ---- Configuration: fill these in before deploying -------------------------
// SHEET_ID  = the id in the Sheet URL  https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
// FOLDER_ID = the id in the folder URL https://drive.google.com/drive/folders/<FOLDER_ID>
var SHEET_ID  = 'PUT_YOUR_SHEET_ID_HERE';
var FOLDER_ID = 'PUT_YOUR_DRIVE_FOLDER_ID_HERE';
var SHEET_TAB = 'Reports';   // worksheet/tab name (created if missing)

// ---- Limits (friction for a public URL; not authentication) ----------------
var MAX_TITLE     = 200;
var MAX_DESC      = 5000;
var MAX_CONTACT   = 200;
var MAX_IMAGE_B64 = 8 * 1024 * 1024;   // reject base64 payloads over ~8 MB (~6 MB image)
var GLOBAL_PER_MIN = 20;               // crude GLOBAL cap/minute (no client IP is available)
var GLOBAL_PER_DAY = 300;              // hard GLOBAL cap/day — bounds Drive fill from abuse
// Optional shared token: FRICTION only (this app is open-source, so a committed
// token is not truly secret). Leave '' to disable. If you set it, also set
// REPORT_TOKEN in rosu/report.py to the SAME value.
var APP_TOKEN = '';

var HEADERS = ['timestamp', 'title', 'description', 'app_version', 'os',
               'lang', 'contact', 'image_url'];

// The only image types we store. The endpoint is public, so a caller could POST
// an arbitrary image_mime/image_name directly; we ignore both and use a
// server-chosen name with an extension derived from this allow-list.
var ALLOWED_MIME = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
  'image/webp': '.webp', 'image/bmp': '.bmp'
};


function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _json({ ok: false, error: 'no_body' });
    }
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return _json({ ok: false, error: 'bad_json' });
    }
    if (typeof data !== 'object' || data === null) {
      return _json({ ok: false, error: 'bad_json' });   // null/number/string JSON
    }
    if (SHEET_ID.indexOf('PUT_YOUR') === 0) {
      return _json({ ok: false, error: 'server_not_configured' });  // deploy footgun
    }

    // Honeypot: real users never fill the hidden field; bots do. Look successful
    // but store nothing.
    if (data.hp) return _json({ ok: true, id: 0 });

    if (APP_TOKEN && data.token !== APP_TOKEN) {
      return _json({ ok: false, error: 'unauthorized' });
    }

    var title = _clip(data.title, MAX_TITLE);
    var desc  = _clip(data.description, MAX_DESC);
    if (!title || !desc) return _json({ ok: false, error: 'missing_fields' });

    if (data.image_b64 && String(data.image_b64).length > MAX_IMAGE_B64) {
      return _json({ ok: false, error: 'image_too_big' });
    }

    if (!_throttleOk()) return _json({ ok: false, error: 'rate_limited' });

    var imageUrl = '';
    if (data.image_b64) {
      var mime = String(data.image_mime || 'image/png');
      var ext = ALLOWED_MIME[mime];
      if (!ext) {
        imageUrl = '(image rejected: unsupported type)';   // don't store spoofed types
      } else {
        try {
          var bytes = Utilities.base64Decode(String(data.image_b64));
          var name = 'rosu-' + Date.now() + ext;   // server-chosen name (ignore caller's)
          var file = DriveApp.getFolderById(FOLDER_ID)
                             .createFile(Utilities.newBlob(bytes, mime, name));
          imageUrl = file.getUrl();
        } catch (err) {
          imageUrl = '(image failed: ' + String(err).slice(0, 120) + ')';
        }
      }
    }

    _sheet().appendRow([
      new Date(),
      _cell(title),
      _cell(desc),
      _cell(_clip(data.app_version, 40)),
      _cell(_clip(data.os, 120)),
      _cell(_clip(data.lang, 10)),
      _cell(_clip(data.contact, MAX_CONTACT)),
      imageUrl
    ]);
    return _json({ ok: true, id: _sheet().getLastRow() });
  } catch (err) {
    return _json({ ok: false, error: String(err).slice(0, 200) });
  }
}


function doGet() {
  // Health check — visiting the /exec URL in a browser confirms it's live.
  return _json({ ok: true, service: 'rosu-report', ready: true });
}


// ---- helpers ---------------------------------------------------------------
function _sheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_TAB);
  if (!sh) {
    sh = ss.insertSheet(SHEET_TAB);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
}

function _clip(v, n) {
  if (v === undefined || v === null) return '';
  v = String(v);
  return v.length > n ? v.slice(0, n) : v;
}

// Neutralize spreadsheet formula injection: a user string starting with = + - @
// would be evaluated as a formula when the owner opens the Sheet. A leading
// apostrophe forces Sheets to store it as literal text (and hides the quote).
function _cell(v) {
  v = String(v === undefined || v === null ? '' : v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Crude GLOBAL rate limits. Apps Script exposes no caller IP, so these cap the
// TOTAL submissions per minute (cache) and per day (properties), not per-user.
// The daily cap is what bounds Drive fill if the public URL is abused.
function _throttleOk() {
  var cache = CacheService.getScriptCache();
  var mkey = 'rl-' + Math.floor(Date.now() / 60000);
  var m = Number(cache.get(mkey) || '0');
  if (m >= GLOBAL_PER_MIN) return false;
  var props = PropertiesService.getScriptProperties();
  var d = new Date();
  var dkey = 'day-' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  var day = Number(props.getProperty(dkey) || '0');
  if (day >= GLOBAL_PER_DAY) return false;
  cache.put(mkey, String(m + 1), 120);
  props.setProperty(dkey, String(day + 1));
  return true;
}
