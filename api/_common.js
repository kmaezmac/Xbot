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
export const callOpenAI = async (prompt) => {
    const response = await axios.post(
        "https://api.openai.com/v1/responses",
        {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            input: prompt,
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        }
    );
    console.log("[openai] response data:", JSON.stringify(response.data).substring(0, 500));
    // Responses API: output_text or fallback to output[0].content[0].text
    const text = response.data.output_text
        ?? response.data.output?.[0]?.content?.[0]?.text
        ?? response.data.choices?.[0]?.message?.content;
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
 * Bearer Token を使って X API v2 でツイートする
 */
const bearerHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.X_BEARER_TOKEN}`,
};

export const tweetWithBearer = async (text) => {
    const res = await axios.post(
        "https://api.x.com/2/tweets",
        { text },
        { headers: bearerHeaders }
    );
    console.log("[bearer] tweet id:", res.data.data.id);
    return res.data;
};

export const tweetThreadWithBearer = async (firstTweet, secondTweet) => {
    const first = await tweetWithBearer(firstTweet);
    const res = await axios.post(
        "https://api.x.com/2/tweets",
        { text: secondTweet, reply: { in_reply_to_tweet_id: first.data.id } },
        { headers: bearerHeaders }
    );
    console.log("[bearer] reply tweet id:", res.data.data.id);
    return { first, second: res.data };
};

export { axios };