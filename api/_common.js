import { TwitterApi } from "twitter-api-v2";
import https from 'https';
import axios from "axios";

export const appKey = process.env.TWITTER_API_KEY;
export const appSecret = process.env.TWITTER_API_SECRET;
export const accessToken = process.env.TWITTER_ACCESS_TOKEN;
export const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

export const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
});
client.readWrite;

export const execute = async (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', async() => {
                try {
                    var body = JSON.parse(data)
                    var tweetText = body.tweetText;
                    console.log(tweetText);
                    await client.v2.tweet(tweetText);
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

/**
 * OpenAI API (POST /v1/responses) を呼び出す
 */
export const callOpenAI = async (userText) => {
    const response = await axios.post(
        "https://api.openai.com/v1/responses",
        {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: "あなたは実際に商品を使った個人ユーザーです。AIっぽい文章や広告っぽい表現は禁止です。",
                        },
                    ],
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: userText,
                        },
                    ],
                },
            ],
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        }
    );
    console.log("[openai] response data:", JSON.stringify(response.data));
    const text = response.data.output[1].content[0].text;
    return text;
};

/**
 * スレッド形式で投稿する（投稿1 → 投稿1へのリプライとして投稿2）
 */
export const tweetThread = async (firstTweet, secondTweet) => {
    const first = await client.v2.tweet(firstTweet);
    console.log("[thread] first tweet id:", first.data.id);
    const second = await client.v2.reply(secondTweet, first.data.id);
    console.log("[thread] reply tweet id:", second.data.id);
    return { first, second };
};

/**
 * OAuth 2.0 refresh_token でアクセストークンを取得する
 */
const getOAuth2Token = async () => {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", process.env.X_REFRESH_TOKEN);
    params.append("client_id", process.env.X_CLIENT_ID);
    const res = await axios.post(
        "https://api.x.com/2/oauth2/token",
        params,
        {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            auth: {
                username: process.env.X_CLIENT_ID,
                password: process.env.X_API_APP_SECRET,
            },
        }
    );
    console.log("[oauth2] token obtained");
    return res.data.access_token;
};

export const tweetWithOAuth2 = async (text) => {
    const token = await getOAuth2Token();
    const res = await axios.post(
        "https://api.x.com/2/tweets",
        { text },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        }
    );
    console.log("[oauth2] tweet id:", res.data.data.id);
    return res.data;
};

export const tweetThreadWithOAuth2 = async (firstTweet, secondTweet) => {
    const token = await getOAuth2Token();
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
    const first = await axios.post(
        "https://api.x.com/2/tweets",
        { text: firstTweet },
        { headers }
    );
    console.log("[oauth2] tweet id:", first.data.data.id);
    const second = await axios.post(
        "https://api.x.com/2/tweets",
        { text: secondTweet, reply: { in_reply_to_tweet_id: first.data.data.id } },
        { headers }
    );
    console.log("[oauth2] reply tweet id:", second.data.data.id);
    return { first: first.data, second: second.data };
};

export { axios };