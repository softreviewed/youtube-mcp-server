#!/usr/bin/env node
import { z } from "zod";
import axios, { AxiosInstance } from 'axios';
import { google } from 'googleapis';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const API_KEY = process.env.YOUTUBE_API_KEY;
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

// Authentication setup
let youtubeApi: AxiosInstance;
let oauth2Client: any = null;
let hasWriteAccess = false;

if (API_KEY) {
    // API Key authentication (read-only)
    console.error('🔑 Using API Key authentication (read-only)');
    youtubeApi = axios.create({
        baseURL: 'https://www.googleapis.com/youtube/v3',
        params: { key: API_KEY },
    });
    hasWriteAccess = false;
} else if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    // OAuth 2.0 authentication (read + write)
    console.error('🔐 Using OAuth 2.0 authentication (read + write)');
    oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    youtubeApi = axios.create({
        baseURL: 'https://www.googleapis.com/youtube/v3',
    });

    // Set up axios interceptor to automatically refresh tokens
    youtubeApi.interceptors.request.use(async (config) => {
        try {
            const accessToken = await oauth2Client.getAccessToken();
            if (accessToken.token) {
                config.headers.Authorization = `Bearer ${accessToken.token}`;
            }
        } catch (error: any) {
            console.error('❌ Token refresh failed:', error.message);
            throw new Error('OAuth token refresh failed');
        }
        return config;
    });
    hasWriteAccess = true;
} else {
    throw new Error('Authentication required: Either YOUTUBE_API_KEY or YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET + YOUTUBE_REFRESH_TOKEN');
}

// Helper function to make API calls
async function makeApiCall(method: string, endpoint: string, params?: any, data?: any) {
    try {
        const response = await youtubeApi.request({
            method,
            url: endpoint,
            params,
            data,
        });
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(`YouTube API error: ${error.response?.data?.error?.message || error.message}`);
        }
        throw error;
    }
}

// Define tools
const tools = [
    {
        name: "videos_list",
        description: "Returns a list of videos that match the API request parameters.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of video resource properties" },
                chart: { type: "string", enum: ["mostPopular"], description: "Chart type" },
                id: { type: "string", description: "Video ID" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                myRating: { type: "string", enum: ["dislike", "like"] },
                onBehalfOfContentOwner: { type: "string" },
                pageToken: { type: "string" },
                regionCode: { type: "string" },
                videoCategoryId: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "channels_list",
        description: "Returns a collection of zero or more channel resources that match the request criteria.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of channel resource properties" },
                categoryId: { type: "string", description: "Guide category ID" },
                forUsername: { type: "string", description: "YouTube username" },
                id: { type: "string", description: "Channel ID" },
                managedByMe: { type: "boolean" },
                mine: { type: "boolean" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                onBehalfOfContentOwner: { type: "string" },
                pageToken: { type: "string" },
                hl: { type: "string", description: "Language for textual properties" },
            },
            required: ["part"],
        },
    },
    {
        name: "search_list",
        description: "Returns a collection of search results that match the query parameters specified in the API request.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of search resource properties" },
                channelId: { type: "string", description: "Channel ID to search within" },
                channelType: { type: "string", enum: ["any", "show"] },
                eventType: { type: "string", enum: ["completed", "live", "upcoming"] },
                forContentOwner: { type: "boolean" },
                forDeveloper: { type: "boolean" },
                forMine: { type: "boolean" },
                location: { type: "string" },
                locationRadius: { type: "string" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                onBehalfOfContentOwner: { type: "string" },
                order: { type: "string", enum: ["date", "rating", "relevance", "title", "videoCount", "viewCount"] },
                pageToken: { type: "string" },
                publishedAfter: { type: "string" },
                publishedBefore: { type: "string" },
                q: { type: "string", description: "Search query" },
                regionCode: { type: "string" },
                relevanceLanguage: { type: "string" },
                safeSearch: { type: "string", enum: ["moderate", "none", "strict"] },
                topicId: { type: "string" },
                type: { type: "string", description: "Resource types to return" },
                videoCaption: { type: "string", enum: ["any", "closedCaption", "none"] },
                videoCategoryId: { type: "string" },
                videoDefinition: { type: "string", enum: ["any", "high", "standard"] },
                videoDimension: { type: "string", enum: ["2d", "3d", "any"] },
                videoDuration: { type: "string", enum: ["any", "long", "medium", "short"] },
                videoEmbeddable: { type: "string", enum: ["any", "true"] },
                videoLicense: { type: "string", enum: ["any", "creativeCommon", "youtube"] },
                videoSyndicated: { type: "string", enum: ["any", "true"] },
                videoType: { type: "string", enum: ["any", "episode", "movie"] },
            },
            required: ["part"],
        },
    },
    {
        name: "commentThreads_list",
        description: "Returns a list of comment threads that match the API request parameters.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of commentThread resource properties" },
                allThreadsRelatedToChannelId: { type: "string", description: "Channel ID for related threads" },
                channelId: { type: "string", description: "Channel ID" },
                id: { type: "string", description: "Comment thread ID" },
                maxResults: { type: "number", minimum: 1, maximum: 100 },
                moderationStatus: { type: "string", enum: ["published", "heldForReview", "likelySpam"] },
                order: { type: "string", enum: ["time", "relevance"] },
                pageToken: { type: "string" },
                searchTerms: { type: "string" },
                textFormat: { type: "string", enum: ["html", "plainText"] },
                videoId: { type: "string", description: "Video ID" },
            },
            required: ["part"],
        },
    },
    {
        name: "comments_list",
        description: "Returns a list of comments that match the API request parameters.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of comment resource properties" },
                id: { type: "string", description: "Comment ID" },
                maxResults: { type: "number", minimum: 1, maximum: 100 },
                pageToken: { type: "string" },
                parentId: { type: "string", description: "Parent comment ID" },
                textFormat: { type: "string", enum: ["html", "plainText"] },
            },
            required: ["part"],
        },
    },
    {
        name: "commentThreads_insert",
        description: "Creates a new top-level comment on a video or channel.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                body: {
                    type: "object",
                    description: "CommentThread resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                channelId: { type: "string", description: "Channel ID to comment on" },
                                videoId: { type: "string", description: "Video ID to comment on" },
                                topLevelComment: {
                                    type: "object",
                                    properties: {
                                        snippet: {
                                            type: "object",
                                            properties: {
                                                textOriginal: { type: "string", description: "Comment text" }
                                            },
                                            required: ["textOriginal"]
                                        }
                                    },
                                    required: ["snippet"]
                                }
                            }
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "comments_insert",
        description: "Creates a reply to an existing comment.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                body: {
                    type: "object",
                    description: "Comment resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                parentId: { type: "string", description: "Parent comment ID" },
                                textOriginal: { type: "string", description: "Reply text" }
                            },
                            required: ["parentId", "textOriginal"]
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "captions_list",
        description: "Returns a list of caption tracks that are associated with a specified video.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of caption resource properties" },
                videoId: { type: "string", description: "Video ID" },
                id: { type: "string", description: "Caption ID" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "captions_download",
        description: "Downloads a caption track. The caption track is returned in its original format unless the request specifies a value for the tfmt parameter and in its original language unless the request specifies a value for the tlang parameter.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Caption ID" },
                tfmt: { type: "string", description: "Caption format (srt, sbv, vtt, etc.)", enum: ["srt", "sbv", "vtt", "ttml"] },
                tlang: { type: "string", description: "Translation language" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "activities_list",
        description: "Returns a list of channel activity events that match the request criteria.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of activity resource properties" },
                channelId: { type: "string", description: "Channel ID" },
                home: { type: "boolean", description: "Whether to retrieve the authenticated user's home activity feed" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                mine: { type: "boolean", description: "Whether to retrieve the authenticated user's activities" },
                publishedAfter: { type: "string", description: "RFC 3339 timestamp" },
                publishedBefore: { type: "string", description: "RFC 3339 timestamp" },
                regionCode: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "guideCategories_list",
        description: "Returns a list of categories that can be associated with YouTube channels.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of guideCategory resource properties" },
                hl: { type: "string", description: "Language" },
                id: { type: "string", description: "Guide category ID" },
                regionCode: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "i18nLanguages_list",
        description: "Returns a list of application languages that the YouTube website supports.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of i18nLanguage resource properties" },
                hl: { type: "string", description: "Language" },
            },
            required: ["part"],
        },
    },
    {
        name: "i18nRegions_list",
        description: "Returns a list of content regions that the YouTube website supports.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of i18nRegion resource properties" },
                hl: { type: "string", description: "Language" },
            },
            required: ["part"],
        },
    },
    {
        name: "videoAbuseReportReasons_list",
        description: "Retrieve a list of reasons that can be used to report abusive videos.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of videoAbuseReportReason resource properties" },
                hl: { type: "string", description: "Language" },
            },
            required: ["part"],
        },
    },
    {
        name: "videoCategories_list",
        description: "Returns a list of categories that can be associated with YouTube videos.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of videoCategory resource properties" },
                hl: { type: "string", description: "Language" },
                id: { type: "string", description: "Video category ID" },
                regionCode: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "videos_insert",
        description: "Uploads a video to YouTube and optionally sets the video's metadata.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
                body: {
                    type: "object",
                    description: "Video resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Video title" },
                                description: { type: "string", description: "Video description" },
                                tags: { type: "array", items: { type: "string" }, description: "Video tags" },
                                categoryId: { type: "string", description: "Video category ID" }
                            }
                        },
                        status: {
                            type: "object",
                            properties: {
                                privacyStatus: { type: "string", enum: ["public", "private", "unlisted"] }
                            }
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "videos_update",
        description: "Updates a video's metadata.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to update" },
                onBehalfOfContentOwner: { type: "string" },
                body: {
                    type: "object",
                    description: "Video resource",
                    properties: {
                        id: { type: "string", description: "Video ID" },
                        snippet: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Video title" },
                                description: { type: "string", description: "Video description" },
                                tags: { type: "array", items: { type: "string" }, description: "Video tags" },
                                categoryId: { type: "string", description: "Video category ID" }
                            }
                        },
                        status: {
                            type: "object",
                            properties: {
                                privacyStatus: { type: "string", enum: ["public", "private", "unlisted"] }
                            }
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "videos_delete",
        description: "Deletes a YouTube video.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Video ID" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "videos_rate",
        description: "Add a like or dislike rating to a video or remove a rating from a video.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Video ID" },
                rating: { type: "string", enum: ["like", "dislike", "none"], description: "Rating to apply" },
            },
            required: ["id", "rating"],
        },
    },
    {
        name: "videos_getRating",
        description: "Retrieves the ratings that the authorized user gave to a list of specified videos.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Comma-separated list of video IDs" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "videos_reportAbuse",
        description: "Report a video for containing abusive content.",
        inputSchema: {
            type: "object",
            properties: {
                videoId: { type: "string", description: "Video ID" },
                onBehalfOfContentOwner: { type: "string" },
                body: {
                    type: "object",
                    description: "Abuse report resource",
                    properties: {
                        abuseReportReasonId: { type: "string", description: "Reason ID for the abuse report" },
                        abuseReportDetails: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    abuseType: { type: "string", description: "Type of abuse" },
                                    description: { type: "string", description: "Description of the abuse" }
                                }
                            }
                        }
                    },
                    required: ["abuseReportReasonId"]
                }
            },
            required: ["videoId", "body"],
        },
    },
    {
        name: "playlists_list",
        description: "Returns a collection of playlists that match the API request parameters.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of playlist resource properties" },
                channelId: { type: "string", description: "Channel ID" },
                id: { type: "string", description: "Playlist ID" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                mine: { type: "boolean" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
                pageToken: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "playlists_insert",
        description: "Creates a playlist.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
                body: {
                    type: "object",
                    description: "Playlist resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Playlist title" },
                                description: { type: "string", description: "Playlist description" },
                                tags: { type: "array", items: { type: "string" }, description: "Playlist tags" }
                            },
                            required: ["title"]
                        },
                        status: {
                            type: "object",
                            properties: {
                                privacyStatus: { type: "string", enum: ["public", "private", "unlisted"] }
                            }
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "playlists_update",
        description: "Modifies a playlist.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to update" },
                onBehalfOfContentOwner: { type: "string" },
                body: {
                    type: "object",
                    description: "Playlist resource",
                    properties: {
                        id: { type: "string", description: "Playlist ID" },
                        snippet: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Playlist title" },
                                description: { type: "string", description: "Playlist description" },
                                tags: { type: "array", items: { type: "string" }, description: "Playlist tags" }
                            }
                        },
                        status: {
                            type: "object",
                            properties: {
                                privacyStatus: { type: "string", enum: ["public", "private", "unlisted"] }
                            }
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "playlists_delete",
        description: "Deletes a playlist.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Playlist ID" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "playlistItems_list",
        description: "Returns a collection of playlist items that match the API request parameters.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of playlistItem resource properties" },
                id: { type: "string", description: "Playlist item ID" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                onBehalfOfContentOwner: { type: "string" },
                pageToken: { type: "string" },
                playlistId: { type: "string", description: "Playlist ID" },
                videoId: { type: "string", description: "Video ID" },
            },
            required: ["part"],
        },
    },
    {
        name: "playlistItems_insert",
        description: "Adds a resource to a playlist.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
                body: {
                    type: "object",
                    description: "PlaylistItem resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                playlistId: { type: "string", description: "Playlist ID" },
                                resourceId: {
                                    type: "object",
                                    properties: {
                                        kind: { type: "string", description: "Resource kind" },
                                        videoId: { type: "string", description: "Video ID" }
                                    },
                                    required: ["kind", "videoId"]
                                }
                            },
                            required: ["playlistId", "resourceId"]
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "playlistItems_update",
        description: "Modifies a playlist item.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to update" },
                onBehalfOfContentOwner: { type: "string" },
                body: {
                    type: "object",
                    description: "PlaylistItem resource",
                    properties: {
                        id: { type: "string", description: "Playlist item ID" },
                        snippet: {
                            type: "object",
                            properties: {
                                playlistId: { type: "string", description: "Playlist ID" },
                                resourceId: {
                                    type: "object",
                                    properties: {
                                        kind: { type: "string", description: "Resource kind" },
                                        videoId: { type: "string", description: "Video ID" }
                                    }
                                },
                                position: { type: "number", description: "Position in playlist" }
                            }
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "playlistItems_delete",
        description: "Deletes a playlist item.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Playlist item ID" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "channels_update",
        description: "Updates a channel's metadata. Note that this method currently only supports updates to the channel resource's brandingSettings and invideoPromotion objects and their child properties.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to update" },
                onBehalfOfContentOwner: { type: "string" },
                body: {
                    type: "object",
                    description: "Channel resource",
                    properties: {
                        id: { type: "string", description: "Channel ID" },
                        brandingSettings: {
                            type: "object",
                            properties: {
                                channel: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string", description: "Channel title" },
                                        description: { type: "string", description: "Channel description" },
                                        keywords: { type: "string", description: "Channel keywords" },
                                        defaultTab: { type: "string", description: "Default tab" },
                                        showRelatedChannels: { type: "boolean" },
                                        showBrowseView: { type: "boolean" },
                                        featuredChannelsTitle: { type: "string" },
                                        featuredChannelsUrls: { type: "array", items: { type: "string" } },
                                        unsubscribedTrailer: { type: "string" }
                                    }
                                },
                                image: {
                                    type: "object",
                                    properties: {
                                        bannerExternalUrl: { type: "string", description: "Banner image URL" }
                                    }
                                }
                            }
                        },
                        invideoPromotion: {
                            type: "object",
                            properties: {
                                items: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: {
                                                type: "object",
                                                properties: {
                                                    type: { type: "string" },
                                                    videoId: { type: "string" },
                                                    websiteUrl: { type: "string" },
                                                    recentlyUploadedBy: { type: "string" }
                                                }
                                            },
                                            timing: {
                                                type: "object",
                                                properties: {
                                                    offsetMs: { type: "string" },
                                                    durationMs: { type: "string" },
                                                    type: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                },
                                useSmartTiming: { type: "boolean" }
                            }
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "channelBanners_insert",
        description: "Uploads a channel banner image to YouTube. This method represents the first two steps in a three-step process to update the banner image for a channel.",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string", description: "Channel ID" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
            },
            required: ["channelId"],
        },
    },
    {
        name: "channelSections_list",
        description: "Returns a list of channelSection resources that match the API request criteria.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of channelSection resource properties" },
                channelId: { type: "string", description: "Channel ID" },
                id: { type: "string", description: "Channel section ID" },
                mine: { type: "boolean" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "channelSections_insert",
        description: "Adds a channel section to the authenticated user's channel.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
                body: {
                    type: "object",
                    description: "ChannelSection resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["allPlaylists", "completedEvents", "liveEvents", "multipleChannels", "multiplePlaylists", "popularUploads", "recentUploads", "singlePlaylist", "subscriptions", "upcomingEvents"] },
                                style: { type: "string", enum: ["horizontalRow", "verticalList"] },
                                channelId: { type: "string", description: "Channel ID" },
                                title: { type: "string", description: "Section title" },
                                position: { type: "number", description: "Section position" }
                            },
                            required: ["type"]
                        },
                        contentDetails: {
                            type: "object",
                            properties: {
                                channels: { type: "array", items: { type: "string" } },
                                playlists: { type: "array", items: { type: "string" } }
                            }
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "channelSections_update",
        description: "Updates a channel section.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to update" },
                onBehalfOfContentOwner: { type: "string" },
                body: {
                    type: "object",
                    description: "ChannelSection resource",
                    properties: {
                        id: { type: "string", description: "Channel section ID" },
                        snippet: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["allPlaylists", "completedEvents", "liveEvents", "multipleChannels", "multiplePlaylists", "popularUploads", "recentUploads", "singlePlaylist", "subscriptions", "upcomingEvents"] },
                                style: { type: "string", enum: ["horizontalRow", "verticalList"] },
                                channelId: { type: "string", description: "Channel ID" },
                                title: { type: "string", description: "Section title" },
                                position: { type: "number", description: "Section position" }
                            }
                        },
                        contentDetails: {
                            type: "object",
                            properties: {
                                channels: { type: "array", items: { type: "string" } },
                                playlists: { type: "array", items: { type: "string" } }
                            }
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "channelSections_delete",
        description: "Deletes a channel section.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Channel section ID" },
                onBehalfOfContentOwner: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "subscriptions_list",
        description: "Returns subscription resources that match the API request criteria.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of subscription resource properties" },
                channelId: { type: "string", description: "Channel ID" },
                forChannelId: { type: "string" },
                id: { type: "string", description: "Subscription ID" },
                maxResults: { type: "number", minimum: 0, maximum: 50 },
                mine: { type: "boolean" },
                myRecentSubscribers: { type: "boolean" },
                mySubscribers: { type: "boolean" },
                onBehalfOfContentOwner: { type: "string" },
                onBehalfOfContentOwnerChannel: { type: "string" },
                order: { type: "string", enum: ["alphabetical", "relevance", "unread"] },
                pageToken: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "subscriptions_insert",
        description: "Adds a subscription for the authenticated user's channel.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to set" },
                body: {
                    type: "object",
                    description: "Subscription resource",
                    properties: {
                        snippet: {
                            type: "object",
                            properties: {
                                resourceId: {
                                    type: "object",
                                    properties: {
                                        kind: { type: "string", description: "Resource kind" },
                                        channelId: { type: "string", description: "Channel ID to subscribe to" }
                                    },
                                    required: ["kind", "channelId"]
                                }
                            },
                            required: ["resourceId"]
                        }
                    },
                    required: ["snippet"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "subscriptions_delete",
        description: "Deletes a subscription.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Subscription ID" },
            },
            required: ["id"],
        },
    },
    {
        name: "comments_update",
        description: "Modifies a comment.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of properties to update" },
                body: {
                    type: "object",
                    description: "Comment resource",
                    properties: {
                        id: { type: "string", description: "Comment ID" },
                        snippet: {
                            type: "object",
                            properties: {
                                textOriginal: { type: "string", description: "Updated comment text" }
                            }
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["part", "body"],
        },
    },
    {
        name: "comments_delete",
        description: "Deletes a comment.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Comment ID" },
            },
            required: ["id"],
        },
    },
    {
        name: "comments_setModerationStatus",
        description: "Sets the moderation status of one or more comments.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Comment ID" },
                moderationStatus: { type: "string", enum: ["published", "heldForReview", "likelySpam", "rejected"] },
                banAuthor: { type: "boolean", description: "Whether to ban the author" },
            },
            required: ["id", "moderationStatus"],
        },
    },
    {
        name: "comments_markAsSpam",
        description: "Marks a comment as spam.",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Comment ID" },
            },
            required: ["id"],
        },
    },
    {
        name: "members_list",
        description: "Lists members (formerly known as 'sponsors') for a channel.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of member resource properties" },
                filterByMemberChannelId: { type: "string" },
                hasAccessToLevel: { type: "string" },
                maxResults: { type: "number", minimum: 1, maximum: 1000 },
                mode: { type: "string", enum: ["all_current", "updates"] },
                pageToken: { type: "string" },
            },
            required: ["part"],
        },
    },
    {
        name: "membershipsLevels_list",
        description: "Returns a collection of zero or more membershipsLevel resources owned by the channel that authorized the API request.",
        inputSchema: {
            type: "object",
            properties: {
                part: { type: "string", description: "Comma-separated list of membershipsLevel resource properties" },
            },
            required: ["part"],
        },
    },
];

// Create MCP server
const server = new Server({
    name: "youtube-server",
    version: "0.1.0"
}, {
    capabilities: {
        tools: {},
    },
});

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case "videos_list":
            const videosData = await makeApiCall('GET', '/videos', args);
            return { content: [{ type: "text", text: JSON.stringify(videosData, null, 2) }] };

        case "channels_list":
            const channelsData = await makeApiCall('GET', '/channels', args);
            return { content: [{ type: "text", text: JSON.stringify(channelsData, null, 2) }] };

        case "search_list":
            const searchData = await makeApiCall('GET', '/search', args);
            return { content: [{ type: "text", text: JSON.stringify(searchData, null, 2) }] };

        case "commentThreads_list":
            const commentThreadsData = await makeApiCall('GET', '/commentThreads', args);
            return { content: [{ type: "text", text: JSON.stringify(commentThreadsData, null, 2) }] };

        case "comments_list":
            const commentsData = await makeApiCall('GET', '/comments', args);
            return { content: [{ type: "text", text: JSON.stringify(commentsData, null, 2) }] };

        case "commentThreads_insert":
            if (!hasWriteAccess) {
                throw new Error('Comment posting requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: threadBody, ...threadParams } = args;
            const threadResult = await makeApiCall('POST', '/commentThreads', threadParams, threadBody);
            return { content: [{ type: "text", text: JSON.stringify(threadResult, null, 2) }] };

        case "comments_insert":
            if (!hasWriteAccess) {
                throw new Error('Comment replying requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: commentBody, ...commentParams } = args;
            const commentResult = await makeApiCall('POST', '/comments', commentParams, commentBody);
            return { content: [{ type: "text", text: JSON.stringify(commentResult, null, 2) }] };

        case "captions_list":
            const captionsListResult = await makeApiCall('GET', '/captions', args);
            return { content: [{ type: "text", text: JSON.stringify(captionsListResult, null, 2) }] };

        case "captions_download":
            const captionsDownloadResult = await makeApiCall('GET', `/captions/${args.id}`, args);
            return { content: [{ type: "text", text: JSON.stringify(captionsDownloadResult, null, 2) }] };

        case "activities_list":
            const activitiesResult = await makeApiCall('GET', '/activities', args);
            return { content: [{ type: "text", text: JSON.stringify(activitiesResult, null, 2) }] };

        case "guideCategories_list":
            const guideCategoriesResult = await makeApiCall('GET', '/guideCategories', args);
            return { content: [{ type: "text", text: JSON.stringify(guideCategoriesResult, null, 2) }] };

        case "i18nLanguages_list":
            const i18nLanguagesResult = await makeApiCall('GET', '/i18nLanguages', args);
            return { content: [{ type: "text", text: JSON.stringify(i18nLanguagesResult, null, 2) }] };

        case "i18nRegions_list":
            const i18nRegionsResult = await makeApiCall('GET', '/i18nRegions', args);
            return { content: [{ type: "text", text: JSON.stringify(i18nRegionsResult, null, 2) }] };

        case "videoAbuseReportReasons_list":
            const videoAbuseReportReasonsResult = await makeApiCall('GET', '/videoAbuseReportReasons', args);
            return { content: [{ type: "text", text: JSON.stringify(videoAbuseReportReasonsResult, null, 2) }] };

        case "videoCategories_list":
            const videoCategoriesResult = await makeApiCall('GET', '/videoCategories', args);
            return { content: [{ type: "text", text: JSON.stringify(videoCategoriesResult, null, 2) }] };

        case "videos_insert":
            if (!hasWriteAccess) {
                throw new Error('Video upload requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: videoBody, ...videoParams } = args;
            const videoInsertResult = await makeApiCall('POST', '/videos', videoParams, videoBody);
            return { content: [{ type: "text", text: JSON.stringify(videoInsertResult, null, 2) }] };

        case "videos_update":
            if (!hasWriteAccess) {
                throw new Error('Video update requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: updateBody, ...updateParams } = args;
            const videoUpdateResult = await makeApiCall('PUT', '/videos', updateParams, updateBody);
            return { content: [{ type: "text", text: JSON.stringify(videoUpdateResult, null, 2) }] };

        case "videos_delete":
            if (!hasWriteAccess) {
                throw new Error('Video deletion requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('DELETE', `/videos`, args);
            return { content: [{ type: "text", text: "Video deleted successfully" }] };

        case "videos_rate":
            if (!hasWriteAccess) {
                throw new Error('Video rating requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { id: rateId, ...rateParams } = args;
            await makeApiCall('POST', '/videos/rate', { id: rateId, ...rateParams });
            return { content: [{ type: "text", text: `Video ${rateId} rated: ${args.rating}` }] };

        case "videos_getRating":
            if (!hasWriteAccess) {
                throw new Error('Getting video ratings requires OAuth authentication. Please set up OAuth tokens.');
            }
            const ratingResult = await makeApiCall('GET', '/videos/getRating', args);
            return { content: [{ type: "text", text: JSON.stringify(ratingResult, null, 2) }] };

        case "videos_reportAbuse":
            const { body: abuseBody, ...abuseParams } = args;
            await makeApiCall('POST', '/videos/reportAbuse', abuseParams, abuseBody);
            return { content: [{ type: "text", text: "Abuse report submitted successfully" }] };

        case "playlists_list":
            const playlistsResult = await makeApiCall('GET', '/playlists', args);
            return { content: [{ type: "text", text: JSON.stringify(playlistsResult, null, 2) }] };

        case "playlists_insert":
            if (!hasWriteAccess) {
                throw new Error('Playlist creation requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: playlistBody, ...playlistParams } = args;
            const playlistInsertResult = await makeApiCall('POST', '/playlists', playlistParams, playlistBody);
            return { content: [{ type: "text", text: JSON.stringify(playlistInsertResult, null, 2) }] };

        case "playlists_update":
            if (!hasWriteAccess) {
                throw new Error('Playlist update requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: playlistUpdateBody, ...playlistUpdateParams } = args;
            const playlistUpdateResult = await makeApiCall('PUT', '/playlists', playlistUpdateParams, playlistUpdateBody);
            return { content: [{ type: "text", text: JSON.stringify(playlistUpdateResult, null, 2) }] };

        case "playlists_delete":
            if (!hasWriteAccess) {
                throw new Error('Playlist deletion requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('DELETE', '/playlists', args);
            return { content: [{ type: "text", text: "Playlist deleted successfully" }] };

        case "playlistItems_list":
            const playlistItemsResult = await makeApiCall('GET', '/playlistItems', args);
            return { content: [{ type: "text", text: JSON.stringify(playlistItemsResult, null, 2) }] };

        case "playlistItems_insert":
            if (!hasWriteAccess) {
                throw new Error('Adding to playlist requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: itemBody, ...itemParams } = args;
            const itemInsertResult = await makeApiCall('POST', '/playlistItems', itemParams, itemBody);
            return { content: [{ type: "text", text: JSON.stringify(itemInsertResult, null, 2) }] };

        case "playlistItems_update":
            if (!hasWriteAccess) {
                throw new Error('Playlist item update requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: itemUpdateBody, ...itemUpdateParams } = args;
            const itemUpdateResult = await makeApiCall('PUT', '/playlistItems', itemUpdateParams, itemUpdateBody);
            return { content: [{ type: "text", text: JSON.stringify(itemUpdateResult, null, 2) }] };

        case "playlistItems_delete":
            if (!hasWriteAccess) {
                throw new Error('Playlist item deletion requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('DELETE', '/playlistItems', args);
            return { content: [{ type: "text", text: "Playlist item deleted successfully" }] };

        case "channels_update":
            if (!hasWriteAccess) {
                throw new Error('Channel update requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: channelBody, ...channelParams } = args;
            const channelUpdateResult = await makeApiCall('PUT', '/channels', channelParams, channelBody);
            return { content: [{ type: "text", text: JSON.stringify(channelUpdateResult, null, 2) }] };

        case "channelBanners_insert":
            if (!hasWriteAccess) {
                throw new Error('Channel banner upload requires OAuth authentication. Please set up OAuth tokens.');
            }
            // Note: This endpoint requires multipart/form-data upload, simplified for now
            const bannerResult = await makeApiCall('POST', '/channelBanners/insert', args);
            return { content: [{ type: "text", text: JSON.stringify(bannerResult, null, 2) }] };

        case "channelSections_list":
            const channelSectionsResult = await makeApiCall('GET', '/channelSections', args);
            return { content: [{ type: "text", text: JSON.stringify(channelSectionsResult, null, 2) }] };

        case "channelSections_insert":
            if (!hasWriteAccess) {
                throw new Error('Channel section creation requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: sectionBody, ...sectionParams } = args;
            const sectionInsertResult = await makeApiCall('POST', '/channelSections', sectionParams, sectionBody);
            return { content: [{ type: "text", text: JSON.stringify(sectionInsertResult, null, 2) }] };

        case "channelSections_update":
            if (!hasWriteAccess) {
                throw new Error('Channel section update requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: sectionUpdateBody, ...sectionUpdateParams } = args;
            const sectionUpdateResult = await makeApiCall('PUT', '/channelSections', sectionUpdateParams, sectionUpdateBody);
            return { content: [{ type: "text", text: JSON.stringify(sectionUpdateResult, null, 2) }] };

        case "channelSections_delete":
            if (!hasWriteAccess) {
                throw new Error('Channel section deletion requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('DELETE', '/channelSections', args);
            return { content: [{ type: "text", text: "Channel section deleted successfully" }] };

        case "subscriptions_list":
            const subscriptionsResult = await makeApiCall('GET', '/subscriptions', args);
            return { content: [{ type: "text", text: JSON.stringify(subscriptionsResult, null, 2) }] };

        case "subscriptions_insert":
            if (!hasWriteAccess) {
                throw new Error('Subscription creation requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: subscriptionBody, ...subscriptionParams } = args;
            const subscriptionInsertResult = await makeApiCall('POST', '/subscriptions', subscriptionParams, subscriptionBody);
            return { content: [{ type: "text", text: JSON.stringify(subscriptionInsertResult, null, 2) }] };

        case "subscriptions_delete":
            if (!hasWriteAccess) {
                throw new Error('Subscription deletion requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('DELETE', '/subscriptions', args);
            return { content: [{ type: "text", text: "Subscription deleted successfully" }] };

        case "comments_update":
            if (!hasWriteAccess) {
                throw new Error('Comment update requires OAuth authentication. Please set up OAuth tokens.');
            }
            const { body: commentUpdateBody, ...commentUpdateParams } = args;
            const commentUpdateResult = await makeApiCall('PUT', '/comments', commentUpdateParams, commentUpdateBody);
            return { content: [{ type: "text", text: JSON.stringify(commentUpdateResult, null, 2) }] };

        case "comments_delete":
            if (!hasWriteAccess) {
                throw new Error('Comment deletion requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('DELETE', '/comments', args);
            return { content: [{ type: "text", text: "Comment deleted successfully" }] };

        case "comments_setModerationStatus":
            if (!hasWriteAccess) {
                throw new Error('Comment moderation requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('POST', '/comments/setModerationStatus', args);
            return { content: [{ type: "text", text: "Comment moderation status updated successfully" }] };

        case "comments_markAsSpam":
            if (!hasWriteAccess) {
                throw new Error('Comment spam marking requires OAuth authentication. Please set up OAuth tokens.');
            }
            await makeApiCall('POST', '/comments/markAsSpam', args);
            return { content: [{ type: "text", text: "Comment marked as spam successfully" }] };

        case "members_list":
            if (!hasWriteAccess) {
                throw new Error('Members listing requires OAuth authentication. Please set up OAuth tokens.');
            }
            const membersResult = await makeApiCall('GET', '/members', args);
            return { content: [{ type: "text", text: JSON.stringify(membersResult, null, 2) }] };

        case "membershipsLevels_list":
            if (!hasWriteAccess) {
                throw new Error('Memberships levels listing requires OAuth authentication. Please set up OAuth tokens.');
            }
            const membershipsResult = await makeApiCall('GET', '/membershipsLevels', args);
            return { content: [{ type: "text", text: JSON.stringify(membershipsResult, null, 2) }] };

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('YouTube MCP server running on stdio');