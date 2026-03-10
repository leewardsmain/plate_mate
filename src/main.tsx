import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify';
import { authConfig } from './auth/amplifyConfig';
import './index.css'
import App from './App.tsx'

// Initialize AWS Amplify only if config is somewhat valid
try {
  if (authConfig.Auth?.Cognito?.userPoolId) {
    Amplify.configure(authConfig);
  } else {
    console.warn("Amplify Auth is not configured. Please fill in src/auth/amplifyConfig.ts");
  }
} catch (e) {
  console.error("Failed to configure Amplify", e);
}

// Set light mode before first paint
document.documentElement.setAttribute('data-theme', 'light');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
