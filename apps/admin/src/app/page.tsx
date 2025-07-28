'use client'

import { Refine } from '@refinedev/core'
import { RefineThemes, ThemedLayoutV2, notificationProvider } from '@refinedev/antd'
import { dataProvider, liveProvider } from '@refinedev/supabase'
import routerProvider from '@refinedev/nextjs-router'
import { ConfigProvider, App as AntdApp } from 'antd'
import { supabase } from '@ecommerce/shared'

import '@refinedev/antd/dist/reset.css'

const resources = [
  {
    name: 'products',
    list: '/products',
    create: '/products/create',
    edit: '/products/edit/:id',
    show: '/products/show/:id',
    meta: {
      canDelete: true,
    },
  },
  {
    name: 'categories',
    list: '/categories',
    create: '/categories/create',
    edit: '/categories/edit/:id',
    show: '/categories/show/:id',
    meta: {
      canDelete: true,
    },
  },
  {
    name: 'orders',
    list: '/orders',
    show: '/orders/show/:id',
    edit: '/orders/edit/:id',
  },
  {
    name: 'user_profiles',
    list: '/users',
    show: '/users/show/:id',
  },
]

export default function AdminApp() {
  return (
    <ConfigProvider theme={RefineThemes.Blue}>
      <AntdApp>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider(supabase)}
          liveProvider={liveProvider(supabase)}
          notificationProvider={notificationProvider}
          resources={resources}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <ThemedLayoutV2>
            <div style={{ padding: '24px' }}>
              <h1>Welcome to E-Commerce Admin Panel</h1>
              <p>Select a resource from the sidebar to get started.</p>
            </div>
          </ThemedLayoutV2>
        </Refine>
      </AntdApp>
    </ConfigProvider>
  )
}