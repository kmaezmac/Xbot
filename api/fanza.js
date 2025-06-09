import { client, axios } from "./_common.js";

export default async function handler(req, res) {
    const requestUrl = "https://api.dmm.com/affiliate/v3/ItemList?api_id=" + process.env.FANZA_API_ID
        + "&affiliate_id=" + process.env.FANZA_AFFILIATE_ID + "&site=FANZA&service=digital&floor=videoa&output=json";
    try {
        const response = await axios.get(requestUrl);
        if (response.status !== 201) {
            const randomNo = Math.floor(Math.random() * (response.data.result.items.length));
            const title = response.data.result.items[randomNo].title;
            const affiliateURL = response.data.result.items[randomNo].affiliateURL;
            await client.v2.tweet(title.substring(0, 90) + " " + affiliateURL + " #Fanza #av #エロ #アダルト");
        }
        res.status(200).send('get');
    } catch (error) {
        console.log(error);
        res.status(500).send('error');
    }
}