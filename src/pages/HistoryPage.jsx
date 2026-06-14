import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { exportToCSV, exportToJSON } from '../utils/exportUtils'

function HistoryPage() {
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('all')
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [confidenceMinFilter, setConfidenceMinFilter] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('triageHistory') || '[]')
    setHistory(savedHistory)
  }

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.setItem('triageHistory', '[]')
      setHistory([])
    }
  }

  const sortedHistory = [...history].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  )

  const filteredHistory = sortedHistory.filter((item) => {
    const categoryMatch = filter === 'all' || item.category === filter
    const searchMatch =
      searchQuery === '' ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    const urgencyMatch = urgencyFilter === 'all' || item.urgency === urgencyFilter
    const confidenceMatch =
      typeof item.confidence === 'number'
        ? item.confidence * 100 >= confidenceMinFilter
        : true

    let dateMatch = true
    if (dateFrom || dateTo) {
      const itemDate = new Date(item.timestamp).toDateString()
      if (dateFrom) {
        const fromDate = new Date(dateFrom).toDateString()
        dateMatch = dateMatch && itemDate >= fromDate
      }
      if (dateTo) {
        const toDate = new Date(dateTo).toDateString()
        dateMatch = dateMatch && itemDate <= toDate
      }
    }

    return categoryMatch && searchMatch && urgencyMatch && confidenceMatch && dateMatch
  })

  const categories = [...new Set(history.map((item) => item.category))]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
              <p className="text-gray-600">View, filter, and export past message analyses</p>
            </div>
            <div className="flex gap-2">
              {history.length > 0 && (
                <>
                  <button
                    onClick={() => exportToCSV(filteredHistory)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-semibold text-sm"
                  >
                    📥 Export CSV
                  </button>
                  <button
                    onClick={() => exportToJSON(filteredHistory)}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 font-semibold text-sm"
                  >
                    📥 Export JSON
                  </button>
                </>
              )}
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {history.length > 0 && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  placeholder="Search by message or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Row 1 */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Urgency</label>
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Urgencies</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min Confidence</label>
                  <select
                    value={confidenceMinFilter}
                    onChange={(e) => setConfidenceMinFilter(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">All Confidence</option>
                    <option value="50">50%+</option>
                    <option value="70">70%+</option>
                    <option value="85">85%+</option>
                    <option value="95">95%+</option>
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilter('all')
                      setUrgencyFilter('all')
                      setConfidenceMinFilter(0)
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className="w-full mt-6 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Filter Row 2 - Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                Showing {filteredHistory.length} of {history.length} results
              </div>
            </div>
          )}

        {/* History List */}
        {filteredHistory.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-xl text-gray-600 mb-2">No history yet</div>
            <p className="text-gray-500 mb-6">
              Analyzed messages will appear here
            </p>
            <a
              href="/analyze"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Analyze a Message
            </a>
          </div>
        )}

        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="text-gray-800 font-medium mb-2">
                      "{item.message.substring(0, 100)}{item.message.length > 100 ? '...' : ''}"
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                        {item.category}
                      </span>
                      {item.secondaryCategory && (
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-semibold">
                          {item.secondaryCategory}
                        </span>
                      )}
                      {typeof item.confidence === 'number' && (
                        <span className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-semibold">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        item.urgency === 'High' ? 'bg-red-200 text-red-900' :
                        item.urgency === 'Medium' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-green-200 text-green-900'
                      }`}>
                        {item.urgency} Urgency
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 ml-4">
                    {expandedIndex === index ? '▲' : '▼'}
                  </div>
                </div>
              </div>

              {expandedIndex === index && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Full Message</div>
                      <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                        {item.message}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Recommended Action</div>
                      <div className="text-sm text-gray-800 bg-purple-50 p-3 rounded border border-purple-200">
                        {item.recommendedAction}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">AI Reasoning</div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown>
                            {item.reasoning}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

export default HistoryPage
