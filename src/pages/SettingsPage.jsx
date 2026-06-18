import { useState } from 'react'
import { getRecommendedAction } from '../utils/templates'

function SettingsPage() {
  const [customTemplates, setCustomTemplates] = useState(() => JSON.parse(localStorage.getItem('customTemplates') || '{}'))
  const [selectedCategory, setSelectedCategory] = useState('Billing Issue')
  const [selectedUrgency, setSelectedUrgency] = useState('High')
  const [saved, setSaved] = useState(false)

  const categories = ['Billing Issue', 'Technical Problem', 'Feature Request', 'General Inquiry']
  const urgencyLevels = ['High', 'Medium', 'Low']

  const saveCustomTemplates = () => {
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleUpdateAction = (newAction) => {
    const key = `${selectedCategory}|${selectedUrgency}`
    const updated = { ...customTemplates }

    if (newAction.trim() === '') {
      delete updated[key]
    } else {
      updated[key] = newAction
    }

    setCustomTemplates(updated)
  }

  const handleReset = () => {
    if (window.confirm('Reset all custom templates to defaults?')) {
      localStorage.removeItem('customTemplates')
      setCustomTemplates({})
    }
  }

  const customCount = Object.keys(customTemplates).length
  const currentTemplateKey = `${selectedCategory}|${selectedUrgency}`
  const currentAction =
    customTemplates[currentTemplateKey] ||
    getRecommendedAction(selectedCategory, selectedUrgency)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings & Custom Templates</h1>
          <p className="text-gray-600">Customize recommended actions for each category and urgency level</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Custom Response Templates</h2>
            {customCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                You have {customCount} custom template(s) configured.
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {urgencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recommended Action
              </label>
              <textarea
                value={currentAction}
                onChange={(e) => handleUpdateAction(e.target.value)}
                placeholder="Enter the recommended action for this combination..."
                className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Clear the field to revert to the default template for this combination.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveCustomTemplates}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              {saved ? '✓ Saved' : 'Save Templates'}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Templates Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Urgency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Custom</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {categories.flatMap((cat) =>
                  urgencyLevels.map((level) => {
                    const key = `${cat}|${level}`
                    const isCustom = customTemplates[key]
                    const action = customTemplates[key] || getRecommendedAction(cat, level)

                    return (
                      <tr key={key} className={isCustom ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-800">{cat}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{level}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{action.substring(0, 60)}...</td>
                        <td className="px-4 py-3 text-center">
                          {isCustom && <span className="text-blue-600 font-semibold">✓ Custom</span>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
