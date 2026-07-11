import { describe, expect, it } from 'vitest';

import { HAVN_MCP_TOOLS } from '../nodes/Havn/Havn.node.js';
import { TOOL_PARAMETERS } from '../nodes/Havn/toolParameters.js';

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
		expect(TOOL_PARAMETERS.add_property_photos.fields).toContainEqual(
			expect.objectContaining({ name: 'photos', kind: 'photos', required: true }),
		);
		expect(Object.values(TOOL_PARAMETERS).flatMap(({ fields }) => fields)).not.toContainEqual(
			expect.objectContaining({ kind: 'json' }),
		);
	});
});
