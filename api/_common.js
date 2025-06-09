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

export { axios };