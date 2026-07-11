import type { INodeProperties } from 'n8n-workflow';

type FieldKind = 'boolean' | 'dateTime' | 'number' | 'photos' | 'string' | 'stringList';

type ToolField = {
	description?: string;
	kind?: FieldKind;
	name: string;
	options?: string[];
	required?: boolean;
	showWhen?: { field: string; value: string };
};

export type ToolParameterDefinition = {
	fields: ToolField[];
};

const searchFields: ToolField[] = [
	{ name: 'query', description: 'Search text, such as a name, email, phone, address, or title.' },
	{ name: 'limit', kind: 'number', description: 'Maximum number of results.' },
	{ name: 'offset', kind: 'number', description: 'Number of matching records to skip.' },
];

const taskTypes = [
	'follow_up_lead', 'call_buyer', 'send_brochure', 'schedule_private_tour',
	'prepare_seller_report', 'review_ai_follow_up', 'update_property_details',
	'setup_kiosk_mode', 'invite_agent', 'collect_seller_feedback', 'custom',
];

const taskFields: ToolField[] = [
	{ name: 'title', required: true },
	{ name: 'assigned_to_user_id', description: 'HAVN user UUID.' },
	{ name: 'contact_id', description: 'HAVN contact UUID.' },
	{ name: 'description' }, { name: 'due_at', kind: 'dateTime' },
	{ name: 'lead_id', description: 'HAVN lead UUID.' }, { name: 'notes' },
	{ name: 'open_house_id', description: 'HAVN open house UUID.' },
	{ name: 'priority', options: ['low', 'medium', 'high', 'urgent'] },
	{ name: 'property_id', description: 'HAVN property UUID.' },
	{ name: 'type', options: taskTypes },
];

const propertyFields: ToolField[] = [
	{ name: 'title', required: true }, { name: 'address_line_1', required: true },
	{ name: 'city', required: true }, { name: 'region', required: true },
	{ name: 'assigned_agent_id' }, { name: 'asking_price', kind: 'number' },
	{ name: 'bathrooms', kind: 'number' }, { name: 'bedrooms', kind: 'number' },
	{ name: 'country' }, { name: 'description' }, { name: 'interior_sqft', kind: 'number' },
	{ name: 'latitude', kind: 'number' }, { name: 'longitude', kind: 'number' },
	{ name: 'lot_sqft', kind: 'number' }, { name: 'owner_email' },
	{ name: 'owner_first_name' }, { name: 'owner_last_name' }, { name: 'owner_phone' },
	{ name: 'postal_code' }, { name: 'private_notes' },
	{ name: 'status', options: ['draft', 'active', 'under_contract', 'sold', 'archived'] },
];

const contactFields: ToolField[] = [
	{ name: 'full_name', required: true }, { name: 'email' }, { name: 'first_name' },
	{ name: 'last_name' }, { name: 'notes' }, { name: 'phone' },
	{ name: 'preferred_contact_channel', options: ['sms', 'email', 'phone'] },
];

const sellerAiFields: ToolField[] = [
	{ name: 'ai_summary_summary', description: 'AI-assisted overall summary.' },
	{ name: 'ai_summary_lead_quality', description: 'Summary of lead quality.' },
	{ name: 'ai_summary_open_house_activity', description: 'Summary of open house activity.' },
	{ name: 'ai_summary_pricing_notes', description: 'Pricing observations.' },
	{ name: 'ai_summary_buyer_feedback', kind: 'stringList', description: 'One buyer feedback item per line.' },
	{ name: 'ai_summary_highlights', kind: 'stringList', description: 'One highlight per line.' },
	{ name: 'ai_summary_next_steps', kind: 'stringList', description: 'One next step per line.' },
	{ name: 'ai_summary_questions', kind: 'stringList', description: 'One question per line.' },
	{ name: 'ai_summary_risks', kind: 'stringList', description: 'One risk per line.' },
];

export const TOOL_PARAMETERS: Record<string, ToolParameterDefinition> = {
	workspace_summary: { fields: [] },
	search_properties: { fields: searchFields },
	get_property_media: { fields: [
		{ name: 'property_id', required: true, description: 'HAVN property UUID.' },
		{ name: 'limit', kind: 'number', description: 'Maximum number of media records, up to 50.' },
	] },
	search_contacts: { fields: searchFields },
	search_tasks: { fields: searchFields },
	search_open_houses: { fields: searchFields },
	search_leads: { fields: searchFields },
	search_seller_reports: { fields: searchFields },
	analytics_summary: { fields: [
		{ name: 'property_id', description: 'Optional HAVN property UUID.' },
		{ name: 'limit', kind: 'number', description: 'Maximum number of analytics records, up to 100.' },
	] },
	search_files: { fields: searchFields },
	search_media: { fields: searchFields },
	create_task: { fields: taskFields },
	update_task: { fields: [
		{ name: 'task_id', required: true, description: 'HAVN task UUID.' },
		...taskFields.map((field) => ({ ...field, required: false })),
		{ name: 'completed_at', kind: 'dateTime' },
		{ name: 'status', options: ['open', 'in_progress', 'done', 'overdue', 'cancelled'] },
	] },
	create_property: { fields: propertyFields },
	update_property: { fields: [
		{ name: 'property_id', required: true, description: 'HAVN property UUID.' },
		...propertyFields.map((field) => ({ ...field, required: false })),
		{ name: 'address_line_2' },
	] },
	add_property_photos: { fields: [
		{ name: 'property_id', required: true, description: 'HAVN property UUID.' },
		{ name: 'photos', required: true, kind: 'photos', description: 'Public image URLs and optional alt text.' },
		{ name: 'is_hero_first', kind: 'boolean', description: 'Use the first imported photo as the hero image.' },
	] },
	add_attachment: { fields: [
		{ name: 'source', required: true, options: ['binary', 'public_url'], description: 'Upload incoming n8n binary data or import a public URL.' },
		{ name: 'binary_property_name', required: true, showWhen: { field: 'source', value: 'binary' }, description: 'Name of the incoming binary property. Usually data.' },
		{ name: 'file_url', required: true, showWhen: { field: 'source', value: 'public_url' }, description: 'Public HTTP or HTTPS URL of the document to import.' },
		{ name: 'file_name' }, { name: 'property_id' }, { name: 'task_id' },
	] },
	create_open_house: { fields: [
		{ name: 'property_id', required: true }, { name: 'starts_at', required: true, kind: 'dateTime' },
		{ name: 'ends_at', required: true, kind: 'dateTime' }, { name: 'access_notes' },
		{ name: 'host_agent_id' }, { name: 'internal_notes' },
		{ name: 'status', options: ['scheduled', 'live', 'completed', 'cancelled'] }, { name: 'title' },
	] },
	update_open_house: { fields: [
		{ name: 'open_house_id', required: true }, { name: 'property_id' },
		{ name: 'starts_at', kind: 'dateTime' }, { name: 'ends_at', kind: 'dateTime' },
		{ name: 'access_notes' }, { name: 'host_agent_id' }, { name: 'internal_notes' },
		{ name: 'status', options: ['scheduled', 'live', 'completed', 'cancelled'] }, { name: 'title' },
	] },
	add_open_house_lead: { fields: [
		{ name: 'open_house_id', required: true }, { name: 'buyer_agent_email' },
		{ name: 'buyer_agent_name' }, { name: 'contact_id' }, { name: 'email' },
		{ name: 'full_name' }, { name: 'intent_score', kind: 'number' }, { name: 'notes' },
		{ name: 'phone' }, { name: 'represented_by_agent', kind: 'boolean' },
		{ name: 'status', options: ['new', 'qualified', 'follow_up', 'converted', 'archived'] },
		{ name: 'temperature', options: ['hot', 'warm', 'cold'] },
	] },
	create_inquiry: { fields: [
		{ name: 'contact_id', required: true }, { name: 'property_id', required: true },
		{ name: 'intent_score', kind: 'number' }, { name: 'notes' },
		{ name: 'status', options: ['new', 'qualified', 'follow_up', 'converted', 'archived'] },
		{ name: 'temperature', options: ['hot', 'warm', 'cold'] },
	] },
	update_inquiry: { fields: [
		{ name: 'inquiry_id', required: true }, { name: 'contact_id' },
		{ name: 'intent_score', kind: 'number' }, { name: 'notes' },
		{ name: 'status', options: ['new', 'qualified', 'follow_up', 'converted', 'archived'] },
		{ name: 'temperature', options: ['hot', 'warm', 'cold'] },
	] },
	create_contact: { fields: contactFields },
	update_contact: { fields: [
		{ name: 'contact_id', required: true },
		...contactFields.map((field) => ({ ...field, required: false })),
		{ name: 'status', options: ['active', 'archived'] },
	] },
	add_contact_photo: { fields: [
		{ name: 'contact_id', required: true },
		{ name: 'image_url', required: true, description: 'Public URL of the contact photo.' },
	] },
	add_contact_note: { fields: [
		{ name: 'contact_id', required: true }, { name: 'note', required: true },
	] },
	update_lead_status: { fields: [
		{ name: 'lead_id', required: true },
		{ name: 'status', required: true, options: ['new', 'qualified', 'follow_up', 'converted', 'archived'] },
		{ name: 'temperature', options: ['hot', 'warm', 'cold'] }, { name: 'note' },
	] },
	create_follow_up: { fields: [
		{ name: 'subject', required: true }, { name: 'assigned_agent_id' }, { name: 'body' },
		{ name: 'channel', options: ['call', 'sms', 'email', 'broker', 'note'] },
		{ name: 'due_at', kind: 'dateTime' }, { name: 'lead_id' }, { name: 'property_id' },
		{ name: 'status', options: ['pending', 'in_progress', 'completed', 'cancelled'] }, { name: 'visitor_id' },
	] },
	update_follow_up: { fields: [
		{ name: 'follow_up_id', required: true }, { name: 'assigned_agent_id' }, { name: 'body' },
		{ name: 'channel', options: ['call', 'sms', 'email', 'broker', 'note'] },
		{ name: 'completed_at', kind: 'dateTime' }, { name: 'due_at', kind: 'dateTime' },
		{ name: 'status', options: ['pending', 'in_progress', 'completed', 'cancelled'] }, { name: 'subject' },
	] },
	draft_seller_report_summary: { fields: [
		{ name: 'property_id', required: true }, { name: 'summary', required: true },
		{ name: 'next_steps' }, { name: 'open_house_id' }, { name: 'seller_feedback' }, ...sellerAiFields,
	] },
	update_seller_report_summary: { fields: [
		{ name: 'report_id', required: true },
		{ name: 'next_steps' }, { name: 'seller_feedback' },
		{ name: 'status', options: ['draft', 'sent', 'archived', 'ready', 'accepted'] },
		{ name: 'summary' }, ...sellerAiFields,
	] },
};

function label(name: string): string {
	return name
		.replace(/^ai_summary_/, 'ai_')
		.split('_')
		.map((part) => ({ ai: 'AI', id: 'ID', url: 'URL' })[part] ?? part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function propertyForField(tool: string, field: ToolField): INodeProperties {
	const base = {
		displayName: label(field.name),
		name: parameterName(tool, field.name),
		description: field.description ?? label(field.name),
		displayOptions: {
			show: {
				tool: [tool],
				...(field.showWhen ? { [parameterName(tool, field.showWhen.field)]: [field.showWhen.value] } : {}),
			},
		},
		required: field.required ?? false,
	};
	if (field.options) {
		return {
			...base,
			type: 'options',
			options: field.options.map((value) => ({ name: label(value), value })),
			default: field.options[0],
		};
	}
	if (field.kind === 'boolean') return { ...base, type: 'boolean', default: false };
	if (field.kind === 'number') return { ...base, type: 'number', default: 0 };
	if (field.kind === 'dateTime') return { ...base, type: 'dateTime', default: '' };
	if (field.kind === 'stringList') {
		return { ...base, type: 'string', typeOptions: { rows: 4 }, default: '' };
	}
	if (field.kind === 'photos') {
		return {
			...base,
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			placeholder: 'Add Photo',
			default: { photo: [{ image_url: '', alt_text: '' }] },
			options: [
				{
					name: 'photo',
					displayName: 'Photo',
					values: [
						{
							displayName: 'Image URL',
							name: 'image_url',
							type: 'string',
							default: '',
							required: true,
							description: 'A publicly accessible direct image URL.',
						},
						{
							displayName: 'Alt Text',
							name: 'alt_text',
							type: 'string',
							default: '',
							description: 'A short accessible description of this photo.',
						},
					],
				},
			],
		};
	}
	return { ...base, type: 'string', default: field.name === 'binary_property_name' ? 'data' : '' };
}

export function buildToolParameterProperties(): INodeProperties[] {
	const properties: INodeProperties[] = [];
	for (const [tool, definition] of Object.entries(TOOL_PARAMETERS)) {
		const required = definition.fields.filter((field) => field.required);
		const optional = definition.fields.filter((field) => !field.required);
		properties.push(...required.map((field) => propertyForField(tool, field)));
		if (optional.length > 0) {
			properties.push({
				displayName: 'Additional Fields',
				name: additionalFieldsName(tool),
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { tool: [tool] } },
				options: optional.map((field) => {
					const property = propertyForField(tool, field);
					delete property.displayOptions;
					property.name = field.name;
					return property;
				}),
			});
		}
	}
	return properties;
}

export function parameterName(tool: string, field: string): string {
	return `${tool}__${field}`;
}

export function additionalFieldsName(tool: string): string {
	return `${tool}__additional`;
}

export function fieldKind(tool: string, fieldName: string): FieldKind {
	return TOOL_PARAMETERS[tool]?.fields.find((field) => field.name === fieldName)?.kind ?? 'string';
}
