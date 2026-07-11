import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class HavnMcpApi implements ICredentialType {
	name = 'havnMcpApi';
	displayName = 'HAVN MCP API';
	documentationUrl = 'https://havnre.app/mcp/';

	properties: INodeProperties[] = [
		{
			displayName: 'HAVN MCP API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Create or rotate this key in HAVN Settings > MCP access. A key with write scope is needed for write tools.',
		},
		{
			displayName: 'MCP Endpoint',
			name: 'endpoint',
			type: 'string',
			default: 'https://mcp.havnre.app/mcp',
			required: true,
			description: 'The HAVN remote MCP endpoint.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.endpoint}}',
			url: '',
			method: 'POST',
			headers: {
				Accept: 'application/json, text/event-stream',
				Authorization: '=Bearer {{$credentials.apiKey}}',
				'Content-Type': 'application/json',
			},
			body: {
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: '2025-03-26',
					capabilities: {},
					clientInfo: {
						name: 'n8n-credential-test',
						version: '1.0.0',
					},
				},
			},
		},
	};
}
