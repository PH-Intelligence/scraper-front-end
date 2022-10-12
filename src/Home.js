import * as React from 'react';
import { useState, useEffect } from "react";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DataTable from './DataTable';
import Copyright from './Copyright';
import Auth from './Auth'
import Account from './Account'

export default function Home(props) {

  return (
    <>
      <Container maxWidth="md">
        {!props.logged_in ? (
          <Auth />
        ) : (
          <Account key={props.logged_in.user.id} session={props.logged_in} />
        )}
      </Container>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Company Tracker
          </Typography>
          <DataTable logged_in={props.logged_in} />
          <Copyright />
        </Box>
      </Container>
    </>
  )

}