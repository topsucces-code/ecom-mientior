import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase/server'

export async function GET() {
  try {
    // Test 1: Check if products table exists and has data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, status')
      .limit(5)

    if (productsError) {
      console.error('Products error:', productsError)
      return NextResponse.json({ 
        error: 'Products table error', 
        details: productsError.message 
      }, { status: 500 })
    }

    // Test 2: Check if categories table exists
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(5)

    if (categoriesError) {
      console.error('Categories error:', categoriesError)
      return NextResponse.json({ 
        error: 'Categories table error', 
        details: categoriesError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        products: products || [],
        productsCount: products?.length || 0,
        categories: categories || [],
        categoriesCount: categories?.length || 0,
        message: 'Database connection successful'
      }
    })

  } catch (error) {
    console.error('API Test error:', error)
    return NextResponse.json({ 
      error: 'API test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}