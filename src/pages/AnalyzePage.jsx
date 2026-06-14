import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { categorizeMessage } from '../utils/llmHelper'
import { calculateUrgency } from '../utils/urgencyScorer'
import { getRecommendedAction } from '../utils/templates'
import { importFromCSV } from '../utils/exportUtils'
import sampleMessages from '../../sample-messages.json'

function AnalyzePage() {
  const [message, setMessage] = useState('')
  const [results, setResults] = useState(null)
  const [batchResults, setBatchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const batchTestMessages = sampleMessages.batchTestRunMessages || []

  useEffect(() => {
    // Check for example message from home page
    const exampleMessage = localStorage.getItem('exampleMessage')
    if (exampleMessage) {
      setMessage(exampleMessage)
      localStorage.removeItem('exampleMessage')
    }
  }, [])

  const handleAnalyze = async () => {
    if (!message.trim()) {
      alert('Please enter a message to analyze')
      return
    }

    setIsLoading(true)
    setResults(null)
    setBatchResults([])
    
    try {
      // Run categorization (LLM call)
      const { category, reasoning, confidence, secondaryCategory } = await categorizeMessage(message)
      
      // Calculate urgency (rule-based)
      const urgency = calculateUrgency(message)
      
      // Get recommended action (template-based)
      const recommendedAction = getRecommendedAction(category, urgency, message)
      
      const analysisResult = {
        message,
        category,
        secondaryCategory,
        confidence,
        urgency,
        recommendedAction,
        reasoning,
        timestamp: new Date().toISOString()
      }

      setResults(analysisResult)

      // Save to history
      const history = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      history.push(analysisResult)
      localStorage.setItem('triageHistory', JSON.stringify(history))
    } catch (error) {
      console.error('Error analyzing message:', error)
      alert('Error analyzing message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunBatchTest = async () => {
    if (!batchTestMessages.length) {
      alert('No batch test messages available.')
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const generatedResults = []

      for (const testMessage of batchTestMessages) {
        const { category, reasoning, confidence, secondaryCategory } = await categorizeMessage(testMessage)
        const urgency = calculateUrgency(testMessage)
        const recommendedAction = getRecommendedAction(category, urgency, testMessage)

        generatedResults.push({
          message: testMessage,
          category,
          secondaryCategory,
          confidence,
          urgency,
          recommendedAction,
          reasoning,
          timestamp: new Date().toISOString(),
          isBatchResult: true
        })
      }

      setBatchResults(generatedResults)

      const history = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      history.push(...generatedResults)
      localStorage.setItem('triageHistory', JSON.stringify(history))
    } catch (error) {
      console.error('Error running batch test:', error)
      alert('Error running batch test. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessage('')
    setResults(null)
    setBatchResults([])
  }

  const handleBulkUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setResults(null)

    try {
      const messages = await importFromCSV(file)
      const generatedResults = []

      for (const msg of messages) {
        const { category, reasoning, confidence, secondaryCategory } = await categorizeMessage(msg.message)
        const urgency = calculateUrgency(msg.message)
        const recommendedAction = getRecommendedAction(category, urgency, msg.message)

        generatedResults.push({
          message: msg.message,
          category,
          secondaryCategory,
          confidence,
          urgency,
          recommendedAction,
          reasoning,
          timestamp: new Date().toISOString(),
          isBulkResult: true
        })
      }

      setBatchResults(generatedResults)

      const history = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      history.push(...generatedResults)
      localStorage.setItem('triageHistory', JSON.stringify(history))

      alert(`Successfully processed ${generatedResults.length} messages from file`)
      event.target.value = ''
    } catch (error) {
      console.error('Error processing file:', error)
      alert(`Error processing file: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analyze Customer Message</h1>
          <p className="text-gray-600 mb-6">
            Paste a customer support message below to automatically categorize and prioritize.
          </p>

          {/* Input Section */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste customer message here..."
              className="w-full border border-gray-300 rounded-lg p-3 h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <div className="text-sm text-gray-500 mt-1">
              {message.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`flex-1 min-w-[180px] py-3 rounded-lg font-semibold ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Analyze Message'
              )}
            </button>
            <button
              onClick={handleRunBatchTest}
              disabled={isLoading}
              className={`flex-1 min-w-[180px] py-3 rounded-lg font-semibold ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? 'Running Batch Test...' : 'Run 10-Message Test'}
            </button>
            <label className="flex-1 min-w-[180px]">
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                disabled={isLoading}
                className="hidden"
              />
              <button
                onClick={(e) => e.currentTarget.parentElement.querySelector('input').click()}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                📤 Upload CSV
              </button>
            </label>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 min-w-[120px]"
            >
              Clear
            </button>
          </div>
        </div>

        {batchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10-Message Batch Test Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Secondary</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confidence</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Urgency</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {batchResults.map((item, index) => (
                    <tr key={`${item.timestamp}-${index}`}>
                      <td className="px-3 py-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 max-w-sm">{item.message}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{item.category}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{item.secondaryCategory || 'None'}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : 'N/A'}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{item.urgency}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{item.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Category</div>
                <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                  {results.category}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Secondary Category</div>
                <div className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-semibold">
                  {results.secondaryCategory || 'None'}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Confidence</div>
                <div className="inline-block bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-semibold">
                  {typeof results.confidence === 'number' ? `${Math.round(results.confidence * 100)}%` : 'N/A'}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Urgency Level</div>
                <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                  results.urgency === 'High' ? 'bg-red-200 text-red-900' :
                  results.urgency === 'Medium' ? 'bg-yellow-200 text-yellow-900' :
                  'bg-green-200 text-green-900'
                }`}>
                  {results.urgency}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Recommended Action</div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-800">{results.recommendedAction}</p>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">AI Reasoning</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>
                      {results.reasoning}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const text = `Category: ${results.category}\nSecondary Category: ${results.secondaryCategory || 'None'}\nConfidence: ${typeof results.confidence === 'number' ? `${Math.round(results.confidence * 100)}%` : 'N/A'}\nUrgency: ${results.urgency}\nRecommendation: ${results.recommendedAction}\n\nReasoning: ${results.reasoning}`
                  navigator.clipboard.writeText(text)
                  alert('Results copied to clipboard!')
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-semibold"
              >
                📋 Copy Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyzePage
