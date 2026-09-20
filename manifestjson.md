## manifest.json
Chromeに拡張機能の構成を伝える設定ファイル

```json
{
    "manifest_version": 3,
    "name": "ChatGPT Character Theme",
    "version": "0.1.0",
    "description": "Adds selectable character themes to the ChatGPT conversation UI.",
    "content_scripts": [
        {
            "matches": ["https://chatgpt.com/*"],
            "js": ["src/content.js"]
        }
    ]
}
```

---

```json
"manifest_version": 3
```
Chrome拡張のManifest仕様のバージョン
3は Manifest V3(MV3)を使うという意味で、作成するアプリのバージョンではない

---

```json
"name": "ChatGPT Character Theme"
```
拡張機能そのものの名前
拡張機能管理画面などで表示される

---

```json
"version": "0.1.0"
```
作成する拡張機能のバージョン
ここでは開発初期のため0.1.0としている

--- 

```json
"content_scripts": [
  {
    "matches": ["https://chatgpt.com/*"],
    "js": ["src/content.js"]
  }
]
```
content scriptとは指定したWebページ上でChrome拡張から実行するJavaScript
今回であれば、Chrome拡張がchatgpt.comを開くとcontent.jsを実行し、chatGPTのDOMを調べたり変更したりする

`matches`はcontent scriptをどのURLで動かすかの指定であり、`js`は対象ページで実際に読み込ませるJavaScriptファイルを指定する。
