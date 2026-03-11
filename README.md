> ⚠️ The following sample application is a personal, open-source project shared by the app creator and not an officially supported Zoom Communications, Inc. sample application. Zoom Communications, Inc., its employees and affiliates are not responsible for the use and maintenance of this application. Please use this sample application for inspiration, exploration and experimentation at your own risk and enjoyment. You may reach out to the app creator and broader Zoom Developer community on https://devforum.zoom.us/ for technical discussion and assistance, but understand there is no service level agreement support for this application. Thank you and happy coding!

> ⚠️ このサンプルのアプリケーションは、Zoom Communications, Inc.の公式にサポートされているものではなく、アプリ作成者が個人的に公開しているオープンソースプロジェクトです。Zoom Communications, Inc.とその従業員、および関連会社は、本アプリケーションの使用や保守について責任を負いません。このサンプルアプリケーションは、あくまでもインスピレーション、探求、実験のためのものとして、ご自身の責任と楽しみの範囲でご活用ください。技術的な議論やサポートが必要な場合は、アプリ作成者やZoom開発者コミュニティ（ https://devforum.zoom.us/ ）にご連絡いただけますが、このアプリケーションにはサービスレベル契約に基づくサポートがないことをご理解ください。

# Zoom Video SDK minimum sample
This is a smallest sample that describes how to use the Zoom Video SDK.
For details, please visit [Zoom Video SDK for web](https://developers.zoom.us/docs/video-sdk/web/).

# How to use
1. You will need to populate the Video SDK client Key and secret in `.env` file. For details, visit [Get Video SDK credentials](https://developers.zoom.us/docs/video-sdk/developer-accounts/#get-video-sdk-credentials).
1. Then, run ```npm install``` to install required package.
2. ```node index.js``` to start.

## Notes
You will need to run this on a SSL certified web server. If you run locally, you might need to use a CORS test Chrome extensions such as [Allow CORS: Access-Control-Allow-origin](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf/) before start.

# Real-Time Media Streams (RTMS)

This sample includes RTMS (Real-Time Media Streams) start/stop functionality using the Video SDK's `RealTimeMediaStreamsClient`.

## What is RTMS?

RTMS allows you to stream live audio and video from a Video SDK session to an external server in real time. This is useful for building features such as live transcription, recording, analytics, and AI-powered media processing.

For details, visit [Zoom RTMS documentation](https://developers.zoom.us/docs/video-sdk/rtms/).

## How RTMS works in this sample

After joining a session as **Host**, two buttons appear:

- **Start RTMS** — calls `rtmsClient.startRealTimeMediaStreams()` to begin streaming media to the registered RTMS endpoint.
- **Stop RTMS** — calls `rtmsClient.stopRealTimeMediaStreams()` to stop the stream.

Button states are controlled by polling `rtmsClient.getRealTimeMediaStreamsStatus()`, which returns the following numeric values:

| Value | Meaning |
|-------|---------|
| `0` | Initial (never started) |
| `1` | Started (streaming) |
| `3` | Stopped |

## Prerequisites for RTMS

- You must join as **Host** (Role: 1). RTMS cannot be started by a Participant.
- RTMS must be enabled for your Video SDK app in the [Zoom App Marketplace](https://marketplace.zoom.us/).
- An RTMS-compatible receiver server must be running and registered to your app to receive the media stream. This sample only handles the client-side start/stop; the receiver server is out of scope.

## Deploy to GCP Cloud Run

```bash
gcloud run deploy vsdkbasicrtms --source . --platform managed --allow-unauthenticated --region asia-northeast1
```

The app listens on port `8080` (configured via `ENV PORT=8080` in the Dockerfile).
