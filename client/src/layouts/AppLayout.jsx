import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FloatingAddButton from '../components/FloatingAddButton.jsx'
import './AppLayout.css'

// The shared shell for every authenticated page: sidebar on desktop, bottom
// nav + floating add button on mobile, a top search bar on both. Individual
// pages only render their own content via <Outlet/> — none of them need to
// know about navigation chrome.
export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <header className="app-layout__topbar">
          <SearchBar />
        </header>
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FloatingAddButton />
    </div>
  )
}
