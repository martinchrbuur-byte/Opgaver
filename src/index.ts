import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios, { AxiosInstance } from "axios";

const ATLASSIAN_DOMAIN = process.env.ATLASSIAN_DOMAIN || "martinchrbuur.atlassian.net";
const API_TOKEN = process.env.ATLASSIAN_API_TOKEN || "";
const USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || "";

if (!API_TOKEN || !USER_EMAIL) {
  console.error(
    "Error: ATLASSIAN_API_TOKEN and ATLASSIAN_USER_EMAIL environment variables must be set"
  );
  process.exit(1);
}

class AtlassianMCPServer {
  private server: Server;
  private client: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: "atlassian-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = axios.create({
      baseURL: `https://${ATLASSIAN_DOMAIN}/rest/api/3`,
      auth: {
        username: USER_EMAIL,
        password: API_TOKEN,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_projects",
            description: "List all Jira projects accessible to the user",
            inputSchema: {
              type: "object",
              properties: {
                maxResults: {
                  type: "number",
                  description: "Maximum number of projects to return (default: 50)",
                },
              },
              required: [],
            },
          },
          {
            name: "list_issues",
            description: "List Jira issues with optional filtering",
            inputSchema: {
              type: "object",
              properties: {
                jql: {
                  type: "string",
                  description: "JQL query to filter issues",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of issues to return (default: 50)",
                },
                projectKey: {
                  type: "string",
                  description: "Project key to filter issues (e.g., 'PROJ')",
                },
              },
              required: [],
            },
          },
          {
            name: "get_issue",
            description: "Get details of a specific Jira issue",
            inputSchema: {
              type: "object",
              properties: {
                issueKey: {
                  type: "string",
                  description: "The issue key (e.g., 'PROJ-123')",
                },
              },
              required: ["issueKey"],
            },
          },
          {
            name: "create_issue",
            description: "Create a new Jira issue",
            inputSchema: {
              type: "object",
              properties: {
                projectKey: {
                  type: "string",
                  description: "The project key where the issue will be created",
                },
                summary: {
                  type: "string",
                  description: "Title/summary of the issue",
                },
                description: {
                  type: "string",
                  description: "Description of the issue",
                },
                issueType: {
                  type: "string",
                  description: "Type of issue (e.g., 'Task', 'Bug', 'Story')",
                },
                priority: {
                  type: "string",
                  description: "Priority level (e.g., 'High', 'Medium', 'Low')",
                },
              },
              required: ["projectKey", "summary", "issueType"],
            },
          },
          {
            name: "update_issue",
            description: "Update an existing Jira issue",
            inputSchema: {
              type: "object",
              properties: {
                issueKey: {
                  type: "string",
                  description: "The issue key (e.g., 'PROJ-123')",
                },
                summary: {
                  type: "string",
                  description: "New summary/title (optional)",
                },
                description: {
                  type: "string",
                  description: "New description (optional)",
                },
                status: {
                  type: "string",
                  description: "New status (e.g., 'To Do', 'In Progress', 'Done')",
                },
                assignee: {
                  type: "string",
                  description: "Email of the assignee (optional)",
                },
              },
              required: ["issueKey"],
            },
          },
          {
            name: "search_issues",
            description: "Search for Jira issues using JQL",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query or JQL",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results (default: 50)",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_boards",
            description: "List all boards in a project",
            inputSchema: {
              type: "object",
              properties: {
                projectKey: {
                  type: "string",
                  description: "Project key (optional)",
                },
              },
              required: [],
            },
          },
          {
            name: "add_comment",
            description: "Add a comment to a Jira issue",
            inputSchema: {
              type: "object",
              properties: {
                issueKey: {
                  type: "string",
                  description: "The issue key (e.g., 'PROJ-123')",
                },
                comment: {
                  type: "string",
                  description: "The comment text",
                },
              },
              required: ["issueKey", "comment"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleToolCall(request);
    });
  }

  private async handleToolCall(request: {
    params: {
      name: string;
      arguments?: Record<string, unknown>;
    };
  }): Promise<{ content: TextContent[] }> {
    const { name, arguments: args } = request.params;
    const arguments_ = args || {};

    try {
      switch (name) {
        case "list_projects":
          return await this.listProjects(arguments_);
        case "list_issues":
          return await this.listIssues(arguments_);
        case "get_issue":
          return await this.getIssue(arguments_);
        case "create_issue":
          return await this.createIssue(arguments_);
        case "update_issue":
          return await this.updateIssue(arguments_);
        case "search_issues":
          return await this.searchIssues(arguments_);
        case "get_boards":
          return await this.getBoards(arguments_);
        case "add_comment":
          return await this.addComment(arguments_);
        default:
          return {
            content: [
              {
                type: "text" as const,
                text: `Unknown tool: ${name}`,
              } as TextContent,
            ],
          };
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown error";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        const axiosError = error as any;
        if (axiosError.response?.data) {
          errorMessage = JSON.stringify(axiosError.response.data, null, 2);
        } else {
          errorMessage = JSON.stringify(error, null, 2);
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${errorMessage}`,
          } as TextContent,
        ],
      };
    }
  }

  private async listProjects(args: Record<string, unknown>) {
    const maxResults = (args.maxResults as number) || 50;
    const response = await this.client.get("/project", {
      params: { maxResults },
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async listIssues(args: Record<string, unknown>) {
    const maxResults = (args.maxResults as number) || 50;
    let jql = args.jql as string;

    if (!jql && args.projectKey) {
      jql = `project = "${args.projectKey}"`;
    }

    const params: Record<string, unknown> = { maxResults };
    if (jql) {
      params.jql = jql;
    }

    const response = await this.client.get("/search", { params });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async getIssue(args: Record<string, unknown>) {
    const issueKey = args.issueKey as string;
    const response = await this.client.get(`/issue/${issueKey}`);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async createIssue(args: Record<string, unknown>) {
    const projectKey = args.projectKey as string;
    const summary = args.summary as string;
    const issueType = args.issueType as string;
    const description = (args.description as string) || "";
    const priority = (args.priority as string) || "Medium";

    // Convert description to Atlassian Document Format
    const descriptionDoc = {
      type: "doc" as const,
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: description,
            },
          ],
        },
      ],
    };

    const payload = {
      fields: {
        project: { key: projectKey },
        summary,
        issuetype: { name: issueType },
        description: descriptionDoc,
        priority: { name: priority },
      },
    };

    const response = await this.client.post("/issue", payload);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async updateIssue(args: Record<string, unknown>) {
    const issueKey = args.issueKey as string;
    const payload: Record<string, unknown> = { fields: {} };

    if (args.summary) {
      (payload.fields as Record<string, unknown>).summary = args.summary;
    }
    if (args.description) {
      (payload.fields as Record<string, unknown>).description = args.description;
    }
    if (args.assignee) {
      (payload.fields as Record<string, unknown>).assignee = { name: args.assignee };
    }

    await this.client.put(`/issue/${issueKey}`, payload);
    return {
      content: [
        {
          type: "text" as const,
          text: `Issue ${issueKey} updated successfully`,
        } as TextContent,
      ],
    };
  }

  private async searchIssues(args: Record<string, unknown>) {
    const query = args.query as string;
    const maxResults = (args.maxResults as number) || 50;

    const response = await this.client.get("/search", {
      params: {
        jql: query,
        maxResults,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async getBoards(args: Record<string, unknown>) {
    const params: Record<string, unknown> = {};
    if (args.projectKey) {
      params.projectKey = args.projectKey;
    }

    const response = await this.client.get("/board", { params });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  private async addComment(args: Record<string, unknown>) {
    const issueKey = args.issueKey as string;
    const comment = args.comment as string;

    const payload = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment,
              },
            ],
          },
        ],
      },
    };

    const response = await this.client.post(
      `/issue/${issueKey}/comment`,
      payload
    );
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(response.data, null, 2),
        } as TextContent,
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Atlassian MCP server running on stdio");
  }
}

const server = new AtlassianMCPServer();
server.run().catch(console.error);
