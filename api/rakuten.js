import { client, axios } from "./_common.js";

export default async function handler(req, res) {
    var args = [20, 30, 40];
    var age = args[Math.floor(Math.random() * args.length)];
    var random = Math.floor(Math.random() * 34) + 1;
    var requestUrl = "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?applicationId=" + process.env.RAKUTEN_APP_ID
        + "&age=" + age + "&sex=1&carrier=0&page=" + random + "&accessKey=" + process.env.RAKUTEN_APP_ACCESS_KEY
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
            var tweetText = itemName + catchcopy;
            var finalTweet = tweetText.substring(0, 90) + " " + affiliateUrl + " #楽天ROOM #楽天 #楽天市場 #ad #PR";
            console.log("[rakuten] tweet length:", finalTweet.length);
            console.log("[rakuten] tweet:", finalTweet);
            await client.v2.tweet(finalTweet);
            console.log("[rakuten] tweet posted successfully");
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