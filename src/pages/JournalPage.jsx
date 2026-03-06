import { Plus } from 'lucide-react'
import TradeTable from '../components/journal/TradeTable'
import TradeDetail from '../components/journal/TradeDetail'
import AddTradeForm from '../components/journal/AddTradeForm'
import { useUiStore } from '../stores/uiStore'

export default function JournalPage() {
  const { toggleAddTradeForm } = useUiStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Trading Journal</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track and review all your trades</p>
        </div>
        <button
          onClick={toggleAddTradeForm}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Trade
        </button>
      </div>

      <TradeTable />
      <TradeDetail />
      <AddTradeForm />
    </div>
  )
}
