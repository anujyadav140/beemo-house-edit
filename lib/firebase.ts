import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBeYac0iCgDA7-ZSVVgC1KyzHLafeOFbzo',
  authDomain: 'my-beemo-app.firebaseapp.com',
  databaseURL: 'https://my-beemo-app-default-rtdb.firebaseio.com',
  projectId: 'my-beemo-app',
  storageBucket: 'my-beemo-app.firebasestorage.app',
  messagingSenderId: '1097743151401',
  appId: '1:1097743151401:web:46c2c7e0564a9e6be34738',
}

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export { app, db }
