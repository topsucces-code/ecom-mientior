import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@ecommerce/shared'
import type { NotificationInsert } from '@ecommerce/shared'

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (countError) {
      throw new Error(countError.message)
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      hasMore: (notifications?.length || 0) === limit
    })

  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body: NotificationInsert = await request.json()
    
    // Validate required fields
    if (!body.user_id || !body.type || !body.title || !body.message || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(body)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Send real-time notification if user is online
    await supabase
      .channel('notifications')
      .send({
        type: 'broadcast',
        event: 'new_notification',
        payload: {
          userId: body.user_id,
          notification
        }
      })

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const notificationId = searchParams.get('notificationId')
    const markAllAsRead = searchParams.get('markAll') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (markAllAsRead) {
      // Mark all notifications as read for the user
      query = query.eq('read', false)
    } else if (notificationId) {
      // Mark specific notification as read
      query = query.eq('id', notificationId)
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAll parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await query.select()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      updatedNotifications: data
    })

  } catch (error) {
    console.error('Failed to update notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const notificationId = searchParams.get('notificationId')
    const category = searchParams.get('category')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (deleteAll) {
      // Delete all notifications for user
      if (category) {
        query = query.eq('category', category)
      }
    } else if (notificationId) {
      // Delete specific notification
      query = query.eq('id', notificationId)
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or deleteAll parameter is required' },
        { status: 400 }
      )
    }

    const { error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}