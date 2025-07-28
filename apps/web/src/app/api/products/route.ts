import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const status = searchParams.get('status') || 'active'

    // Construire la requête
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        compare_at_price,
        sku,
        inventory_quantity,
        brand,
        images,
        tags,
        status,
        featured,
        created_at,
        category_id,
        categories!inner(id, name, slug)
      `)
      .eq('status', status)

    // Appliquer les filtres
    if (category) {
      query = query.eq('categories.slug', category)
    }

    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: products, error, count } = await query

    if (error) {
      console.error('Products API error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch products', 
        details: error.message 
      }, { status: 500 })
    }

    // Calculer la pagination
    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      products: products || [],
      currentPage: page,
      totalPages,
      totalCount: count || 0,
      hasMore: page < totalPages
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}