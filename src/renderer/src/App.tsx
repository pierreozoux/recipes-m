import { Center, Loader } from '@mantine/core'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import WorkspacePicker from './features/workspace/WorkspacePicker'
import AppShell from './AppShell'
import RecipesListPage from './features/recipes/RecipesListPage'
import RecipeEditPage from './features/recipes/RecipeEditPage'
import IngredientsListPage from './features/ingredients/IngredientsListPage'
import IngredientEditPage from './features/ingredients/IngredientEditPage'
import { trpc } from './api/trpc'

function WorkspaceGate({ children }: { children: JSX.Element }): JSX.Element {
  const currentQuery = trpc.workspace.current.useQuery()

  if (currentQuery.isLoading) {
    return (
      <Center mih="100vh">
        <Loader />
      </Center>
    )
  }

  if (!currentQuery.data) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WorkspacePicker />} />
        <Route
          element={
            <WorkspaceGate>
              <AppShell />
            </WorkspaceGate>
          }
        >
          <Route path="/recipes" element={<RecipesListPage />} />
          <Route path="/recipes/new" element={<RecipeEditPage createNew />} />
          <Route path="/recipes/:id" element={<RecipeEditPage />} />
          <Route path="/ingredients" element={<IngredientsListPage />} />
          <Route path="/ingredients/new" element={<IngredientEditPage createNew />} />
          <Route path="/ingredients/:id" element={<IngredientEditPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/recipes" replace />} />
      </Routes>
    </HashRouter>
  )
}
