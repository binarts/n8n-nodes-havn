import { describe, expect, it } from 'vitest';

import { Havn, HAVN_MCP_TOOLS } from '../nodes/Havn/Havn.node.js';
import { parameterName, TOOL_PARAMETERS } from '../nodes/Havn/toolParameters.js';

const EXPECTED_TOOL_NAMES = [
	'workspace_summary',
	'search_properties',
	'get_property_media',
	'search_contacts',
	'search_tasks',
	'search_open_houses',
	'search_leads',
	'search_seller_reports',
	'analytics_summary',
	'search_files',
	'search_media',
	'create_task',
	'update_task',
	'create_property',
	'update_property',
	'add_property_photos',
	'add_attachment',
	'create_open_house',
	'update_open_house',
	'add_open_house_lead',
	'create_inquiry',
	'update_inquiry',
	'create_contact',
	'update_contact',
	'add_contact_photo',
	'add_contact_note',
	'update_lead_status',
	'create_follow_up',
	'update_follow_up',
	'draft_seller_report_summary',
	'update_seller_report_summary',
];

describe('HAVN n8n tool catalog', () => {
	it('includes every currently supported HAVN MCP tool exactly once', () => {
		const names = HAVN_MCP_TOOLS.map(({ name }) => name);

		expect(names).toEqual(EXPECTED_TOOL_NAMES);
		expect(new Set(names)).toHaveLength(names.length);
	});

	it('defines visible input parameters for every tool', () => {
		expect(Object.keys(TOOL_PARAMETERS)).toEqual(EXPECTED_TOOL_NAMES);
		expect(TOOL_PARAMETERS.get_property_media.fields).toContainEqual(
			expect.objectContaining({ name: 'property_id', required: true }),
		);
		expect(TOOL_PARAMETERS.create_contact.fields).toContainEqual(
			expect.objectContaining({ name: 'full_name', required: true }),
		);
		expect(TOOL_PARAMETERS.create_inquiry.fields).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'contact_id', required: true }),
				expect.objectContaining({ name: 'property_id' }),
				expect.objectContaining({ name: 'desired_location' }),
				expect.objectContaining({ name: 'budget_min', kind: 'number' }),
				expect.objectContaining({ name: 'desired_property_type' }),
			]),
		);
		expect(TOOL_PARAMETERS.draft_seller_report_summary.fields).toContainEqual(
			expect.objectContaining({ name: 'ai_summary_lead_sources', kind: 'sourceCounts' }),
		);
		expect(TOOL_PARAMETERS.add_property_photos.fields).toContainEqual(
			expect.objectContaining({ name: 'photos', kind: 'photos', required: true }),
		);
		expect(Object.values(TOOL_PARAMETERS).flatMap(({ fields }) => fields)).not.toContainEqual(
			expect.objectContaining({ kind: 'json' }),
		);
		expect(TOOL_PARAMETERS.add_attachment.fields).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'source', required: true }),
				expect.objectContaining({ name: 'binary_property_name', required: true }),
			]),
		);
		for (const tool of ['add_attachment', 'add_property_photos', 'add_contact_photo']) {
			expect(TOOL_PARAMETERS[tool].fields).toContainEqual(
				expect.objectContaining({ name: 'source', required: true }),
			);
		}
	});

	it('uses title case tool names and sentence case generated descriptions', () => {
		const properties = new Havn().description.properties;
		const toolProperty = properties.find(({ name }) => name === 'tool');
		const options = toolProperty?.options ?? [];

		expect(options).toEqual(expect.arrayContaining([
			expect.objectContaining({ name: 'Workspace Summary', value: 'workspace_summary' }),
			expect.objectContaining({ name: 'Custom MCP Tool', value: 'custom' }),
		]));

		const addressLine = properties.find(
			({ name }) => name === parameterName('create_property', 'address_line_1'),
		);
		expect(addressLine?.description).toBe('Address line 1');
	});
});
