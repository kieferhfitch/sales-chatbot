{
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node@latest"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
