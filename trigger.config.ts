import { defineConfig } from "@trigger.dev/sdk/v3";
import { config } from "dotenv";

config();

if (!process.env.TRIGGER_PROJECT_ID) {
	throw new Error("TRIGGER_PROJECT_ID is not set");
}

export default defineConfig({
	project: process.env.TRIGGER_PROJECT_ID,
	runtime: "node",
	logLevel: "log",
	maxDuration: 3600,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ["./src/trigger"],
	build: {
		external: [
			"@livekit/rtc-node",
			"audio-decode",
		],
	},
	additionalPackages: [
		"@livekit/rtc-node@0.13.24",
		"audio-decode@2.2.3",
		"@vercel/blob@2.0.1",
	],
});
