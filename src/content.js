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

            // 追加された要素自身、またはその内部からassistantを探す
            let assistantMessage = null;

            // 検知したいノードかどうかを判定
            if (node.matches(assistantSelector)) {
                // node自身がすでに探していたassistant要素だから
                assistantMessage = node;
            } else {
                // nodeが <div data-message-author-role="assistant"> を含むようなdiv要素だった場合
                // nodeの中のassistantを探しに行く
                assistantMessage = node.querySelector(assistantSelector);
            }

            // assistantが見つからなければ終了
            if (!assistantMessage) {
                return;
            }

            // getAttribute() は、HTML要素についている属性の値を取得するメソッド
            const messageId = assistantMessage.getAttribute("data-message-id");

            // 仮のassistant要素は無視する
            if (messageId?.startsWith("request-placeholder-")) {
                return;
            }

            console.log("新しいassistantを検出:", messageId);
        })
    })
})

observer.observe(document.body, {
    childList: true,
    subtree: true
})
