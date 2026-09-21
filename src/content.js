// assistantの回答を識別するためのセレクタ
const assistantSelector = '[data-message-author-role="assistant"]';

// DOMに新しく追加された要素を監視する
const observer = new MutationObserver((mutations) => {
    // mutationsは検出されたDOM変更の一覧であり、複数の変更がまとめて渡されることがある
    // その変更を1件ずつ調べる
    mutations.forEach((mutation) => {

        // 今回追加された要素だけ確認
        // mutation.addedNodesとは変更によって追加されたNodeの一覧
        mutation.addedNodes.forEach((node) => {

            // HTML要素以外は無視
            // Node.ELEMENT_NODEは要素を表すNode
            // 今回はHTML要素だと考えてよい
            // 今探したいのは<div data-message-author-role="assistant">という要素
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
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

            // 見つかったassistantを1件ずつ処理
            assistantMessages.forEach((assistantMessage) => {
                // getAttribute() は、HTML要素についている属性の値を取得するメソッド
                const messageId = assistantMessage.getAttribute("data-message-id");

                // 仮のassistant要素は無視する
                if (messageId?.startsWith("request-placeholder-")) {
                    return;
                }

                // すでに画像が追加されている場合は何もしない
                if (assistantMessage.querySelector(".koharu-avatar")) {
                    return;
                }

                // assistantの回答を吹き出し表示するためのクラス
                assistantMessage.classList.add("character-message");

                // 画像を作成
                const koharuImage = document.createElement("img");

                // 拡張機能内部にある画像のURLをChromeに作ってもらう
                koharuImage.src = chrome.runtime.getURL("assets/koharu_normal.png");
                koharuImage.classList.add("koharu-avatar");

                // prepend()とは指定した要素の中の先頭に要素を追加するメソッド
                assistantMessage.prepend(koharuImage);

                console.log("新しいassistantを検出:", messageId);
            })
        })
    })
})

observer.observe(document.body, {
    childList: true,
    subtree: true
})
