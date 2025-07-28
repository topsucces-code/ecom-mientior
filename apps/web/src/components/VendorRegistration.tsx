'use client'

import React, { useState, useCallback } from 'react'
import { VendorApplication, VendorDocument } from '@ecommerce/shared'
import { useVendorStore } from '../lib/vendor-store'

interface VendorRegistrationProps {
  userId: string
  onSuccess?: (application: VendorApplication) => void
  onCancel?: () => void
  className?: string
}

interface FormData {
  business_name: string
  business_type: VendorApplication['business_type']
  contact_email: string
  contact_phone: string
  business_description: string
  business_address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  estimated_monthly_volume: string
  product_categories: string[]
}

interface FormErrors {
  [key: string]: string | undefined
}

const BUSINESS_TYPES: { value: VendorApplication['business_type']; label: string }[] = [
  { value: 'individual', label: 'Individual/Sole Proprietor' },
  { value: 'company', label: 'Company/LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
]

const VOLUME_OPTIONS = [
  '< $1,000',
  '$1,000 - $5,000',
  '$5,000 - $25,000',
  '$25,000 - $100,000',
  '$100,000 - $500,000',
  '> $500,000',
]

const CATEGORY_OPTIONS = [
  'Electronics',
  'Clothing & Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Health & Beauty',
  'Toys & Games',
  'Automotive',
  'Jewelry & Accessories',
  'Art & Crafts',
  'Food & Beverages',
  'Pet Supplies',
  'Office Supplies',
  'Baby & Kids',
  'Industrial',
  'Other',
]

const VendorRegistration: React.FC<VendorRegistrationProps> = ({
  userId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { 
    createVendorApplication, 
    applicationLoading, 
    applicationError,
    clearErrors 
  } = useVendorStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    business_name: '',
    business_type: 'individual',
    contact_email: '',
    contact_phone: '',
    business_description: '',
    business_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
    estimated_monthly_volume: '',
    product_categories: [],
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [documents, setDocuments] = useState<File[]>([])

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}

    switch (step) {
      case 1:
        if (!formData.business_name.trim()) {
          newErrors.business_name = 'Business name is required'
        }
        if (!formData.business_type) {
          newErrors.business_type = 'Business type is required'
        }
        if (!formData.contact_email.trim()) {
          newErrors.contact_email = 'Contact email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
          newErrors.contact_email = 'Please enter a valid email address'
        }
        break

      case 2:
        if (!formData.business_address.street.trim()) {
          newErrors['business_address.street'] = 'Street address is required'
        }
        if (!formData.business_address.city.trim()) {
          newErrors['business_address.city'] = 'City is required'
        }
        if (!formData.business_address.state.trim()) {
          newErrors['business_address.state'] = 'State is required'
        }
        if (!formData.business_address.postal_code.trim()) {
          newErrors['business_address.postal_code'] = 'Postal code is required'
        }
        break

      case 3:
        if (!formData.business_description.trim()) {
          newErrors.business_description = 'Business description is required'
        } else if (formData.business_description.length < 50) {
          newErrors.business_description = 'Please provide at least 50 characters'
        }
        if (!formData.estimated_monthly_volume) {
          newErrors.estimated_monthly_volume = 'Monthly volume estimate is required'
        }
        if (formData.product_categories.length === 0) {
          newErrors.product_categories = 'At least one category is required'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = useCallback((
    field: string, 
    value: string | string[]
  ) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof FormData] as any,
            [child]: value,
          }
        }
      }
      return {
        ...prev,
        [field]: value,
      }
    })

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }, [errors])

  const handleCategoryToggle = (category: string) => {
    const current = formData.product_categories
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category]
    
    handleInputChange('product_categories', updated)
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported format. Please upload PDF, JPEG, PNG, or GIF files.`)
        return false
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`)
        return false
      }

      return true
    })

    setDocuments(prev => [...prev, ...newFiles])
  }

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    try {
      clearErrors()
      
      // Prepare document data (in real app, upload files first)
      const documentData: VendorDocument[] = documents.map((file, index) => ({
        id: `temp-${index}`,
        vendor_id: '', // Will be set by backend
        document_type: 'other', // Could be enhanced to detect type
        file_url: URL.createObjectURL(file), // Temporary URL
        file_name: file.name,
        file_size: file.size,
        upload_date: new Date().toISOString(),
        verification_status: 'pending',
      }))

      const applicationData: Omit<VendorApplication, 'id' | 'created_at' | 'updated_at' | 'reviewed_at'> = {
        user_id: userId,
        business_name: formData.business_name,
        business_type: formData.business_type,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        business_description: formData.business_description,
        business_address: formData.business_address,
        estimated_monthly_volume: formData.estimated_monthly_volume,
        product_categories: formData.product_categories,
        documents: documentData,
        status: 'submitted',
      }

      const result = await createVendorApplication(applicationData)
      
      if (result && onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('Error submitting application:', error)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                errors.business_name ? 'border-red-300' : ''
              }`}
              placeholder="Enter your business name"
            />
            {errors.business_name && (
              <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              value={formData.business_type}
              onChange={(e) => handleInputChange('business_type', e.target.value)}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                errors.business_type ? 'border-red-300' : ''
              }`}
            >
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.business_type && (
              <p className="mt-1 text-sm text-red-600">{errors.business_type}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                  errors.contact_email ? 'border-red-300' : ''
                }`}
                placeholder="business@example.com"
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.business_address.street}
              onChange={(e) => handleInputChange('business_address.street', e.target.value)}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                errors['business_address.street'] ? 'border-red-300' : ''
              }`}
              placeholder="123 Main Street"
            />
            {errors['business_address.street'] && (
              <p className="mt-1 text-sm text-red-600">{errors['business_address.street']}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.business_address.city}
                onChange={(e) => handleInputChange('business_address.city', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                  errors['business_address.city'] ? 'border-red-300' : ''
                }`}
                placeholder="New York"
              />
              {errors['business_address.city'] && (
                <p className="mt-1 text-sm text-red-600">{errors['business_address.city']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province *
              </label>
              <input
                type="text"
                value={formData.business_address.state}
                onChange={(e) => handleInputChange('business_address.state', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                  errors['business_address.state'] ? 'border-red-300' : ''
                }`}
                placeholder="NY"
              />
              {errors['business_address.state'] && (
                <p className="mt-1 text-sm text-red-600">{errors['business_address.state']}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.business_address.postal_code}
                onChange={(e) => handleInputChange('business_address.postal_code', e.target.value)}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                  errors['business_address.postal_code'] ? 'border-red-300' : ''
                }`}
                placeholder="10001"
              />
              {errors['business_address.postal_code'] && (
                <p className="mt-1 text-sm text-red-600">{errors['business_address.postal_code']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                value={formData.business_address.country}
                onChange={(e) => handleInputChange('business_address.country', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="JP">Japan</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Description *
            </label>
            <textarea
              value={formData.business_description}
              onChange={(e) => handleInputChange('business_description', e.target.value)}
              rows={4}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                errors.business_description ? 'border-red-300' : ''
              }`}
              placeholder="Describe your business, what you sell, your experience, etc. (minimum 50 characters)"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.business_description.length}/50 characters minimum
            </p>
            {errors.business_description && (
              <p className="mt-1 text-sm text-red-600">{errors.business_description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Monthly Sales Volume *
            </label>
            <select
              value={formData.estimated_monthly_volume}
              onChange={(e) => handleInputChange('estimated_monthly_volume', e.target.value)}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 ${
                errors.estimated_monthly_volume ? 'border-red-300' : ''
              }`}
            >
              <option value="">Select volume range</option>
              {VOLUME_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.estimated_monthly_volume && (
              <p className="mt-1 text-sm text-red-600">{errors.estimated_monthly_volume}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Categories * (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {CATEGORY_OPTIONS.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.product_categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
            {errors.product_categories && (
              <p className="mt-1 text-sm text-red-600">{errors.product_categories}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <span className="text-4xl mb-2 block">📎</span>
                <div className="text-sm text-gray-600">
                  <label className="cursor-pointer">
                    <span className="text-amber-600 hover:text-amber-500">
                      Upload business documents
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, JPEG, PNG, GIF up to 5MB each
                </p>
              </div>
            </div>
            
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Uploaded Documents:</p>
                {documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step <= currentStep 
                ? 'bg-amber-600 border-amber-600 text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              {step < currentStep ? '✓' : step}
            </div>
            {step < 3 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                step < currentStep ? 'bg-amber-600' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>Business Info</span>
        <span>Address</span>
        <span>Details</span>
      </div>
    </div>
  )

  return (
    <div className={`max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Become a Vendor
        </h2>
        <p className="text-gray-600">
          Join our marketplace and start selling your products to customers worldwide.
        </p>
      </div>

      {renderProgressBar()}

      {applicationError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-medium">Application Error</h3>
              <p className="text-red-600 text-sm mt-1">{applicationError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <div className="flex justify-between">
        <div>
          {currentStep > 1 ? (
            <button
              onClick={handlePrevious}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              ← Previous
            </button>
          ) : (
            onCancel && (
              <button
                onClick={onCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Cancel
              </button>
            )
          )}
        </div>

        <div>
          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={applicationLoading}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applicationLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(VendorRegistration)