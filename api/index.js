import { TwitterApi } from "twitter-api-v2";
import https from 'https';
import axios from "axios";

const appKey = process.env.TWITTER_API_KEY;
const appSecret = process.env.TWITTER_API_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
});
client.readWrite;

const execute = async (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                try {
                    var body = JSON.parse(data)
                    var tweetText = body.tweetText;
                    client.v2.tweet(tweetText);
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
};

const rakuten = async () => {
    var args = [20, 30, 40];
    var age = args[Math.floor(Math.random() * args.length)];
    var random = Math.floor(Math.random() * 34) + 1;
    var requestUrl = "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601?applicationId=" + process.env.RAKUTEN_APP_ID
        + "&age=" + age + "&sex=1&carrier=0&page=" + random + "&affiliateId=" + process.env.RAKUTEN_AFFILIATE_ID;
    console.log(requestUrl);
    try {
        const response = await axios.get(requestUrl);
        if (response.status !== 201) {
            var randomNo = Math.floor(Math.random() * (response.data.Items.length));
            var itemName = response.data.Items[randomNo].Item.itemName;
            var catchcopy = response.data.Items[randomNo].Item.catchcopy;
            var affiliateUrl = response.data.Items[randomNo].Item.affiliateUrl;
            var tweetText = itemName + catchcopy;
            await client.v2.tweet(tweetText.substring(0, 90) + " " + affiliateUrl + " #楽天ROOM #楽天 #楽天市場 #ad #PR");
            console.log("完了");
        }
    } catch (error) {
        console.log(error);
    }
};

const fanza = async () => {
    var requestUrl = "https://api.dmm.com/affiliate/v3/ItemList?api_id=" + process.env.FANZA_API_ID
        + "&affiliate_id=" + process.env.FANZA_AFFILIATE_ID + "&site=FANZA&service=digital&floor=videoa&output=json";
    console.log(requestUrl);
    try {
        const response = await axios.get(requestUrl);
        if (response.status !== 201) {
            var randomNo = Math.floor(Math.random() * (response.data.result.items.length));
            var title = response.data.result.items[randomNo].title;
            var affiliateURL = response.data.result.items[randomNo].affiliateURL;
            await client.v2.tweet(title.substring(0, 90) + " " + affiliateURL + " #Fanza #av #エロ #アダルト");
            console.log("完了");
        }
    } catch (error) {
        console.log(error);
    }
};

export default async function handler(req, res) {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    try {
        if (pathname === "/api/tiktok4500") {
            await execute(process.env.TIKTOK_4500_API_URL);
        } else if (pathname === "/api/tiktok5000") {
            await execute(process.env.TIKTOK_5000_API_URL);
        } else if (pathname === "/api/amazon") {
            await execute(process.env.AMAZON_API_URL);
        } else if (pathname === "/api/rakuten") {
            await rakuten();
        } else if (pathname === "/api/moppy") {
            await execute(process.env.MOPPY_API_URL);
        } else if (pathname === "/api/mercari") {
            await execute(process.env.MERCARI_API_URL);
        } else if (pathname === "/api/daiwa") {
            await execute(process.env.DAIWA_API_URL);
        } else if (pathname === "/api/olive") {
            await execute(process.env.OLIVE_API_URL);
        } else if (pathname === "/api/fanza") {
            await fanza();
        } else if (pathname === "/api/" || pathname === "/api") {
            console.log("ログ定期実行");
        } else {
            res.status(404).send('Not found');
            return;
        }
        res.status(200).send('get');
    } catch (err) {
        console.log(err);
        res.status(500).send('error');
    }
}