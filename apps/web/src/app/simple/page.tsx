export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Simple E-Commerce</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Welcome to Our Store</h2>
          <p className="text-gray-600">Simple version without complex components</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Product 1</h3>
            <p className="text-gray-600">Sample product description</p>
            <p className="text-lg font-bold mt-2">$29.99</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Product 2</h3>
            <p className="text-gray-600">Sample product description</p>
            <p className="text-lg font-bold mt-2">$39.99</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Product 3</h3>
            <p className="text-gray-600">Sample product description</p>
            <p className="text-lg font-bold mt-2">$49.99</p>
          </div>
        </div>
      </main>
    </div>
  )
}