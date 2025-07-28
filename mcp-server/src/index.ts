#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Create MCP server
const server = new Server(
  {
    name: 'ecommerce-supabase-server',
    version: '1.0.0',
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_products',
        description: 'Get products from the e-commerce database',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of products to return (default: 10)',
              minimum: 1,
              maximum: 100,
            },
            category_id: {
              type: 'string',
              description: 'Filter by category ID',
            },
            featured: {
              type: 'boolean',
              description: 'Filter by featured products only',
            },
            status: {
              type: 'string',
              enum: ['active', 'draft', 'archived'],
              description: 'Filter by product status',
            },
            search: {
              type: 'string',
              description: 'Search in product name and description',
            },
          },
        },
      },
      {
        name: 'get_product_by_id',
        description: 'Get a specific product by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_categories',
        description: 'Get all product categories',
        inputSchema: {
          type: 'object',
          properties: {
            include_products_count: {
              type: 'boolean',
              description: 'Include count of products in each category',
            },
          },
        },
      },
      {
        name: 'get_orders',
        description: 'Get orders from the database',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of orders to return (default: 10)',
              minimum: 1,
              maximum: 100,
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Filter by order status',
            },
            user_id: {
              type: 'string',
              description: 'Filter by user ID',
            },
          },
        },
      },
      {
        name: 'get_sales_analytics',
        description: 'Get sales analytics and statistics',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['day', 'week', 'month', 'year'],
              description: 'Time period for analytics (default: month)',
            },
            start_date: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD format)',
            },
            end_date: {
              type: 'string',
              description: 'End date (YYYY-MM-DD format)',
            },
          },
        },
      },
      {
        name: 'update_product_inventory',
        description: 'Update product inventory quantity',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: {
              type: 'string',
              description: 'Product ID',
            },
            quantity: {
              type: 'number',
              description: 'New inventory quantity',
              minimum: 0,
            },
          },
          required: ['product_id', 'quantity'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_products': {
        const {
          limit = 10,
          category_id,
          featured,
          status = 'active',
          search,
        } = args || {};

        let query = supabase
          .from('products')
          .select(`
            *,
            category:categories(name, slug)
          `)
          .eq('status', status)
          .limit(Number(limit));

        if (category_id) {
          query = query.eq('category_id', category_id);
        }

        if (featured !== undefined) {
          query = query.eq('featured', featured);
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_product_by_id': {
        const { id } = args || {};

        if (!id) {
          throw new McpError(ErrorCode.InvalidParams, 'Product ID is required');
        }

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_categories': {
        const { include_products_count } = args || {};

        let query = supabase.from('categories').select('*');

        if (include_products_count) {
          query = supabase
            .from('categories')
            .select(`
              *,
              products_count:products(count)
            `);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_orders': {
        const { limit = 10, status, user_id } = args || {};

        let query = supabase
          .from('orders')
          .select(`
            *,
            user_profiles(first_name, last_name, email)
          `)
          .limit(Number(limit))
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        if (user_id) {
          query = query.eq('user_id', user_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'get_sales_analytics': {
        const { period = 'month', start_date, end_date } = args || {};

        // Calculate date range based on period
        let dateFilter = '';
        const now = new Date();
        
        if (start_date && end_date) {
          dateFilter = `created_at >= '${start_date}' AND created_at <= '${end_date}'`;
        } else {
          switch (period) {
            case 'day':
              dateFilter = `created_at >= '${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}'`;
              break;
            case 'week':
              dateFilter = `created_at >= '${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}'`;
              break;
            case 'month':
              dateFilter = `created_at >= '${new Date(now.getFullYear(), now.getMonth(), 1).toISOString()}'`;
              break;
            case 'year':
              dateFilter = `created_at >= '${new Date(now.getFullYear(), 0, 1).toISOString()}'`;
              break;
          }
        }

        // Get sales statistics
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', dateFilter.split("'")[1]);

        if (ordersError) throw ordersError;

        // Calculate analytics
        const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        const totalOrders = orders?.length || 0;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const analytics = {
          period,
          date_range: { start_date, end_date },
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          average_order_value: averageOrderValue,
          orders_by_status: orders?.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analytics, null, 2),
            },
          ],
        };
      }

      case 'update_product_inventory': {
        const { product_id, quantity } = args || {};

        if (!product_id || quantity === undefined) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Product ID and quantity are required'
          );
        }

        const { data, error } = await supabase
          .from('products')
          .update({ inventory_quantity: quantity })
          .eq('id', product_id)
          .select()
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated inventory for product ${product_id}: ${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error}`
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('E-commerce MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});