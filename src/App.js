import * as React from 'react';
import { useState, useEffect } from "react";
import Home from './Home';
import CompanyIndex from './CompanyIndex';
import Company from './Company';
import DataTable from './DataTable';
import { supabase } from './supabaseClient';
import Container from '@mui/material/Container';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';

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
          <BusinessIcon />
        </ListItemIcon>
        <ListItemText primary="Companies" />
      </ListItemButton>
      <ListItemButton component={Link} to="/about">
        <ListItemIcon>
          <InfoIcon />
        </ListItemIcon>
        <ListItemText primary="About" />
      </ListItemButton>
      <Routes>
        <Route path="companies" element={<Companies logged_in={session}/>}/>
        <Route path="companies/:companyId" element={<Company logged_in={session} />} />
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
