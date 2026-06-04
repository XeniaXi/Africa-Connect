import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const PORT = process.env.MCP_PORT ?? 4001;
const API_BASE = process.env.API_BASE ?? 'http://localhost:4000';

function buildMcpServer(): McpServer {
  const server = new McpServer({ name: 'connectafrica', version: '1.0.0' });

  // Tool: find_business
  server.registerTool('find_business', {
    title: 'Find African businesses',
    description:
      'Find verified African businesses by category, location and intent. Returns results ranked by trust score, proximity and availability.',
    inputSchema: {
      category: z.string().optional().describe('Business category e.g. "artisan.electrician", "healthcare.hospital"'),
      intent: z.string().optional().describe('Natural language intent e.g. "AC repairer near me"'),
      city: z.string().optional(),
      state: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      radiusKm: z.number().optional().default(10),
      verifiedOnly: z.boolean().optional().default(false),
      limit: z.number().optional().default(10),
    },
  }, async (input) => {
    const res = await fetch(`${API_BASE}/v1/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor-Type': 'AGENT' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { content: [{ type: 'text', text: `Search failed: ${res.statusText}` }] };
    const results = await res.json() as any[];
    if (!results.length) return { content: [{ type: 'text', text: 'No matching businesses found.' }] };
    const text = results
      .map((b: any, i: number) =>
        `${i + 1}. ${b.displayName} — ${b.locationSummary} | Trust: ${b.trustScore}/100 | ${b.rankingReason}`,
      )
      .join('\n');
    return { content: [{ type: 'text', text }], structuredContent: { results } };
  });

  // Tool: get_business_profile
  server.registerTool('get_business_profile', {
    title: 'Get business profile',
    description: 'Get full public profile for a business by ID, including services, location and trust details.',
    inputSchema: { businessId: z.string().describe('Business ID from find_business results') },
  }, async ({ businessId }) => {
    const res = await fetch(`${API_BASE}/v1/businesses/${businessId}`);
    if (!res.ok) return { content: [{ type: 'text', text: 'Business not found.' }] };
    const b = await res.json() as any;
    const text = `${b.displayName}\nCategory: ${b.category?.name}\nVerification Level: ${b.verificationLevel}/6\nTrust Score: ${b.trustScore}/100\nStatus: ${b.availabilityStatus}`;
    return { content: [{ type: 'text', text }], structuredContent: b };
  });

  // Tool: verify_business
  server.registerTool('verify_business', {
    title: 'Get verification status',
    description: 'Return the verification level and trust signals for a business.',
    inputSchema: { businessId: z.string() },
  }, async ({ businessId }) => {
    const res = await fetch(`${API_BASE}/v1/businesses/${businessId}`);
    if (!res.ok) return { content: [{ type: 'text', text: 'Business not found.' }] };
    const b = await res.json() as any;
    const levelNames = ['Unverified', 'Phone Verified', 'Email Verified', 'Document Verified', 'Address Verified', 'Trusted Partner', 'ConnectAfrica Certified'];
    const levelName = levelNames[b.verificationLevel] ?? 'Unknown';
    return {
      content: [{ type: 'text', text: `${b.displayName}: ${levelName} (Level ${b.verificationLevel}/6). Trust Score: ${b.trustScore}/100.` }],
      structuredContent: { businessId, verificationLevel: b.verificationLevel, levelName, trustScore: b.trustScore },
    };
  });

  // Tool: create_lead
  server.registerTool('create_lead', {
    title: 'Create a customer lead',
    description: 'Send a customer lead to a business. Use after find_business to route the customer intent.',
    inputSchema: {
      businessId: z.string(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      message: z.string().optional().describe('Customer request or service need'),
      sourceChannel: z.string().optional().default('mcp'),
    },
  }, async (input) => {
    const res = await fetch(`${API_BASE}/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor-Type': 'AGENT' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { content: [{ type: 'text', text: `Failed to create lead: ${res.statusText}` }] };
    const lead = await res.json() as any;
    return { content: [{ type: 'text', text: `Lead created (ID: ${lead.id}). The business will be notified.` }], structuredContent: lead };
  });

  // Tool: list_categories
  server.registerTool('list_categories', {
    title: 'List supported business categories',
    description: 'List all business categories ConnectAfrica supports.',
    inputSchema: {},
  }, async () => ({
    content: [{
      type: 'text',
      text: 'Supported categories: artisan (electrician, plumber, carpenter, painter, AC repair), healthcare (hospital, clinic, pharmacy, laboratory), education (school, tutoring), estate (property, agent), logistics, food, retail.',
    }],
  }));

  return server;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/mcp', async (req, res) => {
  const server = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: String(e) });
  }
});

app.get('/mcp', (_req, res) => res.status(405).json({ error: 'Use POST for MCP' }));
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`ConnectAfrica MCP Gateway on :${PORT}`));
