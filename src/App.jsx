import { useState, Suspense, lazy } from 'react'
import { Button, Container, Typography, Box, Paper } from '@mui/material'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

// Lazy load the federated CustomModal component
const CustomModal = lazy(() => import('uivisual/CustomModal'))

function App() {
  const [count, setCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Container maxWidth="md" className="min-h-screen flex flex-col items-center justify-center py-8">
      <Paper elevation={3} className="p-8 w-full max-w-2xl">
        <Box className="flex flex-col items-center gap-6">
          <div className="flex gap-8 mb-4">
            <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
              <img src={viteLogo} className="h-24 w-24 hover:drop-shadow-lg transition-all" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
              <img src={reactLogo} className="h-24 w-24 animate-spin-slow hover:drop-shadow-lg transition-all" alt="React logo" />
            </a>
          </div>

          <Typography variant="h3" component="h1" className="mb-4 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vite + React + Tailwind + Material UI
          </Typography>

          <Box className="flex flex-col items-center gap-4">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setCount((count) => count + 1)}
              className="px-8 py-2"
            >
              Count is {count}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => setModalOpen(true)}
              className="px-8 py-2"
            >
              Open Custom Modal
            </Button>

            <Typography variant="body1" className="text-center text-gray-600">
              Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR
            </Typography>
          </Box>

          <Typography variant="body2" className="text-center text-gray-500 mt-4">
            Click on the Vite and React logos to learn more
          </Typography>
        </Box>
      </Paper>

      {/* Federated CustomModal */}
      <Suspense fallback={<div className="text-center p-4">Loading Modal...</div>}>
        <CustomModal
          id="app-custom-modal"
          title="Custom Modal from FLow-Project-UIVisual"
          open={modalOpen}
          onHide={() => setModalOpen(false)}
          size="medium"
          downloadConfig={{
            isVisible: true,
            path: '#',
            toolTipMsg: 'Download modal content',
            fileName: 'modal-content.png',
          }}
          modalActions={
            <Box className="flex gap-2">
              <Button
                variant="outlined"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  alert('Saved!')
                  setModalOpen(false)
                }}
              >
                Save
              </Button>
            </Box>
          }
        >
          <Box className="p-4">
            <Typography variant="h5" component="h3" className="mb-4">
              Welcome to Federated Modal!
            </Typography>
            <Typography variant="body1" className="mb-4">
              This modal is loaded from FLow-Project-UIVisual using Module Federation.
              It's fully functional with drag, resize, screenshot, and download capabilities.
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Current count: {count}
            </Typography>
          </Box>
        </CustomModal>
      </Suspense>
    </Container>
  )
}

export default App
