import { Outlet } from 'react-router-dom'

export default function IndividualDetailWrapper() {
  // Hardcoded caseId
  const caseId = 1

  return (
    <Outlet context={{ caseId }} />
  )
}

