import React, { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface CSVPost {
  content: string
  date?: string
  likes?: number
  comments?: number
  shares?: number
  id?: string
}

export const DataUpload: React.FC = () => {
  const { user } = useAuth()
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'linkedin'>('csv')
  const [csvData, setCsvData] = useState<CSVPost[]>([])
  const [processing, setProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string
        const lines = csvText.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setUploadStatus('error')
          setStatusMessage('CSV file must contain at least a header row and one data row.')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const posts: CSVPost[] = []
        
        // Validate required columns
        const contentIndex = headers.findIndex(h => h.includes('content') || h.includes('text') || h.includes('post'))
        if (contentIndex === -1) {
          setUploadStatus('error')
          setStatusMessage('CSV must contain a column with "content", "text", or "post" in the header.')
          return
        }
        
        // Optional columns
        const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('created'))
        const likesIndex = headers.findIndex(h => h.includes('like'))
        const commentsIndex = headers.findIndex(h => h.includes('comment'))
        const sharesIndex = headers.findIndex(h => h.includes('share') || h.includes('repost'))
        const idIndex = headers.findIndex(h => h.includes('id') && !h.includes('user'))
        
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',').map(c => c.trim())
          
          if (columns.length >= headers.length && columns[contentIndex]) {
            const post: CSVPost = {
              content: columns[contentIndex].replace(/^"(.*)"$/, '$1'), // Remove quotes if present
              date: dateIndex >= 0 ? columns[dateIndex] : undefined,
              likes: likesIndex >= 0 ? parseInt(columns[likesIndex]) || 0 : 0,
              comments: commentsIndex >= 0 ? parseInt(columns[commentsIndex]) || 0 : 0,
              shares: sharesIndex >= 0 ? parseInt(columns[sharesIndex]) || 0 : 0,
              id: idIndex >= 0 ? columns[idIndex] : `csv_${i}_${Date.now()}`
            }
            
            if (post.content.length > 10) { // Filter out very short content
              posts.push(post)
            }
          }
        }
        
        if (posts.length === 0) {
          setUploadStatus('error')
          setStatusMessage('No valid posts found in CSV file.')
          return
        }
        
        setCsvData(posts)
        setUploadStatus('success')
        setStatusMessage(`Successfully parsed ${posts.length} posts from CSV file.`)
        
      } catch (error) {
        console.error('CSV parsing error:', error)
        setUploadStatus('error')
        setStatusMessage('Error parsing CSV file. Please check the format.')
      }
    }
    
    reader.onerror = () => {
      setUploadStatus('error')
      setStatusMessage('Error reading file.')
    }
    
    reader.readAsText(file)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileUpload(file)
      } else {
        setUploadStatus('error')
        setStatusMessage('Please upload a CSV file.')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const processData = async () => {
    if (csvData.length === 0) {
      setUploadStatus('error')
      setStatusMessage('No data to process. Please upload a CSV file first.')
      return
    }

    setProcessing(true)
    setUploadStatus('idle')
    setStatusMessage('')

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setUploadStatus('error')
        setStatusMessage('Authentication required. Please log in again.')
        setProcessing(false)
        return
      }

      console.log('User authenticated, starting pipeline...')
      const { data, error } = await supabase.functions.invoke('pipeline-orchestrator', {
        body: {
          posts: csvData.map(post => ({
            content: post.content,
            createdAt: post.date || new Date().toISOString(),
            likes: post.likes || 0,
            numComments: post.comments || 0,
            numShares: post.shares || 0,
            id: post.id || `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          })),
          uploadSource: 'csv_upload',
          goal: 'lighthearted authority in AI automation'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) {
        console.error('Pipeline processing error:', error)
        setUploadStatus('error')
        setStatusMessage(`Processing failed: ${error.message}. Please try logging out and back in.`)
      } else {
        console.log('Pipeline processing result:', data)
        setUploadStatus('success')
        setStatusMessage(`Processing completed! ${data.data?.summary?.completion_rate || 100}% pipeline success.`)
        setCsvData([]) // Clear the data after successful processing
      }
    } catch (error: any) {
      console.error('Error processing data:', error)
      setUploadStatus('error')
      setStatusMessage(`Error: ${error.message || 'Unknown error occurred'}. Please try refreshing the page.`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload LinkedIn Data</h1>
        <p className="mt-2 text-gray-600">
          Upload your LinkedIn posts to start the MicroMe analysis pipeline. 
          All data is processed transparently with full explainability.
        </p>
      </div>

      {/* Upload Method Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Upload Method</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setUploadMethod('csv')}
            className={`p-4 rounded-lg border-2 transition-colors text-left ${
              uploadMethod === 'csv'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold mb-1">CSV Upload</h3>
            <p className="text-sm text-gray-600">
              Upload a CSV file with your LinkedIn posts. Recommended for getting started quickly.
            </p>
          </button>
          
          <button
            onClick={() => setUploadMethod('linkedin')}
            className={`p-4 rounded-lg border-2 transition-colors text-left opacity-50 cursor-not-allowed ${
              uploadMethod === 'linkedin'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
            disabled
          >
            <div className="w-8 h-8 bg-blue-600 rounded mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm">in</span>
            </div>
            <h3 className="font-semibold mb-1">LinkedIn API</h3>
            <p className="text-sm text-gray-600">
              Direct integration with LinkedIn API. Coming soon.
            </p>
          </button>
        </div>
      </div>

      {/* CSV Upload Section */}
      {uploadMethod === 'csv' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CSV File Upload</h2>
          
          {/* CSV Format Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
            <div className="text-sm text-blue-800">
              <p className="mb-2">Your CSV should include the following columns:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Required:</strong> content/text/post - The text content of your posts</li>
                <li><strong>Optional:</strong> date/created_at - Post publication date</li>
                <li><strong>Optional:</strong> likes - Number of likes</li>
                <li><strong>Optional:</strong> comments - Number of comments</li>
                <li><strong>Optional:</strong> shares/reposts - Number of shares</li>
              </ul>
              <p className="mt-2 text-xs">Column names are case-insensitive and can include variations of these terms.</p>
            </div>
          </div>
          
          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Maximum file size: 10MB
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Select CSV File
            </label>
          </div>
          
          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-green-800">{statusMessage}</p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-800">{statusMessage}</p>
              </div>
            </div>
          )}
          
          {/* Data Preview */}
          {csvData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-3">Showing first 3 posts:</p>
                {csvData.slice(0, 3).map((post, index) => (
                  <div key={index} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
                    </p>
                    <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                      {post.date && <span>Date: {post.date}</span>}
                      <span>Likes: {post.likes}</span>
                      <span>Comments: {post.comments}</span>
                      <span>Shares: {post.shares}</span>
                    </div>
                  </div>
                ))}
                {csvData.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ...and {csvData.length - 3} more posts
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Process Button */}
          {csvData.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={processData}
                disabled={processing}
                className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                {processing ? 'Processing Pipeline...' : 'Start MicroMe Analysis'}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Transparency Notice */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Data Privacy & Transparency</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Your data is processed through our transparent 6-stage AI pipeline</p>
          <p>• All analysis includes confidence scores and evidence trails</p>
          <p>• You maintain full control over your data and privacy settings</p>
          <p>• Data is stored securely and can be deleted at any time</p>
        </div>
      </div>
    </div>
  )
}