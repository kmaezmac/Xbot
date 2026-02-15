import { client, axios, callOpenAI, tweetThreadWithBearer } from "./_common.js";

const OPENAI_PROMPT_TEMPLATE = (itemName, catchcopy) => `あなたは実際に商品を使った個人ユーザーです。
AIっぽい文章や広告っぽい表現は禁止です。

以下の商品情報をもとに、
・140文字以内
・絵文字は使わない
・PR感を出さない
・実際に使った感想として自然な口調
・X（旧Twitter）用の投稿文
・アフィリエイトリンクは本文に含めず「気になる人はリプに」などで誘導

という条件でポストを1つ作成してください。

商品名: ${itemName}
キャッチコピー: ${catchcopy}

投稿文のみを返してください。余計な説明は不要です。`;

export default async function handler(req, res) {
    const mode = process.env.X_API_MODE || "legacy";
    console.log("[rakuten] mode:", mode);

    var args = [20, 30, 40];
    var age = args[Math.floor(Math.random() * args.length)];
    var random = Math.floor(Math.random() * 34) + 1;
    var requestUrl = "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?applicationId=" + process.env.RAKUTEN_APP_ID
        + "&age=" + age + "&sex=1&carrier=0&page=" + random + "&accessKey=" + process.env.RAKUTEN_APP_ACCESS_KEY + "&affiliateId=" + process.env.RAKUTEN_AFFILIATE_ID;
    console.log("[rakuten] requestUrl:", requestUrl);
    console.log("[rakuten] RAKUTEN_APP_ID exists:", !!process.env.RAKUTEN_APP_ID);
    console.log("[rakuten] RAKUTEN_APP_ACCESS_KEY exists:", !!process.env.RAKUTEN_APP_ACCESS_KEY);
    try {
        const response = await axios.get(requestUrl,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.RAKUTEN_APP_ACCESS_KEY}`,
                    'Origin': 'https://xbot-phi.vercel.app'
                }
            }
        );
        console.log("[rakuten] response status:", response.status);
        console.log("[rakuten] Items count:", response.data?.Items?.length ?? "no Items");
        if (response.status !== 201) {
            var randomNo = Math.floor(Math.random() * (response.data.Items.length));
            console.log("[rakuten] selected item index:", randomNo);
            var itemName = response.data.Items[randomNo].Item.itemName;
            var catchcopy = response.data.Items[randomNo].Item.catchcopy;
            var affiliateUrl = response.data.Items[randomNo].Item.affiliateUrl;
            console.log("[rakuten] itemName:", itemName);
            console.log("[rakuten] affiliateUrl:", affiliateUrl);

            if (mode === "new") {
                // --- 新方式: OpenAI生成 + スレッド投稿 ---
                console.log("[rakuten][new] calling OpenAI...");
                const aiText = await callOpenAI(OPENAI_PROMPT_TEMPLATE(itemName, catchcopy));
                console.log("[rakuten][new] OpenAI response:", aiText);

                // 選択アイテムから画像を取得（投稿1用）
                var mediumImageUrls = response.data.Items[randomNo].Item.mediumImageUrls;
                var imageUrl = mediumImageUrls?.[0]?.imageUrl || "";
                console.log("[rakuten][new] imageUrl:", imageUrl);

                // 投稿1: AI生成テキスト + 画像URL
                var firstTweet = aiText.substring(0, 140);
                if (imageUrl) {
                    firstTweet = aiText.substring(0, 130) + "\n" + imageUrl;
                }
                console.log("[rakuten][new] firstTweet:", firstTweet);

                // 投稿2: アフィリエイトリンク付きリプライ
                var tweetText = itemName + catchcopy;
                var secondTweet = tweetText.substring(0, 90) + " " + affiliateUrl + " #楽天ROOM #楽天 #楽天市場 #ad #PR";
                console.log("[rakuten][new] secondTweet:", secondTweet);

                await tweetThreadWithBearer(firstTweet, secondTweet);
                console.log("[rakuten][new] thread posted successfully");
            } else {
                // --- 旧方式: 従来通り単発投稿 ---
                var tweetText = itemName + catchcopy;
                var finalTweet = tweetText.substring(0, 90) + " " + affiliateUrl + " #楽天ROOM #楽天 #楽天市場 #ad #PR";
                console.log("[rakuten][legacy] tweet:", finalTweet);
                await client.v2.tweet(finalTweet);
                console.log("[rakuten][legacy] tweet posted successfully");
            }
        }
        res.status(200).send('get');
    } catch (error) {
        console.error("[rakuten] error name:", error.name);
        console.error("[rakuten] error message:", error.message);
        console.error("[rakuten] error status:", error.response?.status);
        console.error("[rakuten] error data:", JSON.stringify(error.response?.data));
        res.status(500).send('error');
    }
}
