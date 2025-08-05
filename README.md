# IPTV Proxy Server

A lightweight Node.js Express server that proxies IPTV streams via [Streamlink](https://streamlink.github.io/) and serves a dynamic M3U playlist with encoded stream URLs.

## Features

- Loads IPTV channels from a local `channels.m3u` file (not provided)
- Proxies HLS streams using Streamlink with custom HTTP headers
- Generates a dynamic M3U playlist with base64-encoded URLs for proxying
- Simple, minimal dependencies with environment variable configuration

## Requirements

- Node.js 16+
- [Streamlink CLI](https://streamlink.github.io/install.html) installed and in your system PATH
- A valid `channels.m3u` file in the project root
- `.env` file for configuration (see below)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/nmontross1/iptv-proxy-server.git
   cd iptv-proxy-server
   npm install
   ```

2. Install Streamlink

- macOS (Homebrew)
`brew install streamlink`

- Ubuntu / Debian
`sudo apt install streamlink`

3. Create a `.env` file in the root directory with the following contents:

    ```
    PORT=3000
    HOST_IP=<your-ip-address>
    ```
4. Place your `channels.m3u` playlist file in the project root directory.

## Running the Server
Run the server with:

    node server.js

The server will be accessible at:

    http://<HOST_IP>:<PORT>/playlist.m3u

This URL serves the dynamically generated playlist with proxied stream URLs.

## How It Works
On startup, the server reads and parses the channels.m3u file.

It encodes each channel’s stream URL in base64 to create proxy endpoints.

When a client requests /proxy/:encodedUrl, the server decodes the URL and uses Streamlink to fetch and proxy the live stream.

The /playlist.m3u endpoint returns an M3U playlist with all channels’ proxy URLs for client playback.

## Environment Variables
| Variable  | Description                               | Default     |
| --------- | ----------------------------------------- | ----------- |
| `PORT`    | Port number the Express server listens on | `3000`      |
| `HOST_IP` | IP address used in playlist URLs          | `127.0.0.1` |

## Dependencies
Dependencies
- Express — web framework

- Streamlink — stream proxying CLI

- iptv-playlist-parser — parses M3U playlists

- dotenv — environment variable loader