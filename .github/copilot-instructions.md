# Atlassian MCP Server Project Setup

This project implements a Model Context Protocol (MCP) server for integrating with Atlassian Jira.

## Project Details

- **Project Type**: MCP Server (TypeScript)
- **Framework**: TypeScript with MCP SDK
- **API Integration**: Atlassian Jira REST API v3
- **Transport**: Stdio (standard input/output)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@modelcontextprotocol/sdk`: Official MCP TypeScript SDK
- `axios`: HTTP client for Jira API requests
- `typescript`: TypeScript compiler

### 2. Build the Project

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `build/` directory.

### 3. Configure Environment Variables

Before running the server, set these environment variables:

```bash
export ATLASSIAN_DOMAIN="martinchrbuur.atlassian.net"
export ATLASSIAN_API_TOKEN="your-jira-api-token"
export ATLASSIAN_USER_EMAIL="your-email@atlassian.com"
```

**How to get an API Token**:
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the generated token
4. Use it as `ATLASSIAN_API_TOKEN`

### 4. Running the Server

```bash
npm start
```

The server will run on stdio and be ready to receive MCP calls.

## VS Code Integration

The `.vscode/mcp.json` file contains the MCP server configuration for Claude integration. To use with Claude:

1. Ensure the server is built: `npm run build`
2. Configure your Claude client to use this MCP server
3. The server will communicate via stdio

## Available Tools

The server provides 8 tools:

1. **list_projects** - List all accessible Jira projects
2. **list_issues** - Query issues with JQL filtering or by project
3. **get_issue** - Get detailed information about a specific issue
4. **create_issue** - Create a new Jira issue
5. **update_issue** - Update an existing issue
6. **search_issues** - Search for issues using JQL
7. **get_boards** - List boards in a project
8. **add_comment** - Add a comment to an issue

## Project Structure

```
.
├── src/
│   └── index.ts           # Main MCP server implementation
├── build/                 # Compiled JavaScript output
├── .vscode/
│   └── mcp.json          # MCP server configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # User documentation
```

## References

- MCP Documentation: https://modelcontextprotocol.io/
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Jira REST API: https://developer.atlassian.com/cloud/jira/rest/v3/
- MCP Servers Examples: https://github.com/modelcontextprotocol/servers

## Development Workflow

```bash
# Build and watch for changes
npm run watch

# Build and run
npm run dev

# Just build
npm run build

# Just run (requires build)
npm start
```

## Troubleshooting

### Missing Environment Variables
Ensure all three environment variables are set before running:
- `ATLASSIAN_DOMAIN`
- `ATLASSIAN_API_TOKEN`
- `ATLASSIAN_USER_EMAIL`

### API Authentication Errors
Verify that:
- Your API token is valid (regenerate if necessary)
- Your email matches your Atlassian account
- Your domain is correct

### Build Errors
```bash
npm install --save-dev typescript @types/node
npm run build
```
