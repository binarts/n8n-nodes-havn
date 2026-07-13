# HAVN n8n node

Use HAVN's remote MCP tools in n8n workflows. The node supports every currently published HAVN MCP tool, including properties, contacts, inquiries, tasks, open houses, leads, seller reports, analytics, media, documents, and attachments.

## Credentials

In HAVN, open **Settings > MCP access**, create an API key, then add it to the **HAVN MCP API** credential in n8n. Use a key with the `write` scope for create and update tools.

The node connects to `https://mcp.havnre.app/mcp` by default. The key is stored as an encrypted n8n credential. HAVN applies the same agency roles, scopes, plan limits, document storage quotas, and feature access controls as the HAVN apps.

## Using the node

1. Select a HAVN tool.
2. Fill in the named required inputs and choose optional inputs under **Additional Fields**.
3. The node outputs the tool result as standard n8n JSON.

For example, choose **Get Property Media**, set **Property ID** to `2622add8-df69-4339-9eb7-b8db40f50c8c`, and optionally set **Limit** to `10`. A successful item has this shape:

```json
{
  "tool": "get_property_media",
  "data": [{ "id": "photo-id", "property_id": "2622add8-df69-4339-9eb7-b8db40f50c8c", "url": "https://..." }]
}
```

Use **Custom MCP Tool** only when HAVN has released a new MCP tool that is not yet listed in this node version. Enter its exact MCP tool name and arguments as a JSON object; for normal workflows, prefer the named tools and their guided fields.

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

For verified community-node submission, publish to npm through GitHub Actions with provenance and submit through the n8n Creator Portal.
