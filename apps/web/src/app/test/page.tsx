import Link from 'next/link'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Test Page - Server is Working!
        </h1>
        <p className="text-gray-600">
          If you can see this page, the Next.js server is running correctly.
        </p>
        <div className="mt-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}