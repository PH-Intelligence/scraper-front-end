import Container from '@mui/material/Container';
import { supabase } from './supabaseClient';
import { useState, useEffect, useRef } from "react";
import LatestFundingRounds from './LatestFundingRounds.js';

export default function Funding_Rounds(props) {

  return (
    <Container>
      <h2>Funding Rounds</h2>
      <LatestFundingRounds logged_in={props.logged_in} />
    </Container>
  );
}