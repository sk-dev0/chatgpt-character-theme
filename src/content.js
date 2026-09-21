// ==================================================
// 状態・定数
// ==================================================

// 現在選択されているキャラクター
let currentCharacter = "koharu";

// assistantの回答を識別するためのセレクタ
const assistantSelector = '[data-message-author-role="assistant"]';



// ==================================================
// 保存されている前回のキャラクター選択を読み込む
// ==================================================

async function loadCurrentCharacter() {
    // chromeというのはChromeが提供している拡張機能APIの入り口
    // chromeは外部ライブラリではなく、Chrome自身が拡張機能の実行環境に用意してくれているAPIだからインストールの必要はない
    // 全てが無条件ではなくものによってはmanifest.jsonで権限の宣言が必要
    // storageがそれにあたり、これはデータ保存用のAPI
    // localはローカル領域に保存する仕組み
    const result = await chrome.storage.local.get("currentCharacter");

    if (result.currentCharacter) {
        currentCharacter = result.currentCharacter
    }
}



// ==================================================
// ChatGPTの入力欄の下にキャラクター選択UIを追加する
// ==================================================

function addCharacterSelector() {
    // 目印として入力欄を取得
    const composerBody = document.querySelector('[data-composer-body]');

    if (!composerBody) {
        return;
    }

    // 二重追加を防ぐ
    // document.querySelector()は指定したクラスを持つ要素を1つ探す処理
    // もしすでにあれば関数が終了し新しくセレクターを作るところまでいかない
    // なけれなnullを返すためセレクターを生成する
    if (document.querySelector(".character-selector")) {
        return;
    }

    const characterSelector = document.createElement("div");
    characterSelector.classList.add("character-selector");

    characterSelector.innerHTML = `
        <button data-character="normal">Normal</button>
        <button data-character="koharu">小春</button>
        <button data-character="hiyori">ひより</button>
    `;

    // 現在のキャラクターのボタンを探してselectedを付ける
    const selectedButton = characterSelector.querySelector(
        `[data-character="${currentCharacter}"]`
    );

    // この?はselectedButtonがあるときにだけその後ろを実行するという意味
    selectedButton?.classList.add("selected");

    // 各ボタンにクリック処理を追加
    characterSelector.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            // datasetはHTML要素についているdata-○○属性をJavaScriptから扱うためのもの
            currentCharacter = button.dataset.character;

            // 現在選択中のキャラクターを保存
            chrome.storage.local.set({
                currentCharacter: currentCharacter
            });

            characterSelector.querySelectorAll("button").forEach((button) => {
                button.classList.remove("selected");
            })

            button.classList.add("selected");
        })
    })

    composerBody.parentElement.insertAdjacentElement(
        "afterend",
        characterSelector
    );
}



// ==================================================
// 追加されたNodeからassistantの回答要素をすべて探して返す
// ==================================================

function findAssistantMessages(node) {
    // HTML要素以外は無視
    // Node.ELEMENT_NODEは要素を表すNode
    // 今回はHTML要素だと考えてよい
    // 今探したいのは<div data-message-author-role="assistant">という要素
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return [];
    }

    // 追加されたnodeの中からassistantをすべて取得する
    let assistantMessages = [];

    // 検知したいノードかどうかを判定
    if (node.matches(assistantSelector)) {
        assistantMessages.push(node);
    }

    // node内部にあるassistantもすべて取得する
    // node.querySelectorAll()がnodeの子孫にあるassistantをすべて探す
    assistantMessages.push(
        ...node.querySelectorAll(assistantSelector)
    );

    return assistantMessages;
}



// ==================================================
// 回答に割り当てられたキャラクターを取得し、
// 未保存なら現在のキャラクターを割り当てて保存する
// ==================================================

async function getMessageCharacter(messageId) {
    // この回答に保存済みのキャラクターがいるか確認
    // Chromeの保存領域からメッセージIDがキーとなるデータを探す
    // savedDataにはmessageIdがキーでキャラクターがバリューのオブジェクトが格納される
    const savedData = await chrome.storage.local.get(messageId);

    // 保存済みならばそのキャラクター、なければ現在選択しているキャラクター
    let messageCharacter = savedData[messageId]

    if (!messageCharacter) {
        messageCharacter = currentCharacter;

        // この回答のキャラクターを保存
        await chrome.storage.local.set({
            [messageId]: messageCharacter
        })
    }

    return messageCharacter;
}



// ==================================================
// assistantの回答にキャラクター用の吹き出しと画像を表示する
// ==================================================


function displayCharacter(assistantMessage, messageCharacter) {
    // NormalならChatGPT本来の表示のまま
    if (messageCharacter === "normal") {
        return;
    }

    // assistantの回答を吹き出し表示するためのクラス
    assistantMessage.classList.add("character-message", `character-${messageCharacter}`);

    // 画像を作成
    const characterImage = document.createElement("img");

    // 拡張機能内部にある画像のURLをChromeに作ってもらう
    characterImage.src = chrome.runtime.getURL(`assets/${messageCharacter}_normal.png`);
    characterImage.classList.add("character-avatar");

    // prepend()とは指定した要素の中の先頭に要素を追加するメソッド
    assistantMessage.prepend(characterImage);
}



// ==================================================
// assistantの回答1件について、キャラクターの決定と表示を行う
// ==================================================

async function processAssistantMessage(assistantMessage) {
    // getAttribute() は、HTML要素についている属性の値を取得するメソッド
    const messageId = assistantMessage.getAttribute("data-message-id");

    // 仮のassistant要素は無視する
    if (messageId?.startsWith("request-placeholder-")) {
        return;
    }

    // この回答にキャラクター設定を適用済みなら、もう一度処理しない
    if (assistantMessage.classList.contains("character-processed")) {
        return;
    }

    // この回答を処理済みにする
    assistantMessage.classList.add("character-processed");

    console.log("新しいassistantを検出:", messageId);
}



// ==================================================
// DOMに新しく追加された要素を監視する
// ==================================================

const observer = new MutationObserver((mutations) => {
    addCharacterSelector();

    // mutationsは検出されたDOM変更の一覧であり、複数の変更がまとめて渡されることがある
    // その変更を1件ずつ調べる
    mutations.forEach((mutation) => {

        // 今回追加された要素だけ確認
        // mutation.addedNodesとは変更によって追加されたNodeの一覧
        mutation.addedNodes.forEach((node) => {
            const assistantMessages = findAssistantMessages(node);

            // 見つかったassistantを1件ずつ処理
            assistantMessages.forEach(async (assistantMessage) => {
                processAssistantMessage(assistantMessage);
            })
        })
    })
})



// ========================================
// 初期化
// ========================================

async function initialize() {
    // 前回選択していたキャラクターを読み込む
    await loadCurrentCharacter();

    // 読み込みが終わったらDOM監視を開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

initialize();



