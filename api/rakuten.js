import { client, axios } from "./_common.js";

export default async function handler(req, res) {
    var args = [20, 30, 40];
    var age = args[Math.floor(Math.random() * args.length)];
    var random = Math.floor(Math.random() * 34) + 1;
    var requestUrl = "https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601?applicationId=" + process.env.RAKUTEN_APP_ID
        + "&age=" + age + "&sex=1&carrier=0&page=" + random + "&accessKey=" + process.env.RAKUTEN_APP_ACCESS_KEY
    try {
        const response = await axios.get(requestUrl,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.RAKUTEN_APP_ACCESS_KEY}`
                }
            }
        );
        if (response.status !== 201) {
            var randomNo = Math.floor(Math.random() * (response.data.Items.length));
            var itemName = response.data.Items[randomNo].Item.itemName;
            var catchcopy = response.data.Items[randomNo].Item.catchcopy;
            var affiliateUrl = response.data.Items[randomNo].Item.affiliateUrl;
            var tweetText = itemName + catchcopy;
            await client.v2.tweet(tweetText.substring(0, 90) + " " + affiliateUrl + " #楽天ROOM #楽天 #楽天市場 #ad #PR");
        }
        res.status(200).send('get');
    } catch (error) {
        console.log(error);
        res.status(500).send('error');
    }
}