#!/usr/bin/env node
import axios from 'axios';
import { google } from 'googleapis';

console.log('🔍 Checking YouTube OAuth access...');

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('❌ Missing OAuth credentials');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const youtubeApi = axios.create({
    baseURL: 'https://www.googleapis.com/youtube/v3',
});

youtubeApi.interceptors.request.use(async (config) => {
    const accessToken = await oauth2Client.getAccessToken();
    if (accessToken.token) {
        config.headers.Authorization = `Bearer ${accessToken.token}`;
    }
    return config;
});

async function testAccess() {
    try {
        console.log('1. Getting access token...');
        const token = await oauth2Client.getAccessToken();
        console.log('✅ Token obtained successfully');

        console.log('2. Checking for YouTube channel...');
        const channelResponse = await youtubeApi.get('/channels', {
            params: { part: 'snippet', mine: true }
        });

        if (channelResponse.data.items && channelResponse.data.items.length > 0) {
            const channel = channelResponse.data.items[0];
            console.log('');
            console.log('🎉 SUCCESS! You have access to post comments on:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Channel ID:', channel.id);
            console.log('Channel Title:', channel.snippet.title);
            console.log('Channel Description:', channel.snippet.description || 'No description');
            console.log('');
            console.log('✅ You can:');
            console.log('   • Post comments on any YouTube video');
            console.log('   • Reply to comments on your videos');
            console.log('   • Read comments from any public video');
        } else {
            console.log('');
            console.log('❌ No YouTube channel found for this Google account');
            console.log('');
            console.log('This means:');
            console.log('❌ Cannot post new comments');
            console.log('❌ Cannot reply to comments');
            console.log('✅ Can still read public comments');
            console.log('');
            console.log('To post comments, you need to:');
            console.log('1. Create a YouTube channel with this Google account');
            console.log('2. Or use a different Google account that has a YouTube channel');
        }

    } catch (error) {
        console.error('');
        console.error('❌ Access check failed:', error.response?.data?.error?.message || error.message);

        if (error.response?.status === 403) {
            console.log('');
            console.log('Common reasons for 403 error:');
            console.log('• No YouTube channel associated with this account');
            console.log('• Channel not verified for API access');
            console.log('• Insufficient OAuth scopes');
        }
    }
}

testAccess();