import Container from '@mui/material/Container';
import { supabase } from './supabaseClient';
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function VC_Funds(props) {

  const [vcData, setVcData] = useState([]);
  const loggedIn = useRef(-1);
  const isLoading = useRef(false);

  useEffect(() => {

    loggedIn.current = props.logged_in;
    // console.log(loggedIn.current);

    if (loggedIn.current == -1) {
      // console.log('has not yet loaded');
      return;
    }

    if (isLoading.current) {
      // console.log('already in process of loading, so do not call the API again');
      return;
    }

    isLoading.current = true;

    (async() => {

      var data, error;

      (
        {data, error} = await supabase.from('vc_funds')
        .select(`
          id,
          fund,
          country
        `)
        .order('fund', { ascending: true })
      )
      console.log('We have just made 1 API call');

      if (error)
        console.log('Error occurred:', error)
      else
        if (JSON.stringify(data) != JSON.stringify(vcData)) {
          // console.log('changing');
          isLoading.current = false;
          setVcData(data);
        }

    })()

  }, [props.logged_in])

  return (
    <Container>
      <h2>VC Funds</h2>
      <ul>
        {vcData.map((vc) => (
          <li key={vc.id}>
            <Link to={`/vc-funds/${vc.id}`}>
              {vc.fund}
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}