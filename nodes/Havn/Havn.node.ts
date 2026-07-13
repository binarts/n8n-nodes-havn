import {
	NodeConnectionTypes,
	NodeApiError,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import {
	additionalFieldsName,
	buildToolParameterProperties,
	fieldKind,
	parameterName,
	TOOL_PARAMETERS,
} from './toolParameters.js';

type HavnMcpResponse = {
	body?: unknown;
	headers?: Record<string, string | string[] | undefined>;
};

type McpToolResult = {
	content?: Array<{ text?: string; type?: string }>;
	isError?: boolean;
};

const MCP_PROTOCOL_VERSION = '2025-03-26';

export const HAVN_MCP_TOOLS = [
	{ name: 'workspace_summary', description: 'Summarize the connected HAVN workspace.' },
	{ name: 'search_properties', description: 'Search properties and listing details.' },
	{ name: 'get_property_media', description: 'Get media for one property.' },
	{ name: 'search_contacts', description: 'Search contacts by name, email, or phone.' },
	{ name: 'search_tasks', description: 'Search HAVN tasks.' },
	{ name: 'search_open_houses', description: 'Search open houses and showings.' },
	{ name: 'search_leads', description: 'Search leads, general inquiries, property inquiries, and buyer requirements.' },
	{ name: 'search_seller_reports', description: 'Search seller reports.' },
	{ name: 'analytics_summary', description: 'Get HAVN analytics, inquiry mix, lead sources, and buyer requirements.' },
	{ name: 'search_files', description: 'Search documents and attachments.' },
	{ name: 'search_media', description: 'Search property and contact media.' },
	{ name: 'create_task', description: 'Create a task.' },
	{ name: 'update_task', description: 'Update a task.' },
	{ name: 'create_property', description: 'Create a property.' },
	{ name: 'update_property', description: 'Update a property.' },
	{ name: 'add_property_photos', description: 'Import property photos from public URLs.' },
	{ name: 'add_attachment', description: 'Import a document from a public URL.' },
	{ name: 'create_open_house', description: 'Create an open house.' },
	{ name: 'update_open_house', description: 'Update an open house.' },
	{ name: 'add_open_house_lead', description: 'Add a lead to an open house.' },
	{ name: 'create_inquiry', description: 'Create a general or property inquiry.' },
	{ name: 'update_inquiry', description: 'Update a general or property inquiry and buyer requirements.' },
	{ name: 'create_contact', description: 'Create a contact.' },
	{ name: 'update_contact', description: 'Update a contact.' },
	{ name: 'add_contact_photo', description: 'Import a contact photo from a public URL.' },
	{ name: 'add_contact_note', description: 'Append a contact note.' },
	{ name: 'update_lead_status', description: 'Update lead status or temperature.' },
	{ name: 'create_follow_up', description: 'Create a follow-up.' },
	{ name: 'update_follow_up', description: 'Update a follow-up.' },
	{ name: 'draft_seller_report_summary', description: 'Create a draft seller report.' },
	{ name: 'update_seller_report_summary', description: 'Update a seller report.' },
] as const;

export class Havn implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HAVN',
		name: 'havn',
		icon: 'file:havn.png',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		description: 'Use HAVN real-estate workspace tools through MCP',
		defaults: {
			name: 'HAVN',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'havnMcpApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Tool',
				name: 'tool',
				type: 'options',
				options: [
					...HAVN_MCP_TOOLS.map((tool) => ({
						name: tool.name
							.split('_')
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(' '),
						value: tool.name,
						description: tool.description,
					})),
					{
						name: 'Custom MCP Tool',
						value: 'custom',
						description: 'Call a newly released HAVN MCP tool before this package is updated.',
					},
				],
				default: 'workspace_summary',
				description: 'The HAVN MCP tool to call.',
			},
			{
				displayName: 'Custom Tool Name',
				name: 'customToolName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						tool: ['custom'],
					},
				},
				description: 'Exact HAVN MCP tool name.',
			},
			{
				displayName: 'Arguments (JSON)',
				name: 'argumentsJson',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						tool: ['custom'],
					},
				},
				description: 'Arguments for the custom MCP tool as a JSON object.',
			},
			...buildToolParameterProperties(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const output: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('havnMcpApi');
		const apiKey = String(credentials.apiKey ?? '').trim();
		const endpoint = normalizeEndpoint(String(credentials.endpoint ?? ''), this);

		if (!apiKey) {
			throw new NodeOperationError(this.getNode(), 'A HAVN MCP API key is required.');
		}

		for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
			try {
				const selectedTool = this.getNodeParameter('tool', itemIndex) as string;
				const toolName = selectedTool === 'custom'
					? String(this.getNodeParameter('customToolName', itemIndex)).trim()
					: selectedTool;
				if (!toolName) {
					throw new NodeOperationError(this.getNode(), 'A HAVN MCP tool name is required.', { itemIndex });
				}

				const legacyArguments = parseArguments(
					this.getNodeParameter('argumentsJson', itemIndex, '{}'),
					this,
					itemIndex,
				);
				const toolArguments = selectedTool === 'custom'
					? legacyArguments
					: { ...legacyArguments, ...collectToolArguments(this, selectedTool, itemIndex) };
				let data: unknown;
				if (toolName === 'add_attachment' && toolArguments.source === 'binary') {
					data = await uploadAttachmentBinary(this, items, itemIndex, endpoint, apiKey, toolArguments);
				} else if (toolName === 'add_property_photos' && toolArguments.source === 'binary') {
					data = await uploadPropertyPhotosBinary(this, items, itemIndex, endpoint, apiKey, toolArguments);
				} else if (toolName === 'add_contact_photo' && toolArguments.source === 'binary') {
					data = await uploadContactPhotoBinary(this, items, itemIndex, endpoint, apiKey, toolArguments);
				} else {
					delete toolArguments.source;
					delete toolArguments.binary_property_name;
					delete toolArguments.binary_photos;
					const sessionId = await initializeMcpSession(this, endpoint, apiKey);
					const result = await callMcpTool(this, endpoint, apiKey, sessionId, toolName, toolArguments);
					data = parseToolContent(result);
				}

				output.push({
					json: {
						data: data as INodeExecutionData['json'][string],
						tool: toolName,
					},
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					output.push({ json: { error: errorMessage(error) }, pairedItem: { item: itemIndex } });
					continue;
				}
				if (error instanceof NodeOperationError) throw error;
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [output];
	}
}

function normalizeEndpoint(value: string, context: IExecuteFunctions): string {
	const endpoint = value.trim();
	try {
		const url = new URL(endpoint);
		if (url.protocol !== 'https:' || url.pathname !== '/mcp') {
			throw new Error('invalid endpoint');
		}
		return url.toString();
	} catch {
		throw new NodeOperationError(context.getNode(), 'The HAVN MCP endpoint must be an HTTPS URL ending in /mcp.');
	}
}

function collectToolArguments(
	context: IExecuteFunctions,
	tool: string,
	itemIndex: number,
): Record<string, unknown> {
	const definition = TOOL_PARAMETERS[tool];
	if (!definition) return {};

	const result: Record<string, unknown> = {};
	for (const field of definition.fields.filter((candidate) => candidate.required)) {
		if (field.showWhen) {
			const dependency = context.getNodeParameter(parameterName(tool, field.showWhen.field), itemIndex);
			if (dependency !== field.showWhen.value) continue;
		}
		const value = context.getNodeParameter(parameterName(tool, field.name), itemIndex);
		if (value !== '') {
			addArgumentValue(result, field.name, value, fieldKind(tool, field.name));
		}
	}

	if (definition.fields.some((field) => !field.required)) {
		const additional = context.getNodeParameter(additionalFieldsName(tool), itemIndex, {}) as Record<string, unknown>;
		for (const [name, value] of Object.entries(additional)) {
			addArgumentValue(result, name, value, fieldKind(tool, name));
		}
	}
	return result;
}

async function uploadAttachmentBinary(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	endpoint: string,
	apiKey: string,
	toolArguments: Record<string, unknown>,
): Promise<unknown> {
	const binaryPropertyName = String(toolArguments.binary_property_name ?? 'data').trim() || 'data';
	const binary = items[itemIndex]?.binary?.[binaryPropertyName];
	if (!binary) {
		throw new NodeOperationError(
			context.getNode(),
			`No incoming binary file was found in property "${binaryPropertyName}". Add a file-producing node before HAVN or choose Public URL.`,
			{ itemIndex },
		);
	}
	const bytes = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	const headers: Record<string, string> = {
		authorization: `Bearer ${apiKey}`,
		'content-type': binary.mimeType || 'application/octet-stream',
		'x-havn-file-name': encodeURIComponent(String(toolArguments.file_name || binary.fileName || 'attachment')),
	};
	if (toolArguments.property_id) headers['x-havn-property-id'] = String(toolArguments.property_id);
	if (toolArguments.task_id) headers['x-havn-task-id'] = String(toolArguments.task_id);

	return await context.helpers.httpRequest({
		method: 'POST',
		url: new URL('/uploads/attachments', endpoint).toString(),
		headers,
		body: bytes,
		json: true,
	});
}

async function uploadPropertyPhotosBinary(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	endpoint: string,
	apiKey: string,
	toolArguments: Record<string, unknown>,
): Promise<unknown> {
	const rows = (toolArguments.binary_photos as { photo?: Array<{ alt_text?: string; binary_property_name?: string }> })?.photo ?? [];
	if (rows.length === 0) {
		throw new NodeOperationError(context.getNode(), 'Add at least one incoming binary photo.', { itemIndex });
	}
	const uploaded: unknown[] = [];
	for (let index = 0; index < rows.length; index += 1) {
		const row = rows[index];
		const binaryPropertyName = String(row.binary_property_name ?? 'data').trim() || 'data';
		const { binary, bytes } = await incomingBinary(context, items, itemIndex, binaryPropertyName);
		uploaded.push(await context.helpers.httpRequest({
			method: 'POST',
			url: new URL('/uploads/property-photos', endpoint).toString(),
			headers: {
				authorization: `Bearer ${apiKey}`,
				'content-type': binary.mimeType || 'application/octet-stream',
				'x-havn-alt-text': encodeURIComponent(String(row.alt_text ?? '')),
				'x-havn-file-name': encodeURIComponent(binary.fileName || `property-photo-${index + 1}`),
				'x-havn-is-hero': String(Boolean(toolArguments.is_hero_first && index === 0)),
				'x-havn-property-id': String(toolArguments.property_id),
			},
			body: bytes,
			json: true,
		}));
	}
	return { count: uploaded.length, photos: uploaded.flat() };
}

async function uploadContactPhotoBinary(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	endpoint: string,
	apiKey: string,
	toolArguments: Record<string, unknown>,
): Promise<unknown> {
	const binaryPropertyName = String(toolArguments.binary_property_name ?? 'data').trim() || 'data';
	const { binary, bytes } = await incomingBinary(context, items, itemIndex, binaryPropertyName);
	return await context.helpers.httpRequest({
		method: 'POST',
		url: new URL('/uploads/contact-photos', endpoint).toString(),
		headers: {
			authorization: `Bearer ${apiKey}`,
			'content-type': binary.mimeType || 'application/octet-stream',
			'x-havn-contact-id': String(toolArguments.contact_id),
			'x-havn-file-name': encodeURIComponent(binary.fileName || 'contact-photo'),
		},
		body: bytes,
		json: true,
	});
}

async function incomingBinary(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	binaryPropertyName: string,
) {
	const binary = items[itemIndex]?.binary?.[binaryPropertyName];
	if (!binary) {
		throw new NodeOperationError(
			context.getNode(),
			`No incoming binary file was found in property "${binaryPropertyName}". Add a file-producing node before HAVN or choose Public URL.`,
			{ itemIndex },
		);
	}
	return {
		binary,
		bytes: await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName),
	};
}

function addArgumentValue(
	result: Record<string, unknown>,
	name: string,
	value: unknown,
	kind: string,
): void {
	if (kind === 'photos') {
		const rows = (value as { photo?: Array<{ alt_text?: string; image_url?: string }> }).photo ?? [];
		result.image_urls = rows.map((row) => String(row.image_url ?? '').trim()).filter(Boolean);
		const altTexts = rows.map((row) => String(row.alt_text ?? '').trim());
		if (altTexts.some(Boolean)) result.alt_texts = altTexts;
		return;
	}
	if (kind === 'binaryPhotos') {
		result.binary_photos = value;
		return;
	}
	if (kind === 'sourceCounts') {
		const rows = (value as { source?: Array<{ count?: number; name?: string }> }).source ?? [];
		const counts: Record<string, number> = {};
		for (const row of rows) {
			const source = String(row.name ?? '').trim();
			if (source) counts[source] = Math.max(0, Number(row.count ?? 0));
		}
		const key = name.replace(/^ai_summary_/, '');
		const aiSummary = (result.ai_summary_json ?? {}) as Record<string, unknown>;
		aiSummary[key] = counts;
		result.ai_summary_json = aiSummary;
		return;
	}
	if (name.startsWith('ai_summary_')) {
		const key = name.slice('ai_summary_'.length);
		const aiSummary = (result.ai_summary_json ?? {}) as Record<string, unknown>;
		aiSummary[key] = normalizeArgumentValue(value, kind);
		result.ai_summary_json = aiSummary;
		return;
	}
	result[name] = normalizeArgumentValue(value, kind);
}

function normalizeArgumentValue(value: unknown, kind: string): unknown {
	if (kind === 'stringList' && typeof value === 'string') {
		return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	}
	return value;
}

function parseArguments(value: unknown, context: IExecuteFunctions, itemIndex: number): Record<string, unknown> {
	try {
		const parsed: unknown = typeof value === 'string' ? JSON.parse(value || '{}') : value;
		if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
			throw new Error('Arguments must be a JSON object.');
		}
		return parsed as Record<string, unknown>;
	} catch (error) {
		throw new NodeOperationError(context.getNode(), `Invalid Arguments JSON: ${errorMessage(error)}`, { itemIndex });
	}
}

async function initializeMcpSession(
	context: IExecuteFunctions,
	endpoint: string,
	apiKey: string,
): Promise<string | undefined> {
	const response = await mcpRequest(context, endpoint, apiKey, undefined, {
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: MCP_PROTOCOL_VERSION,
			capabilities: {},
			clientInfo: { name: 'n8n-nodes-havn', version: '0.1.0' },
		},
	});

	assertMcpSuccess(response.body, context);
	const sessionId = headerValue(response.headers, 'mcp-session-id');
	await mcpRequest(context, endpoint, apiKey, sessionId, {
		jsonrpc: '2.0',
		method: 'notifications/initialized',
		params: {},
	});
	return sessionId;
}

async function callMcpTool(
	context: IExecuteFunctions,
	endpoint: string,
	apiKey: string,
	sessionId: string | undefined,
	toolName: string,
	toolArguments: Record<string, unknown>,
): Promise<McpToolResult> {
	const response = await mcpRequest(context, endpoint, apiKey, sessionId, {
		jsonrpc: '2.0',
		id: 2,
		method: 'tools/call',
		params: { name: toolName, arguments: toolArguments },
	});

	const body = assertMcpSuccess(response.body, context);
	const result = (body as { result?: McpToolResult }).result;
	if (!result) {
		throw new NodeOperationError(context.getNode(), 'HAVN MCP returned no tool result.');
	}
	if (result.isError) {
		throw new NodeOperationError(context.getNode(), toolText(result) || 'HAVN MCP could not complete this tool call.');
	}
	return result;
}

async function mcpRequest(
	context: IExecuteFunctions,
	endpoint: string,
	apiKey: string,
	sessionId: string | undefined,
	body: Record<string, unknown>,
): Promise<HavnMcpResponse> {
	const headers: Record<string, string> = {
		accept: 'application/json, text/event-stream',
		authorization: `Bearer ${apiKey}`,
		'content-type': 'application/json',
	};
	if (sessionId) headers['mcp-session-id'] = sessionId;

	return await context.helpers.httpRequest({
		method: 'POST',
		url: endpoint,
		headers,
		body,
		json: true,
		returnFullResponse: true,
	}) as HavnMcpResponse;
}

function assertMcpSuccess(value: unknown, context: IExecuteFunctions): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new NodeOperationError(context.getNode(), 'HAVN MCP returned an invalid response.');
	}
	const body = value as Record<string, unknown>;
	if (body.error) {
		const error = body.error as { message?: string };
		throw new NodeOperationError(context.getNode(), error.message || 'HAVN MCP request failed.');
	}
	return body;
}

function parseToolContent(result: McpToolResult): unknown {
	const text = toolText(result);
	if (!text) return null;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return { text };
	}
}

function toolText(result: McpToolResult): string {
	return result.content
		?.filter((item) => item.type === 'text' && typeof item.text === 'string')
		.map((item) => item.text)
		.join('\n') ?? '';
}

function headerValue(headers: HavnMcpResponse['headers'], headerName: string): string | undefined {
	if (!headers) return undefined;
	const value = headers[headerName] ?? headers[headerName.toLowerCase()];
	return Array.isArray(value) ? value[0] : value;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
