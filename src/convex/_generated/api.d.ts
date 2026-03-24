/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as characters from "../characters.js";
import type * as charactersInternal from "../charactersInternal.js";
import type * as crons from "../crons.js";
import type * as discord_channelPoller from "../discord/channelPoller.js";
import type * as discord_channelPollerQueries from "../discord/channelPollerQueries.js";
import type * as discord_commands from "../discord/commands.js";
import type * as discord_http from "../discord/http.js";
import type * as discord_messages from "../discord/messages.js";
import type * as discord_types from "../discord/types.js";
import type * as http from "../http.js";
import type * as pollResponses from "../pollResponses.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  characters: typeof characters;
  charactersInternal: typeof charactersInternal;
  crons: typeof crons;
  "discord/channelPoller": typeof discord_channelPoller;
  "discord/channelPollerQueries": typeof discord_channelPollerQueries;
  "discord/commands": typeof discord_commands;
  "discord/http": typeof discord_http;
  "discord/messages": typeof discord_messages;
  "discord/types": typeof discord_types;
  http: typeof http;
  pollResponses: typeof pollResponses;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
