import * as React from 'react';
import { useState, useEffect } from "react";
import Home from './Home';
import CompanyIndex from './CompanyIndex';
import Company from './Company';
import VC_Funds from './VC_Funds';
import VC_Fund from './VC_Fund';
import Funding_Rounds from './Funding_Rounds';
import { supabase } from './supabaseClient';
import Container from '@mui/material/Container';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Home as HomeIcon, Info, Business, Savings, Handshake } from '@mui/icons-material';

import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  useMatch,
  useParams
} from "react-router-dom";

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
    <Router>
      <ListItemButton component={Link} to="/">
        <ListItemIcon>
          <HomeIcon />
        </ListItemIcon>
        <ListItemText primary="Home" />
      </ListItemButton>
      <ListItemButton component={Link} to="/companies">
        <ListItemIcon>
          <Business />
        </ListItemIcon>
        <ListItemText primary="Companies" />
      </ListItemButton>
      {/* 
        <ListItemButton component={Link} to="/vc-funds">
          <ListItemIcon>
            <Savings />
          </ListItemIcon>
          <ListItemText primary="VC Funds" />
        </ListItemButton>
        <ListItemButton component={Link} to="/funding-rounds">
          <ListItemIcon>
            <Handshake />
          </ListItemIcon>
          <ListItemText primary="Funding Rounds" />
        </ListItemButton>
      */}
      <ListItemButton component={Link} to="/about">
        <ListItemIcon>
          <Info />
        </ListItemIcon>
        <ListItemText primary="About" />
      </ListItemButton>
      <Routes>
        <Route path="companies" element={<Companies logged_in={session}/>}/>
        <Route path="companies/:companyId" element={<Company logged_in={session} />} />
        <Route path="vc-funds" element={<VC_Funds logged_in={session}/>}/>
        <Route path="vc-funds/:vcId" element={<VC_Fund logged_in={session} />} />
        <Route path="funding-rounds" element={<Funding_Rounds logged_in={session}/>}/>
        <Route path="about" element={<About/>}/>
        <Route path="/" element={<Home logged_in={session} />}/>
      </Routes>
    </Router>
  );

}

function About() {
  return (
    <Container>
      <h2>About</h2>
      <div>
      Stay up to speed with the latest in company hiring, job openings, employee satisfaction, and funding rounds data.
      </div>
    </Container>
  );
}

function Companies(props) {

  return (
    <Container>
      <h2>Companies</h2>
      <CompanyIndex logged_in={props.logged_in} />
    </Container>
  );
}
