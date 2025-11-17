import { useState } from 'react'
import { Button, Container, Typography, Box, Paper } from '@mui/material'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

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

            <Typography variant="body1" className="text-center text-gray-600">
              Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR
            </Typography>
          </Box>

          <Typography variant="body2" className="text-center text-gray-500 mt-4">
            Click on the Vite and React logos to learn more
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default App
