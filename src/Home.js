import * as React from 'react';
import { useState, useEffect, useRef } from "react";
import { supabase } from './supabaseClient';
import GenericDataTable from './GenericDataTable';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Copyright from './Copyright';
import Auth from './Auth';
import Account from './Account';
import LatestHeadcounts from './LatestHeadcounts.js'
import LatestFundingRounds from './LatestFundingRounds.js'

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
      <LatestHeadcounts logged_in={props.logged_in} />
      {/* 
        <LatestFundingRounds logged_in={props.logged_in} />
      */}
    </>
  )
}