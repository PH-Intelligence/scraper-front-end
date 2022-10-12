import { useState } from 'react'
import { supabase } from './supabaseClient'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      alert('Check your email for the login link!')
    } catch (error) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row flex-center flex">
      <div className="col-6 form-widget" aria-live="polite">
        <h1 className="header">Company Tracker</h1>
        <div className="description">
          Sign in via magic link with your email below to unlock:
          <ul>
            <li>Many more companies</li>
            <li>Weeks of historical employee and job opening data</li>
            <li>CSV exports</li>
          </ul>
        </div>
        {loading ? (
          'Sending magic link...'
        ) : (
          <form onSubmit={handleLogin}>
            <TextField id="email" label="Email" variant="outlined" className="inputField" type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <br />
            <Button variant="contained" className="button block" aria-live="polite" type="submit">Send magic link</Button>
          </form>
        )}
      </div>
    </div>
  )
}