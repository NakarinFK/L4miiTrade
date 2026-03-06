import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import ToastContainer from '../ui/ToastContainer'

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-3 md:p-4 pb-20 md:pb-4 bg-gray-950">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
