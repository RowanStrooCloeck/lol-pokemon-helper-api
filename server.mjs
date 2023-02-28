import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import bodyParser from "body-parser";
import axios from "axios";
const app = express(),
    port = 3000;
const API_KEY = process.env.API_KEY;

app.use(bodyParser.json());

app.get('/champion-mastery/:region/:summoner', async function (req, res) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    const region = req.params.region;
    const summonerName = req.params.summoner;
    const apiUrl = `https://${region}.api.riotgames.com/lol`
    try {
        axios.defaults.headers.common['X-Riot-Token'] = API_KEY;
        const summonerResponse = await axios.get(`${apiUrl}/summoner/v4/summoners/by-name/${summonerName}`);
        const summonerId = summonerResponse.data.id;
        const masteryResponse = await axios.get(`${apiUrl}/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`);
        const championData = await getChampionData(masteryResponse.data);
        res.send(championData);
    } catch (e) {
        res.status(e.response.status).send(e.response.data.status);
    }
});

app.get('/challenge', async function(req, res) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    const apiUrl = `https://euw1.api.riotgames.com/lol`
    try {
        axios.defaults.headers.common['X-Riot-Token'] = API_KEY;
        const challengeInfo = await axios.get(`${apiUrl}/challenges/v1/challenges/401101/config`);
        res.send({
            name: challengeInfo.data.localizedNames.en_GB.name,
            description: challengeInfo.data.localizedNames.en_GB.descripton,
            shortDescription: challengeInfo.data.localizedNames.en_GB.shortDescription,
            thresholds: challengeInfo.data.thresholds
        });
    } catch (e) {
        res.status(e.response.status).send(e.response.data.status); 
    }
});

async function getChampionData(mastery) {
    const response = await axios.get('http://ddragon.leagueoflegends.com/cdn/12.23.1/data/en_US/champion.json');
    const data = response.data.data;
    const returnData = [];
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const id = parseInt(data[key].key)
            const name = data[key].name;
            const masteryData = mastery.find(x => x.championId === id);
            let obj;
            if (masteryData) {
                obj = {
                    id: id,
                    key: key,
                    name: name,
                    masteryPoints: masteryData.championPoints,
                    masteryLevel: masteryData.championLevel
                }
            } else {
                obj = {
                    id: id,
                    key: key,
                    name: name,
                    masteryPoints: 0,
                    masteryLevel: 0
                }
            }
            returnData.push(obj);
        }
    }
    return returnData;
}

app.listen(port, () => {
    console.log(`Server listening on the port::${port}`);
});