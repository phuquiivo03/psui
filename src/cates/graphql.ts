import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-tag";

// Types for the GraphQL query response
interface ReplyVoteHistory {
  userId: string;
  direction: boolean;
}

interface Community {
  id: string;
  isFrozen: boolean;
  avatar: string;
  name: string;
}

interface Post {
  title: string;
  content: string;
  postType: string;
  id: string;
  community: Community;
}

interface User {
  id: string;
}

interface Reply {
  id: string;
  id2: string;
  user: User;
  content: string;
  rating: number;
  postTime: string;
  isOfficialReply: boolean;
  isBestReply: boolean;
  post: Post;
  replyvotehistory: ReplyVoteHistory[];
}

interface RepliesConnection {
  totalCount: number;
}

interface GetRepliesResponse {
  reply: Reply[];
  repliesConnection: RepliesConnection;
}

interface GetRepliesVariables {
  limit: number;
  offset: number;
  id: string;
  networkIds: string[];
}

// The GraphQL query
const GET_REPLIES_QUERY = gql`
  query ($limit: Int, $offset: Int, $id: String, $networkIds: [String]) {
    reply(
      orderBy: POST_TIME_DESC
      first: $limit
      offset: $offset
      condition: { isDeleted: false, author: $id }
    ) {
      id
      id2
      user {
        id
      }
      content
      rating
      postTime
      isOfficialReply
      isBestReply
      post {
        title
        content
        postType
        id
        community {
          id
          isFrozen
          avatar
          name
        }
      }
      replyvotehistory {
        userId
        direction
      }
    }
    repliesConnection(condition: { isDeleted: false, author: $id }) {
      totalCount
    }
  }
`;

// Add a sleep function for retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches replies for a specific user with retry logic
 * @param userId The user ID to fetch replies for
 * @param limit Number of replies to fetch
 * @param offset Pagination offset
 * @param networkIds Array of network IDs to filter by
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with the GraphQL response
 */
export async function getUserReplies(
  userId: string,
  limit: number = 10,
  offset: number = 0,
  networkIds: string[] = ["3"],
  maxRetries: number = 3
): Promise<GetRepliesResponse> {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      const client = new GraphQLClient("https://api.peeranha.io/graphql", {
        headers: {
          accept: "*/*",
          "accept-language":
            "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
          "content-type": "application/json",
          origin: "https://sui.peera.ai",
          priority: "u=1, i",
          referer: "https://sui.peera.ai/",
          "sec-ch-ua":
            '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        },
      });

      const variables: GetRepliesVariables = {
        limit,
        offset,
        id: userId,
        networkIds,
      };

      const result = await client.request<GetRepliesResponse>(
        GET_REPLIES_QUERY,
        variables
      );

      console.log("Successfully fetched user replies");
      return result;
    } catch (error: any) {
      retries++;
      console.error(`Attempt ${retries}/${maxRetries} failed:`, error.message);

      // If we've reached max retries, try the fetch implementation as fallback
      if (retries >= maxRetries) {
        console.log("Falling back to fetch implementation...");
        return getUserRepliesWithFetch(userId, limit, offset, networkIds);
      }

      // Exponential backoff - wait longer between consecutive retries
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await sleep(delay);
    }
  }

  throw new Error(`Failed to fetch user replies after ${maxRetries} attempts`);
}

// Update fetch implementation to also include retries
export async function getUserRepliesWithFetch(
  userId: string,
  limit: number = 10,
  offset: number = 0,
  networkIds: string[] = ["3"],
  maxRetries: number = 3
): Promise<GetRepliesResponse> {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      const response = await fetch("https://api.peeranha.io/graphql", {
        method: "POST",
        headers: {
          accept: "*/*",
          "accept-language":
            "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
          "content-type": "application/json",
          origin: "https://sui.peera.ai",
          priority: "u=1, i",
          referer: "https://sui.peera.ai/",
          "sec-ch-ua":
            '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          query: `
            query(
              $limit: Int,
              $offset: Int,
              $id: String,
              $networkIds: [String]
            ) {
              reply (
                orderBy: POST_TIME_DESC,
                first: $limit,
                offset: $offset,
                condition: { 
                  isDeleted: false,
                  author: $id,
                },
              ) {
                id
                id2
                user {
                  id
                }
                content
                rating
                postTime
                isOfficialReply
                isBestReply
                post {
                  title
                  content
                  postType
                  id
                  community {
                    id
                    isFrozen
                    avatar
                    name
                  }
                }
                replyvotehistory {
                  userId
                  direction
                }
              }
              repliesConnection (
                condition: { 
                  isDeleted: false,
                  author: $id,
                },
              ) {
                totalCount
              }
            }
          `,
          variables: {
            limit,
            offset,
            id: userId,
            networkIds,
          },
        }),
      });

      // Check for status code even if fetch doesn't throw on HTTP errors
      if (response.status === 503) {
        throw new Error(`Service unavailable (503) - server may be overloaded`);
      }

      if (!response.ok) {
        throw new Error(
          `GraphQL request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      console.log("GraphQL response status:", response.status);

      if (!data.data) {
        throw new Error("Invalid GraphQL response: missing data field");
      }

      return data.data as GetRepliesResponse;
    } catch (error: any) {
      retries++;
      console.error(
        `Fetch attempt ${retries}/${maxRetries} failed:`,
        error.message
      );

      if (retries >= maxRetries) {
        throw new Error(`All fetch attempts failed: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`Retrying fetch in ${delay / 1000} seconds...`);
      await sleep(delay);
    }
  }

  throw new Error("Failed to fetch user replies with fetch");
}

// Example usage
async function fetchUserReplies() {
  try {
    const data = await getUserReplies(
      "0x449a613f2c8a8f40388fa93bc909be64323d7c53140d65c94e256764e73e3646",
      10,
      0,
      ["3"]
    );
    console.log("User replies count:", data.repliesConnection.totalCount);
    console.log("First reply:", data.reply[0]);
  } catch (error) {
    console.error("Failed to fetch user replies:", error);
  }
}

// Call the function if running directly
if (require.main === module) {
  fetchUserReplies();
}
