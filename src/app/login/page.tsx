"use client"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initializeApp } from "firebase/app";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
// import { genreColors } from './page'; // Assuming genreColors is exported from page.tsx

const firebaseConfig = {
  apiKey: "AIzaSyDNLW6B1Twtz--zRNIhxyJ8ercYUtMRdPU",
  authDomain: "novel-hub-34b1b.firebaseapp.com",
  projectId: "novel-hub-34b1b",
  storageBucket: "novel-hub-34b1b.appspot.com",
  messagingSenderId: "76649685525",
  appId: "1:76649685525:web:3c3c98bfbbbcf394f4641c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user);
      // Redirect to the desired page after successful login
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <label>
          Email:
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </label>
        <label>
          Password:
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </label>
        <Button type="submit" className="login-button">
          Login
        </Button>
      </form>
    </div>
  );
};

export default Login;