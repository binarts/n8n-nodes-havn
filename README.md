# HAVN n8n node

Use HAVN's remote MCP tools in n8n workflows. The node supports every currently published HAVN MCP tool, including properties, contacts, inquiries, tasks, open houses, leads, seller reports, analytics, media, documents, and attachments.

## Credentials

In HAVN, open **Settings > MCP access**, create an API key, then add it to the **HAVN MCP API** credential in n8n. Use a key with the `write` scope for create and update tools.

The node connects to `https://mcp.havnre.app/mcp` by default. The key is stored as an encrypted n8n credential. HAVN applies the same agency roles, scopes, plan limits, document storage quotas, and feature access controls as the HAVN apps.

## Using the node

1. Select a HAVN tool.
2. Fill in the named required inputs and choose optional inputs under **Additional Fields**.
3. The node outputs the tool result as standard n8n JSON.

For example, `get_property_media` displays **Property ID** as a required input and **Limit** as an optional input. The **Custom MCP tool** option keeps a raw JSON field for newly released tools that are not yet included in the package.

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

For verified community-node submission, publish to npm through GitHub Actions with provenance and submit through the n8n Creator Portal.
