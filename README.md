// README.md
# Insurance Quote System - Deployment Guide

## Prerequisites
1. Vercel account
2. InstaBrain API credentials
3. OpenAI API key
4. Go High Level access

## Environment Variables
Set up the following environment variables in Vercel:

1. INSTABRAIN_USER_ID: Your InstaBrain user ID
2. INSTABRAIN_ACCESS_TOKEN: Your InstaBrain access token
3. OPENAI_API_KEY: Your OpenAI API key

## Deployment Steps

1. Push code to GitHub repository

2. Connect to Vercel:
   ```bash
   vercel login
   vercel link
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Configure Go High Level:
   - Add API endpoint URLs to GHL settings
   - Set up webhook endpoints if needed
   - Configure CORS settings

## API Endpoints

1. Chat Endpoint:
   ```
   POST /api/chat
   ```

2. Quote Endpoint:
   ```
   POST /api/quote
   ```

3. Application Endpoint:
   ```
   POST /api/application
   ```

## Security Notes

1. CORS is configured to only allow requests from Go High Level domains
2. All sensitive credentials are stored as Vercel environment variables
3. Rate limiting is handled by Vercel's built-in protection

## Monitoring

1. View logs in Vercel dashboard
2. Monitor API usage in InstaBrain dashboard
3. Track OpenAI usage in OpenAI dashboard

## Troubleshooting

1. Check Vercel deployment logs for errors
2. Verify environment variables are set correctly
3. Ensure Go High Level is configured properly
