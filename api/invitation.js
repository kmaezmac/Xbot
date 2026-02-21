import { tweetWithOAuth2 } from "./_common.js";

const emojis = [
    "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊",
    "😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋",
    "😛","😜","🤪","😝","🤑","🤗","🫣","🤫","🤔","🫡",
    "🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬",
    "🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢",
    "🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎",
    "🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺",
    "🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖",
    "😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬",
    "😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽",
    "👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿",
    "😾","🙈","🙉","🙊","💖","💝","💘","💗","💓","💞",
    "💕","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎",
    "❤️‍🔥","💯","💢","💥","💫","💦","🔥","⭐","🌟","✨",
    "🎉","🎊","🎈","🎁","🏆","🥇","🥈","🥉","🏅","🎖️",
    "🐶","🐺","🐱","🐭","🐹","🐰","🐸","🐯","🐨","🐻",
    "🐷","🐽","🐮","🐗","🐵","🐒","🐴","🐑","🐘","🐼",
    "🐧","🐦","🐤","🐥","🐣","🐔","🦄","🐝","🦋","🐞",
    "🌸","🌺","🌻","🌹","🌷","🍀","🌈","☀️","⛅","🌙",
    "🍎","🍊","🍋","🍇","🍓","🍑","🍒","🥝","🍌","🥑",
];

const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

const moppy = () => {
    var text = "【モッピー】1,000万人以上が利用する国内最大級ポイ活応援サービス！今なら入会ボーナスもらえるチャンス★ ";
    var hashTag = "#モッピー #moppy #ポイ活 #お小遣い稼ぎ #節約 #副業";
    return text + randomEmoji() + " " + process.env.MOPPY_URI + " " + hashTag;
};

const mercari = () => {
    var text = "メルカリを使ってみてね！\n500円分お得にお買い物できる招待コード【" + process.env.MERCARI_CODE + "】を贈りました🎁\nアプリをインストールして登録してね";
    var hashTag = "#メルカリ #Mercari #お小遣い稼ぎ #節約 #副業";
    return text + randomEmoji() + " " + process.env.MERCARI_URI + " " + hashTag;
};

const olive = () => {
    var text = "今なら誰でも1,000円ゲットできるよ！\nOliveアカウント紹介プログラム！！\n紹介コード【"
        + process.env.OLIVE_CODE + "】\nエントリー＆申込はこちら";
    var hashTag = "#Oliveアカウント紹介プログラム #三井住友銀行";
    return text + randomEmoji() + " " + process.env.OLIVE_URI + "\n" + hashTag;
};

const tiktokA = () => {
    var text = "【期間限定】今なら誰でも" + process.env.TIKTOK_AMOUNT + "円ゲットできるよ\n招待URL: " + process.env.TIKTOK_URL;
    var hashTag = "\n#TikTokLite #ポイ活 #副業 #稼げる #TikTok";
    return text + randomEmoji() + hashTag;
};

const tiktokB = () => {
    var text = "【期間限定】今なら誰でも" + process.env.TIKTOK_AMOUNT2 + "円ゲットできるよ\n招待URL: " + process.env.TIKTOK_URL2;
    var hashTag = "\n#TikTokLite #ポイ活 #副業 #稼げる #TikTok";
    return text + randomEmoji() + hashTag;
};

const generators = [moppy, tiktokA, tiktokB, mercari, olive];

export default async function handler(req, res) {
    try {
        const selected = generators[Math.floor(Math.random() * generators.length)];
        const tweet = selected();
        console.log("[invitation] selected:", selected.name, "tweet:", tweet);
        await tweetWithOAuth2(tweet);
        console.log("[invitation] posted successfully");
        res.status(200).send('get');
    } catch (error) {
        console.error("[invitation] error name:", error.name);
        console.error("[invitation] error message:", error.message);
        console.error("[invitation] error status:", error.response?.status);
        console.error("[invitation] error data:", JSON.stringify(error.response?.data));
        console.error("[invitation] error stack:", error.stack);
        res.status(500).send('error');
    }
}
