# Atlassian MCP Server

A Model Context Protocol (MCP) server for integrating with Atlassian Jira. This server provides tools for managing Jira projects, issues, boards, and comments via MCP.

## Features

- **List Projects**: View all accessible Jira projects
- **List Issues**: Query issues with JQL filtering
- **Get Issue**: Retrieve detailed information about a specific issue
- **Create Issue**: Create new issues in Jira
- **Update Issue**: Modify existing issues
- **Search Issues**: Search for issues using JQL queries
- **Get Boards**: List boards in a project
- **Add Comments**: Add comments to issues

## Setup

### Prerequisites

- Node.js 18+
- Atlassian Jira account with API access
- Jira API token (generate at https://id.atlassian.com/manage-profile/security/api-tokens)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

### Configuration

Set the following environment variables:

```bash
export ATLASSIAN_DOMAIN="martinchrbuur.atlassian.net"
export ATLASSIAN_API_TOKEN="your-api-token"
export ATLASSIAN_USER_EMAIL="your-email@example.com"
```

For VS Code integration with Claude, update your Claude settings to include this MCP server by adding the configuration to your MCP settings.

### Running the Server

```bash
npm start
```

Or for development with watch mode:

```bash
npm run dev
```

## Usage

Once the server is running, it exposes the following tools through MCP:

### List Projects
Retrieve all accessible projects. Optional pagination with `maxResults`.

### List Issues
Query issues with optional JQL filtering or project key filtering.

### Get Issue
Fetch detailed information about a specific issue by its key (e.g., "PROJ-123").

### Create Issue
Create a new issue with:
- `projectKey`: Project identifier
- `summary`: Issue title
- `issueType`: Type (Task, Bug, Story, etc.)
- `description`: Optional description
- `priority`: Optional priority level

### Update Issue
Update an existing issue's summary, description, status, or assignee.

### Search Issues
Search using JQL queries with optional result limiting.

### Get Boards
List all boards, optionally filtered by project.

### Add Comment
Add a comment to an issue using Atlassian's document format.

## Architecture

- **index.ts**: Main MCP server implementation using the official TypeScript SDK
- **Axios Client**: REST API client for Atlassian Jira
- **Tool Handlers**: Implement each MCP tool as handler methods

## Error Handling

The server includes error handling for:
- Missing environment variables
- API authentication failures
- Invalid requests
- Jira API errors

## Documentation

For more information about MCP, visit: https://modelcontextprotocol.io/

For Jira REST API documentation: https://developer.atlassian.com/cloud/jira/rest/v3/

## License

MIT
