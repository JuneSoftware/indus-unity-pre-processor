import axios, { AxiosRequestConfig } from 'axios';
import * as core from '@actions/core'

const apiKey = core.getInput('buildNumberAPIKey');

export async function getBuildNumber(): Promise<number> {
    const configGet: AxiosRequestConfig = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://unity.indusgame.com/build-numbers/latest',
        headers: {
            'X-Api-Key': apiKey
        }
    };

    try {
        const response = await axios.request(configGet);
        return response.data.number;
    } catch (ex) {
        console.log(ex);
        return -1;
    }
}

export async function incrementBuildNumber(number: number): Promise<number> {
    const data = JSON.stringify({
        "number": number
    });

    const configPut: AxiosRequestConfig = {
        method: 'put',
        maxBodyLength: Infinity,
        url: 'https://unity.indusgame.com/build-numbers/set',
        headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const response = await axios.request(configPut);
        return response.data.number;
    } catch (ex) {
        console.log(ex);
        return -1;
    }
}