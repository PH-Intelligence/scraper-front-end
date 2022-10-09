import * as React from 'react';
import { useState, useEffect } from "react";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ProTip from './ProTip';
import DataTable from './DataTable';

import { supabase } from './supabaseClient'
import './index.css'
import Auth from './Auth'
import Account from './Account'

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://twitter.com/jaypinho">
        Jay Pinho
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

export default function App() {

  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <>
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        {!session ? (
          <Auth />
        ) : (
          <Account key={session.user.id} session={session} />
        )}
      </div>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Company Tracker
          </Typography>
          <DataTable logged_in={session} />
          <ProTip />
          <Copyright />
        </Box>
      </Container>
    </>
  )

}
