import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Breads } from './pages/Breads'
import { BreadDetail } from './pages/BreadDetail'
import { Recipes } from './pages/Recipes'
import { RecipeDetail } from './pages/RecipeDetail'

function App() {
  return (
    <BrowserRouter basename="/bready">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="breads" element={<Breads />} />
          <Route path="breads/:id" element={<BreadDetail />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
